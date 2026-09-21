import type { EmailOutboxStatus } from "@/modules/email/domain/types";

export const emailMaxAttempts = 5;
export const emailDispatchBatchSize = 20;

const retryDelaysMs = [
  5 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
] as const;

export function nextRetryAt(attemptCountAfterFailure: number, now = new Date()): Date | null {
  if (attemptCountAfterFailure >= emailMaxAttempts) {
    return null;
  }
  const delay = retryDelaysMs[attemptCountAfterFailure - 1] ?? retryDelaysMs[retryDelaysMs.length - 1];
  return new Date(now.getTime() + delay);
}

export function statusAfterFailure(attemptCountAfterFailure: number, permanent = false): EmailOutboxStatus {
  if (permanent || attemptCountAfterFailure >= emailMaxAttempts) {
    return "DEAD";
  }
  return "FAILED";
}

export function isEligibleForDispatch(input: {
  status: EmailOutboxStatus;
  nextAttemptAt: Date | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  if (input.status === "PENDING") {
    return true;
  }
  if (input.status === "FAILED") {
    return !input.nextAttemptAt || input.nextAttemptAt.getTime() <= now.getTime();
  }
  return false;
}

export function classifyProviderFailure(code: string, message: string): "transient" | "permanent" {
  const haystack = `${code} ${message}`.toLowerCase();
  if (
    haystack.includes("invalid") &&
    (haystack.includes("recipient") || haystack.includes("to address") || haystack.includes("email"))
  ) {
    return "permanent";
  }
  if (haystack.includes("validation_error") && haystack.includes("email")) {
    return "permanent";
  }
  return "transient";
}

export function sanitizeEmailErrorMessage(value: string | null | undefined): string {
  if (!value) {
    return "Email delivery failed.";
  }
  return value
    .replace(/re_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}
