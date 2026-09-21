export const paymentCurrency = "MXN" as const;

export const pendingOrderTtlMs = 24 * 60 * 60 * 1000;

export const paymentIntentIdempotencyVersion = "v1";

export const stripePaymentMethodTypes = ["card"] as const;

export function paymentIntentIdempotencyKey(orderId: string): string {
  return `order:${orderId}:payment-intent:${paymentIntentIdempotencyVersion}`;
}

export function isStripeLiveKey(value: string | undefined): boolean {
  const key = value?.trim() ?? "";
  return key.startsWith("sk_live_") || key.startsWith("pk_live_");
}

export function isStripeTestKey(value: string | undefined): boolean {
  const key = value?.trim() ?? "";
  return key.startsWith("sk_test_") || key.startsWith("pk_test_");
}
