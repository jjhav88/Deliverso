import { describe, expect, it } from "vitest";
import {
  canAdminCancelPaidOrder,
  canAdminCancelPendingOrder,
  canAdminRefundOrder,
  canCustomerRequestCancellation,
  canCustomerWithdrawCancellation,
  canIssueRefund,
  hasActiveCancellationRequest,
} from "@/modules/cancellations/domain/eligibility";
import {
  getRefundableAmount,
  mapStripeRefundStatus,
  planRefundAmount,
  shouldApplyRefundTransition,
} from "@/modules/cancellations/domain/refundable";
import { getOrderFinancialStatus, netPaidMinor } from "@/modules/cancellations/domain/financial-status";
import {
  cancellationStatusLabel,
  financialStatusLabel,
  refundReasonLabel,
} from "@/modules/cancellations/domain/labels";
import { refundIdempotencyKey } from "@/modules/cancellations/domain/types";
import { canAccessCustomerOrder } from "@/modules/orders/domain/ownership";
import {
  cancellationApprovedEventKey,
  cancellationRejectedEventKey,
  cancellationRequestedEventKey,
  orderCanceledEventKey,
  refundFailedEventKey,
  refundSucceededEventKey,
} from "@/modules/email/domain/event-keys";
import { getEmailHeadline, getEmailIntro } from "@/modules/email/domain/presentation";
import { getEmailSubject } from "@/modules/email/domain/subjects";
import { renderTransactionalEmail } from "@/modules/email/templates/render";
import { sampleOrderView } from "@/modules/email/sample-data";
import { adminAuditActions } from "@/modules/auth/domain/audit-actions";
import { adminNavigation } from "@/config/admin-navigation";

const paidOrder = {
  status: "PAID",
  paymentStatus: "SUCCEEDED",
  fulfillmentStatus: "PENDING",
};

describe("unpaid cancel", () => {
  it("lets customer or admin cancel pending payment without a refund record", () => {
    expect(canAdminCancelPendingOrder({ status: "PENDING_PAYMENT", paymentStatus: "REQUIRES_PAYMENT_METHOD" })).toBe(
      true,
    );
    expect(canAdminCancelPendingOrder({ status: "PAID", paymentStatus: "SUCCEEDED" })).toBe(false);
    expect(canAdminRefundOrder({ status: "PENDING_PAYMENT", paymentStatus: "REQUIRES_PAYMENT_METHOD", refundableMinor: 10000 })).toBe(
      false,
    );
  });
});

describe("customer request", () => {
  it("allows request only for paid early fulfillment and one active request", () => {
    expect(canCustomerRequestCancellation(paidOrder)).toEqual({ ok: true });
    expect(
      canCustomerRequestCancellation({ ...paidOrder, fulfillmentStatus: "CONFIRMED" }),
    ).toEqual({ ok: true });
    expect(
      canCustomerRequestCancellation({ ...paidOrder, hasActiveRequest: true }),
    ).toEqual({ ok: false, reason: "active_request" });
    expect(hasActiveCancellationRequest("REQUESTED")).toBe(true);
    expect(hasActiveCancellationRequest("APPROVED")).toBe(true);
    expect(hasActiveCancellationRequest("REJECTED")).toBe(false);
  });

  it("blocks auto-request after production starts", () => {
    for (const fulfillmentStatus of ["IN_PRODUCTION", "READY", "OUT_FOR_DELIVERY", "COMPLETED"]) {
      expect(
        canCustomerRequestCancellation({ ...paidOrder, fulfillmentStatus }),
      ).toEqual({ ok: false, reason: "ineligible_fulfillment" });
    }
    expect(canAdminRefundOrder({ status: "PAID", paymentStatus: "SUCCEEDED", refundableMinor: 10000 })).toBe(true);
  });

  it("allows withdraw only while REQUESTED", () => {
    expect(canCustomerWithdrawCancellation("REQUESTED")).toBe(true);
    expect(canCustomerWithdrawCancellation("APPROVED")).toBe(false);
    expect(canCustomerWithdrawCancellation("REJECTED")).toBe(false);
  });
});

