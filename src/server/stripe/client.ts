import "server-only";
import Stripe from "stripe";
import { stripePaymentMethodTypes } from "@/config/payments";
import { getStripeSecretKey, getStripeWebhookSecret } from "@/server/stripe/env";
import type {
  CreatePaymentIntentInput,
  StripeGateway,
  StripePaymentIntentSnapshot,
} from "@/server/stripe/gateway";

const globalForStripe = globalThis as typeof globalThis & {
  deliversoStripe?: Stripe;
};

function getStripe(): Stripe {
  if (!globalForStripe.deliversoStripe) {
    globalForStripe.deliversoStripe = new Stripe(getStripeSecretKey());
  }
  return globalForStripe.deliversoStripe;
}

function mapPaymentIntent(intent: Stripe.PaymentIntent): StripePaymentIntentSnapshot {
  return {
    id: intent.id,
    clientSecret: intent.client_secret,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
    livemode: intent.livemode,
    metadata: {
      orderId: intent.metadata?.orderId,
      orderNumber: intent.metadata?.orderNumber,
    },
  };
}

export function getStripeGateway(): StripeGateway {
  const stripe = getStripe();

  return {
    async createPaymentIntent(input, idempotencyKey) {
      const intent = await stripe.paymentIntents.create(
        {
          amount: input.amountMinor,
          currency: input.currency,
          payment_method_types: [...stripePaymentMethodTypes],
          metadata: {
            orderId: input.metadata.orderId,
            orderNumber: input.metadata.orderNumber,
            ...(input.metadata.customerId ? { customerId: input.metadata.customerId } : {}),
          },
        },
        { idempotencyKey },
      );
      return mapPaymentIntent(intent);
    },

    async retrievePaymentIntent(id) {
      return mapPaymentIntent(await stripe.paymentIntents.retrieve(id));
    },

    async cancelPaymentIntent(id) {
      try {
        return mapPaymentIntent(await stripe.paymentIntents.cancel(id));
      } catch {
        return null;
      }
    },

    constructWebhookEvent(rawBody, signature) {
      return stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
    },
  };
}
