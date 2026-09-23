import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { isQuotationStatus, type QuotationStatus } from "@/modules/quotations/domain/types";
import { signQuoteAttachmentUrl } from "@/modules/quotations/storage";

export async function countQuotationDashboard() {
  if (!hasRuntimeDatabaseUrl()) {
    return { submitted: 0, inReview: 0, needsInfo: 0, quoted: 0 };
  }
  const prisma = getPrisma();
  const [submitted, inReview, needsInfo, quoted] = await Promise.all([
    prisma.quotation.count({ where: { status: "SUBMITTED" } }),
    prisma.quotation.count({ where: { status: "IN_REVIEW" } }),
    prisma.quotation.count({ where: { status: "NEEDS_INFO" } }),
    prisma.quotation.count({ where: { status: "QUOTED" } }),
  ]);
  return { submitted, inReview, needsInfo, quoted };
}

export async function listAdminQuotations(input: { status?: string | null; q?: string | null }) {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }
  const status = input.status && isQuotationStatus(input.status) ? (input.status as QuotationStatus) : undefined;
  const q = input.q?.trim();
  return getPrisma().quotation.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { quoteNumber: { contains: q, mode: "insensitive" } },
              { customerEmailSnapshot: { contains: q, mode: "insensitive" } },
              { customerNameSnapshot: { contains: q, mode: "insensitive" } },
              { productNameSnapshot: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminQuotation(id: string) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const row = await getPrisma().quotation.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      offers: { orderBy: { version: "asc" } },
      activeOffer: true,
      address: true,
      pickupLocation: true,
      order: { select: { id: true, orderNumber: true, status: true } },
    },
  });
  if (!row) {
    return null;
  }
  const attachments = await Promise.all(
    row.attachments.map(async (item) => ({
      ...item,
      url: await signQuoteAttachmentUrl(item.storagePath),
    })),
  );
  return { ...row, attachments };
}

export async function listQuoteFulfillmentOptions() {
  if (!hasRuntimeDatabaseUrl()) {
    return { pickups: [], zones: [] };
  }
  const prisma = getPrisma();
  const [pickups, zones] = await Promise.all([
    prisma.pickupLocation.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { pickups, zones };
}
