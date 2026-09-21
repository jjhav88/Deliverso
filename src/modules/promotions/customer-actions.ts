"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getCurrentCartRecord } from "@/server/cart/session";
import { getPrisma } from "@/server/db/prisma";
import { getCartView } from "@/modules/cart/queries";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import { normalizePromotionCode } from "@/modules/promotions/domain/code";
import { publicPromotionUnavailableMessage } from "@/modules/promotions/domain/types";
import { resolveCartPromotion } from "@/modules/promotions/resolve";
import { logInfo } from "@/server/logging/logger";
import type { CartActionState } from "@/modules/cart/action-state";

function revalidateCart() {
  revalidatePath("/carrito");
  revalidatePath("/en/cart");
  revalidatePath("/checkout");
  revalidatePath("/en/checkout");
}

export async function applyPromotionCodeToCart(
  previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  void previousState;
  const locale = await getLocale();
  const customer = await requireCustomer("/carrito");
  const cart = await getCurrentCartRecord();
  if (!cart || cart.customerId !== customer.id || cart.status !== "ACTIVE") {
    return { error: publicPromotionUnavailableMessage, success: null };
  }

  const normalized = normalizePromotionCode(String(formData.get("code") ?? ""));
  if (!normalized) {
    return { error: publicPromotionUnavailableMessage, success: null };
  }

  const promotion = await getPrisma().promotion.findUnique({
    where: { normalizedCode: normalized },
    select: { id: true },
  });
  if (!promotion) {
    logInfo({ event: "PROMOTION_CODE_REJECTED", reason: "NOT_FOUND" });
    return { error: publicPromotionUnavailableMessage, success: null };
  }

  const view = await getCartView({
    locale: isAppLocale(locale) ? locale : "es-MX",
    displayCurrency: await getDisplayCurrency(),
    rateSet: await getExchangeRateSet(),
  });
  const resolved = await resolveCartPromotion({
    customerId: customer.id,
    selectedPromotionId: promotion.id,
    items: view.items
      .filter((item) => item.valid && item.lineTotal)
      .map((item) => ({ productId: item.productId, lineTotalMinor: item.lineTotal!.amountMinor })),
    subtotalMinor: view.subtotal.amountMinor,
    locale: isAppLocale(locale) ? locale : "es-MX",
  });

  if (!resolved.quote?.isEligible || resolved.quote.promotionId !== promotion.id) {
    logInfo({ event: "PROMOTION_CODE_REJECTED", reason: resolved.quote?.reason ?? "UNAVAILABLE" });
    return { error: publicPromotionUnavailableMessage, success: null };
  }

  await getPrisma().cart.update({
    where: { id: cart.id },
    data: { selectedPromotionId: promotion.id },
  });
  revalidateCart();
  return { error: null, success: "applied" };
}

export async function removePromotionFromCart(): Promise<void> {
  const customer = await requireCustomer("/carrito");
  const cart = await getCurrentCartRecord();
  if (!cart || cart.customerId !== customer.id) {
    return;
  }
  await getPrisma().cart.update({
    where: { id: cart.id },
    data: { selectedPromotionId: null },
  });
  revalidateCart();
}
