import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { PaymentStatus } from "@/modules/orders/domain/payment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";

export function isPaidForFulfillment(order: {
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
}): boolean {
  return order.status === "PAID" && order.paymentStatus === "SUCCEEDED";
}

export function isOrderCancelledForOperations(order: {
  status: OrderStatus | string;
  fulfillmentStatus: FulfillmentStatus | string;
}): boolean {
  return order.status === "CANCELLED" || order.fulfillmentStatus === "CANCELLED";
}

export function isOperationalOrder(order: {
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
  fulfillmentStatus: FulfillmentStatus | string;
}): boolean {
  if (isOrderCancelledForOperations(order)) {
    return false;
  }
  if (order.status === "EXPIRED") {
    return false;
  }
  return isPaidForFulfillment(order);
}

export function isPendingPaymentAttention(order: {
  status: OrderStatus | string;
}): boolean {
  return order.status === "PENDING_PAYMENT";
}

export function isPartialRefundStillOperable(order: {
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
  fulfillmentStatus: FulfillmentStatus | string;
  refundedAmountMinor: number;
  grandTotalMinor: number;
}): boolean {
  if (order.refundedAmountMinor <= 0) {
    return false;
  }
  if (order.refundedAmountMinor >= order.grandTotalMinor) {
    return false;
  }
  return isOperationalOrder(order);
}
