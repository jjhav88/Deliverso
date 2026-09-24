import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { applyRefundProviderStatus } from "@/modules/refunds/apply";
import type { WebhookProcessResult } from "@/modules/payments/domain/webhook-http";

export type StripeRefundLike = {
  id: string;
  status?: string | null;
  amount: number;
  payment_intent?: string | { id: string } | null;
  metadata?: { refundId?: string | null; orderId?: string | null } | null;
  failure_reason?: string | null;
};

function paymentIntentId(refund: StripeRefundLike): string | null {
  const value = refund.payment_intent;
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.id;
}

export async function processStripeRefundEvent(input: {
  providerEventId: string;
  eventType: string;
  livemode: boolean;
  refund: StripeRefundLike;
}): Promise<WebhookProcessResult> {
  const prisma = getPrisma();

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const existing = await tx.paymentWebhookEvent.findUnique({
        where: { providerEventId: input.providerEventId },
        select: { id: true },
      });
      if (existing) {
        return { kind: "duplicate" as const, refundId: null };
      }

      const byStripeId = await tx.refund.findUnique({
        where: { stripeRefundId: input.refund.id },
        select: { id: true },
      });
      const metadataRefundId = input.refund.metadata?.refundId?.trim() || null;
      const byMetadata = !byStripeId && metadataRefundId
        ? await tx.refund.findUnique({
            where: { id: metadataRefundId },
            select: { id: true },
          })
        : null;
      const byIntent =
        !byStripeId && !byMetadata && paymentIntentId(input.refund)
          ? await tx.refund.findFirst({
              where: {
                order: { stripePaymentIntentId: paymentIntentId(input.refund) ?? undefined },
                status: { in: ["PENDING", "PROCESSING"] },
                amountMinor: input.refund.amount,
              },
              orderBy: { createdAt: "desc" },
              select: { id: true },
            })
          : null;

      const refund = byStripeId ?? byMetadata ?? byIntent;
      const event = await tx.paymentWebhookEvent.create({
        data: {
          provider: "STRIPE",
          providerEventId: input.providerEventId,
          eventType: input.eventType,
          livemode: input.livemode,
        },
      });

      if (!refund) {
        await tx.paymentWebhookEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date(), processingResult: "missing_refund" },
        });
        return { kind: "missing" as const, refundId: null };
      }

      await tx.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), processingResult: "processed" },
      });
      return { kind: "apply" as const, refundId: refund.id };
    });

    if (outcome.kind === "duplicate") {
      return { ok: true, result: "duplicate" };
    }
    if (outcome.kind === "missing" || !outcome.refundId) {
      return { ok: true, result: "ignored" };
    }

    await applyRefundProviderStatus({
      refundId: outcome.refundId,
      stripeRefundId: input.refund.id,
      providerStatus: input.refund.status ?? "pending",
      failureCode: input.refund.failure_reason ?? null,
    });
    return { ok: true, result: "processed" };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return { ok: true, result: "duplicate" };
    }
    throw error;
  }
}
