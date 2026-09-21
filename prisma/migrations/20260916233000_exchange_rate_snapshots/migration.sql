-- CreateTable
CREATE TABLE "ExchangeRateSnapshot" (
    "id" UUID NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "rate" DECIMAL(30,15) NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceDate" DATE NOT NULL,
    "fetchedAt" TIMESTAMPTZ NOT NULL,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRateSnapshot_baseCurrency_quoteCurrency_provider_sourceDate_key" ON "ExchangeRateSnapshot"("baseCurrency", "quoteCurrency", "provider", "sourceDate");

-- CreateIndex
CREATE INDEX "ExchangeRateSnapshot_baseCurrency_quoteCurrency_idx" ON "ExchangeRateSnapshot"("baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE INDEX "ExchangeRateSnapshot_fetchedAt_idx" ON "ExchangeRateSnapshot"("fetchedAt");
