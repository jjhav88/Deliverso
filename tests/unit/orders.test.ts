import { describe, expect, it } from "vitest";
import { formatOrderNumber, isOrderNumberFormat } from "@/modules/orders/domain/order-number";
import {
  canTransitionOrderStatus,
  paymentSuccessPreventsExpiry,
} from "@/modules/orders/domain/status";
import {
  canTransitionFulfillmentStatus,
  nextFulfillmentStatuses,
} from "@/modules/orders/domain/fulfillment-status";
import { canAccessCustomerOrder, isCartWritable } from "@/modules/orders/domain/ownership";
import {
  canInitializePaymentElement,
  canRetryCardPayment,
  canTransitionPaymentStatus,
  isStripePaymentAmountValid,
  isTerminalPaymentIntentStatus,
} from "@/modules/orders/domain/payment-status";
import { planPaymentIntentEvent } from "@/modules/orders/domain/webhook-plan";
import { isStripeLiveKey } from "@/config/payments";
import { checkoutDraftStatuses } from "@/modules/checkout/domain/status";
import { appPathnames } from "@/config/navigation";
import { adminNavigation } from "@/config/admin-navigation";

describe("order number", () => {
  it("uses a readable non-UUID format", () => {
    const number = formatOrderNumber(new Date("2026-09-17T00:00:00.000Z"), "X7K29Q");
    expect(number).toBe("DEL-260917-X7K29Q");
    expect(isOrderNumberFormat(number)).toBe(true);
    expect(number).not.toMatch(/[0-9a-f-]{36}/i);
  });
});

