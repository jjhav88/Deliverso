import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { recoverStaleEmailOutbox } from "@/modules/email/recover-stale";
import { expirePendingOrderIfNeeded } from "@/modules/orders/expire";
import { reconcilePendingPayments } from "@/modules/payments/reconcile";
import { logInfo } from "@/server/logging/logger";

export type MaintenanceJobResult = {
  name: string;
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
};

export async function expireStaleCheckoutDraftsJob(now = new Date()): Promise<MaintenanceJobResult> {
  const result = await getPrisma().checkoutDraft.updateMany({
    where: {
      status: { in: ["IN_PROGRESS", "READY_FOR_PAYMENT"] },
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });
  if (result.count > 0) {
    await writeAdminAuditLog({
      action: "CHECKOUT_EXPIRED",
      resourceType: "CheckoutDraft",
      metadata: { updated: result.count },
    });
  }
  return { name: "expireStaleCheckoutDrafts", processed: result.count, updated: result.count, skipped: 0, failed: 0 };
}

export async function abandonStaleCartsJob(now = new Date()): Promise<MaintenanceJobResult> {
  const result = await getPrisma().cart.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: { status: "ABANDONED" },
  });
  if (result.count > 0) {
    await writeAdminAuditLog({
      action: "CART_ABANDONED",
      resourceType: "Cart",
      metadata: { updated: result.count },
    });
  }
  return { name: "abandonStaleCarts", processed: result.count, updated: result.count, skipped: 0, failed: 0 };
}

export async function expirePendingOrdersJob(now = new Date()): Promise<MaintenanceJobResult> {
  const orders = await getPrisma().order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      expiresAt: { lte: now },
    },
    select: { id: true },
    take: 25,
    orderBy: { expiresAt: "asc" },
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      const result = await expirePendingOrderIfNeeded(order.id);
      if (result === "expired") {
        updated += 1;
      } else {
        skipped += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    name: "expirePendingOrders",
    processed: orders.length,
    updated,
    skipped,
    failed,
  };
}

export async function runMaintenanceJobs(): Promise<MaintenanceJobResult[]> {
  const results: MaintenanceJobResult[] = [];

  const recovered = await recoverStaleEmailOutbox();
  results.push({ name: "recoverStaleEmailOutbox", ...recovered });

  const reconciled = await reconcilePendingPayments();
  results.push({ name: "reconcilePendingPayments", ...reconciled });

  results.push(await expirePendingOrdersJob());
  const released = await (await import("@/modules/promotions/reservation")).releaseExpiredPromotionReservations();
  results.push({ name: "releaseExpiredPromotionReservations", ...released });
  results.push(await expireStaleCheckoutDraftsJob());
  results.push(await abandonStaleCartsJob());
  const expiredQuotes = await (await import("@/modules/quotations/expire")).expireQuotations();
  results.push({ name: "expireQuotations", ...expiredQuotes });

  for (const result of results) {
    logInfo({
      event: "MAINTENANCE_JOB",
      job: result.name,
      processed: result.processed,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
    });
  }

  return results;
}
