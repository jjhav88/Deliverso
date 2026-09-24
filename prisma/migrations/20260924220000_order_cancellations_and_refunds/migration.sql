-- Cancellations and refunds (M18). Existing orders keep historical totals.

ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'CANCELLATION_REQUESTED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'CANCELLATION_APPROVED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'CANCELLATION_REJECTED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'ORDER_CANCELED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'REFUND_SUCCEEDED';
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'REFUND_FAILED';

ALTER TABLE "Order" ADD COLUMN "refundedAmountMinor" INTEGER NOT NULL DEFAULT 0;

CREATE TYPE "CancellationRequestStatus" AS ENUM (
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'COMPLETED'
);

CREATE TYPE "RefundStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELED'
);

CREATE TYPE "RefundType" AS ENUM ('FULL', 'PARTIAL');

CREATE TYPE "RefundReason" AS ENUM (
  'CUSTOMER_REQUEST',
  'DUPLICATE',
  'PRODUCT_UNAVAILABLE',
  'FULFILLMENT_ISSUE',
  'ORDER_ERROR',
  'QUALITY_ISSUE',
  'OTHER'
);

CREATE TABLE "CancellationRequest" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "status" "CancellationRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" "RefundReason" NOT NULL,
    "customerMessage" TEXT,
    "adminMessage" TEXT,
    "reviewedByAdminId" UUID,
    "reviewedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "CancellationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CancellationRequest_orderId_status_idx" ON "CancellationRequest"("orderId", "status");
CREATE INDEX "CancellationRequest_customerId_createdAt_idx" ON "CancellationRequest"("customerId", "createdAt");
CREATE INDEX "CancellationRequest_status_createdAt_idx" ON "CancellationRequest"("status", "createdAt");

CREATE TABLE "Refund" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "paymentAttemptId" UUID,
    "stripeRefundId" TEXT,
    "type" "RefundType" NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "RefundReason" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "cancelsOrder" BOOLEAN NOT NULL DEFAULT false,
    "requestedByAdminId" UUID,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerFailureCode" TEXT,
    "providerFailureMessage" TEXT,
    "internalNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ,
    "failedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");
CREATE INDEX "Refund_orderId_status_idx" ON "Refund"("orderId", "status");
CREATE INDEX "Refund_status_createdAt_idx" ON "Refund"("status", "createdAt");
CREATE INDEX "Refund_createdAt_idx" ON "Refund"("createdAt");

CREATE TABLE "RefundEvent" (
    "id" UUID NOT NULL,
    "refundId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RefundEvent_refundId_createdAt_idx" ON "RefundEvent"("refundId", "createdAt");

ALTER TABLE "CancellationRequest" ADD CONSTRAINT "CancellationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CancellationRequest" ADD CONSTRAINT "CancellationRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CancellationRequest" ADD CONSTRAINT "CancellationRequest_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_requestedByAdminId_fkey" FOREIGN KEY ("requestedByAdminId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefundEvent" ADD CONSTRAINT "RefundEvent_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
