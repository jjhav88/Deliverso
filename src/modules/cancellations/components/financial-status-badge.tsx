import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { OrderFinancialStatus } from "@/modules/cancellations/domain/types";
import type { CustomerRefundHighlight } from "@/modules/cancellations/domain/presentation";
import {
  customerRefundHighlightLabel,
  customerRefundHighlightVariant,
  financialStatusBadgeVariant,
  getCustomerRefundHighlight,
} from "@/modules/cancellations/domain/presentation";
import { financialStatusLabel } from "@/modules/cancellations/domain/labels";
import { getOrderFinancialStatus } from "@/modules/cancellations/domain/financial-status";

export function FinancialStatusBadge({
  status,
  highlight,
  locale = "es-MX",
  prominent = false,
}: {
  status?: OrderFinancialStatus;
  highlight?: Exclude<CustomerRefundHighlight, "none">;
  locale?: string;
  prominent?: boolean;
}) {
  const label = highlight
    ? customerRefundHighlightLabel(highlight, locale)
    : status
      ? financialStatusLabel(status, locale)
      : null;
  if (!label) {
    return null;
  }
  const variant = highlight
    ? customerRefundHighlightVariant(highlight)
    : status
      ? financialStatusBadgeVariant(status)
      : "default";

  return (
    <Badge
      variant={variant}
      className={cn(prominent && "px-3.5 py-1.5 type-label tracking-[0.12em]")}
    >
      {label}
    </Badge>
  );
}

export function OrderListRefundBadge({
  status,
  paymentStatus,
  grandTotalMinor,
  refundedAmountMinor,
  hasReservedRefund,
  hasFailedRefund,
  locale,
}: {
  status: string;
  paymentStatus: string;
  grandTotalMinor: number;
  refundedAmountMinor: number;
  hasReservedRefund: boolean;
  hasFailedRefund: boolean;
  locale: string;
}) {
  const highlight = getCustomerRefundHighlight({
    financialStatus: getOrderFinancialStatus({
      status,
      paymentStatus,
      grandTotalMinor,
      refundedAmountMinor,
    }),
    hasReservedRefund,
    hasFailedRefund,
  });
  if (highlight === "none") {
    return null;
  }
  return (
    <div className="mt-1">
      <FinancialStatusBadge highlight={highlight} locale={locale} />
    </div>
  );
}
