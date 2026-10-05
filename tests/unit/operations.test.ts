import { describe, expect, it } from "vitest";
import { templateForFulfillmentStatus } from "@/modules/email/domain/fulfillment-map";
import { fulfillmentEventKey } from "@/modules/email/domain/event-keys";
import { adminNavigation } from "@/config/admin-navigation";
import { adminAuditActions } from "@/modules/auth/domain/audit-actions";
import {
  isOperationalOrder,
  isPaidForFulfillment,
  isPartialRefundStillOperable,
} from "@/modules/operations/domain/eligibility";
import {
  evaluateFulfillmentTransition,
  fulfillmentActionLabel,
  getAllowedFulfillmentTransitions,
} from "@/modules/operations/domain/transitions";

const paidDelivery = {
  status: "PAID" as const,
  paymentStatus: "SUCCEEDED" as const,
  fulfillmentStatus: "CONFIRMED" as const,
  fulfillmentMethod: "DELIVERY" as const,
};

describe("operational eligibility", () => {
  it("requires PAID and SUCCEEDED", () => {
    expect(isPaidForFulfillment({ status: "PAID", paymentStatus: "SUCCEEDED" })).toBe(true);
    expect(isPaidForFulfillment({ status: "PENDING_PAYMENT", paymentStatus: "REQUIRES_ACTION" })).toBe(
      false,
    );
    expect(
      isOperationalOrder({
        status: "PENDING_PAYMENT",
        paymentStatus: "REQUIRES_ACTION",
        fulfillmentStatus: "PENDING",
      }),
    ).toBe(false);
  });

  it("excludes cancelled and expired orders", () => {
    expect(
      isOperationalOrder({
        status: "CANCELLED",
        paymentStatus: "SUCCEEDED",
        fulfillmentStatus: "CONFIRMED",
      }),
    ).toBe(false);
    expect(
      isOperationalOrder({
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        fulfillmentStatus: "CANCELLED",
      }),
    ).toBe(false);
    expect(
      isOperationalOrder({
        status: "EXPIRED",
        paymentStatus: "NOT_STARTED",
        fulfillmentStatus: "PENDING",
      }),
    ).toBe(false);
  });

  it("keeps partial refunds operable", () => {
    expect(
      isPartialRefundStillOperable({
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        fulfillmentStatus: "IN_PRODUCTION",
        refundedAmountMinor: 5000,
        grandTotalMinor: 45000,
      }),
    ).toBe(true);
    expect(
      getAllowedFulfillmentTransitions({
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        fulfillmentStatus: "IN_PRODUCTION",
        fulfillmentMethod: "DELIVERY",
      }),
    ).toEqual(["READY"]);
  });

  it("treats custom quote orders like catalog orders after payment", () => {
    expect(
      evaluateFulfillmentTransition(
        { ...paidDelivery, fulfillmentStatus: "CONFIRMED" },
        "IN_PRODUCTION",
      ),
    ).toEqual({ ok: true, from: "CONFIRMED", to: "IN_PRODUCTION", noop: false });
  });
});

describe("fulfillment transitions", () => {
  it("allows the paid delivery path and rejects jumps", () => {
    expect(getAllowedFulfillmentTransitions({ ...paidDelivery, fulfillmentStatus: "PENDING" })).toEqual([
      "CONFIRMED",
    ]);
    expect(getAllowedFulfillmentTransitions(paidDelivery)).toEqual(["IN_PRODUCTION"]);
    expect(
      getAllowedFulfillmentTransitions({ ...paidDelivery, fulfillmentStatus: "READY" }),
    ).toEqual(["OUT_FOR_DELIVERY"]);
    expect(
      evaluateFulfillmentTransition({ ...paidDelivery, fulfillmentStatus: "READY" }, "COMPLETED").ok,
    ).toBe(false);
    expect(evaluateFulfillmentTransition(paidDelivery, "READY").ok).toBe(false);
  });

  it("uses pickup path without out for delivery", () => {
    const pickup = { ...paidDelivery, fulfillmentMethod: "PICKUP" as const, fulfillmentStatus: "READY" as const };
    expect(getAllowedFulfillmentTransitions(pickup)).toEqual(["COMPLETED"]);
    expect(fulfillmentActionLabel("COMPLETED", "PICKUP")).toBe("Marcar como recogido");
    expect(fulfillmentActionLabel("OUT_FOR_DELIVERY", "DELIVERY")).toBe("Salir a entrega");
    expect(evaluateFulfillmentTransition(pickup, "OUT_FOR_DELIVERY").ok).toBe(false);
    expect(evaluateFulfillmentTransition(pickup, "COMPLETED")).toMatchObject({ ok: true, noop: false });
  });

  it("blocks unpaid and cancelled operational actions", () => {
    const unpaid = evaluateFulfillmentTransition(
      { ...paidDelivery, status: "PENDING_PAYMENT", paymentStatus: "REQUIRES_ACTION" },
      "IN_PRODUCTION",
    );
    expect(unpaid).toMatchObject({ ok: false, code: "UNPAID" });
    expect(
      getAllowedFulfillmentTransitions({
        ...paidDelivery,
        status: "PENDING_PAYMENT",
        paymentStatus: "REQUIRES_ACTION",
      }),
    ).toEqual([]);
    expect(
      evaluateFulfillmentTransition({ ...paidDelivery, status: "CANCELLED" }, "IN_PRODUCTION"),
    ).toMatchObject({ ok: false, code: "CANCELLED" });
    expect(getAllowedFulfillmentTransitions({ ...paidDelivery, status: "CANCELLED" })).toEqual([]);
  });

  it("completes delivery from out for delivery", () => {
    expect(
      evaluateFulfillmentTransition(
        { ...paidDelivery, fulfillmentStatus: "OUT_FOR_DELIVERY" },
        "COMPLETED",
      ),
    ).toMatchObject({ ok: true, from: "OUT_FOR_DELIVERY", to: "COMPLETED" });
  });

  it("queues one fulfillment email event key per status", () => {
    expect(templateForFulfillmentStatus("IN_PRODUCTION")).toBe("ORDER_IN_PRODUCTION");
    expect(templateForFulfillmentStatus("READY")).toBe("ORDER_READY");
    expect(templateForFulfillmentStatus("OUT_FOR_DELIVERY")).toBe("ORDER_OUT_FOR_DELIVERY");
    expect(templateForFulfillmentStatus("COMPLETED")).toBe("ORDER_COMPLETED");
    expect(fulfillmentEventKey("ord_1", "READY")).toBe("order:ord_1:fulfillment:READY:v1");
    expect(fulfillmentEventKey("ord_1", "READY")).toBe(fulfillmentEventKey("ord_1", "READY"));
    expect(adminAuditActions).toContain("ORDER_FULFILLMENT_STATUS_CHANGED");
  });
});

describe("admin operations navigation", () => {
  it("exposes the operations center", () => {
    expect(adminNavigation.find((item) => item.id === "operations")).toMatchObject({
      href: "/admin/operations",
      label: "Operación",
      availability: "ready",
    });
  });
});
