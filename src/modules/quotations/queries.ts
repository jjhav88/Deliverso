import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { signQuoteAttachmentUrl } from "@/modules/quotations/storage";
import { isQuoteExpired } from "@/modules/quotations/domain/lifecycle";
import { quoteAttentionStatuses } from "@/modules/quotations/domain/attention";

const detailInclude = {
  attachments: { orderBy: { createdAt: "asc" as const } },
  messages: { orderBy: { createdAt: "asc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
  offers: { orderBy: { version: "asc" as const } },
  activeOffer: true,
  address: true,
  pickupLocation: true,
  order: { select: { id: true, orderNumber: true, status: true } },
} as const;

export async function countCustomerQuotesRequiringAttention(customerId: string): Promise<number> {
  if (!hasRuntimeDatabaseUrl() || !customerId) {
    return 0;
  }
  return getPrisma().quotation.count({
    where: {
      customerId,
      status: { in: [...quoteAttentionStatuses] },
    },
  });
}

export async function listRecentCustomerQuotations(customerId: string, take = 3) {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }
  return getPrisma().quotation.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      quoteNumber: true,
      productNameSnapshot: true,
      status: true,
      createdAt: true,
      quotedTotalMinor: true,
    },
  });
}

export async function listCustomerQuotations(customerId: string) {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }
  return getPrisma().quotation.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: {
      quoteNumber: true,
      productNameSnapshot: true,
      status: true,
      createdAt: true,
      quotedTotalMinor: true,
      validUntil: true,
    },
  });
}

export async function getCustomerQuotation(input: {
  customerId: string;
  quoteNumber: string;
}) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const row = await getPrisma().quotation.findFirst({
    where: { quoteNumber: input.quoteNumber, customerId: input.customerId },
    include: detailInclude,
  });
  if (!row) {
    return null;
  }
  const now = new Date();
  const attachments = await Promise.all(
    row.attachments.map(async (item) => ({
      ...item,
      url: await signQuoteAttachmentUrl(item.storagePath),
    })),
  );
  return {
    ...row,
    attachments,
    expired: isQuoteExpired(now, row.validUntil),
  };
}

export async function getPublishedCustomQuoteProduct(slug: string, locale: string) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const products = await getPrisma().product.findMany({
    where: { type: "CUSTOM_QUOTE", status: "PUBLISHED" },
    include: { translations: true },
    take: 50,
  });
  return (
    products.find((product) =>
      product.translations.some((item) => item.slug === slug && (item.locale === locale || item.locale === "es-MX")),
    ) ?? null
  );
}
