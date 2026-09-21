import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { getStripeGateway } from "@/server/stripe/client";
import type { StripeGateway } from "@/server/stripe/gateway";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { processStripePaymentIntentEvent } from "@/modules/payments/process-webhook";
import {
  paymentReconciliationMinAgeMs,
  shouldConsiderForReconciliation,
  validatePaymentReconciliation,
} from "@/modules/payments/domain/reconciliation";
import { logInfo, logWarn } from "@/server/logging/logger";

export type ReconcileSummary = {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
};

export async function reconcilePendingPayments(
  gateway: StripeGateway = getStripeGateway(),
  now = new Date(),
): Promise<ReconcileSummary> {
  const cutoff = new Date(now.getTime() - paymentReconciliationMinAgeMs);
  const orders = await getPrisma().order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      stripePaymentIntentId: { not: null },
      createdAt: { lte: cutoff },
    },
    select: {
      id: true,
      orderNumber: true,
      stripePaymentIntentId: true,
      grandTotalMinor: true,
      status: true,
      createdAt: true,
    },
    take: 25,
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of orders) {
    if (!shouldConsiderForReconciliation(order, now)) {
      skipped += 1;
      continue;
    }
    try {
      const intent = await gateway.retrievePaymentIntent(order.stripePaymentIntentId as string);
      const check = validatePaymentReconciliation({ order, intent });
      if (!check.ok) {
        skipped += 1;
        continue;
      }

      const result = await processStripePaymentIntentEvent({
        providerEventId: `reconcile:${intent.id}:succeeded`,
        eventType: "payment_intent.succeeded",
        livemode: intent.livemode,
        paymentIntent: {
          id: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          status: intent.status,
        },
      });

      if (result.ok && result.result === "processed") {
        updated += 1;
        await writeAdminAuditLog({
          action: "PAYMENT_RECONCILED",
          resourceType: "Order",
          resourceId: order.id,
          metadata: { paymentIntentId: intent.id, result: result.result },
        });
        logInfo({
          event: "PAYMENT_RECONCILED",
          orderId: order.id,
          paymentIntentId: intent.id,
          result: result.result,
        });
      } else {
        skipped += 1;
      }
    } catch {
      failed += 1;
      logWarn({ event: "PAYMENT_RECONCILE_FAILED", orderId: order.id });
    }
  }

  return { processed: orders.length, updated, skipped, failed };
}
