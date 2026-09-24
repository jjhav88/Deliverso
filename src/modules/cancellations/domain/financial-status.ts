import type { OrderFinancialStatus } from "@/modules/cancellations/domain/types";
import { getSucceededRefundsMinor } from "@/modules/cancellations/domain/refundable";

export function getOrderFinancialStatus(input: {
  status: string;
  paymentStatus: string;
  grandTotalMinor: number;
  refundedAmountMinor?: number;
  refunds?: ReadonlyArray<{ status: string; amountMinor: number }>;
}): OrderFinancialStatus {
  const succeeded =
    input.refunds != null
      ? getSucceededRefundsMinor(input.refunds)
      : Math.max(0, input.refundedAmountMinor ?? 0);

  if (input.paymentStatus === "SUCCEEDED") {
    if (succeeded <= 0) {
      return "PAID";
    }
    if (succeeded >= input.grandTotalMinor) {
      return "REFUNDED";
    }
    return "PARTIALLY_REFUNDED";
  }

  if (input.status === "CANCELLED" || input.status === "EXPIRED") {
    return "CANCELED_UNPAID";
  }

  return "UNPAID";
}

export function netPaidMinor(input: {
  grandTotalMinor: number;
  refundedAmountMinor: number;
}): number {
  return Math.max(0, input.grandTotalMinor - Math.max(0, input.refundedAmountMinor));
}
