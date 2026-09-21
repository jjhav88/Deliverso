import type { PromotionContext, PromotionQuote, PromotionRule } from "@/modules/promotions/domain/types";
import { quotePromotion } from "@/modules/promotions/domain/calculator";
import { eligibleSubtotalMinor } from "@/modules/promotions/domain/scope";
import { buildPromotionTotals } from "@/modules/promotions/domain/totals";

export { eligibleSubtotalMinor, itemMatchesScope } from "@/modules/promotions/domain/scope";

export function evaluatePromotionEligibility(
  rule: PromotionRule,
  context: PromotionContext,
): PromotionQuote {
  const base: PromotionQuote = {
    promotionId: rule.id,
    normalizedCode: rule.normalizedCode,
    label: rule.label,
    benefitType: rule.benefitType,
    eligibleSubtotalMinor: eligibleSubtotalMinor(context.items, rule),
    discountMinor: 0,
    deliveryDiscountMinor: 0,
    totalDiscountMinor: 0,
    reason: null,
    isEligible: false,
  };

  if (rule.status === "DRAFT" || rule.status === "ARCHIVED") {
    return { ...base, reason: "UNAVAILABLE" };
  }
  if (rule.status === "PAUSED") {
    return { ...base, reason: "PAUSED" };
  }
  if (rule.startsAt && rule.startsAt.getTime() > context.now.getTime()) {
    return { ...base, reason: "SCHEDULED" };
  }
  if (rule.endsAt && rule.endsAt.getTime() <= context.now.getTime()) {
    return { ...base, reason: "EXPIRED" };
  }
  if (rule.mode === "CODE" && !rule.normalizedCode) {
    return { ...base, reason: "UNAVAILABLE" };
  }
  if (rule.minSubtotalMinor != null && context.subtotalMinor < rule.minSubtotalMinor) {
    return { ...base, reason: "BELOW_MINIMUM" };
  }
  if (rule.benefitType === "FREE_DELIVERY" && context.fulfillmentMethod === "PICKUP") {
    return { ...base, reason: "PICKUP_NO_DELIVERY" };
  }
  if (rule.benefitType === "FREE_DELIVERY" && context.fulfillmentMethod !== "DELIVERY") {
    return { ...base, isEligible: true, reason: "DELIVERY_PENDING" };
  }
  if (base.eligibleSubtotalMinor <= 0 && rule.benefitType !== "FREE_DELIVERY") {
    return { ...base, reason: "SCOPE_EMPTY" };
  }
  if (rule.usageLimitTotal != null && context.reservedTotal >= rule.usageLimitTotal) {
    return { ...base, reason: "USAGE_LIMIT" };
  }
  if (
    rule.usageLimitPerCustomer != null &&
    context.reservedForCustomer >= rule.usageLimitPerCustomer
  ) {
    return { ...base, reason: "CUSTOMER_LIMIT" };
  }

  const quoted = quotePromotion(rule, context);
  if (quoted.totalDiscountMinor <= 0 && rule.benefitType !== "FREE_DELIVERY") {
    return { ...quoted, isEligible: false, reason: "NO_BENEFIT" };
  }

  const totals = buildPromotionTotals({
    subtotalMinor: context.subtotalMinor,
    deliveryFeeMinor: context.deliveryFeeMinor,
    discountMinor: quoted.discountMinor,
    deliveryDiscountMinor: quoted.deliveryDiscountMinor,
  });
  if (totals.grandTotalMinor <= 0) {
    return { ...quoted, isEligible: false, reason: "ZERO_VALUE" };
  }

  return { ...quoted, isEligible: true, reason: null };
}
