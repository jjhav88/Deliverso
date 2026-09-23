import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { getStripeGateway } from "@/server/stripe/client";
import type { StripeGateway } from "@/server/stripe/gateway";
import { paymentSuccessPreventsExpiry } from "@/modules/orders/domain/status";

export async function expirePendingOrderIfNeeded(
  orderId: string,
  gateway: StripeGateway = getStripeGateway(),
): Promise<"expired" | "paid" | "unchanged"> {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      cartId: true,
      status: true,
      paymentStatus: true,
      expiresAt: true,
      stripePaymentIntentId: true,
    },
  });

  if (!order) {
    return "unchanged";
  }
  if (paymentSuccessPreventsExpiry({ status: order.status, paymentSucceeded: order.paymentStatus === "SUCCEEDED" })) {
    return "paid";
  }
  if (order.status !== "PENDING_PAYMENT" || order.expiresAt.getTime() > Date.now()) {
    return "unchanged";
  }

  if (order.stripePaymentIntentId) {
    try {
      const intent = await gateway.retrievePaymentIntent(order.stripePaymentIntentId);
      if (intent.status === "succeeded") {
        return "paid";
      }
    } catch {
      return "unchanged";
    }
    await gateway.cancelPaymentIntent(order.stripePaymentIntentId);
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: order.id },
      select: { status: true, paymentStatus: true },
    });
    if (
      !current ||
      paymentSuccessPreventsExpiry({
        status: current.status,
        paymentSucceeded: current.paymentStatus === "SUCCEEDED",
      })
    ) {
      return;
    }
    if (current.status !== "PENDING_PAYMENT") {
      return;
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "EXPIRED",
        paymentStatus: current.paymentStatus === "SUCCEEDED" ? current.paymentStatus : "CANCELED",
      },
    });
    if (order.cartId) {
      await tx.cart.update({
        where: { id: order.cartId },
        data: { status: "ACTIVE" },
      });
    }
    await tx.orderEvent.create({
      data: { orderId: order.id, type: "ORDER_EXPIRED" },
    });
    const { releasePromotionReservation } = await import("@/modules/promotions/reservation");
    await releasePromotionReservation(tx, order.id);
  });

  return "expired";
}
