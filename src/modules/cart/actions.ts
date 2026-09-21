"use server";

import { revalidatePath } from "next/cache";
import { buildConfigurationKey } from "@/modules/cart/domain/configuration-key";
import { parseCartQuantity } from "@/modules/cart/domain/quantity";
import { priceConfiguredProduct } from "@/modules/catalog/pricing/price-configured-product";
import { loadPricingSnapshot } from "@/modules/catalog/pricing/load-snapshot";
import { getPrisma } from "@/server/db/prisma";
import { touchCart } from "@/server/cart/session";
import type { CartActionState } from "@/modules/cart/action-state";
import { resolveReadableCart, resolveWritableCart } from "@/modules/cart/guard";
import { demoteReadyCheckoutDrafts } from "@/modules/checkout/invalidate";

function revalidateCartSurfaces() {
  revalidatePath("/carrito");
  revalidatePath("/en/cart");
  revalidatePath("/checkout");
  revalidatePath("/en/checkout");
}

export async function addToCartAction(
  previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void previousState;
  const shopper = await resolveWritableCart();
  if (!shopper.ok) {
    return { error: shopper.error, success: null };
  }

  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || null;
  const requestedQuantity = parseCartQuantity(formData.get("quantity"));
  const optionIds = formData.getAll("optionIds").flatMap((value) =>
    typeof value === "string" && value ? [value] : [],
  );

  if (!productId) {
    return { error: "Producto inválido.", success: null };
  }

  const snapshot = await loadPricingSnapshot({ productId, variantId });
  if (!snapshot) {
    return { error: "El producto no está disponible.", success: null };
  }

  const priced = priceConfiguredProduct({
    snapshot,
    selectedOptionIds: optionIds,
    quantity: requestedQuantity,
  });
  if (!priced.ok) {
    return { error: priced.message, success: null };
  }

  const cart = shopper.cart;
  if (!cart) {
    return { error: "No fue posible crear el carrito.", success: null };
  }

  const key = buildConfigurationKey(snapshot.variant.id, priced.selectedOptionIds);
  const prisma = getPrisma();
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId_configurationKey: {
        cartId: cart.id,
        productId,
        variantId: snapshot.variant.id,
        configurationKey: key,
      },
    },
  });

  const addQuantity = requestedQuantity ?? 1;

  if (existing) {
    const safe = parseCartQuantity(existing.quantity + addQuantity);
    if (safe === null) {
      return { error: "La cantidad máxima por línea es 99.", success: null };
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: safe },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: snapshot.variant.id,
        quantity: addQuantity,
        configurationKey: key,
        options: {
          create: priced.selectedOptionIds.map((optionId) => ({ optionId })),
        },
      },
    });
  }

  await touchCart(cart.id);
  await demoteReadyCheckoutDrafts(cart.id);
  revalidateCartSurfaces();
  return { error: null, success: "Producto agregado al carrito." };
}

export async function updateCartItemQuantityAction(
  previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void previousState;
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = parseCartQuantity(formData.get("quantity"));
  if (!itemId || quantity === null) {
    return { error: "Cantidad inválida.", success: null };
  }

  const shopper = await resolveWritableCart();
  if (!shopper.ok) {
    return { error: shopper.error, success: null };
  }
  const cart = shopper.cart;

  const item = await getPrisma().cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true },
  });
  if (!item) {
    return { error: "Esa línea no pertenece a tu carrito.", success: null };
  }

  await getPrisma().cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });
  await touchCart(cart.id);
  await demoteReadyCheckoutDrafts(cart.id);
  revalidateCartSurfaces();
  return { error: null, success: "Cantidad actualizada." };
}

export async function removeCartItemAction(
  previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void previousState;
  const itemId = String(formData.get("itemId") ?? "");
  const shopper = await resolveWritableCart();
  if (!shopper.ok) {
    return { error: shopper.error, success: null };
  }
  const cart = shopper.cart;
  if (!itemId) {
    return { error: "No se pudo eliminar el producto.", success: null };
  }

  const item = await getPrisma().cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true },
  });
  if (!item) {
    return { error: "Esa línea no pertenece a tu carrito.", success: null };
  }

  await getPrisma().cartItem.delete({ where: { id: item.id } });
  await touchCart(cart.id);
  await demoteReadyCheckoutDrafts(cart.id);
  revalidateCartSurfaces();
  return { error: null, success: "Producto eliminado." };
}

export async function clearCartAction(
  previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void previousState;
  void formData;
  const shopper = await resolveWritableCart();
  if (!shopper.ok) {
    return { error: shopper.error, success: null };
  }

  await getPrisma().cartItem.deleteMany({ where: { cartId: shopper.cart.id } });
  await touchCart(shopper.cart.id);
  await demoteReadyCheckoutDrafts(shopper.cart.id);
  revalidateCartSurfaces();
  return { error: null, success: "Carrito vaciado." };
}
