import "server-only";
import { paymentCurrency, paymentIntentIdempotencyKey } from "@/config/payments";
import { getPrisma } from "@/server/db/prisma";
import { getStripeGateway } from "@/server/stripe/client";
import type { StripeGateway, StripePaymentIntentSnapshot } from "@/server/stripe/gateway";
import { mapStripePaymentIntentStatus } from "@/modules/orders/domain/payment-status";

export async function createOrGetPaymentIntentForOrder(
  orderId: string,
  gateway: StripeGateway = getStripeGateway(),
): Promise<StripePaymentIntentSnapshot> {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      grandTotalMinor: true,
      stripePaymentIntentId: true,
      status: true,
    },
  });

  if (!order || order.status === "CANCELLED" || order.status === "EXPIRED") {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  if (order.stripePaymentIntentId) {
    const existing = await gateway.retrievePaymentIntent(order.stripePaymentIntentId);
    if (existing.status !== "canceled") {
      return existing;
    }
  }

  const created = await gateway.createPaymentIntent(
    {
      amountMinor: order.grandTotalMinor,
      currency: paymentCurrency.toLowerCase() as "mxn",
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
      },
    },
    paymentIntentIdempotencyKey(order.id),
  );

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripePaymentIntentId: created.id,
      paymentStatus: mapStripePaymentIntentStatus(created.status),
    },
  });

  return created;
}
