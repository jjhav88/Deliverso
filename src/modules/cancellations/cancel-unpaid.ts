import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { getStripeGateway } from "@/server/stripe/client";
import { queueOrderCanceledEmail } from "@/modules/cancellations/emails";

export type CancelUnpaidResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: "not_found" | "not_pending" | "already_paid" };

export async function cancelUnpaidOrder(input: {
  orderId: string;
  actor: "customer" | "admin";
}): Promise<CancelUnpaidResult> {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      cartId: true,
      stripePaymentIntentId: true,
      customerEmail: true,
      customerName: true,
      locale: true,
    },
  });
  if (!order) {
    return { ok: false, reason: "not_found" };
  }
  if (order.status === "PAID" || order.paymentStatus === "SUCCEEDED") {
    return { ok: false, reason: "already_paid" };
  }
  if (order.status !== "PENDING_PAYMENT") {
    return { ok: false, reason: "not_pending" };
  }

  if (order.stripePaymentIntentId) {
    await getStripeGateway().cancelPaymentIntent(order.stripePaymentIntentId);
  }

  const applied = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: order.id },
      select: { status: true, paymentStatus: true },
    });
    if (!current) {
      return false;
    }
    if (current.status === "PAID" || current.paymentStatus === "SUCCEEDED") {
      return false;
    }
    if (current.status !== "PENDING_PAYMENT") {
      return false;
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentStatus: "CANCELED",
        fulfillmentStatus: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
    if (order.cartId) {
      await tx.cart.update({
        where: { id: order.cartId },
        data: { status: "ACTIVE" },
      });
    }
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "ORDER_CANCELED",
        metadata: { actor: input.actor, paid: false },
      },
    });
    const { releasePromotionReservation } = await import("@/modules/promotions/reservation");
    await releasePromotionReservation(tx, order.id);
    await queueOrderCanceledEmail(order, tx);
    return true;
  });

  if (!applied) {
    return { ok: false, reason: "already_paid" };
  }
  return { ok: true, orderId: order.id };
}
