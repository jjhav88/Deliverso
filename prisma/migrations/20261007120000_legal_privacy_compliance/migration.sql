-- Legal documents, acceptances, privacy requests and identity settings (M21).
-- Existing orders keep termsVersion / policy versions NULL. No historical backfill.

ALTER TABLE "SiteSettings" ADD COLUMN "legalEntityName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "rfc" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "legalAddress" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "legalPhone" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "privacyEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "legalCountry" TEXT NOT NULL DEFAULT 'México';

ALTER TABLE "Order" ADD COLUMN "termsVersion" TEXT;
ALTER TABLE "Order" ADD COLUMN "refundPolicyVersion" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryPolicyVersion" TEXT;

CREATE TYPE "LegalDocumentType" AS ENUM (
  'PRIVACY_NOTICE',
  'TERMS',
  'DELIVERY_POLICY',
  'REFUND_POLICY',
  'COOKIE_POLICY'
);

CREATE TYPE "LegalDocumentStatus" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
);

CREATE TYPE "PrivacyRequestType" AS ENUM (
  'ACCESS',
  'RECTIFICATION',
  'CANCELLATION',
  'OPPOSITION',
  'OTHER'
);

CREATE TYPE "PrivacyRequestStatus" AS ENUM (
  'RECEIVED',
  'IN_REVIEW',
  'RESOLVED',
  'REJECTED'
);

CREATE TABLE "LegalDocument" (
    "id" UUID NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "locale" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "LegalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "effectiveAt" TIMESTAMPTZ NOT NULL,
    "publishedAt" TIMESTAMPTZ,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalDocument_type_locale_version_key" ON "LegalDocument"("type", "locale", "version");
CREATE INDEX "LegalDocument_type_locale_status_idx" ON "LegalDocument"("type", "locale", "status");
CREATE INDEX "LegalDocument_status_publishedAt_idx" ON "LegalDocument"("status", "publishedAt");

CREATE TABLE "LegalAcceptance" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "orderId" UUID,
    "documentType" "LegalDocumentType" NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LegalAcceptance_customerId_acceptedAt_idx" ON "LegalAcceptance"("customerId", "acceptedAt");
CREATE INDEX "LegalAcceptance_orderId_idx" ON "LegalAcceptance"("orderId");
CREATE INDEX "LegalAcceptance_documentType_documentVersion_idx" ON "LegalAcceptance"("documentType", "documentVersion");

ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PrivacyRequest" (
    "id" UUID NOT NULL,
    "type" "PrivacyRequestType" NOT NULL,
    "customerId" UUID,
    "email" TEXT NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "message" TEXT NOT NULL,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ,
    "reviewedById" UUID,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrivacyRequest_status_createdAt_idx" ON "PrivacyRequest"("status", "createdAt");
CREATE INDEX "PrivacyRequest_email_idx" ON "PrivacyRequest"("email");
CREATE INDEX "PrivacyRequest_customerId_idx" ON "PrivacyRequest"("customerId");

ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
