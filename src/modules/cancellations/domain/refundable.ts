import {
  reservedRefundStatuses,
  succeededRefundStatuses,
  type RefundStatus,
  type RefundType,
} from "@/modules/cancellations/domain/types";

export type RefundAmountRow = {
  status: string;
  amountMinor: number;
};

export function sumRefundsByStatus(
  refunds: readonly RefundAmountRow[],
  statuses: readonly string[],
): number {
  return refunds
    .filter((row) => statuses.includes(row.status))
    .reduce((sum, row) => sum + Math.max(0, row.amountMinor), 0);
}

export function getSucceededRefundsMinor(refunds: readonly RefundAmountRow[]): number {
  return sumRefundsByStatus(refunds, succeededRefundStatuses);
}

export function getReservedRefundsMinor(refunds: readonly RefundAmountRow[]): number {
  return sumRefundsByStatus(refunds, reservedRefundStatuses);
}

/**
 * Money still available for a new refund.
 * PENDING/PROCESSING already reserve amount so concurrent admins cannot over-refund.
 */
export function getRefundableAmount(input: {
  grandTotalMinor: number;
  refunds: readonly RefundAmountRow[];
}): number {
  const committed =
    getSucceededRefundsMinor(input.refunds) + getReservedRefundsMinor(input.refunds);
  return Math.max(0, input.grandTotalMinor - committed);
}

export function planRefundAmount(input: {
  type: RefundType;
  requestedAmountMinor?: number;
  refundableMinor: number;
}): { ok: true; amountMinor: number } | { ok: false; reason: "invalid_amount" | "nothing_refundable" } {
  const refundable = Math.max(0, input.refundableMinor);
  if (refundable <= 0) {
    return { ok: false, reason: "nothing_refundable" };
  }
  if (input.type === "FULL") {
    return { ok: true, amountMinor: refundable };
  }
  const requested = input.requestedAmountMinor ?? 0;
  if (!Number.isInteger(requested) || requested <= 0 || requested > refundable) {
    return { ok: false, reason: "invalid_amount" };
  }
  return { ok: true, amountMinor: requested };
}

export function mapStripeRefundStatus(status: string): RefundStatus {
  switch (status) {
    case "succeeded":
      return "SUCCEEDED";
    case "failed":
      return "FAILED";
    case "canceled":
      return "CANCELED";
    case "pending":
    case "requires_action":
      return "PROCESSING";
    default:
      return "PROCESSING";
  }
}

export function shouldApplyRefundTransition(input: {
  current: RefundStatus;
  next: RefundStatus;
}): boolean {
  if (input.current === input.next) {
    return false;
  }
  if (input.current === "SUCCEEDED") {
    return false;
  }
  if (input.current === "CANCELED" && input.next !== "SUCCEEDED") {
    return false;
  }
  return true;
}
