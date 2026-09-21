import type { PromotionRule } from "@/modules/promotions/domain/types";

type Translation = { locale: string; label: string };

export function mapPromotionRule(row: {
  id: string;
  mode: PromotionRule["mode"];
  status: PromotionRule["status"];
  normalizedCode: string | null;
  benefitType: PromotionRule["benefitType"];
  percentageBps: number | null;
  fixedAmountMinor: number | null;
  minSubtotalMinor: number | null;
  maxDiscountMinor: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  priority: number;
  scopeType: PromotionRule["scopeType"];
  translations: Translation[];
  products?: Array<{ productId: string }>;
  categories?: Array<{ categoryId: string }>;
  universes?: Array<{ universeId: string }>;
  businessLines?: Array<{ businessLineId: string }>;
}, locale: string): PromotionRule {
  const translation =
    row.translations.find((item) => item.locale === locale) ??
    row.translations.find((item) => item.locale === "es-MX") ??
    row.translations[0];
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    normalizedCode: row.normalizedCode,
    benefitType: row.benefitType,
    percentageBps: row.percentageBps,
    fixedAmountMinor: row.fixedAmountMinor,
    minSubtotalMinor: row.minSubtotalMinor,
    maxDiscountMinor: row.maxDiscountMinor,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    usageLimitTotal: row.usageLimitTotal,
    usageLimitPerCustomer: row.usageLimitPerCustomer,
    priority: row.priority,
    scopeType: row.scopeType,
    productIds: row.products?.map((item) => item.productId) ?? [],
    categoryIds: row.categories?.map((item) => item.categoryId) ?? [],
    universeIds: row.universes?.map((item) => item.universeId) ?? [],
    businessLineIds: row.businessLines?.map((item) => item.businessLineId) ?? [],
    label: translation?.label ?? row.normalizedCode ?? "Promoción",
  };
}
