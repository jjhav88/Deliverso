import "server-only";
import Stripe from "stripe";
import { stripePaymentMethodTypes } from "@/config/payments";
import { getStripeSecretKey, getStripeWebhookSecret } from "@/server/stripe/env";
import type {
  CreatePaymentIntentInput,
  StripeGateway,
  StripePaymentIntentSnapshot,
  StripeRefundSnapshot,
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

function paymentIntentIdFromRefund(refund: Stripe.Refund): string | null {
  const value = refund.payment_intent;
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.id;
}

function mapRefund(refund: Stripe.Refund): StripeRefundSnapshot {
  return {
    id: refund.id,
    status: refund.status ?? "pending",
    amount: refund.amount,
    currency: refund.currency,
    paymentIntentId: paymentIntentIdFromRefund(refund),
    livemode: "livemode" in refund ? Boolean(refund.livemode) : false,
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

    async createRefund(input, idempotencyKey) {
      const refund = await stripe.refunds.create(
        {
          payment_intent: input.paymentIntentId,
          amount: input.amountMinor,
          metadata: {
            refundId: input.metadata.refundId,
            orderId: input.metadata.orderId,
          },
        },
        { idempotencyKey },
      );
      return mapRefund(refund);
    },

    async retrieveRefund(id) {
      return mapRefund(await stripe.refunds.retrieve(id));
    },

    constructWebhookEvent(rawBody, signature) {
      return stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
    },
  };
}