describe("refundable calculation", () => {
  it("uses grandTotal and never goes negative", () => {
    expect(getRefundableAmount({ grandTotalMinor: 90000, refunds: [] })).toBe(90000);
    expect(
      getRefundableAmount({
        grandTotalMinor: 90000,
        refunds: [{ status: "SUCCEEDED", amountMinor: 20000 }],
      }),
    ).toBe(70000);
    expect(
      getRefundableAmount({
        grandTotalMinor: 90000,
        refunds: [{ status: "SUCCEEDED", amountMinor: 90000 }],
      }),
    ).toBe(0);
  });

  it("reserves PENDING and PROCESSING against concurrent refunds", () => {
    expect(
      getRefundableAmount({
        grandTotalMinor: 90000,
        refunds: [{ status: "PENDING", amountMinor: 90000 }],
      }),
    ).toBe(0);
    expect(
      getRefundableAmount({
        grandTotalMinor: 90000,
        refunds: [
          { status: "SUCCEEDED", amountMinor: 20000 },
          { status: "PROCESSING", amountMinor: 10000 },
        ],
      }),
    ).toBe(60000);
  });

  it("releases FAILED so a retry can use the amount again", () => {
    expect(
      getRefundableAmount({
        grandTotalMinor: 90000,
        refunds: [{ status: "FAILED", amountMinor: 90000 }],
      }),
    ).toBe(90000);
  });

  it("plans full remaining after partial, never the original 900", () => {
    const refundable = getRefundableAmount({
      grandTotalMinor: 90000,
      refunds: [{ status: "SUCCEEDED", amountMinor: 20000 }],
    });
    expect(planRefundAmount({ type: "FULL", refundableMinor: refundable })).toEqual({
      ok: true,
      amountMinor: 70000,
    });
  });

  it("allows multiple partials until the paid total and rejects over-refund", () => {
    const afterFirst = getRefundableAmount({
      grandTotalMinor: 90000,
      refunds: [{ status: "SUCCEEDED", amountMinor: 20000 }],
    });
    expect(planRefundAmount({ type: "PARTIAL", requestedAmountMinor: 10000, refundableMinor: afterFirst })).toEqual({
      ok: true,
      amountMinor: 10000,
    });
    expect(planRefundAmount({ type: "PARTIAL", requestedAmountMinor: 80000, refundableMinor: afterFirst })).toEqual({
      ok: false,
      reason: "invalid_amount",
    });
    expect(planRefundAmount({ type: "PARTIAL", requestedAmountMinor: 0, refundableMinor: afterFirst })).toEqual({
      ok: false,
      reason: "invalid_amount",
    });
  });

  it("uses paid grandTotal for promotion and quotation orders", () => {
    const promoPaid = 36000;
    expect(getRefundableAmount({ grandTotalMinor: promoPaid, refunds: [] })).toBe(36000);
    const quotePaid = 475000;
    expect(getRefundableAmount({ grandTotalMinor: quotePaid, refunds: [] })).toBe(475000);
  });
});

describe("financial status", () => {
  it("derives paid, partial and refunded without hacking PaymentStatus", () => {
    expect(
      getOrderFinancialStatus({
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        grandTotalMinor: 90000,
        refundedAmountMinor: 0,
      }),
    ).toBe("PAID");
    expect(
      getOrderFinancialStatus({
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        grandTotalMinor: 90000,
        refundedAmountMinor: 20000,
      }),
    ).toBe("PARTIALLY_REFUNDED");
    expect(
      getOrderFinancialStatus({
        status: "CANCELLED",
        paymentStatus: "SUCCEEDED",
        grandTotalMinor: 90000,
        refundedAmountMinor: 90000,
      }),
    ).toBe("REFUNDED");
    expect(netPaidMinor({ grandTotalMinor: 90000, refundedAmountMinor: 20000 })).toBe(70000);
  });

  it("keeps completed orders completed after a partial refund", () => {
    expect(
      canAdminCancelPaidOrder({
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        fulfillmentStatus: "COMPLETED",
        refundableMinor: 20000,
      }),
    ).toBe(true);
    expect(
      getOrderFinancialStatus({
        status: "PAID",
        paymentStatus: "SUCCEEDED",
        grandTotalMinor: 90000,
        refundedAmountMinor: 20000,
      }),
    ).toBe("PARTIALLY_REFUNDED");
  });
});

describe("stripe adapter mapping", () => {
  it("maps provider statuses and keeps deterministic idempotency", () => {
    expect(mapStripeRefundStatus("succeeded")).toBe("SUCCEEDED");
    expect(mapStripeRefundStatus("pending")).toBe("PROCESSING");
    expect(mapStripeRefundStatus("failed")).toBe("FAILED");
    expect(mapStripeRefundStatus("canceled")).toBe("CANCELED");
    expect(refundIdempotencyKey("ref_1")).toBe("refund:ref_1:v1");
    expect(refundIdempotencyKey("ref_1")).toBe(refundIdempotencyKey("ref_1"));
  });

  it("ignores duplicate success and does not downgrade SUCCEEDED", () => {
    expect(shouldApplyRefundTransition({ current: "SUCCEEDED", next: "SUCCEEDED" })).toBe(false);
    expect(shouldApplyRefundTransition({ current: "SUCCEEDED", next: "FAILED" })).toBe(false);
    expect(shouldApplyRefundTransition({ current: "PROCESSING", next: "SUCCEEDED" })).toBe(true);
    expect(shouldApplyRefundTransition({ current: "PENDING", next: "FAILED" })).toBe(true);
  });
});

