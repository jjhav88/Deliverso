import type { EmailOutboxStatus } from "@/modules/email/domain/types";

export const emailProcessingStaleMs = 10 * 60 * 1000;

export function isStaleProcessing(input: {
  status: EmailOutboxStatus;
  processingStartedAt: Date | null;
  updatedAt?: Date | null;
  now?: Date;
  staleMs?: number;
}): boolean {
  if (input.status !== "PROCESSING") {
    return false;
  }
  const now = input.now ?? new Date();
  const staleMs = input.staleMs ?? emailProcessingStaleMs;
  const started = input.processingStartedAt ?? input.updatedAt ?? null;
  if (!started) {
    return false;
  }
  return now.getTime() - started.getTime() >= staleMs;
}
