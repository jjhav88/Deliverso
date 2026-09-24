import type { QuotationStatus } from "@/modules/quotations/domain/types";

export const quoteAttentionStatuses = ["NEEDS_INFO", "QUOTED"] as const;
export type QuoteAttentionStatus = (typeof quoteAttentionStatuses)[number];

export function quoteRequiresCustomerAttention(status: QuotationStatus): boolean {
  return status === "NEEDS_INFO" || status === "QUOTED";
}

export function countQuotesRequiringAttention(statuses: readonly QuotationStatus[]): number {
  return statuses.filter(quoteRequiresCustomerAttention).length;
}

export type CustomerAccountMenuItemId = "account" | "orders" | "quotes";

export type CustomerAccountMenuItem = {
  id: CustomerAccountMenuItemId;
  href: "/cuenta" | "/cotizaciones";
  label: string;
  badge: number | null;
};

export function buildCustomerAccountMenu(input: {
  locale: string;
  attentionCount: number;
}): CustomerAccountMenuItem[] {
  const en = input.locale === "en-US";
  const quotesBadge = input.attentionCount > 0 ? input.attentionCount : null;
  return [
    { id: "account", href: "/cuenta", label: en ? "My account" : "Mi cuenta", badge: null },
    { id: "orders", href: "/cuenta", label: en ? "My orders" : "Mis pedidos", badge: null },
    {
      id: "quotes",
      href: "/cotizaciones",
      label: en ? "My quotes" : "Mis cotizaciones",
      badge: quotesBadge,
    },
  ];
}

export function quotesMenuLabel(input: { locale: string; attentionCount: number }): string {
  const item = buildCustomerAccountMenu(input).find((entry) => entry.id === "quotes");
  if (!item) {
    return input.locale === "en-US" ? "My quotes" : "Mis cotizaciones";
  }
  return item.badge ? `${item.label} (${item.badge})` : item.label;
}
