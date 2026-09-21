import type { PromotionBenefitType, PromotionScopeType } from "@/modules/promotions/domain/types";

export function promotionRulePreview(input: {
  benefitType: PromotionBenefitType;
  percentageBps: number | null;
  fixedAmountMinor: number | null;
  minSubtotalMinor: number | null;
  maxDiscountMinor: number | null;
  usageLimitPerCustomer: number | null;
  scopeType: PromotionScopeType;
  locale?: "es-MX" | "en-US";
}): string {
  const locale = input.locale ?? "es-MX";
  const parts: string[] = [];
  if (input.benefitType === "PERCENTAGE" && input.percentageBps) {
    parts.push(locale === "en-US" ? `${input.percentageBps / 100}% off` : `${input.percentageBps / 100}% de descuento`);
  } else if (input.benefitType === "FIXED_AMOUNT" && input.fixedAmountMinor) {
    const amount = (input.fixedAmountMinor / 100).toFixed(2);
    parts.push(locale === "en-US" ? `$${amount} MXN off` : `$${amount} MXN de descuento`);
  } else if (input.benefitType === "FREE_DELIVERY") {
    parts.push(locale === "en-US" ? "Free delivery" : "Envío gratis");
  }

  const scope =
    input.scopeType === "ORDER"
      ? locale === "en-US"
        ? "on the order"
        : "en el pedido"
      : locale === "en-US"
        ? "on selected items"
        : "en productos seleccionados";
  parts.push(scope);

  if (input.minSubtotalMinor) {
    parts.push(
      locale === "en-US"
        ? `from $${(input.minSubtotalMinor / 100).toFixed(0)}`
        : `desde $${(input.minSubtotalMinor / 100).toFixed(0)}`,
    );
  }
  if (input.maxDiscountMinor) {
    parts.push(
      locale === "en-US"
        ? `max $${(input.maxDiscountMinor / 100).toFixed(0)}`
        : `máximo $${(input.maxDiscountMinor / 100).toFixed(0)}`,
    );
  }
  if (input.usageLimitPerCustomer) {
    parts.push(
      locale === "en-US"
        ? `${input.usageLimitPerCustomer} use${input.usageLimitPerCustomer === 1 ? "" : "s"} per customer`
        : `${input.usageLimitPerCustomer} uso${input.usageLimitPerCustomer === 1 ? "" : "s"} por cliente`,
    );
  }
  return parts.join(", ");
}
