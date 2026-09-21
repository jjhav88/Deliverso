-- Promotions discount engine (M16). Existing orders remain payable; new columns are nullable/default 0.

CREATE TYPE "PromotionMode" AS ENUM ('CODE', 'AUTOMATIC');
CREATE TYPE "PromotionBenefitType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_DELIVERY');
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "PromotionScopeType" AS ENUM ('ORDER', 'PRODUCT', 'CATEGORY', 'UNIVERSE', 'BUSINESS_LINE');
CREATE TYPE "PromotionReservationStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED');

CREATE TABLE "Promotion" (
    "id" UUID NOT NULL,
    "internalName" TEXT NOT NULL,
    "mode" "PromotionMode" NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "normalizedCode" TEXT,
    "benefitType" "PromotionBenefitType" NOT NULL,
    "percentageBps" INTEGER,
    "fixedAmountMinor" INTEGER,
    "minSubtotalMinor" INTEGER,
    "maxDiscountMinor" INTEGER,
    "startsAt" TIMESTAMPTZ,
    "endsAt" TIMESTAMPTZ,
    "usageLimitTotal" INTEGER,
    "usageLimitPerCustomer" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scopeType" "PromotionScopeType" NOT NULL DEFAULT 'ORDER',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdByAdminId" UUID,
    "updatedByAdminId" UUID,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Promotion_normalizedCode_key" ON "Promotion"("normalizedCode");
CREATE INDEX "Promotion_status_idx" ON "Promotion"("status");
CREATE INDEX "Promotion_startsAt_idx" ON "Promotion"("startsAt");
CREATE INDEX "Promotion_endsAt_idx" ON "Promotion"("endsAt");
CREATE INDEX "Promotion_mode_status_idx" ON "Promotion"("mode", "status");

CREATE TABLE "PromotionTranslation" (
    "id" UUID NOT NULL,
    "promotionId" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PromotionTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromotionTranslation_promotionId_locale_key" ON "PromotionTranslation"("promotionId", "locale");

CREATE TABLE "PromotionProduct" (
    "promotionId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("promotionId", "productId")
);

CREATE INDEX "PromotionProduct_productId_idx" ON "PromotionProduct"("productId");

CREATE TABLE "PromotionCategory" (
    "promotionId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "PromotionCategory_pkey" PRIMARY KEY ("promotionId", "categoryId")
);

CREATE INDEX "PromotionCategory_categoryId_idx" ON "PromotionCategory"("categoryId");

CREATE TABLE "PromotionUniverse" (
    "promotionId" UUID NOT NULL,
    "universeId" UUID NOT NULL,

    CONSTRAINT "PromotionUniverse_pkey" PRIMARY KEY ("promotionId", "universeId")
);

CREATE INDEX "PromotionUniverse_universeId_idx" ON "PromotionUniverse"("universeId");

CREATE TABLE "PromotionBusinessLine" (
    "promotionId" UUID NOT NULL,
    "businessLineId" UUID NOT NULL,

    CONSTRAINT "PromotionBusinessLine_pkey" PRIMARY KEY ("promotionId", "businessLineId")
);

CREATE INDEX "PromotionBusinessLine_businessLineId_idx" ON "PromotionBusinessLine"("businessLineId");

CREATE TABLE "PromotionReservation" (
    "id" UUID NOT NULL,
    "promotionId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "status" "PromotionReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMPTZ,
    "releasedAt" TIMESTAMPTZ,

    CONSTRAINT "PromotionReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromotionReservation_orderId_key" ON "PromotionReservation"("orderId");
CREATE INDEX "PromotionReservation_promotionId_status_expiresAt_idx" ON "PromotionReservation"("promotionId", "status", "expiresAt");
CREATE INDEX "PromotionReservation_customerId_status_expiresAt_idx" ON "PromotionReservation"("customerId", "status", "expiresAt");
CREATE INDEX "PromotionReservation_status_expiresAt_idx" ON "PromotionReservation"("status", "expiresAt");

ALTER TABLE "Cart" ADD COLUMN "selectedPromotionId" UUID;
CREATE INDEX "Cart_selectedPromotionId_idx" ON "Cart"("selectedPromotionId");

ALTER TABLE "CheckoutDraft" ADD COLUMN "selectedPromotionId" UUID;
CREATE INDEX "CheckoutDraft_selectedPromotionId_idx" ON "CheckoutDraft"("selectedPromotionId");

ALTER TABLE "Order" ADD COLUMN "promotionId" UUID;
ALTER TABLE "Order" ADD COLUMN "promotionCodeSnapshot" TEXT;
ALTER TABLE "Order" ADD COLUMN "promotionLabelSnapshot" TEXT;
ALTER TABLE "Order" ADD COLUMN "promotionBenefitType" "PromotionBenefitType";
ALTER TABLE "Order" ADD COLUMN "promotionDiscountMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "promotionEligibleSubtotalMinor" INTEGER;
CREATE INDEX "Order_promotionId_idx" ON "Order"("promotionId");

ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_updatedByAdminId_fkey" FOREIGN KEY ("updatedByAdminId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromotionTranslation" ADD CONSTRAINT "PromotionTranslation_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionUniverse" ADD CONSTRAINT "PromotionUniverse_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionUniverse" ADD CONSTRAINT "PromotionUniverse_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionBusinessLine" ADD CONSTRAINT "PromotionBusinessLine_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionBusinessLine" ADD CONSTRAINT "PromotionBusinessLine_businessLineId_fkey" FOREIGN KEY ("businessLineId") REFERENCES "BusinessLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionReservation" ADD CONSTRAINT "PromotionReservation_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromotionReservation" ADD CONSTRAINT "PromotionReservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PromotionReservation" ADD CONSTRAINT "PromotionReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_selectedPromotionId_fkey" FOREIGN KEY ("selectedPromotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CheckoutDraft" ADD CONSTRAINT "CheckoutDraft_selectedPromotionId_fkey" FOREIGN KEY ("selectedPromotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
