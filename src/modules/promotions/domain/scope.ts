import type { PromotionItem, PromotionRule } from "@/modules/promotions/domain/types";

export function itemMatchesScope(item: PromotionItem, rule: PromotionRule): boolean {
  if (rule.scopeType === "ORDER") {
    return true;
  }
  if (rule.scopeType === "PRODUCT") {
    return rule.productIds.includes(item.productId);
  }
  if (rule.scopeType === "CATEGORY") {
    return item.categoryIds.some((id) => rule.categoryIds.includes(id));
  }
  if (rule.scopeType === "UNIVERSE") {
    return item.universeIds.some((id) => rule.universeIds.includes(id));
  }
  if (rule.scopeType === "BUSINESS_LINE") {
    return Boolean(item.businessLineId && rule.businessLineIds.includes(item.businessLineId));
  }
  return false;
}

export function eligibleSubtotalMinor(items: PromotionItem[], rule: PromotionRule): number {
  return items
    .filter((item) => item.lineTotalMinor > 0 && itemMatchesScope(item, rule))
    .reduce((sum, item) => sum + item.lineTotalMinor, 0);
}
