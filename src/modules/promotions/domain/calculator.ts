import Decimal from "decimal.js";
import type { PromotionContext, PromotionQuote, PromotionRule } from "@/modules/promotions/domain/types";
import { eligibleSubtotalMinor, itemMatchesScope } from "@/modules/promotions/domain/scope";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function percentageDiscountMinor(eligibleSubtotalMinorValue: number, percentageBps: number): number {
  if (eligibleSubtotalMinorValue <= 0 || percentageBps <= 0) {
    return 0;
  }
  return new Decimal(eligibleSubtotalMinorValue)
    .mul(percentageBps)
    .div(10000)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

export function applyMaxDiscount(discountMinor: number, maxDiscountMinor: number | null | undefined): number {
  if (maxDiscountMinor == null) {
    return discountMinor;
  }
  return Math.min(discountMinor, Math.max(0, maxDiscountMinor));
}

export function quotePromotion(rule: PromotionRule, context: PromotionContext): PromotionQuote {
  const eligible = eligibleSubtotalMinor(context.items, rule);
  let discountMinor = 0;
  let deliveryDiscountMinor = 0;

  if (rule.benefitType === "PERCENTAGE" && rule.percentageBps) {
    discountMinor = applyMaxDiscount(percentageDiscountMinor(eligible, rule.percentageBps), rule.maxDiscountMinor);
  } else if (rule.benefitType === "FIXED_AMOUNT" && rule.fixedAmountMinor) {
    discountMinor = applyMaxDiscount(Math.min(rule.fixedAmountMinor, eligible), rule.maxDiscountMinor);
  } else if (rule.benefitType === "FREE_DELIVERY") {
    if (context.fulfillmentMethod === "DELIVERY") {
      deliveryDiscountMinor = Math.max(0, context.deliveryFeeMinor);
    }
  }

  return {
    promotionId: rule.id,
    normalizedCode: rule.normalizedCode,
    label: rule.label,
    benefitType: rule.benefitType,
    eligibleSubtotalMinor: eligible,
    discountMinor,
    deliveryDiscountMinor,
    totalDiscountMinor: discountMinor + deliveryDiscountMinor,
    reason: null,
    isEligible: true,
  };
}

export function itemIsEligibleForRule(rule: PromotionRule, item: PromotionContext["items"][number]): boolean {
  return itemMatchesScope(item, rule);
}
