import "server-only";
import { SITE_SETTINGS_ID } from "@/modules/content/singletons";
import { defaultLegalDocuments } from "@/modules/legal/documents/defaults";
import { getLegalReadiness } from "@/modules/legal/domain/readiness";
import {
  COMMERCIAL_NAME,
  LEGAL_PRIMARY_LOCALE,
  type LegalDocumentType,
  type LegalIdentity,
  type LegalReadiness,
  type OrderLegalSnapshot,
} from "@/modules/legal/domain/types";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getPrisma } from "@/server/db/prisma";

const emptyIdentity = (): LegalIdentity => ({
  commercialName: COMMERCIAL_NAME,
  legalEntityName: null,
  rfc: null,
  legalAddress: null,
  legalPhone: null,
  contactEmail: null,
  privacyEmail: null,
  legalCountry: "México",
});

export async function getLegalIdentity(): Promise<LegalIdentity> {
  if (!hasRuntimeDatabaseUrl()) {
    return emptyIdentity();
  }
  const settings = await getPrisma().siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: {
      legalEntityName: true,
      rfc: true,
      legalAddress: true,
      legalPhone: true,
      contactEmail: true,
      privacyEmail: true,
      legalCountry: true,
    },
  });
  if (!settings) {
    return emptyIdentity();
  }
  return {
    commercialName: COMMERCIAL_NAME,
    legalEntityName: settings.legalEntityName,
    rfc: settings.rfc,
    legalAddress: settings.legalAddress,
    legalPhone: settings.legalPhone,
    contactEmail: settings.contactEmail,
    privacyEmail: settings.privacyEmail,
    legalCountry: settings.legalCountry || "México",
  };
}

export async function getLegalReadinessState(): Promise<{
  identity: LegalIdentity;
  readiness: LegalReadiness;
}> {
  const identity = await getLegalIdentity();
  return { identity, readiness: getLegalReadiness(identity) };
}

export async function ensurePublishedLegalDocuments(): Promise<void> {
  if (!hasRuntimeDatabaseUrl()) {
    return;
  }
  const prisma = getPrisma();
  const now = new Date();
  for (const document of defaultLegalDocuments) {
    const published = await prisma.legalDocument.findFirst({
      where: {
        type: document.type,
        locale: document.locale,
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    if (published) {
      continue;
    }
    try {
      await prisma.legalDocument.create({
        data: {
          type: document.type,
          locale: document.locale,
          version: document.version,
          status: "PUBLISHED",
          title: document.title,
          body: document.body,
          effectiveAt: now,
          publishedAt: now,
        },
      });
    } catch {
      // Unique race or concurrent seed.
    }
  }
}

export type PublishedLegalDocument = {
  id: string;
  type: LegalDocumentType;
  locale: string;
  version: string;
  title: string;
  body: string;
  effectiveAt: Date;
  publishedAt: Date | null;
  updatedAt: Date;
};

export async function getPublishedLegalDocument(
  type: LegalDocumentType,
): Promise<PublishedLegalDocument | null> {
  await ensurePublishedLegalDocuments();
  if (!hasRuntimeDatabaseUrl()) {
    const fallback = defaultLegalDocuments.find((item) => item.type === type);
    if (!fallback) {
      return null;
    }
    const now = new Date();
    return {
      id: "default",
      type: fallback.type,
      locale: fallback.locale,
      version: fallback.version,
      title: fallback.title,
      body: fallback.body,
      effectiveAt: now,
      publishedAt: now,
      updatedAt: now,
    };
  }
  const row = await getPrisma().legalDocument.findFirst({
    where: { type, locale: LEGAL_PRIMARY_LOCALE, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    type: row.type,
    locale: row.locale,
    version: row.version,
    title: row.title,
    body: row.body,
    effectiveAt: row.effectiveAt,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPublishedOrderLegalSnapshot(): Promise<OrderLegalSnapshot | null> {
  const [terms, delivery, refund] = await Promise.all([
    getPublishedLegalDocument("TERMS"),
    getPublishedLegalDocument("DELIVERY_POLICY"),
    getPublishedLegalDocument("REFUND_POLICY"),
  ]);
  if (!terms || !delivery || !refund) {
    return null;
  }
  return {
    termsVersion: terms.version,
    deliveryPolicyVersion: delivery.version,
    refundPolicyVersion: refund.version,
  };
}

export type LegalAdminDocument = {
  id: string;
  type: LegalDocumentType;
  locale: string;
  version: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  body: string;
  effectiveAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
  updatedAt: Date;
};

export async function listLegalDocumentsForAdmin(): Promise<LegalAdminDocument[]> {
  await ensurePublishedLegalDocuments();
  const rows = await getPrisma().legalDocument.findMany({
    where: { locale: LEGAL_PRIMARY_LOCALE },
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    locale: row.locale,
    version: row.version,
    status: row.status,
    title: row.title,
    body: row.body,
    effectiveAt: row.effectiveAt,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getLegalDocumentForAdmin(id: string): Promise<LegalAdminDocument | null> {
  const row = await getPrisma().legalDocument.findUnique({ where: { id } });
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    type: row.type,
    locale: row.locale,
    version: row.version,
    status: row.status,
    title: row.title,
    body: row.body,
    effectiveAt: row.effectiveAt,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    updatedAt: row.updatedAt,
  };
}

export type PrivacyRequestAdminRow = {
  id: string;
  type: string;
  email: string;
  status: string;
  createdAt: Date;
  customerId: string | null;
};

export async function listPrivacyRequestsForAdmin(): Promise<PrivacyRequestAdminRow[]> {
  const rows = await getPrisma().privacyRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      type: true,
      email: true,
      status: true,
      createdAt: true,
      customerId: true,
    },
  });
  return rows;
}

export async function getPrivacyRequestForAdmin(id: string) {
  return getPrisma().privacyRequest.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      email: true,
      status: true,
      message: true,
      adminNotes: true,
      createdAt: true,
      resolvedAt: true,
      customerId: true,
    },
  });
}