describe("emails and audit", () => {
  it("queues one event key per request or refund", () => {
    expect(cancellationRequestedEventKey("req_1")).toBe("cancellation:req_1:requested:v1");
    expect(cancellationApprovedEventKey("req_1")).toBe("cancellation:req_1:approved:v1");
    expect(cancellationRejectedEventKey("req_1")).toBe("cancellation:req_1:rejected:v1");
    expect(orderCanceledEventKey("ord_1")).toBe("order:ord_1:canceled:v1");
    expect(refundSucceededEventKey("ref_1")).toBe("refund:ref_1:succeeded:v1");
    expect(refundFailedEventKey("ref_1")).toBe("refund:ref_1:failed:v1");
  });

  it("does not claim money is back until refund succeeded", () => {
    expect(getEmailIntro("CANCELLATION_APPROVED", "es-MX")).toContain("cuando el reembolso esté listo");
    expect(getEmailIntro("CANCELLATION_REQUESTED", "es-MX")).toContain("sigue activo");
    expect(getEmailSubject("REFUND_SUCCEEDED", "es-MX", { orderNumber: "DEL-1", fulfillmentMethod: "DELIVERY" })).toContain(
      "Procesamos tu reembolso",
    );
    const rendered = renderTransactionalEmail({
      template: "REFUND_SUCCEEDED",
      order: {
        ...sampleOrderView("es-MX"),
        refundAmountMinor: 20000,
        refundReasonLabel: refundReasonLabel("CUSTOMER_REQUEST"),
      },
    });
    expect(rendered.html).toContain("Hemos procesado tu reembolso");
    expect(rendered.html).toContain("$200.00");
    expect(rendered.html).toContain("Solicitud del cliente");
    expect(rendered.text).toContain("banco puede tardar");
  });

  it("records admin audit actions for approve, reject and refunds", () => {
    expect(adminAuditActions).toContain("CANCELLATION_APPROVED");
    expect(adminAuditActions).toContain("CANCELLATION_REJECTED");
    expect(adminAuditActions).toContain("REFUND_CREATED");
    expect(adminAuditActions).toContain("REFUND_SUCCEEDED");
    expect(adminAuditActions).toContain("REFUND_FAILED");
    expect(adminAuditActions).toContain("ORDER_CANCELLED");
  });
});

describe("ownership and permissions", () => {
  it("does not trust orderNumber alone", () => {
    expect(
      canAccessCustomerOrder({ orderCustomerId: "cus_a", customerId: "cus_b" }),
    ).toBe(false);
    expect(
      canAccessCustomerOrder({ orderCustomerId: "cus_a", customerId: "cus_a" }),
    ).toBe(true);
  });

  it("lets both admin roles refund without a new RBAC system", () => {
    expect(canIssueRefund("ADMIN")).toBe(true);
    expect(canIssueRefund("SUPER_ADMIN")).toBe(true);
    expect(canIssueRefund("CUSTOMER")).toBe(false);
  });
});

describe("human labels", () => {
  it("never surfaces raw enums to customers", () => {
    expect(refundReasonLabel("CUSTOMER_REQUEST", "es-MX")).toBe("Solicitud del cliente");
    expect(refundReasonLabel("CUSTOMER_REQUEST", "en-US")).toBe("Customer request");
    expect(cancellationStatusLabel("REQUESTED", "es-MX")).toBe("Pendiente de revisión");
    expect(financialStatusLabel("PARTIALLY_REFUNDED", "es-MX")).toBe("Reembolso parcial");
    expect(financialStatusLabel("REFUNDED", "en-US")).toBe("Refunded");
    expect(getEmailHeadline("ORDER_CANCELED", "es-MX")).not.toContain("ORDER_CANCELED");
  });
});

describe("admin navigation", () => {
  it("exposes the cancellations inbox", () => {
    expect(adminNavigation.find((item) => item.id === "cancellations")?.href).toBe("/admin/cancellations");
  });
});
