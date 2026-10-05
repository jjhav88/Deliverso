import { describe, expect, it } from "vitest";
import {
  approveRefundConfirmCopy,
  cancellationStatusBadgeVariant,
  customerRefundHighlightLabel,
  getCustomerRefundHighlight,
} from "@/modules/cancellations/domain/presentation";
import { cancellationStatusLabel, financialStatusLabel } from "@/modules/cancellations/domain/labels";
import {
  customerOrderLifecycleLabel,
  fulfillmentStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/modules/orders/domain/labels";

describe("admin cancellation presentation", () => {
  it("humanizes request statuses without raw enums", () => {
    expect(cancellationStatusLabel("REQUESTED")).toBe("Pendiente de revisión");
    expect(cancellationStatusLabel("APPROVED")).toBe("Aprobada");
    expect(cancellationStatusLabel("REJECTED")).toBe("Rechazada");
    expect(cancellationStatusLabel("WITHDRAWN")).toBe("Retirada");
    expect(cancellationStatusLabel("COMPLETED")).toBe("Completada");
    expect(cancellationStatusLabel("REQUESTED")).not.toBe("REQUESTED");
    expect(cancellationStatusBadgeVariant("REQUESTED")).toBe("warning");
    expect(fulfillmentStatusLabel("PENDING")).toBe("Pendiente");
    expect(fulfillmentStatusLabel("PENDING")).not.toBe("PENDING");
  });

  it("uses monetary confirmation copy for approve", () => {
    const copy = approveRefundConfirmCopy("$100.00");
    expect(copy).toContain("$100.00");
    expect(copy).toContain("Stripe");
    expect(copy).toContain("financieramente");
    expect(copy).not.toContain("REQUESTED");
  });
});

describe("customer refund presentation", () => {
  it("shows refunded badge state for a full refund", () => {
    expect(
      getCustomerRefundHighlight({
        financialStatus: "REFUNDED",
        hasReservedRefund: false,
        hasFailedRefund: false,
      }),
    ).toBe("refunded");
    expect(customerRefundHighlightLabel("refunded", "es-MX")).toBe("Reembolsado");
    expect(customerRefundHighlightLabel("refunded", "en-US")).toBe("Refunded");
    expect(customerRefundHighlightLabel("refunded", "es-MX")).not.toBe("REFUNDED");
  });

  it("shows partial refund independently of a completed order", () => {
    expect(
      getCustomerRefundHighlight({
        financialStatus: "PARTIALLY_REFUNDED",
        hasReservedRefund: false,
        hasFailedRefund: false,
      }),
    ).toBe("partial");
    expect(customerRefundHighlightLabel("partial", "es-MX")).toBe("Reembolso parcial");
    expect(customerRefundHighlightLabel("partial", "en-US")).toBe("Partially refunded");
    expect(
      customerOrderLifecycleLabel({
        status: "PAID",
        fulfillmentStatus: "COMPLETED",
        locale: "es-MX",
      }),
    ).toBe("Completado");
    expect(
      customerOrderLifecycleLabel({
        status: "PAID",
        fulfillmentStatus: "COMPLETED",
      }),
    ).not.toBe("CANCELLED");
  });

  it("prefers processing over refunded copy while Stripe is pending", () => {
    expect(
      getCustomerRefundHighlight({
        financialStatus: "PAID",
        hasReservedRefund: true,
        hasFailedRefund: false,
      }),
    ).toBe("processing");
    expect(customerRefundHighlightLabel("processing", "es-MX")).toBe("Reembolso en proceso");
    expect(customerRefundHighlightLabel("processing", "en-US")).toBe("Refund processing");
    expect(customerRefundHighlightLabel("processing")).not.toContain("Ya fue reembolsado");
  });

  it("uses a safe reviewing label for failed refunds", () => {
    expect(
      getCustomerRefundHighlight({
        financialStatus: "PAID",
        hasReservedRefund: false,
        hasFailedRefund: true,
      }),
    ).toBe("reviewing");
    expect(customerRefundHighlightLabel("reviewing", "es-MX")).not.toContain("FAILED");
  });

  it("humanizes cancelled and paid headers", () => {
    expect(orderStatusLabel("CANCELLED", "es-MX")).toBe("Cancelado");
    expect(orderStatusLabel("CANCELLED", "en-US")).toBe("Canceled");
    expect(paymentStatusLabel("SUCCEEDED", "es-MX")).toBe("Confirmado");
    expect(paymentStatusLabel("SUCCEEDED", "en-US")).toBe("Confirmed");
    expect(financialStatusLabel("REFUNDED", "es-MX")).toBe("Reembolsado");
    expect(orderStatusLabel("CANCELLED")).not.toBe("CANCELLED");
    expect(paymentStatusLabel("SUCCEEDED")).not.toBe("SUCCEEDED");
  });
});
