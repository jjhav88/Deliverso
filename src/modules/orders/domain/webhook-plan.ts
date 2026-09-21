import type { OrderStatus } from "@/modules/orders/domain/status";
import {
  canTransitionPaymentStatus,
  isStripePaymentAmountValid,
  type PaymentStatus,
} from "@/modules/orders/domain/payment-status";

export type StripeHandledEventType =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.processing"
  | "payment_intent.canceled";

export function isHandledStripeEvent(type: string): type is StripeHandledEventType {
  return (
    type === "payment_intent.succeeded" ||
    type === "payment_intent.payment_failed" ||
    type === "payment_intent.processing" ||
    type === "payment_intent.canceled"
  );
}

export type PaymentIntentPlan =
  | { action: "ignore"; reason: "UNHANDLED" | "ALREADY_TERMINAL" | "NO_TRANSITION" }
  | { action: "reject"; reason: "AMOUNT_MISMATCH" }
  | {
      action: "apply";
      paymentStatus: PaymentStatus;
      orderStatus?: OrderStatus;
      cartStatus?: "CHECKED_OUT" | "ACTIVE";
      fulfillmentStatus?: "PENDING";
      markPaid?: boolean;
      cancelOrder?: boolean;
    };

export function planPaymentIntentEvent(input: {
  eventType: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  expectedAmountMinor: number;
}): PaymentIntentPlan {
  if (!isHandledStripeEvent(input.eventType)) {
    return { action: "ignore", reason: "UNHANDLED" };
  }

  if (input.eventType === "payment_intent.succeeded") {
    if (!isStripePaymentAmountValid(input)) {
      return { action: "reject", reason: "AMOUNT_MISMATCH" };
    }
    if (input.orderStatus === "PAID" && input.paymentStatus === "SUCCEEDED") {
      return { action: "ignore", reason: "ALREADY_TERMINAL" };
    }
    if (!canTransitionPaymentStatus(input.paymentStatus, "SUCCEEDED")) {
      return { action: "ignore", reason: "ALREADY_TERMINAL" };
    }
    return {
      action: "apply",
      paymentStatus: "SUCCEEDED",
      orderStatus: "PAID",
      cartStatus: "CHECKED_OUT",
      fulfillmentStatus: "PENDING",
      markPaid: true,
    };
  }

  if (input.paymentStatus === "SUCCEEDED" || input.orderStatus === "PAID") {
    return { action: "ignore", reason: "ALREADY_TERMINAL" };
  }

  if (input.eventType === "payment_intent.processing") {
    if (!canTransitionPaymentStatus(input.paymentStatus, "PROCESSING")) {
      return { action: "ignore", reason: "NO_TRANSITION" };
    }
    return { action: "apply", paymentStatus: "PROCESSING" };
  }

  if (input.eventType === "payment_intent.payment_failed") {
    if (!canTransitionPaymentStatus(input.paymentStatus, "FAILED")) {
      return { action: "ignore", reason: "NO_TRANSITION" };
    }
    return { action: "apply", paymentStatus: "FAILED" };
  }

  if (!canTransitionPaymentStatus(input.paymentStatus, "CANCELED")) {
    return { action: "ignore", reason: "NO_TRANSITION" };
  }

  return {
    action: "apply",
    paymentStatus: "CANCELED",
    orderStatus: "CANCELLED",
    cartStatus: "ACTIVE",
    cancelOrder: true,
  };
}
