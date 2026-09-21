-- CreateEnum
CREATE TYPE "CheckoutDraftStatus" AS ENUM ('IN_PROGRESS', 'READY_FOR_PAYMENT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateTable
CREATE TABLE "CheckoutDraft" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "status" "CheckoutDraftStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "fulfillmentMethod" "FulfillmentMethod",
    "deliveryZoneId" UUID,
    "pickupLocationId" UUID,
    "requestedDate" DATE,
    "timeWindowId" UUID,
    "customerNotes" TEXT,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CheckoutDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutAddress" (
    "id" UUID NOT NULL,
    "checkoutDraftId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT,
    "street" TEXT NOT NULL,
    "exteriorNumber" TEXT,
    "interiorNumber" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CheckoutAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deliveryFeeMinor" INTEGER NOT NULL,
    "minimumOrderMinor" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryPostalCode" (
    "id" UUID NOT NULL,
    "deliveryZoneId" UUID NOT NULL,
    "countryCode" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,

    CONSTRAINT "DeliveryPostalCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupLocation" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "instructions" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PickupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentWeeklySchedule" (
    "id" UUID NOT NULL,
    "fulfillmentMethod" "FulfillmentMethod" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FulfillmentWeeklySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentTimeWindow" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "label" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FulfillmentTimeWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentBlackoutDate" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "fulfillmentMethod" "FulfillmentMethod",
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FulfillmentBlackoutDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutDraft_customerId_status_idx" ON "CheckoutDraft"("customerId", "status");

-- CreateIndex
CREATE INDEX "CheckoutDraft_cartId_status_idx" ON "CheckoutDraft"("cartId", "status");

-- CreateIndex
CREATE INDEX "CheckoutDraft_expiresAt_idx" ON "CheckoutDraft"("expiresAt");

-- One operational draft per cart.
CREATE UNIQUE INDEX "CheckoutDraft_cart_operational_unique" ON "CheckoutDraft"("cartId")
WHERE "status" IN ('IN_PROGRESS', 'READY_FOR_PAYMENT');

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutAddress_checkoutDraftId_key" ON "CheckoutAddress"("checkoutDraftId");

-- CreateIndex
CREATE INDEX "DeliveryZone_isActive_sortOrder_idx" ON "DeliveryZone"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPostalCode_countryCode_postalCode_key" ON "DeliveryPostalCode"("countryCode", "postalCode");

-- CreateIndex
CREATE INDEX "DeliveryPostalCode_deliveryZoneId_idx" ON "DeliveryPostalCode"("deliveryZoneId");

-- CreateIndex
CREATE INDEX "PickupLocation_isActive_sortOrder_idx" ON "PickupLocation"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FulfillmentWeeklySchedule_fulfillmentMethod_dayOfWeek_key" ON "FulfillmentWeeklySchedule"("fulfillmentMethod", "dayOfWeek");

-- CreateIndex
CREATE INDEX "FulfillmentTimeWindow_scheduleId_sortOrder_idx" ON "FulfillmentTimeWindow"("scheduleId", "sortOrder");

-- CreateIndex
CREATE INDEX "FulfillmentBlackoutDate_date_isActive_idx" ON "FulfillmentBlackoutDate"("date", "isActive");

-- AddForeignKey
ALTER TABLE "CheckoutDraft" ADD CONSTRAINT "CheckoutDraft_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutDraft" ADD CONSTRAINT "CheckoutDraft_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutDraft" ADD CONSTRAINT "CheckoutDraft_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutDraft" ADD CONSTRAINT "CheckoutDraft_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "PickupLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutDraft" ADD CONSTRAINT "CheckoutDraft_timeWindowId_fkey" FOREIGN KEY ("timeWindowId") REFERENCES "FulfillmentTimeWindow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutAddress" ADD CONSTRAINT "CheckoutAddress_checkoutDraftId_fkey" FOREIGN KEY ("checkoutDraftId") REFERENCES "CheckoutDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryPostalCode" ADD CONSTRAINT "DeliveryPostalCode_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentTimeWindow" ADD CONSTRAINT "FulfillmentTimeWindow_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "FulfillmentWeeklySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
