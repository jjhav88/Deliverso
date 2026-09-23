import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { queueTransactionalEmail } from "@/modules/email/queue";

export async function expireQuotations(now = new Date()) {
  const prisma = getPrisma();
  const stale = await prisma.quotation.findMany({
    where: { status: "QUOTED", validUntil: { lte: now } },
    select: {
      id: true,
      quoteNumber: true,
      customerEmailSnapshot: true,
      customerNameSnapshot: true,
      locale: true,
    },
  });
  let updated = 0;
  for (const row of stale) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.quotation.findUnique({ where: { id: row.id }, select: { status: true } });
      if (!current || current.status !== "QUOTED") {
        return;
      }
      await tx.quotation.update({
        where: { id: row.id },
        data: { status: "EXPIRED" },
      });
      await tx.quotationEvent.create({
        data: { quotationId: row.id, type: "QUOTE_EXPIRED", actorType: "SYSTEM" },
      });
      await queueTransactionalEmail(
        {
          template: "QUOTE_EXPIRED",
          eventKey: `quote:${row.id}:expired:v1`,
          recipientEmail: row.customerEmailSnapshot,
          recipientName: row.customerNameSnapshot,
          locale: row.locale,
          referenceType: "Quotation",
          referenceId: row.id,
        },
        tx,
      );
    });
    updated += 1;
  }
  return { processed: stale.length, updated, skipped: 0, failed: 0 };
}
