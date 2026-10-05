-- Operations fulfillment queries: PAID + requestedDate range.

CREATE INDEX IF NOT EXISTS "Order_status_requestedDate_idx" ON "Order"("status", "requestedDate");