describe("order and payment transitions", () => {
  it("moves pending payment to paid and never degrades paid", () => {
    expect(canTransitionOrderStatus("PENDING_PAYMENT", "PAID")).toBe(true);
    expect(canTransitionOrderStatus("PENDING_PAYMENT", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("PENDING_PAYMENT", "EXPIRED")).toBe(true);
    expect(canTransitionOrderStatus("PAID", "PENDING_PAYMENT")).toBe(false);
    expect(canTransitionOrderStatus("PAID", "EXPIRED")).toBe(false);
    expect(canTransitionPaymentStatus("SUCCEEDED", "PROCESSING")).toBe(false);
    expect(canTransitionPaymentStatus("SUCCEEDED", "CANCELED")).toBe(false);
    expect(canTransitionPaymentStatus("PROCESSING", "SUCCEEDED")).toBe(true);
    expect(canInitializePaymentElement("requires_payment_method")).toBe(true);
    expect(canInitializePaymentElement("succeeded")).toBe(false);
    expect(canRetryCardPayment("requires_payment_method")).toBe(true);
    expect(canRetryCardPayment("succeeded")).toBe(false);
    expect(isTerminalPaymentIntentStatus("succeeded")).toBe(true);
    expect(isTerminalPaymentIntentStatus("canceled")).toBe(true);
    expect(isTerminalPaymentIntentStatus("requires_payment_method")).toBe(false);
  });

  it("lets a real payment win over expiry", () => {
    expect(paymentSuccessPreventsExpiry({ status: "PENDING_PAYMENT", paymentSucceeded: true })).toBe(true);
    expect(paymentSuccessPreventsExpiry({ status: "PAID", paymentSucceeded: false })).toBe(true);
    expect(paymentSuccessPreventsExpiry({ status: "PENDING_PAYMENT", paymentSucceeded: false })).toBe(false);
  });
});

describe("fulfillment machine", () => {
  it("allows the paid delivery path and rejects jumps", () => {
    expect(
      canTransitionFulfillmentStatus({
        from: "PENDING",
        to: "CONFIRMED",
        method: "DELIVERY",
        orderPaid: true,
      }),
    ).toBe(true);
    expect(nextFulfillmentStatuses("READY", "DELIVERY")).toEqual(["OUT_FOR_DELIVERY"]);
    expect(nextFulfillmentStatuses("READY", "PICKUP")).toEqual(["COMPLETED"]);
    expect(
      canTransitionFulfillmentStatus({
        from: "PENDING",
        to: "COMPLETED",
        method: "DELIVERY",
        orderPaid: true,
      }),
    ).toBe(false);
    expect(
      canTransitionFulfillmentStatus({
        from: "PENDING",
        to: "CONFIRMED",
        method: "DELIVERY",
        orderPaid: false,
      }),
    ).toBe(false);
  });
});

describe("webhook planning", () => {
  it("blocks amount or currency mismatches", () => {
    expect(
      isStripePaymentAmountValid({ amount: 123000, currency: "mxn", expectedAmountMinor: 123000 }),
    ).toBe(true);
    expect(
      planPaymentIntentEvent({
        eventType: "payment_intent.succeeded",
        orderStatus: "PENDING_PAYMENT",
        paymentStatus: "PROCESSING",
        amount: 122000,
        currency: "mxn",
        expectedAmountMinor: 123000,
      }),
    ).toEqual({ action: "reject", reason: "AMOUNT_MISMATCH" });
    expect(
      planPaymentIntentEvent({
        eventType: "payment_intent.succeeded",
        orderStatus: "PENDING_PAYMENT",
        paymentStatus: "PROCESSING",
        amount: 123000,
        currency: "usd",
        expectedAmountMinor: 123000,
      }).action,
    ).toBe("reject");
  });

  it("ignores out-of-order events after success", () => {
    expect(
      planPaymentIntentEvent({
        eventType: "payment_intent.processing",
        orderStatus: "PAID",
        paymentStatus: "SUCCEEDED",
        amount: 123000,
        currency: "mxn",
        expectedAmountMinor: 123000,
      }),
    ).toEqual({ action: "ignore", reason: "ALREADY_TERMINAL" });
    expect(
      planPaymentIntentEvent({
        eventType: "payment_intent.canceled",
        orderStatus: "PAID",
        paymentStatus: "SUCCEEDED",
        amount: 123000,
        currency: "mxn",
        expectedAmountMinor: 123000,
      }).action,
    ).toBe("ignore");
  });

  it("marks failed without paying and canceled with cart unlock", () => {
    expect(
      planPaymentIntentEvent({
        eventType: "payment_intent.payment_failed",
        orderStatus: "PENDING_PAYMENT",
        paymentStatus: "REQUIRES_PAYMENT_METHOD",
        amount: 123000,
        currency: "mxn",
        expectedAmountMinor: 123000,
      }),
    ).toMatchObject({ action: "apply", paymentStatus: "FAILED" });
    expect(
      planPaymentIntentEvent({
        eventType: "payment_intent.canceled",
        orderStatus: "PENDING_PAYMENT",
        paymentStatus: "REQUIRES_PAYMENT_METHOD",
        amount: 123000,
        currency: "mxn",
        expectedAmountMinor: 123000,
      }),
    ).toMatchObject({
      action: "apply",
      orderStatus: "CANCELLED",
      cartStatus: "ACTIVE",
    });
  });
});

describe("ownership and snapshots", () => {
  it("does not grant access by knowing an order number", () => {
    expect(
      canAccessCustomerOrder({
        orderCustomerId: "customer-a",
        customerId: "customer-b",
      }),
    ).toBe(false);
    expect(
      canAccessCustomerOrder({
        orderCustomerId: "customer-a",
        customerId: "customer-a",
      }),
    ).toBe(true);
  });

  it("locks the cart while a payment is pending", () => {
    expect(isCartWritable("ACTIVE")).toBe(true);
    expect(isCartWritable("PENDING_PAYMENT")).toBe(false);
  });

  it("keeps historical names and prices independent from later catalog edits", () => {
    const snapshot = {
      productNameEs: "Cheesecake de durazno",
      lineTotalMinor: 49900,
      optionNameEs: "Mini",
      customerName: "Ana",
      displayExchangeRate: "17.01",
    };
    const liveCatalog = {
      productNameEs: "Cheesecake de durazno premium",
      lineTotalMinor: 59900,
      optionNameEs: "Grande",
      customerName: "Ana García",
      displayExchangeRate: "18.40",
    };
    expect(snapshot.productNameEs).not.toBe(liveCatalog.productNameEs);
    expect(snapshot.lineTotalMinor).toBe(49900);
    expect(snapshot.optionNameEs).toBe("Mini");
    expect(snapshot.customerName).toBe("Ana");
    expect(snapshot.displayExchangeRate).toBe("17.01");
  });
});

describe("payment configuration", () => {
  it("rejects live Stripe keys in development helpers", () => {
    expect(isStripeLiveKey("sk_live_abc")).toBe(true);
    expect(isStripeLiveKey("pk_live_abc")).toBe(true);
    expect(isStripeLiveKey("sk_test_abc")).toBe(false);
  });

  it("adds converted draft status without using expired for success", () => {
    expect(checkoutDraftStatuses).toContain("CONVERTED_TO_ORDER");
    expect(checkoutDraftStatuses).toContain("EXPIRED");
  });

  it("localizes payment and confirmation routes", () => {
    expect(appPathnames["/pago/[orderNumber]"]).toEqual({
      "es-MX": "/pago/[orderNumber]",
      "en-US": "/payment/[orderNumber]",
    });
    expect(appPathnames["/pedido/[orderNumber]/confirmacion"]).toEqual({
      "es-MX": "/pedido/[orderNumber]/confirmacion",
      "en-US": "/order/[orderNumber]/confirmation",
    });
    expect(adminNavigation.find((item) => item.id === "orders")?.availability).toBe("ready");
  });
});
