"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { getPrisma } from "@/server/db/prisma";
import {
  canTransitionFulfillmentStatus,
  isFulfillmentStatus,
} from "@/modules/orders/domain/fulfillment-status";
import { fulfillmentEventKey } from "@/modules/email/domain/event-keys";
import { templateForFulfillmentStatus } from "@/modules/email/domain/fulfillment-map";
import { queueTransactionalEmail } from "@/modules/email/queue";

export type AdminOrderActionState = {
  error: string | null;
  success: string | null;
};

function revalidateAdminOrders(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateOrderFulfillmentStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/orders");
  const orderId = String(formData.get("orderId") ?? "");
  const nextStatus = String(formData.get("fulfillmentStatus") ?? "");
  if (!orderId || !isFulfillmentStatus(nextStatus)) {
    return;
  }

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      fulfillmentStatus: true,
      fulfillmentMethod: true,
      customerEmail: true,
      customerName: true,
      locale: true,
    },
  });
  if (!order) {
    return;
  }

  if (
    !canTransitionFulfillmentStatus({
      from: order.fulfillmentStatus,
      to: nextStatus,
      method: order.fulfillmentMethod,
      orderPaid: order.status === "PAID",
    })
  ) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { fulfillmentStatus: nextStatus },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "FULFILLMENT_STATUS_CHANGED",
        metadata: { from: order.fulfillmentStatus, to: nextStatus },
      },
    });
    const template = templateForFulfillmentStatus(nextStatus);
    if (template && order.fulfillmentStatus !== nextStatus) {
      await queueTransactionalEmail(
        {
          template,
          eventKey: fulfillmentEventKey(order.id, nextStatus),
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
    actorAdminId: admin.id,
    action: "ORDER_FULFILLMENT_STATUS_CHANGED",
    resourceType: "Order",
    resourceId: order.id,
    metadata: { from: order.fulfillmentStatus, to: nextStatus },
  });
  revalidateAdminOrders(order.id);
}

export async function cancelPaidOrderByAdmin(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/orders");
  const orderId = String(formData.get("orderId") ?? "");
  const confirmed = String(formData.get("confirmNoRefund") ?? "") === "1";
  if (!confirmed) {
    return;
  }

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, fulfillmentStatus: true },
  });
  if (!order) {
    return;
  }
  if (order.status !== "PAID") {
    return;
  }
  if (order.fulfillmentStatus === "COMPLETED" || order.fulfillmentStatus === "CANCELLED") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        fulfillmentStatus: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
    await tx.orderEvent.create({
      data: { orderId: order.id, type: "ORDER_CANCELLED", metadata: { actor: "admin" } },
    });
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "ORDER_CANCELLED",
    resourceType: "Order",
    resourceId: order.id,
    metadata: { refund: false },
  });
  revalidateAdminOrders(order.id);
}
