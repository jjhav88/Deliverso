import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getOrderFinancialStatus, netPaidMinor } from "@/modules/cancellations/domain/financial-status";
import { getRefundableAmount } from "@/modules/cancellations/domain/refundable";
import {
  canAdminCancelPaidOrder,
  canAdminCancelPendingOrder,
  canAdminRefundOrder,
  canCustomerRequestCancellation,
  canCustomerWithdrawCancellation,
  hasActiveCancellationRequest,
} from "@/modules/cancellations/domain/eligibility";
import type { CancellationRequestStatus, OrderFinancialStatus, RefundReason, RefundStatus, RefundType } from "@/modules/cancellations/domain/types";
import { isCancellationRequestStatus } from "@/modules/cancellations/domain/types";

export type CustomerOrderFinance = {
  refundedAmountMinor: number;
  netPaidMinor: number;
  financialStatus: OrderFinancialStatus;
  canRequestCancellation: boolean;
  showSupportContact: boolean;
  request: {
    id: string;
    status: CancellationRequestStatus;
    reason: RefundReason;
    customerMessage: string | null;
    adminMessage: string | null;
    createdAt: string;
    canWithdraw: boolean;
  } | null;
};

export type AdminRefundRow = {
  id: string;
  type: RefundType;
  status: RefundStatus;
  reason: RefundReason;
  amountMinor: number;
  cancelsOrder: boolean;
  stripeRefundId: string | null;
  providerFailureMessage: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type AdminCancellationRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  grandTotalMinor: number;
  fulfillmentStatus: string;
  reason: RefundReason;
  status: CancellationRequestStatus;
  createdAt: string;
  customerMessage: string | null;
};

export type AdminOrderFinance = {
  refundedAmountMinor: number;
  refundableMinor: number;
  netPaidMinor: number;
  financialStatus: OrderFinancialStatus;
  canRefund: boolean;
  canCancelPaid: boolean;
  canCancelPending: boolean;
  refunds: AdminRefundRow[];
  requests: Array<{
    id: string;
    status: CancellationRequestStatus;
    reason: RefundReason;
    customerMessage: string | null;
    adminMessage: string | null;
    createdAt: string;
  }>;
};

export type CancellationDashboardCounts = {
  pendingRequests: number;
  failedRefunds: number;
};

export async function getCustomerOrderFinance(input: {
  customerId: string;
  orderNumber: string;
}): Promise<CustomerOrderFinance | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const order = await getPrisma().order.findFirst({
    where: { orderNumber: input.orderNumber, customerId: input.customerId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      grandTotalMinor: true,
      refundedAmountMinor: true,
      cancellationRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) {
    return null;
  }
  const latest = order.cancellationRequests[0] ?? null;
  const eligibility = canCustomerRequestCancellation({
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    hasActiveRequest: hasActiveCancellationRequest(latest?.status),
  });
  return {
    refundedAmountMinor: order.refundedAmountMinor,
    netPaidMinor: netPaidMinor({
      grandTotalMinor: order.grandTotalMinor,
      refundedAmountMinor: order.refundedAmountMinor,
    }),
    financialStatus: getOrderFinancialStatus(order),
    canRequestCancellation: eligibility.ok,
    showSupportContact:
      !eligibility.ok &&
      eligibility.reason === "ineligible_fulfillment" &&
      order.status === "PAID",
    request: latest
      ? {
          id: latest.id,
          status: latest.status,
          reason: latest.reason,
          customerMessage: latest.customerMessage,
          adminMessage: latest.adminMessage,
          createdAt: latest.createdAt.toISOString(),
          canWithdraw: canCustomerWithdrawCancellation(latest.status),
        }
      : null,
  };
}

export async function getAdminOrderFinance(orderId: string): Promise<AdminOrderFinance | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const order = await getPrisma().order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      grandTotalMinor: true,
      refundedAmountMinor: true,
      refunds: { orderBy: { createdAt: "desc" } },
      cancellationRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) {
    return null;
  }
  const refundableMinor = getRefundableAmount({
    grandTotalMinor: order.grandTotalMinor,
    refunds: order.refunds,
  });
  return {
    refundedAmountMinor: order.refundedAmountMinor,
    refundableMinor,
    netPaidMinor: netPaidMinor({
      grandTotalMinor: order.grandTotalMinor,
      refundedAmountMinor: order.refundedAmountMinor,
    }),
    financialStatus: getOrderFinancialStatus({
      ...order,
      refunds: order.refunds,
    }),
    canRefund: canAdminRefundOrder({ ...order, refundableMinor }),
    canCancelPaid: canAdminCancelPaidOrder({ ...order, refundableMinor }),
    canCancelPending: canAdminCancelPendingOrder(order),
    refunds: order.refunds.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      reason: row.reason,
      amountMinor: row.amountMinor,
      cancelsOrder: row.cancelsOrder,
      stripeRefundId: row.stripeRefundId,
      providerFailureMessage: row.providerFailureMessage,
      createdAt: row.createdAt.toISOString(),
      processedAt: row.processedAt?.toISOString() ?? null,
    })),
    requests: order.cancellationRequests.map((row) => ({
      id: row.id,
      status: row.status,
      reason: row.reason,
      customerMessage: row.customerMessage,
      adminMessage: row.adminMessage,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function listAdminCancellationRequests(input: {
  status?: string | null;
}): Promise<AdminCancellationRow[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }
  const status =
    input.status && isCancellationRequestStatus(input.status) ? input.status : undefined;
  const rows = await getPrisma().cancellationRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          grandTotalMinor: true,
          fulfillmentStatus: true,
        },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    orderId: row.order.id,
    orderNumber: row.order.orderNumber,
    customerName: row.order.customerName,
    customerEmail: row.order.customerEmail,
    grandTotalMinor: row.order.grandTotalMinor,
    fulfillmentStatus: row.order.fulfillmentStatus,
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    customerMessage: row.customerMessage,
  }));
}

export async function countCancellationDashboard(): Promise<CancellationDashboardCounts> {
  if (!hasRuntimeDatabaseUrl()) {
    return { pendingRequests: 0, failedRefunds: 0 };
  }
  const prisma = getPrisma();
  const [pendingRequests, failedRefunds] = await Promise.all([
    prisma.cancellationRequest.count({ where: { status: "REQUESTED" } }),
    prisma.refund.count({ where: { status: "FAILED" } }),
  ]);
  return { pendingRequests, failedRefunds };
}
