import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { getEmailRuntimeConfig } from "@/server/email/env";
import { maskEmail } from "@/modules/email/domain/mask";

export async function getEmailAdminState() {
  const prisma = getPrisma();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const config = getEmailRuntimeConfig();

  const [pending, processing, failed, dead, sentToday, recent] = await Promise.all([
    prisma.emailOutbox.count({ where: { status: "PENDING" } }),
    prisma.emailOutbox.count({ where: { status: "PROCESSING" } }),
    prisma.emailOutbox.count({ where: { status: "FAILED" } }),
    prisma.emailOutbox.count({ where: { status: "DEAD" } }),
    prisma.emailOutbox.count({ where: { status: "SENT", sentAt: { gte: startOfDay } } }),
    prisma.emailOutbox.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        template: true,
        recipientEmail: true,
        status: true,
        attemptCount: true,
        createdAt: true,
        sentAt: true,
        lastErrorCode: true,
        lastErrorMessage: true,
        referenceType: true,
        referenceId: true,
        eventKey: true,
      },
    }),
  ]);

  return {
    provider: "Resend",
    mode: config.mode,
    from: config.fromAddress ?? "onboarding@resend.dev",
    sandboxRecipientMasked: config.sandboxRecipient ? maskEmail(config.sandboxRecipient) : null,
    counters: { pending, processing, failed, dead, sentToday },
    recent: recent.map((row) => ({
      ...row,
      recipientMasked: maskEmail(row.recipientEmail),
      createdAt: row.createdAt.toISOString(),
      sentAt: row.sentAt?.toISOString() ?? null,
    })),
  };
}
