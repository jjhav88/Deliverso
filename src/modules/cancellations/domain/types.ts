export const cancellationRequestStatuses = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
  "COMPLETED",
] as const;

export type CancellationRequestStatus = (typeof cancellationRequestStatuses)[number];

export const refundStatuses = [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
] as const;

export type RefundStatus = (typeof refundStatuses)[number];

export const refundTypes = ["FULL", "PARTIAL"] as const;
export type RefundType = (typeof refundTypes)[number];

export const refundReasons = [
  "CUSTOMER_REQUEST",
  "DUPLICATE",
  "PRODUCT_UNAVAILABLE",
  "FULFILLMENT_ISSUE",
  "ORDER_ERROR",
  "QUALITY_ISSUE",
  "OTHER",
] as const;

export type RefundReason = (typeof refundReasons)[number];

export const refundEventTypes = [
  "REFUND_CREATED",
  "REFUND_SUBMITTED",
  "REFUND_SUCCEEDED",
  "REFUND_FAILED",
] as const;

export type RefundEventType = (typeof refundEventTypes)[number];

export const reservedRefundStatuses = ["PENDING", "PROCESSING"] as const;
export const succeededRefundStatuses = ["SUCCEEDED"] as const;

export const customerCancellationEligibleFulfillment = ["PENDING", "CONFIRMED"] as const;

export type OrderFinancialStatus =
  | "UNPAID"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELED_UNPAID";

export function isCancellationRequestStatus(value: string): value is CancellationRequestStatus {
  return (cancellationRequestStatuses as readonly string[]).includes(value);
}

export function isRefundStatus(value: string): value is RefundStatus {
  return (refundStatuses as readonly string[]).includes(value);
}

export function isRefundType(value: string): value is RefundType {
  return (refundTypes as readonly string[]).includes(value);
}

export function isRefundReason(value: string): value is RefundReason {
  return (refundReasons as readonly string[]).includes(value);
}

export function isRefundEventType(value: string): value is RefundEventType {
  return (refundEventTypes as readonly string[]).includes(value);
}

export function refundIdempotencyKey(refundId: string): string {
  return `refund:${refundId}:v1`;
}
