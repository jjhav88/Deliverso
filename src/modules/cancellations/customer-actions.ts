"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getPrisma } from "@/server/db/prisma";
import { canAccessCustomerOrder } from "@/modules/orders/domain/ownership";
import {
  canCustomerRequestCancellation,
  canCustomerWithdrawCancellation,
  hasActiveCancellationRequest,
} from "@/modules/cancellations/domain/eligibility";
import { isRefundReason } from "@/modules/cancellations/domain/types";
import { queueCancellationRequestedEmail } from "@/modules/cancellations/emails";
import {
  emptyCancellationActionState,
  type CancellationActionState,
} from "@/modules/cancellations/action-state";

function revalidateCustomerOrder(orderNumber: string) {
  revalidatePath("/cuenta");
  revalidatePath("/en/account");
  revalidatePath(`/cuenta/pedidos/${orderNumber}`);
  revalidatePath(`/en/account/orders/${orderNumber}`);
}

async function requireOwnedOrder(orderNumber: string) {
  const locale = await getLocale();
  const safe = isAppLocale(locale) ? locale : "es-MX";
  const customer = await requireCustomer(
    getPathname({
      locale: safe,
      href: { pathname: "/cuenta/pedidos/[orderNumber]", params: { orderNumber: orderNumber || "x" } },
    }),
  );
  const order = await getPrisma().order.findFirst({
    where: { orderNumber, customerId: customer.id },
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      customerEmail: true,
      customerName: true,
      locale: true,
    },
  });
  if (!order || !canAccessCustomerOrder({ orderCustomerId: order.customerId, customerId: customer.id })) {
    return { customer: null, order: null };
  }
  return { customer, order };
}

export async function requestOrderCancellation(
  previousState: CancellationActionState,
  formData: FormData,
): Promise<CancellationActionState> {
  void previousState;
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const reasonRaw = String(formData.get("reason") ?? "");
  const customerMessage = String(formData.get("customerMessage") ?? "").trim() || null;
  if (!isRefundReason(reasonRaw)) {
    return { error: "Selecciona un motivo válido.", success: null };
  }

  const { customer, order } = await requireOwnedOrder(orderNumber);
  if (!customer || !order) {
    return { error: "No encontramos este pedido.", success: null };
  }

  const prisma = getPrisma();
  const active = await prisma.cancellationRequest.findFirst({
    where: { orderId: order.id, status: { in: ["REQUESTED", "APPROVED"] } },
    select: { status: true },
  });
  const eligibility = canCustomerRequestCancellation({
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    hasActiveRequest: hasActiveCancellationRequest(active?.status),
  });
  if (!eligibility.ok) {
    return {
      error:
        eligibility.reason === "ineligible_fulfillment"
          ? "Este pedido ya está en producción. Contáctanos si necesitas ayuda."
          : "No puedes solicitar la cancelación de este pedido.",
      success: null,
    };
  }

  await prisma.$transaction(async (tx) => {
    const request = await tx.cancellationRequest.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        status: "REQUESTED",
        reason: reasonRaw,
        customerMessage,
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "CANCELLATION_REQUESTED",
        metadata: { requestId: request.id, reason: reasonRaw },
      },
    });
    await queueCancellationRequestedEmail(order, request.id, tx);
  });

  revalidateCustomerOrder(order.orderNumber);
  return { error: null, success: "Solicitud de cancelación enviada." };
}

export async function withdrawCancellationRequest(
  previousState: CancellationActionState,
  formData: FormData,
): Promise<CancellationActionState> {
  void previousState;
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const { customer, order } = await requireOwnedOrder(orderNumber);
  if (!customer || !order) {
    return { error: "No encontramos este pedido.", success: null };
  }

  const prisma = getPrisma();
  const request = await prisma.cancellationRequest.findFirst({
    where: { id: requestId, orderId: order.id, customerId: customer.id },
  });
  if (!request || !canCustomerWithdrawCancellation(request.status)) {
    return { error: "Ya no puedes retirar esta solicitud.", success: null };
  }

  await prisma.cancellationRequest.update({
    where: { id: request.id },
    data: { status: "WITHDRAWN" },
  });
  revalidateCustomerOrder(order.orderNumber);
  return { ...emptyCancellationActionState, success: "Solicitud retirada." };
}
