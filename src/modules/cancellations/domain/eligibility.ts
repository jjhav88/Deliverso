import { customerCancellationEligibleFulfillment } from "@/modules/cancellations/domain/types";

export type CancellationEligibilityReason =
  | "not_paid"
  | "already_canceled"
  | "ineligible_fulfillment"
  | "active_request";

export type CancellationEligibility =
  | { ok: true }
  | { ok: false; reason: CancellationEligibilityReason };

export type CancellationEligibilityInput = {
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  hasActiveRequest?: boolean;
};

export function hasActiveCancellationRequest(status: string | null | undefined): boolean {
  return status === "REQUESTED" || status === "APPROVED";
}

export function canCustomerRequestCancellation(
  order: CancellationEligibilityInput,
): CancellationEligibility {
  if (order.status === "CANCELLED" || order.fulfillmentStatus === "CANCELLED") {
    return { ok: false, reason: "already_canceled" };
  }
  if (order.status !== "PAID" || order.paymentStatus !== "SUCCEEDED") {
    return { ok: false, reason: "not_paid" };
  }
  if (order.hasActiveRequest) {
    return { ok: false, reason: "active_request" };
  }
  if (
    !(customerCancellationEligibleFulfillment as readonly string[]).includes(order.fulfillmentStatus)
  ) {
    return { ok: false, reason: "ineligible_fulfillment" };
  }
  return { ok: true };
}

export function canCustomerWithdrawCancellation(status: string): boolean {
  return status === "REQUESTED";
}

export function canAdminCancelPendingOrder(input: {
  status: string;
  paymentStatus: string;
}): boolean {
  return input.status === "PENDING_PAYMENT" && input.paymentStatus !== "SUCCEEDED";
}

export function canAdminRefundOrder(input: {
  status: string;
  paymentStatus: string;
  refundableMinor: number;
}): boolean {
  return (
    input.paymentStatus === "SUCCEEDED" &&
    input.status !== "PENDING_PAYMENT" &&
    input.refundableMinor > 0
  );
}

export function canAdminCancelPaidOrder(input: {
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  refundableMinor: number;
}): boolean {
  if (input.status === "CANCELLED" || input.fulfillmentStatus === "CANCELLED") {
    return false;
  }
  return canAdminRefundOrder(input);
}

export function canAdminReviewCancellation(status: string): boolean {
  return status === "REQUESTED";
}

/** Both ADMIN and SUPER_ADMIN may refund. No extra RBAC in M18. */
export function canIssueRefund(role: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
