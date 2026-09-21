import type { PromotionQuote, PromotionRule } from "@/modules/promotions/domain/types";

export function selectAutomaticPromotion(input: {
  quotes: PromotionQuote[];
  rules: PromotionRule[];
}): PromotionQuote | null {
  const eligible = input.quotes.filter((quote) => quote.isEligible);
  if (eligible.length === 0) {
    return null;
  }

  const ruleById = new Map(input.rules.map((rule) => [rule.id, rule]));
  return [...eligible].sort((a, b) => {
    if (b.totalDiscountMinor !== a.totalDiscountMinor) {
      return b.totalDiscountMinor - a.totalDiscountMinor;
    }
    const priorityA = ruleById.get(a.promotionId)?.priority ?? 0;
    const priorityB = ruleById.get(b.promotionId)?.priority ?? 0;
    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }
    const startA = ruleById.get(a.promotionId)?.startsAt?.getTime() ?? 0;
    const startB = ruleById.get(b.promotionId)?.startsAt?.getTime() ?? 0;
    if (startB !== startA) {
      return startB - startA;
    }
    return a.promotionId.localeCompare(b.promotionId);
  })[0] ?? null;
}

export function resolveAppliedPromotion(input: {
  selectedCodeQuote: PromotionQuote | null;
  automaticQuote: PromotionQuote | null;
}): PromotionQuote | null {
  if (input.selectedCodeQuote?.isEligible) {
    return input.selectedCodeQuote;
  }
  return input.automaticQuote;
}
