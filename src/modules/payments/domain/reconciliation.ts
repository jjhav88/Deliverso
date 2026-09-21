import { isStripePaymentAmountValid } from "@/modules/orders/domain/payment-status";

export const paymentReconciliationMinAgeMs = 5 * 60 * 1000;

export type ReconciliationSnapshot = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: {
    orderId?: string;
    orderNumber?: string;
  };
};

export type ReconciliationOrder = {
  id: string;
  orderNumber: string;
  stripePaymentIntentId: string | null;
  grandTotalMinor: number;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "EXPIRED";
  createdAt: Date;
};

export type ReconciliationCheck =
  | { ok: true }
  | { ok: false; reason: "missing_intent" | "intent_mismatch" | "metadata_mismatch" | "amount_mismatch" | "not_succeeded" | "not_pending" | "too_recent" };

export function shouldConsiderForReconciliation(
  order: Pick<ReconciliationOrder, "status" | "stripePaymentIntentId" | "createdAt">,
  now = new Date(),
  minAgeMs = paymentReconciliationMinAgeMs,
): boolean {
  if (order.status !== "PENDING_PAYMENT") {
    return false;
  }
  if (!order.stripePaymentIntentId) {
    return false;
  }
  return now.getTime() - order.createdAt.getTime() >= minAgeMs;
}

export function validatePaymentReconciliation(input: {
  order: ReconciliationOrder;
  intent: ReconciliationSnapshot | null;
}): ReconciliationCheck {
  if (input.order.status !== "PENDING_PAYMENT") {
    return { ok: false, reason: "not_pending" };
  }
  if (!input.order.stripePaymentIntentId || !input.intent) {
    return { ok: false, reason: "missing_intent" };
  }
  if (input.intent.id !== input.order.stripePaymentIntentId) {
    return { ok: false, reason: "intent_mismatch" };
  }
  if (
    input.intent.metadata?.orderId !== input.order.id ||
    input.intent.metadata?.orderNumber !== input.order.orderNumber
  ) {
    return { ok: false, reason: "metadata_mismatch" };
  }
  if (
    !isStripePaymentAmountValid({
      amount: input.intent.amount,
      currency: input.intent.currency,
      expectedAmountMinor: input.order.grandTotalMinor,
    })
  ) {
    return { ok: false, reason: "amount_mismatch" };
  }
  if (input.intent.status !== "succeeded") {
    return { ok: false, reason: "not_succeeded" };
  }
  return { ok: true };
}
