import { describe, expect, it } from "vitest";
import {
  CONFIRMATION_POLL_INTERVAL_MS,
  CONFIRMATION_POLL_TIMEOUT_MS,
  isConfirmedByDatabase,
  paymentAuthorityFromSearchParams,
  resolveConfirmationPhase,
  shouldPollConfirmation,
  shouldShowPaymentRetry,
  toOwnedOrderPaymentStatusResult,
} from "@/modules/orders/domain/confirmation";

const pending = {
  orderStatus: "PENDING_PAYMENT",
  paymentStatus: "REQUIRES_PAYMENT_METHOD",
};

const querySucceeded = {
  redirect_status: "succeeded",
  payment_intent: "pi_test_succeeded",
  payment_intent_client_secret: "pi_test_succeeded_secret_xxx",
} as const;

describe("confirmation polling", () => {
  it("keeps a pending order in a light poll window", () => {
    const phase = resolveConfirmationPhase({ ...pending, elapsedMs: 0 });
    expect(phase).toBe("verifying");
    expect(shouldPollConfirmation(phase)).toBe(true);
    expect(CONFIRMATION_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(1500);
    expect(CONFIRMATION_POLL_INTERVAL_MS).toBeLessThanOrEqual(2000);
    expect(CONFIRMATION_POLL_TIMEOUT_MS).toBe(30_000);
  });

  it("moves from pending to paid only when the database says so", () => {
    expect(resolveConfirmationPhase({ ...pending, elapsedMs: 4_000 })).toBe("verifying");
    expect(
      resolveConfirmationPhase({
        orderStatus: "PAID",
        paymentStatus: "SUCCEEDED",
        elapsedMs: 4_000,
      }),
    ).toBe("paid");
    expect(shouldPollConfirmation("paid")).toBe(false);
  });
});

describe("confirmation paid initial render", () => {
  it("renders paid immediately without polling", () => {
    const phase = resolveConfirmationPhase({
      orderStatus: "PAID",
      paymentStatus: "SUCCEEDED",
      elapsedMs: 0,
      searchParams: querySucceeded,
    });
    expect(phase).toBe("paid");
    expect(isConfirmedByDatabase("PAID", "SUCCEEDED")).toBe(true);
    expect(shouldPollConfirmation(phase)).toBe(false);
  });
});

describe("confirmation failed", () => {
  it("shows a payment failure and only then allows retry", () => {
    const phase = resolveConfirmationPhase({
      orderStatus: "PENDING_PAYMENT",
      paymentStatus: "FAILED",
      elapsedMs: 1_000,
    });
    expect(phase).toBe("failed");
    expect(shouldPollConfirmation(phase)).toBe(false);
    expect(shouldShowPaymentRetry({ phase, stripeIntentStatus: "requires_payment_method" })).toBe(
      true,
    );
    expect(shouldShowPaymentRetry({ phase: "verifying", stripeIntentStatus: "requires_payment_method" })).toBe(
      false,
    );
    expect(shouldShowPaymentRetry({ phase, stripeIntentStatus: "succeeded" })).toBe(false);
  });
});

describe("confirmation timeout pending", () => {
  it("reassures the customer after 30s without calling it a payment error", () => {
    const phase = resolveConfirmationPhase({
      ...pending,
      elapsedMs: CONFIRMATION_POLL_TIMEOUT_MS,
    });
    expect(phase).toBe("delayed");
    expect(phase).not.toBe("failed");
    expect(shouldPollConfirmation(phase)).toBe(false);
    expect(shouldShowPaymentRetry({ phase, stripeIntentStatus: "requires_payment_method" })).toBe(
      false,
    );
  });
});

describe("confirmation ownership", () => {
  it("hides another customer order from the poll result", () => {
    expect(
      toOwnedOrderPaymentStatusResult({
        customerId: "cus_own",
        order: {
          customerId: "cus_other",
          status: "PAID",
          paymentStatus: "SUCCEEDED",
        },
      }),
    ).toEqual({ ok: false, reason: "not_found" });

    expect(
      toOwnedOrderPaymentStatusResult({
        customerId: "cus_own",
        order: null,
      }),
    ).toEqual({ ok: false, reason: "not_found" });

    expect(
      toOwnedOrderPaymentStatusResult({
        customerId: "cus_own",
        order: {
          customerId: "cus_own",
          status: "PENDING_PAYMENT",
          paymentStatus: "PROCESSING",
        },
      }),
    ).toEqual({
      ok: true,
      orderStatus: "PENDING_PAYMENT",
      paymentStatus: "PROCESSING",
    });
  });
});

describe("confirmation query-param authority", () => {
  it("never treats Stripe redirect params as a paid order", () => {
    expect(paymentAuthorityFromSearchParams(querySucceeded)).toEqual({
      orderStatus: "",
      paymentStatus: "",
    });
    expect(isConfirmedByDatabase("", "")).toBe(false);
    expect(
      resolveConfirmationPhase({
        ...pending,
        elapsedMs: 0,
        searchParams: querySucceeded,
      }),
    ).toBe("verifying");
    expect(
      isConfirmedByDatabase("PENDING_PAYMENT", "REQUIRES_PAYMENT_METHOD"),
    ).toBe(false);
  });

  it("shows syncing when Stripe already succeeded but the database has not", () => {
    expect(
      resolveConfirmationPhase({
        ...pending,
        stripeIntentStatus: "succeeded",
        elapsedMs: 0,
        searchParams: querySucceeded,
      }),
    ).toBe("syncing");
    expect(shouldPollConfirmation("syncing")).toBe(true);
  });
});
