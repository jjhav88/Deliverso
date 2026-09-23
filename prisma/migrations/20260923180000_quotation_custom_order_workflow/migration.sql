-- Custom quotation workflow (M17). Existing orders stay payable; cart/checkout become optional.

CREATE TYPE "QuotationStatus" AS ENUM (
  'SUBMITTED',
  'IN_REVIEW',
  'NEEDS_INFO',
  'QUOTED',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
  'CANCELED',
  'CONVERTED'
);

CREATE TYPE "QuotationActorType" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM');
CREATE TYPE "QuoteMessageAuthorType" AS ENUM ('CUSTOMER', 'ADMIN');

ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'QUOTE_RECEIVED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'QUOTE_NEEDS_INFO';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'QUOTE_OFFERED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'QUOTE_ACCEPTED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'QUOTE_DECLINED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'QUOTE_EXPIRED';

ALTER TABLE "Order" ALTER COLUMN "cartId" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "checkoutDraftId" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "quotationId" UUID;
ALTER TABLE "Order" ADD COLUMN "quotationNumberSnapshot" TEXT;
ALTER TABLE "Order" ADD COLUMN "quotationDescriptionSnapshot" TEXT;
ALTER TABLE "Order" ADD COLUMN "customOrder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "acceptedOfferId" UUID;
CREATE UNIQUE INDEX "Order_quotationId_key" ON "Order"("quotationId");
CREATE INDEX "Order_quotationId_idx" ON "Order"("quotationId");
CREATE INDEX "Order_acceptedOfferId_idx" ON "Order"("acceptedOfferId");

CREATE TABLE "Quotation" (
    "id" UUID NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "productId" UUID,
    "status" "QuotationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "locale" TEXT NOT NULL DEFAULT 'es-MX',
    "customerNameSnapshot" TEXT NOT NULL,
    "customerEmailSnapshot" TEXT NOT NULL,
    "customerPhoneSnapshot" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "productSlugSnapshot" TEXT NOT NULL,
    "requestTitle" TEXT,
    "requestDescription" TEXT NOT NULL,
    "eventDate" DATE,
    "guestCount" INTEGER,
    "requestedFulfillmentDate" DATE,
    "adminInternalNotes" TEXT,
    "quotedSubtotalMinor" INTEGER,
    "deliveryFeeMinor" INTEGER,
    "quotedTotalMinor" INTEGER,
    "fulfillmentMethod" "FulfillmentMethod",
    "pickupLocationId" UUID,
    "deliveryZoneId" UUID,
    "validUntil" TIMESTAMPTZ,
    "acceptedAt" TIMESTAMPTZ,
    "declinedAt" TIMESTAMPTZ,
    "canceledAt" TIMESTAMPTZ,
    "convertedAt" TIMESTAMPTZ,
    "activeOfferId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Quotation_quoteNumber_key" ON "Quotation"("quoteNumber");
CREATE UNIQUE INDEX "Quotation_activeOfferId_key" ON "Quotation"("activeOfferId");
CREATE INDEX "Quotation_customerId_createdAt_idx" ON "Quotation"("customerId", "createdAt");
CREATE INDEX "Quotation_productId_idx" ON "Quotation"("productId");
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");
CREATE INDEX "Quotation_validUntil_idx" ON "Quotation"("validUntil");
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");

CREATE TABLE "QuoteOffer" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "subtotalMinor" INTEGER NOT NULL,
    "deliveryFeeMinor" INTEGER NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "fulfillmentMethod" "FulfillmentMethod" NOT NULL,
    "validUntil" TIMESTAMPTZ NOT NULL,
    "message" TEXT,
    "pickupLocationId" UUID,
    "deliveryZoneId" UUID,
    "createdByAdminId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMPTZ,

    CONSTRAINT "QuoteOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuoteOffer_quotationId_version_key" ON "QuoteOffer"("quotationId", "version");
CREATE INDEX "QuoteOffer_quotationId_createdAt_idx" ON "QuoteOffer"("quotationId", "createdAt");

CREATE TABLE "QuoteAttachment" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteAttachment_quotationId_idx" ON "QuoteAttachment"("quotationId");

CREATE TABLE "QuoteMessage" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "authorType" "QuoteMessageAuthorType" NOT NULL,
    "authorCustomerId" UUID,
    "authorAdminId" UUID,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteMessage_quotationId_createdAt_idx" ON "QuoteMessage"("quotationId", "createdAt");

CREATE TABLE "QuotationEvent" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "actorType" "QuotationActorType" NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuotationEvent_quotationId_createdAt_idx" ON "QuotationEvent"("quotationId", "createdAt");

CREATE TABLE "QuoteAddress" (
    "id" UUID NOT NULL,
    "quotationId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT,
    "street" TEXT NOT NULL,
    "exteriorNumber" TEXT,
    "interiorNumber" TEXT,
    "reference" TEXT,

    CONSTRAINT "QuoteAddress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuoteAddress_quotationId_key" ON "QuoteAddress"("quotationId");

ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteOffer" ADD CONSTRAINT "QuoteOffer_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteOffer" ADD CONSTRAINT "QuoteOffer_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteOffer" ADD CONSTRAINT "QuoteOffer_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_activeOfferId_fkey" FOREIGN KEY ("activeOfferId") REFERENCES "QuoteOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteAttachment" ADD CONSTRAINT "QuoteAttachment_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteMessage" ADD CONSTRAINT "QuoteMessage_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteMessage" ADD CONSTRAINT "QuoteMessage_authorCustomerId_fkey" FOREIGN KEY ("authorCustomerId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteMessage" ADD CONSTRAINT "QuoteMessage_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuotationEvent" ADD CONSTRAINT "QuotationEvent_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteAddress" ADD CONSTRAINT "QuoteAddress_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_acceptedOfferId_fkey" FOREIGN KEY ("acceptedOfferId") REFERENCES "QuoteOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
