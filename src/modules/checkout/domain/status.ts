export const checkoutDraftStatuses = [
  "IN_PROGRESS",
  "READY_FOR_PAYMENT",
  "CONVERTED_TO_ORDER",
  "EXPIRED",
] as const;

export type CheckoutDraftStatus = (typeof checkoutDraftStatuses)[number];

export const operationalDraftStatuses = ["IN_PROGRESS", "READY_FOR_PAYMENT"] as const;

export function isOperationalDraft(status: CheckoutDraftStatus): boolean {
  return status === "IN_PROGRESS" || status === "READY_FOR_PAYMENT";
}

export function isDraftExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
