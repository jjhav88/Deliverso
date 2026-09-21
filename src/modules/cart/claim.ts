import "server-only";
import { decideLegacyCartAction, mergeCartQuantities } from "@/modules/cart/domain/ownership";
import {
  getCustomerActiveCart,
  readLegacyCookieCart,
} from "@/server/cart/session";
import { getPrisma } from "@/server/db/prisma";

export async function claimOrMergeLegacyCart(customerId: string): Promise<void> {
  const prisma = getPrisma();
  const cookieCart = await readLegacyCookieCart();
  const customerCart = await getCustomerActiveCart(customerId);
  const decision = decideLegacyCartAction({
    cookieCart,
    customerCartId: customerCart?.id ?? null,
    currentCustomerId: customerId,
  });

  if (decision === "ignore" || decision === "keep" || !cookieCart) {
    return;
  }

  if (decision === "claim") {
    await prisma.cart.update({
      where: { id: cookieCart.id },
      data: { customerId },
    });
    return;
  }

  if (!customerCart) {
    return;
  }

  await mergeCartItems(cookieCart.id, customerCart.id);
  await prisma.cart.update({
    where: { id: cookieCart.id },
    data: { status: "ABANDONED" },
  });
}

async function mergeCartItems(fromCartId: string, intoCartId: string): Promise<void> {
  if (fromCartId === intoCartId) {
    return;
  }

  const prisma = getPrisma();
  const sourceItems = await prisma.cartItem.findMany({
    where: { cartId: fromCartId },
    include: { options: true },
  });

  for (const item of sourceItems) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId_configurationKey: {
          cartId: intoCartId,
          productId: item.productId,
          variantId: item.variantId,
          configurationKey: item.configurationKey,
        },
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: mergeCartQuantities(existing.quantity, item.quantity) },
      });
      await prisma.cartItem.delete({ where: { id: item.id } });
      continue;
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { cartId: intoCartId },
    });
  }
}
