import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { getStripeGateway } from "@/server/stripe/client";
import type { StripeGateway } from "@/server/stripe/gateway";
import { applyRefundProviderStatus } from "@/modules/refunds/apply";
import { submitReservedRefund } from "@/modules/refunds/engine";
import { logInfo, logWarn } from "@/server/logging/logger";

export const refundReconciliationMinAgeMs = 5 * 60 * 1000;

export type ReconcileRefundsSummary = {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
};

export async function reconcilePendingRefunds(
  gateway: StripeGateway = getStripeGateway(),
  now = new Date(),
): Promise<ReconcileRefundsSummary> {
  const cutoff = new Date(now.getTime() - refundReconciliationMinAgeMs);
  const rows = await getPrisma().refund.findMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      createdAt: { lte: cutoff },
    },
    select: {
      id: true,
      orderId: true,
      amountMinor: true,
      status: true,
      stripeRefundId: true,
      order: { select: { stripePaymentIntentId: true } },
    },
    take: 25,
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      if (row.stripeRefundId) {
        const snapshot = await gateway.retrieveRefund(row.stripeRefundId);
        const result = await applyRefundProviderStatus({
          refundId: row.id,
          stripeRefundId: snapshot.id,
          providerStatus: snapshot.status,
        });
        if (result.ok && result.result === "applied") {
          updated += 1;
          logInfo({
            event: "REFUND_RECONCILED",
            refundId: row.id,
            orderId: row.orderId,
            stripeRefundId: snapshot.id,
            result: result.result,
          });
        } else {
          skipped += 1;
        }
        continue;
      }

      if (!row.order.stripePaymentIntentId) {
        skipped += 1;
        continue;
      }

      const submitted = await submitReservedRefund({
        refundId: row.id,
        orderId: row.orderId,
        amountMinor: row.amountMinor,
        paymentIntentId: row.order.stripePaymentIntentId,
        gateway,
      });
      if (submitted.ok) {
        updated += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
      logWarn({ event: "REFUND_RECONCILE_FAILED", refundId: row.id, orderId: row.orderId });
    }
  }

  return { processed: rows.length, updated, skipped, failed };
}
