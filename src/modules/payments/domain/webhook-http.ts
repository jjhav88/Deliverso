export type WebhookProcessResult =
  | { ok: true; result: "processed" | "duplicate" | "ignored" | "amount_mismatch" }
  | { ok: false; reason: "invalid_signature" | "missing_order" };

export function webhookHttpStatus(outcome: WebhookProcessResult): number {
  if (!outcome.ok) {
    if (outcome.reason === "invalid_signature") {
      return 400;
    }
    if (outcome.reason === "missing_order") {
      return 503;
    }
    return 500;
  }
  return 200;
}

export function shouldRetryStripeDelivery(status: number): boolean {
  return status >= 500;
}
