import "server-only";
import { revalidatePath } from "next/cache";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { fulfillmentEventKey } from "@/modules/email/domain/event-keys";
import { templateForFulfillmentStatus } from "@/modules/email/domain/fulfillment-map";
import { queueTransactionalEmail } from "@/modules/email/queue";
import { isFulfillmentStatus, type FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import { evaluateFulfillmentTransition } from "@/modules/operations/domain/transitions";
import { getPrisma } from "@/server/db/prisma";
import { logError } from "@/server/logging/logger";

export type TransitionFulfillmentResult =
  | { ok: true; from: FulfillmentStatus; to: FulfillmentStatus }
  | { ok: false; error: string };

function revalidateFulfillmentSurfaces(orderId: string) {
  revalidatePath("/admin/operations");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

export async function transitionFulfillmentStatus(input: {
  orderId: string;
  nextStatus: string;
  actorAdminId: string;
}): Promise<TransitionFulfillmentResult> {
  if (!input.orderId || !isFulfillmentStatus(input.nextStatus)) {
    return { ok: false, error: "Esa transición de estado no está permitida." };
  }

  try {
    const prisma = getPrisma();
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        fulfillmentMethod: true,
        customerEmail: true,
        customerName: true,
        locale: true,
      },
    });
    if (!order) {
      return { ok: false, error: "No encontramos ese pedido." };
    }

    const plan = evaluateFulfillmentTransition(order, input.nextStatus);
    if (!plan.ok) {
      return { ok: false, error: plan.error };
    }
    if (plan.noop) {
      return { ok: true, from: plan.from, to: plan.to };
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { fulfillmentStatus: plan.to },
      });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "FULFILLMENT_STATUS_CHANGED",
          metadata: { from: plan.from, to: plan.to },
        },
      });
      const template = templateForFulfillmentStatus(plan.to);
      if (template) {
        await queueTransactionalEmail(
          {
            template,
            eventKey: fulfillmentEventKey(order.id, plan.to),
            recipientEmail: order.customerEmail,
            recipientName: order.customerName,
            locale: order.locale || "es-MX",
            referenceType: "Order",
            referenceId: order.id,
          },
          tx,
        );
      }
    });

    await writeAdminAuditLog({
      actorAdminId: input.actorAdminId,
      action: "ORDER_FULFILLMENT_STATUS_CHANGED",
      resourceType: "Order",
      resourceId: order.id,
      metadata: { from: plan.from, to: plan.to },
    });
    revalidateFulfillmentSurfaces(order.id);
    return { ok: true, from: plan.from, to: plan.to };
  } catch (error) {
    logError({
      event: "FULFILLMENT_TRANSITION_FAILED",
      orderId: input.orderId,
      status: input.nextStatus,
      reason: error instanceof Error ? error.name : "UNKNOWN",
    });
    return { ok: false, error: "No se pudo actualizar el estado. Inténtalo de nuevo." };
  }
}
