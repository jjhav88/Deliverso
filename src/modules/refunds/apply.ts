import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { getSucceededRefundsMinor } from "@/modules/cancellations/domain/refundable";
import { shouldApplyRefundTransition } from "@/modules/cancellations/domain/refundable";
import { mapStripeRefundStatus } from "@/modules/cancellations/domain/refundable";
import type { RefundStatus } from "@/modules/cancellations/domain/types";
import {
  queueOrderCanceledEmail,
  queueRefundFailedEmail,
  queueRefundSucceededEmail,
} from "@/modules/cancellations/emails";

export type ApplyRefundResult =
  | { ok: true; result: "applied" | "duplicate" | "ignored" }
  | { ok: false; reason: "not_found" };

async function refundEventExists(
  tx: {
    refundEvent: {
      findFirst: (args: {
        where: { refundId: string; type: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  },
  refundId: string,
  type: string,
) {
  const existing = await tx.refundEvent.findFirst({
    where: { refundId, type },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function applyRefundProviderStatus(input: {
  refundId: string;
  stripeRefundId?: string | null;
  providerStatus: string;
  failureCode?: string | null;
  failureMessage?: string | null;
}): Promise<ApplyRefundResult> {
  const next = mapStripeRefundStatus(input.providerStatus);
  const prisma = getPrisma();

  const outcome = await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { id: input.refundId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            grandTotalMinor: true,
            customerEmail: true,
            customerName: true,
            locale: true,
          },
        },
      },
    });
    if (!refund) {
      return "not_found" as const;
    }

    if (!shouldApplyRefundTransition({ current: refund.status, next })) {
      return "duplicate" as const;
    }

    const now = new Date();

    if (next === "SUCCEEDED") {
      const alreadySucceeded = await refundEventExists(tx, refund.id, "REFUND_SUCCEEDED");
      const siblings = await tx.refund.findMany({
        where: { orderId: refund.orderId },
        select: { id: true, status: true, amountMinor: true },
      });
      const succeededMinor = getSucceededRefundsMinor(
        siblings.map((row) =>
          row.id === refund.id
            ? { status: "SUCCEEDED", amountMinor: refund.amountMinor }
            : row,
        ),
      );

      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: "SUCCEEDED",
          stripeRefundId: input.stripeRefundId ?? refund.stripeRefundId,
          providerFailureCode: null,
          providerFailureMessage: null,
          processedAt: refund.processedAt ?? now,
          failedAt: null,
        },
      });
      await tx.order.update({
        where: { id: refund.orderId },
        data: { refundedAmountMinor: succeededMinor },
      });
      if (!alreadySucceeded) {
        await tx.refundEvent.create({
          data: {
            refundId: refund.id,
            type: "REFUND_SUCCEEDED",
            metadata: { stripeRefundId: input.stripeRefundId ?? refund.stripeRefundId },
          },
        });
        await tx.orderEvent.create({
          data: {
            orderId: refund.orderId,
            type: "REFUND_SUCCEEDED",
            metadata: { refundId: refund.id, amountMinor: refund.amountMinor },
          },
        });
        await queueRefundSucceededEmail(refund.order, refund.id, tx);
      }

      if (refund.cancelsOrder && refund.order.status !== "CANCELLED") {
        await tx.order.update({
          where: { id: refund.orderId },
          data: {
            status: "CANCELLED",
            fulfillmentStatus: "CANCELLED",
            cancelledAt: now,
          },
        });
        const canceledEvent = await tx.orderEvent.findFirst({
          where: { orderId: refund.orderId, type: "ORDER_CANCELED" },
          select: { id: true },
        });
        if (!canceledEvent) {
          await tx.orderEvent.create({
            data: {
              orderId: refund.orderId,
              type: "ORDER_CANCELED",
              metadata: { refundId: refund.id, paid: true },
            },
          });
          await queueOrderCanceledEmail(refund.order, tx);
        }
        await tx.cancellationRequest.updateMany({
          where: { orderId: refund.orderId, status: { in: ["REQUESTED", "APPROVED"] } },
          data: { status: "COMPLETED" },
        });
      }

      return "applied" as const;
    }

    if (next === "FAILED" || next === "CANCELED") {
      const alreadyFailed = await refundEventExists(tx, refund.id, "REFUND_FAILED");
      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: next,
          stripeRefundId: input.stripeRefundId ?? refund.stripeRefundId,
          providerFailureCode: input.failureCode ?? refund.providerFailureCode,
          providerFailureMessage: input.failureMessage ?? refund.providerFailureMessage,
          failedAt: refund.failedAt ?? now,
        },
      });
      if (!alreadyFailed) {
        await tx.refundEvent.create({
          data: {
            refundId: refund.id,
            type: "REFUND_FAILED",
            metadata: { providerStatus: input.providerStatus },
          },
        });
        await queueRefundFailedEmail(refund.order, refund.id, tx);
      }
      return "applied" as const;
    }

    await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: "PROCESSING" satisfies RefundStatus,
        stripeRefundId: input.stripeRefundId ?? refund.stripeRefundId,
      },
    });
    return "applied" as const;
  });

  if (outcome === "not_found") {
    return { ok: false, reason: "not_found" };
  }

  if (outcome === "applied") {
    if (next === "SUCCEEDED") {
      await writeAdminAuditLog({
        action: "REFUND_SUCCEEDED",
        resourceType: "Refund",
        resourceId: input.refundId,
        metadata: { stripeRefundId: input.stripeRefundId ?? null },
      });
    }
    if (next === "FAILED" || next === "CANCELED") {
      await writeAdminAuditLog({
        action: "REFUND_FAILED",
        resourceType: "Refund",
        resourceId: input.refundId,
        metadata: { providerStatus: input.providerStatus },
      });
    }
  }

  return { ok: true, result: outcome };
}
