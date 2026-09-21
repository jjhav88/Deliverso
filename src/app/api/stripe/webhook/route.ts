import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeGateway } from "@/server/stripe/client";
import { processStripePaymentIntentEvent } from "@/modules/payments/process-webhook";
import { webhookHttpStatus } from "@/modules/payments/domain/webhook-http";
import { logInfo, logWarn } from "@/server/logging/logger";
import { resolveRequestId } from "@/server/logging/request-id";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = resolveRequestId(request);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    logWarn({ event: "STRIPE_WEBHOOK", requestId, result: "missing_signature" });
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeGateway().constructWebhookEvent(rawBody, signature) as Stripe.Event;
  } catch {
    logWarn({ event: "STRIPE_WEBHOOK", requestId, result: "invalid_signature" });
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (!event.type.startsWith("payment_intent.")) {
    logInfo({
      event: "STRIPE_WEBHOOK",
      requestId,
      eventId: event.id,
      eventType: event.type,
      result: "ignored",
    });
    return NextResponse.json({ received: true, requestId }, { status: 200 });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.orderId || null;

  try {
    const outcome = await processStripePaymentIntentEvent({
      providerEventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: {
          orderId: paymentIntent.metadata?.orderId,
          orderNumber: paymentIntent.metadata?.orderNumber,
        },
        last_payment_error: paymentIntent.last_payment_error
          ? {
              code: paymentIntent.last_payment_error.code ?? null,
              message: paymentIntent.last_payment_error.message ?? null,
            }
          : null,
      },
    });
    const status = webhookHttpStatus(outcome);
    logInfo({
      event: "STRIPE_WEBHOOK",
      requestId,
      eventId: event.id,
      eventType: event.type,
      paymentIntentId: paymentIntent.id,
      orderId: orderId ?? undefined,
      result: outcome.ok ? outcome.result : outcome.reason,
      status: String(status),
    });
    return NextResponse.json({ received: true, requestId }, { status });
  } catch {
    logWarn({
      event: "STRIPE_WEBHOOK",
      requestId,
      eventId: event.id,
      eventType: event.type,
      paymentIntentId: paymentIntent.id,
      orderId: orderId ?? undefined,
      result: "transient_error",
    });
    return NextResponse.json({ error: "processing_failed", requestId }, { status: 500 });
  }
}
