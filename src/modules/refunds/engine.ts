import "server-only";
import { randomUUID } from "node:crypto";
import { getPrisma } from "@/server/db/prisma";
import { getStripeGateway } from "@/server/stripe/client";
import type { StripeGateway } from "@/server/stripe/gateway";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import {
  getRefundableAmount,
  planRefundAmount,
} from "@/modules/cancellations/domain/refundable";
import { canIssueRefund } from "@/modules/cancellations/domain/eligibility";
import type { RefundReason, RefundType } from "@/modules/cancellations/domain/types";
import { refundIdempotencyKey } from "@/modules/cancellations/domain/types";
import { applyRefundProviderStatus } from "@/modules/refunds/apply";
import { logInfo, logWarn } from "@/server/logging/logger";

export type CreateRefundInput = {
  orderId: string;
  adminId: string;
  adminRole: string;
  type: RefundType;
  reason: RefundReason;
  requestedAmountMinor?: number;
  cancelsOrder?: boolean;
  internalNote?: string | null;
};

export type CreateRefundResult =
  | { ok: true; refundId: string; amountMinor: number; status: string }
  | {
      ok: false;
      reason:
        | "forbidden"
        | "not_found"
        | "not_paid"
        | "nothing_refundable"
        | "invalid_amount"
        | "missing_payment_intent"
        | "provider_error";
    };

export async function createAndSubmitRefund(
  input: CreateRefundInput,
  gateway: StripeGateway = getStripeGateway(),
): Promise<CreateRefundResult> {
  if (!canIssueRefund(input.adminRole)) {
    return { ok: false, reason: "forbidden" };
  }

  const prisma = getPrisma();
  const reserved = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${input.orderId} FOR UPDATE`;

    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        grandTotalMinor: true,
        stripePaymentIntentId: true,
      },
    });
    if (!order) {
      return { ok: false as const, reason: "not_found" as const };
    }
    if (order.paymentStatus !== "SUCCEEDED") {
      return { ok: false as const, reason: "not_paid" as const };
    }

    const refunds = await tx.refund.findMany({
      where: { orderId: order.id },
      select: { status: true, amountMinor: true },
    });
    const refundableMinor = getRefundableAmount({
      grandTotalMinor: order.grandTotalMinor,
      refunds,
    });
    const planned = planRefundAmount({
      type: input.type,
      requestedAmountMinor: input.requestedAmountMinor,
      refundableMinor,
    });
    if (!planned.ok) {
      return { ok: false as const, reason: planned.reason };
    }

    const paymentAttempt = await tx.paymentAttempt.findFirst({
      where: { orderId: order.id, status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const refundId = randomUUID();
    await tx.refund.create({
      data: {
        id: refundId,
        orderId: order.id,
        paymentAttemptId: paymentAttempt?.id ?? null,
        type: input.type,
        status: "PENDING",
        reason: input.reason,
        amountMinor: planned.amountMinor,
        cancelsOrder: Boolean(input.cancelsOrder) && input.type === "FULL",
        requestedByAdminId: input.adminId,
        internalNote: input.internalNote?.trim() || null,
      },
    });
    await tx.refundEvent.create({
      data: { refundId, type: "REFUND_CREATED" },
    });

    return {
      ok: true as const,
      refundId,
      amountMinor: planned.amountMinor,
      paymentIntentId: order.stripePaymentIntentId,
    };
  });

  if (!reserved.ok) {
    return reserved;
  }

  await writeAdminAuditLog({
    actorAdminId: input.adminId,
    action: "REFUND_CREATED",
    resourceType: "Refund",
    resourceId: reserved.refundId,
    metadata: {
      orderId: input.orderId,
      amountMinor: reserved.amountMinor,
      type: input.type,
    },
  });

  if (!reserved.paymentIntentId) {
    await prisma.refund.update({
      where: { id: reserved.refundId },
      data: {
        status: "FAILED",
        providerFailureCode: "missing_payment_intent",
        failedAt: new Date(),
      },
    });
    return { ok: false, reason: "missing_payment_intent" };
  }

  return submitReservedRefund({
    refundId: reserved.refundId,
    orderId: input.orderId,
    amountMinor: reserved.amountMinor,
    paymentIntentId: reserved.paymentIntentId,
    gateway,
  });
}

export async function submitReservedRefund(input: {
  refundId: string;
  orderId: string;
  amountMinor: number;
  paymentIntentId: string;
  gateway?: StripeGateway;
}): Promise<CreateRefundResult> {
  const gateway = input.gateway ?? getStripeGateway();
  const prisma = getPrisma();

  let snapshot;
  try {
    snapshot = await gateway.createRefund(
      {
        paymentIntentId: input.paymentIntentId,
        amountMinor: input.amountMinor,
        metadata: { refundId: input.refundId, orderId: input.orderId },
      },
      refundIdempotencyKey(input.refundId),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 180) : "stripe_refund_failed";
    await prisma.refund.update({
      where: { id: input.refundId },
      data: {
        status: "FAILED",
        providerFailureCode: "stripe_error",
        providerFailureMessage: message,
        failedAt: new Date(),
      },
    });
    await prisma.refundEvent.create({
      data: {
        refundId: input.refundId,
        type: "REFUND_FAILED",
        metadata: { stage: "submit" },
      },
    });
    logWarn({
      event: "REFUND_FAILED",
      refundId: input.refundId,
      orderId: input.orderId,
      amountMinor: input.amountMinor,
      result: "provider_error",
    });
    await writeAdminAuditLog({
      action: "REFUND_FAILED",
      resourceType: "Refund",
      resourceId: input.refundId,
      metadata: { orderId: input.orderId, result: "provider_error" },
    });
    return { ok: false, reason: "provider_error" };
  }

  await prisma.refund.update({
    where: { id: input.refundId },
    data: {
      stripeRefundId: snapshot.id,
      status: snapshot.status === "succeeded" ? "PROCESSING" : "PROCESSING",
    },
  });
  await prisma.refundEvent.create({
    data: {
      refundId: input.refundId,
      type: "REFUND_SUBMITTED",
      metadata: { stripeRefundId: snapshot.id },
    },
  });
  logInfo({
    event: "REFUND_SUBMITTED",
    refundId: input.refundId,
    orderId: input.orderId,
    stripeRefundId: snapshot.id,
    amountMinor: input.amountMinor,
    status: snapshot.status,
  });

  const applied = await applyRefundProviderStatus({
    refundId: input.refundId,
    stripeRefundId: snapshot.id,
    providerStatus: snapshot.status,
  });

  return {
    ok: true,
    refundId: input.refundId,
    amountMinor: input.amountMinor,
    status: applied.ok ? applied.result : "submitted",
  };
}

export async function retryFailedRefund(input: {
  failedRefundId: string;
  adminId: string;
  adminRole: string;
}): Promise<CreateRefundResult> {
  const failed = await getPrisma().refund.findUnique({
    where: { id: input.failedRefundId },
    select: {
      id: true,
      orderId: true,
      type: true,
      reason: true,
      amountMinor: true,
      cancelsOrder: true,
      status: true,
      internalNote: true,
    },
  });
  if (!failed || (failed.status !== "FAILED" && failed.status !== "CANCELED")) {
    return { ok: false, reason: "not_found" };
  }
  return createAndSubmitRefund({
    orderId: failed.orderId,
    adminId: input.adminId,
    adminRole: input.adminRole,
    type: failed.type,
    reason: failed.reason,
    requestedAmountMinor: failed.type === "PARTIAL" ? failed.amountMinor : undefined,
    cancelsOrder: failed.cancelsOrder,
    internalNote: failed.internalNote,
  });
}
