export const paymentStatuses = [
  "NOT_STARTED",
  "REQUIRES_PAYMENT_METHOD",
  "REQUIRES_ACTION",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELED",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (paymentStatuses as readonly string[]).includes(value);
}

const paymentRank: Record<PaymentStatus, number> = {
  NOT_STARTED: 0,
  REQUIRES_PAYMENT_METHOD: 1,
  REQUIRES_ACTION: 2,
  PROCESSING: 3,
  FAILED: 4,
  CANCELED: 5,
  SUCCEEDED: 100,
};

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) {
    return true;
  }
  if (from === "SUCCEEDED") {
    return false;
  }
  if (to === "SUCCEEDED") {
    return true;
  }
  if (from === "CANCELED") {
    return false;
  }
  if (to === "CANCELED") {
    return true;
  }
  if (to === "FAILED") {
    return true;
  }
  if (to === "PROCESSING") {
    return paymentRank[from] < paymentRank.PROCESSING;
  }
  return paymentRank[to] >= paymentRank[from];
}

export function canInitializePaymentElement(status: string): boolean {
  return (
    status === "requires_payment_method" ||
    status === "requires_confirmation" ||
    status === "requires_action"
  );
}

export function canRetryCardPayment(status: string): boolean {
  return status === "requires_payment_method";
}

export function isTerminalPaymentIntentStatus(status: string): boolean {
  return status === "succeeded" || status === "canceled";
}

export function mapStripePaymentIntentStatus(status: string): PaymentStatus {
  switch (status) {
    case "requires_payment_method":
      return "REQUIRES_PAYMENT_METHOD";
    case "requires_action":
    case "requires_confirmation":
      return "REQUIRES_ACTION";
    case "processing":
      return "PROCESSING";
    case "succeeded":
      return "SUCCEEDED";
    case "canceled":
      return "CANCELED";
    default:
      return "REQUIRES_PAYMENT_METHOD";
  }
}

export function isStripePaymentAmountValid(input: {
  amount: number;
  currency: string;
  expectedAmountMinor: number;
}): boolean {
  return input.amount === input.expectedAmountMinor && input.currency.toLowerCase() === "mxn";
}

export function sanitizeStripeFailureMessage(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, 240);
  if (!trimmed) {
    return null;
  }
  if (/\b(?:\d{12,}|cvv|cvc)\b/i.test(trimmed)) {
    return "El pago no pudo completarse.";
  }
  return trimmed;
}
