import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { emailProcessingStaleMs } from "@/modules/email/domain/stale";
import { logInfo } from "@/server/logging/logger";

export type RecoverStaleEmailResult = {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
};

export async function recoverStaleEmailOutbox(
  now = new Date(),
  staleMs = emailProcessingStaleMs,
): Promise<RecoverStaleEmailResult> {
  const cutoff = new Date(now.getTime() - staleMs);
  const prisma = getPrisma();
  const result = await prisma.emailOutbox.updateMany({
    where: {
      status: "PROCESSING",
      OR: [{ processingStartedAt: { lte: cutoff } }, { processingStartedAt: null, updatedAt: { lte: cutoff } }],
    },
    data: {
      status: "PENDING",
      processingStartedAt: null,
      nextAttemptAt: now,
    },
  });

  if (result.count > 0) {
    await writeAdminAuditLog({
      action: "EMAIL_STALE_RECOVERED",
      resourceType: "EmailOutbox",
      metadata: { updated: result.count },
    });
  }

  logInfo({
    event: "EMAIL_STALE_RECOVERED",
    job: "recoverStaleEmailOutbox",
    processed: result.count,
    updated: result.count,
    skipped: 0,
    failed: 0,
  });

  return { processed: result.count, updated: result.count, skipped: 0, failed: 0 };
}
