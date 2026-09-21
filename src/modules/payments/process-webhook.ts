import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { planPaymentIntentEvent } from "@/modules/orders/domain/webhook-plan";
import { sanitizeStripeFailureMessage } from "@/modules/orders/domain/payment-status";
import { orderPaidEventKey } from "@/modules/email/domain/event-keys";
import { queueTransactionalEmail } from "@/modules/email/queue";

export type WebhookProcessResult =
  | { ok: true; result: "processed" | "duplicate" | "ignored" | "amount_mismatch" }
  | { ok: false; reason: "invalid_signature" | "missing_order" };

type PaymentIntentLike = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  last_payment_error?: { code?: string | null; message?: string | null } | null;
};

export async function processStripePaymentIntentEvent(input: {
  providerEventId: string;
  eventType: string;
  livemode: boolean;
  paymentIntent: PaymentIntentLike;
}): Promise<WebhookProcessResult> {
  const prisma = getPrisma();

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const existing = await tx.paymentWebhookEvent.findUnique({
        where: { providerEventId: input.providerEventId },
        select: { id: true },
      });
      if (existing) {
        return "duplicate" as const;
      }

      const event = await tx.paymentWebhookEvent.create({
        data: {
          provider: "STRIPE",
          providerEventId: input.providerEventId,
          eventType: input.eventType,
          livemode: input.livemode,
        },
      });

      const order = await tx.order.findUnique({
        where: { stripePaymentIntentId: input.paymentIntent.id },
        select: {
          id: true,
          cartId: true,
          status: true,
          paymentStatus: true,
          grandTotalMinor: true,
          customerEmail: true,
          customerName: true,
          locale: true,
        },
      });

      if (!order) {
        await tx.paymentWebhookEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date(), processingResult: "missing_order" },
        });
        return "ignored" as const;
      }

      const plan = planPaymentIntentEvent({
        eventType: input.eventType,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        amount: input.paymentIntent.amount,
        currency: input.paymentIntent.currency,
        expectedAmountMinor: order.grandTotalMinor,
      });

      if (plan.action === "reject") {
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            type: "PAYMENT_AMOUNT_MISMATCH",
            metadata: {
              amount: input.paymentIntent.amount,
              currency: input.paymentIntent.currency,
              expectedAmountMinor: order.grandTotalMinor,
            },
          },
        });
        await tx.paymentWebhookEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date(), processingResult: "amount_mismatch" },
        });
        return "amount_mismatch" as const;
      }

      if (plan.action === "ignore") {
        await tx.paymentWebhookEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date(), processingResult: plan.reason },
        });
        return "ignored" as const;
      }

      const now = new Date();
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: plan.paymentStatus,
          status: plan.orderStatus ?? undefined,
          fulfillmentStatus: plan.fulfillmentStatus ?? undefined,
          paidAt: plan.markPaid ? now : undefined,
          cancelledAt: plan.cancelOrder ? now : undefined,
        },
      });

      if (plan.cartStatus) {
        await tx.cart.update({
          where: { id: order.cartId },
          data: { status: plan.cartStatus },
        });
      }

      await tx.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: "STRIPE",
          providerPaymentIntentId: input.paymentIntent.id,
          amountMinor: input.paymentIntent.amount,
          currencyCode: input.paymentIntent.currency.toUpperCase(),
          status: plan.paymentStatus,
          failureCode: input.paymentIntent.last_payment_error?.code ?? null,
          failureMessage: sanitizeStripeFailureMessage(
            input.paymentIntent.last_payment_error?.message,
          ),
        },
      });

      const eventType =
        plan.paymentStatus === "SUCCEEDED"
          ? "PAYMENT_SUCCEEDED"
          : plan.paymentStatus === "FAILED"
            ? "PAYMENT_FAILED"
            : plan.paymentStatus === "PROCESSING"
              ? "PAYMENT_PROCESSING"
              : "PAYMENT_CANCELED";

      await tx.orderEvent.create({
        data: { orderId: order.id, type: eventType },
      });

      if (plan.paymentStatus === "SUCCEEDED") {
        await queueTransactionalEmail(
          {
            template: "ORDER_PAID",
            eventKey: orderPaidEventKey(order.id),
            recipientEmail: order.customerEmail,
            recipientName: order.customerName,
            locale: order.locale || "es-MX",
            referenceType: "Order",
            referenceId: order.id,
          },
          tx,
        );
      }

      await tx.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processedAt: now, processingResult: "processed" },
      });

      return "processed" as const;
    });

    return { ok: true, result: outcome };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return { ok: true, result: "duplicate" };
    }
    throw error;
  }
}
