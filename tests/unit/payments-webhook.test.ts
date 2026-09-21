import { describe, expect, it } from "vitest";
import { planPaymentIntentEvent } from "@/modules/orders/domain/webhook-plan";
import { isStripePaymentAmountValid } from "@/modules/orders/domain/payment-status";
import { orderPaidEventKey } from "@/modules/email/domain/event-keys";
import { webhookHttpStatus, shouldRetryStripeDelivery } from "@/modules/payments/domain/webhook-http";

const baseSucceeded = {
  eventType: "payment_intent.succeeded",
  orderStatus: "PENDING_PAYMENT" as const,
  paymentStatus: "REQUIRES_PAYMENT_METHOD" as const,
  amount: 123000,
  currency: "mxn",
  expectedAmountMinor: 123000,
};

describe("webhook HTTP outcomes", () => {
  it("returns 200 for processed, duplicate and ignored business results", () => {
    expect(webhookHttpStatus({ ok: true, result: "processed" })).toBe(200);
    expect(webhookHttpStatus({ ok: true, result: "duplicate" })).toBe(200);
    expect(webhookHttpStatus({ ok: true, result: "ignored" })).toBe(200);
    expect(webhookHttpStatus({ ok: true, result: "amount_mismatch" })).toBe(200);
    expect(shouldRetryStripeDelivery(200)).toBe(false);
  });

  it("returns 400 for invalid signature and 503 for a missing order", () => {
    expect(webhookHttpStatus({ ok: false, reason: "invalid_signature" })).toBe(400);
    expect(webhookHttpStatus({ ok: false, reason: "missing_order" })).toBe(503);
    expect(shouldRetryStripeDelivery(503)).toBe(true);
    expect(shouldRetryStripeDelivery(400)).toBe(false);
  });
});

describe("succeeded payment plan", () => {
  it("marks the order PAID and the cart CHECKED_OUT once", () => {
    const first = planPaymentIntentEvent(baseSucceeded);
    expect(first).toMatchObject({
      action: "apply",
      paymentStatus: "SUCCEEDED",
      orderStatus: "PAID",
      cartStatus: "CHECKED_OUT",
      markPaid: true,
    });
    const duplicate = planPaymentIntentEvent({
      ...baseSucceeded,
      orderStatus: "PAID",
      paymentStatus: "SUCCEEDED",
    });
    expect(duplicate).toEqual({ action: "ignore", reason: "ALREADY_TERMINAL" });
    expect(orderPaidEventKey("ord_1")).toBe(orderPaidEventKey("ord_1"));
  });

  it("rejects amount and currency mismatches", () => {
    expect(
      isStripePaymentAmountValid({ amount: 1, currency: "mxn", expectedAmountMinor: 123000 }),
    ).toBe(false);
    expect(planPaymentIntentEvent({ ...baseSucceeded, amount: 1 }).action).toBe("reject");
    expect(planPaymentIntentEvent({ ...baseSucceeded, currency: "usd" }).action).toBe("reject");
  });
});
