-- Stale PROCESSING recovery for EmailOutbox (M15A).
ALTER TABLE "EmailOutbox" ADD COLUMN "processingStartedAt" TIMESTAMPTZ;

CREATE INDEX "EmailOutbox_status_processingStartedAt_idx"
  ON "EmailOutbox"("status", "processingStartedAt");
