import type { PromotionTotals } from "@/modules/promotions/domain/types";

export function buildPromotionTotals(input: {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  discountMinor: number;
  deliveryDiscountMinor: number;
}): PromotionTotals {
  const promotionDiscountMinor = Math.max(0, input.discountMinor) + Math.max(0, input.deliveryDiscountMinor);
  const payable = Math.max(0, input.subtotalMinor) + Math.max(0, input.deliveryFeeMinor);
  return {
    subtotalMinor: Math.max(0, input.subtotalMinor),
    deliveryFeeMinor: Math.max(0, input.deliveryFeeMinor),
    promotionDiscountMinor,
    grandTotalMinor: Math.max(0, payable - promotionDiscountMinor),
  };
}

export function wouldCreateZeroValueOrder(input: {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  discountMinor: number;
  deliveryDiscountMinor: number;
}): boolean {
  return buildPromotionTotals(input).grandTotalMinor <= 0;
}
