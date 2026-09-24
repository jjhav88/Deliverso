"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { getPrisma } from "@/server/db/prisma";
import { cancelUnpaidOrder } from "@/modules/cancellations/cancel-unpaid";
import {
  canAdminCancelPendingOrder,
  canAdminReviewCancellation,
  canIssueRefund,
} from "@/modules/cancellations/domain/eligibility";
import { isRefundReason } from "@/modules/cancellations/domain/types";
import {
  queueCancellationApprovedEmail,
  queueCancellationRejectedEmail,
} from "@/modules/cancellations/emails";
import { createAndSubmitRefund, retryFailedRefund } from "@/modules/refunds/engine";
import type { CancellationActionState } from "@/modules/cancellations/action-state";

function revalidateAdminFinance(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/cancellations");
  revalidatePath("/admin");
}

export async function approveCancellationRequest(
  previousState: CancellationActionState,
  formData: FormData,
): Promise<CancellationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/cancellations");
  if (!canIssueRefund(admin.role)) {
    return { error: "No tienes permiso para reembolsar.", success: null };
  }
  const requestId = String(formData.get("requestId") ?? "");
  const adminMessage = String(formData.get("adminMessage") ?? "").trim() || null;
  const confirmed = String(formData.get("confirm") ?? "") === "1";
  if (!confirmed) {
    return { error: "Confirma la aprobación para continuar.", success: null };
  }

  const prisma = getPrisma();
  const request = await prisma.cancellationRequest.findUnique({
    where: { id: requestId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          customerEmail: true,
          customerName: true,
          locale: true,
        },
      },
    },
  });
  if (!request || !canAdminReviewCancellation(request.status)) {
    return { error: "Esta solicitud ya no está pendiente.", success: null };
  }

  await prisma.cancellationRequest.update({
    where: { id: request.id },
    data: {
      status: "APPROVED",
      adminMessage,
      reviewedByAdminId: admin.id,
      reviewedAt: new Date(),
    },
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "CANCELLATION_APPROVED",
    resourceType: "CancellationRequest",
    resourceId: request.id,
    metadata: { orderId: request.orderId },
  });
  await queueCancellationApprovedEmail(request.order, request.id);

  const refund = await createAndSubmitRefund({
    orderId: request.orderId,
    adminId: admin.id,
    adminRole: admin.role,
    type: "FULL",
    reason: isRefundReason(request.reason) ? request.reason : "CUSTOMER_REQUEST",
    cancelsOrder: true,
    internalNote: adminMessage,
  });

  revalidateAdminFinance(request.orderId);
  if (!refund.ok) {
    return {
      error:
        refund.reason === "nothing_refundable"
          ? "La solicitud se aprobó, pero no hay saldo reembolsable."
          : "La solicitud se aprobó, pero el reembolso no se completó. Revisa el pedido.",
      success: null,
    };
  }
  return { error: null, success: "Solicitud aprobada. Reembolso total enviado a Stripe." };
}

export async function rejectCancellationRequest(
  previousState: CancellationActionState,
  formData: FormData,
): Promise<CancellationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/cancellations");
  const requestId = String(formData.get("requestId") ?? "");
  const adminMessage = String(formData.get("adminMessage") ?? "").trim() || null;

  const prisma = getPrisma();
  const request = await prisma.cancellationRequest.findUnique({
    where: { id: requestId },
    include: {
      order: {
        select: {
          id: true,
          customerEmail: true,
          customerName: true,
          locale: true,
        },
      },
    },
  });
  if (!request || !canAdminReviewCancellation(request.status)) {
    return { error: "Esta solicitud ya no está pendiente.", success: null };
  }

  await prisma.cancellationRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      adminMessage,
      reviewedByAdminId: admin.id,
      reviewedAt: new Date(),
    },
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "CANCELLATION_REJECTED",
    resourceType: "CancellationRequest",
    resourceId: request.id,
    metadata: { orderId: request.orderId },
  });
  await queueCancellationRejectedEmail(request.order, request.id);
  revalidateAdminFinance(request.orderId);
  return { error: null, success: "Solicitud rechazada. El pedido sigue activo." };
}

export async function cancelPendingOrderByAdmin(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/orders");
  const orderId = String(formData.get("orderId") ?? "");
  const confirmed = String(formData.get("confirm") ?? "") === "1";
  if (!orderId || !confirmed) {
    return;
  }
  const order = await getPrisma().order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, paymentStatus: true },
  });
  if (!order || !canAdminCancelPendingOrder(order)) {
    return;
  }
  const result = await cancelUnpaidOrder({ orderId: order.id, actor: "admin" });
  if (result.ok) {
    await writeAdminAuditLog({
      actorAdminId: admin.id,
      action: "ORDER_CANCELLED",
      resourceType: "Order",
      resourceId: order.id,
      metadata: { refund: false, pending: true },
    });
    revalidateAdminFinance(order.id);
  }
}

export async function createAdminRefundAction(
  previousState: CancellationActionState,
  formData: FormData,
): Promise<CancellationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/orders");
  const orderId = String(formData.get("orderId") ?? "");
  const type = String(formData.get("type") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const confirmed = String(formData.get("confirm") ?? "") === "1";
  const cancelsOrder = String(formData.get("cancelsOrder") ?? "") === "1";
  const internalNote = String(formData.get("internalNote") ?? "").trim() || null;
  const amountRaw = String(formData.get("amountMajor") ?? "").trim();
  if (!confirmed) {
    return { error: "Confirma el reembolso para enviarlo a Stripe.", success: null };
  }
  if (type !== "FULL" && type !== "PARTIAL") {
    return { error: "Selecciona el tipo de reembolso.", success: null };
  }
  if (!isRefundReason(reason)) {
    return { error: "Selecciona un motivo.", success: null };
  }

  let requestedAmountMinor: number | undefined;
  if (type === "PARTIAL") {
    const major = Number(amountRaw.replace(",", "."));
    if (!Number.isFinite(major) || major <= 0) {
      return { error: "Indica un monto parcial válido.", success: null };
    }
    requestedAmountMinor = Math.round(major * 100);
  }

  const result = await createAndSubmitRefund({
    orderId,
    adminId: admin.id,
    adminRole: admin.role,
    type,
    reason,
    requestedAmountMinor,
    cancelsOrder: type === "FULL" && cancelsOrder,
    internalNote,
  });
  revalidateAdminFinance(orderId);
  if (!result.ok) {
    const messages: Record<string, string> = {
      nothing_refundable: "No hay saldo disponible para reembolsar.",
      invalid_amount: "El monto excede lo disponible.",
      not_paid: "El pedido no está pagado.",
      provider_error: "Stripe rechazó o no pudo crear el reembolso.",
      missing_payment_intent: "No hay PaymentIntent asociado.",
      forbidden: "No tienes permiso para reembolsar.",
    };
    return { error: messages[result.reason] ?? "No se pudo crear el reembolso.", success: null };
  }
  return {
    error: null,
    success: `Reembolso de ${(result.amountMinor / 100).toFixed(2)} MXN enviado a Stripe.`,
  };
}

export async function retryFailedRefundAction(
  previousState: CancellationActionState,
  formData: FormData,
): Promise<CancellationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/orders");
  const refundId = String(formData.get("refundId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const result = await retryFailedRefund({
    failedRefundId: refundId,
    adminId: admin.id,
    adminRole: admin.role,
  });
  revalidateAdminFinance(orderId);
  if (!result.ok) {
    return { error: "No se pudo reintentar el reembolso.", success: null };
  }
  return { error: null, success: "Se creó un nuevo intento de reembolso." };
}
