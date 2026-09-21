import "server-only";
import { processStripePaymentIntentEvent } from "@/modules/payments/process-webhook";
import { getStripeGateway } from "@/server/stripe/client";
import type { StripeGateway } from "@/server/stripe/gateway";

export async function applySucceededPaymentIntentIfNeeded(input: {
  stripePaymentIntentId?: string | null;
  orderStatus: string;
  paymentStatus: string;
  gateway?: StripeGateway;
}): Promise<"applied" | "already_paid" | "not_succeeded" | "skipped"> {
  if (input.orderStatus === "PAID" && input.paymentStatus === "SUCCEEDED") {
    return "already_paid";
  }
  if (!input.stripePaymentIntentId) {
    return "skipped";
  }

  const gateway = input.gateway ?? getStripeGateway();
  const intent = await gateway.retrievePaymentIntent(input.stripePaymentIntentId);
  if (intent.status !== "succeeded") {
    return "not_succeeded";
  }

  await processStripePaymentIntentEvent({
    providerEventId: `reconcile:${intent.id}:succeeded`,
    eventType: "payment_intent.succeeded",
    livemode: intent.livemode,
    paymentIntent: {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      metadata: intent.metadata,
    },
  });
  return "applied";
}
