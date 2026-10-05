import type { OrderFinancialStatus } from "@/modules/cancellations/domain/types";
import type { BadgeVariant } from "@/components/ui/badge";

export const customerRefundHighlights = [
  "none",
  "processing",
  "reviewing",
  "partial",
  "refunded",
] as const;

export type CustomerRefundHighlight = (typeof customerRefundHighlights)[number];

export function getCustomerRefundHighlight(input: {
  financialStatus: OrderFinancialStatus;
  hasReservedRefund: boolean;
  hasFailedRefund: boolean;
}): CustomerRefundHighlight {
  if (input.hasReservedRefund) {
    return "processing";
  }
  if (input.financialStatus === "REFUNDED") {
    return "refunded";
  }
  if (input.financialStatus === "PARTIALLY_REFUNDED") {
    return "partial";
  }
  if (input.hasFailedRefund) {
    return "reviewing";
  }
  return "none";
}

export function customerRefundHighlightLabel(
  highlight: Exclude<CustomerRefundHighlight, "none">,
  locale = "es-MX",
): string {
  const en = locale === "en-US";
  switch (highlight) {
    case "processing":
      return en ? "Refund processing" : "Reembolso en proceso";
    case "reviewing":
      return en ? "Refund in review" : "Reembolso en revisión";
    case "partial":
      return en ? "Partially refunded" : "Reembolso parcial";
    case "refunded":
      return en ? "Refunded" : "Reembolsado";
  }
}

export function customerRefundHighlightVariant(
  highlight: Exclude<CustomerRefundHighlight, "none">,
): BadgeVariant {
  switch (highlight) {
    case "refunded":
      return "success";
    case "partial":
      return "accent";
    case "processing":
      return "warning";
    case "reviewing":
      return "secondary";
  }
}

export function cancellationStatusBadgeVariant(
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "COMPLETED",
): BadgeVariant {
  switch (status) {
    case "REQUESTED":
      return "warning";
    case "APPROVED":
      return "accent";
    case "COMPLETED":
      return "success";
    case "REJECTED":
      return "secondary";
    case "WITHDRAWN":
      return "default";
  }
}

export function financialStatusBadgeVariant(status: OrderFinancialStatus): BadgeVariant {
  switch (status) {
    case "REFUNDED":
      return "success";
    case "PARTIALLY_REFUNDED":
      return "accent";
    case "PAID":
      return "secondary";
    case "UNPAID":
      return "warning";
    case "CANCELED_UNPAID":
      return "default";
  }
}

export function approveRefundConfirmCopy(amountLabel: string, locale = "es-MX"): string {
  return locale === "en-US"
    ? `You are about to request a Stripe refund of ${amountLabel}. This operation affects the order financially.`
    : `Vas a solicitar a Stripe un reembolso de ${amountLabel}. Esta operación afecta financieramente al pedido.`;
}
