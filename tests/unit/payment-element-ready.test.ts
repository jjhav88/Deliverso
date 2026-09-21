import { describe, expect, it, vi } from "vitest";
import {
  canSubmitPaymentElement,
  createPaymentSubmitGuard,
  nextReadyStateAfterPaymentError,
  paymentButtonLabel,
  paymentDeclineMessage,
  safeStripeElementErrorLog,
  shouldKeepPaymentElementMountedAfterDecline,
  shouldMountPaymentElement,
  shouldRemountPaymentElements,
} from "@/modules/payments/domain/element-ready";
import { paymentAuthorityFromSearchParams } from "@/modules/orders/domain/confirmation";

const ready = {
  stripeReady: true,
  elementsReady: true,
  paymentElementReady: true,
  submitting: false,
  paymentIntentStatus: "requires_payment_method",
};

describe("Payment Element submit guards", () => {
  it("disables the button when stripe is null", () => {
    expect(canSubmitPaymentElement({ ...ready, stripeReady: false })).toBe(false);
  });

  it("disables the button when elements is null", () => {
    expect(canSubmitPaymentElement({ ...ready, elementsReady: false })).toBe(false);
  });

  it("disables the button before PaymentElement is ready", () => {
    expect(canSubmitPaymentElement({ ...ready, paymentElementReady: false })).toBe(false);
    expect(
      paymentButtonLabel({
        paymentElementReady: false,
        submitting: false,
        payLabel: "Pagar $450.00 MXN",
        loadingLabel: "Cargando pago...",
        processingLabel: "Procesando pago...",
      }),
    ).toBe("Cargando pago...");
  });

  it("enables the button after onReady", () => {
    expect(canSubmitPaymentElement(ready)).toBe(true);
    expect(
      paymentButtonLabel({
        paymentElementReady: true,
        submitting: false,
        payLabel: "Pagar $450.00 MXN",
        loadingLabel: "Cargando pago...",
        processingLabel: "Procesando pago...",
      }),
    ).toBe("Pagar $450.00 MXN");
  });

  it("disables the button while submitting", () => {
    expect(canSubmitPaymentElement({ ...ready, submitting: true })).toBe(false);
  });
});

describe("PaymentIntent mount rules", () => {
  it("does not mount PaymentElement for a succeeded intent", () => {
    expect(shouldMountPaymentElement("succeeded")).toBe(false);
    expect(canSubmitPaymentElement({ ...ready, paymentIntentStatus: "succeeded" })).toBe(false);
  });

  it("allows mount and retry when the intent requires a payment method", () => {
    expect(shouldMountPaymentElement("requires_payment_method")).toBe(true);
    expect(canSubmitPaymentElement(ready)).toBe(true);
  });
});

describe("card decline keeps the element usable", () => {
  it("shows a safe error without unmounting PaymentElement", () => {
    expect(
      paymentDeclineMessage({
        stripeMessage: "Your card was declined.",
        fallback: "No fue posible completar el pago.",
      }),
    ).toBe("Your card was declined.");
    expect(nextReadyStateAfterPaymentError(true)).toBe(true);
    expect(
      shouldKeepPaymentElementMountedAfterDecline({
        paymentElementReady: true,
        paymentIntentStatus: "requires_payment_method",
      }),
    ).toBe(true);
    expect(
      shouldRemountPaymentElements({
        previousClientSecret: "pi_same_secret",
        nextClientSecret: "pi_same_secret",
        submitting: false,
        loading: false,
      }),
    ).toBe(false);
  });
});

describe("double submit", () => {
  it("lets only one confirmPayment start", async () => {
    const guard = createPaymentSubmitGuard();
    const confirmPayment = vi.fn(async () => ({ error: null }));

    const first = guard.tryStart();
    const second = guard.tryStart();
    expect(first).toBe(true);
    expect(second).toBe(false);

    if (first) {
      await confirmPayment();
      guard.finish();
    }
    if (second) {
      await confirmPayment();
    }

    expect(confirmPayment).toHaveBeenCalledTimes(1);
    expect(canSubmitPaymentElement({ ...ready, submitting: true })).toBe(false);
  });
});

describe("query params are not payment authority", () => {
  it("does not enable submit from redirect_status", () => {
    const query = { redirect_status: "succeeded", payment_intent: "pi_test" };
    expect(paymentAuthorityFromSearchParams(query)).toEqual({
      orderStatus: "",
      paymentStatus: "",
    });
    expect(
      canSubmitPaymentElement({
        stripeReady: false,
        elementsReady: false,
        paymentElementReady: false,
        submitting: false,
        paymentIntentStatus: "requires_payment_method",
        searchParams: query,
      }),
    ).toBe(false);
  });
});

describe("safe load error logging", () => {
  it("keeps only type, code and message", () => {
    expect(
      safeStripeElementErrorLog({
        type: "invalid_request_error",
        code: "payment_intent_unexpected_state",
        message: "We could not retrieve data from the specified Element.",
      }),
    ).toEqual({
      type: "invalid_request_error",
      code: "payment_intent_unexpected_state",
      message: "We could not retrieve data from the specified Element.",
    });
  });
});
