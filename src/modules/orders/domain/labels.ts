import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";
import type { PaymentStatus } from "@/modules/orders/domain/payment-status";

export function orderStatusLabel(status: OrderStatus | string, locale = "es-MX"): string {
  const en = locale === "en-US";
  switch (status) {
    case "PENDING_PAYMENT":
      return en ? "Pending payment" : "Pago pendiente";
    case "PAID":
      return en ? "Paid" : "Pagado";
    case "CANCELLED":
      return en ? "Canceled" : "Cancelado";
    case "EXPIRED":
      return en ? "Expired" : "Expirado";
    default:
      return status;
  }
}

export function paymentStatusLabel(status: PaymentStatus | string, locale = "es-MX"): string {
  const en = locale === "en-US";
  switch (status) {
    case "SUCCEEDED":
      return en ? "Confirmed" : "Confirmado";
    case "PROCESSING":
      return en ? "Processing" : "En proceso";
    case "CANCELED":
      return en ? "Canceled" : "Cancelado";
    case "FAILED":
      return en ? "Not completed" : "No se completó";
    case "REQUIRES_PAYMENT_METHOD":
    case "REQUIRES_CONFIRMATION":
    case "REQUIRES_ACTION":
      return en ? "Pending" : "Pendiente";
    default:
      return en ? "Pending" : "Pendiente";
  }
}

export function fulfillmentStatusLabel(
  status: FulfillmentStatus | string,
  locale = "es-MX",
): string {
  const en = locale === "en-US";
  switch (status) {
    case "PENDING":
      return en ? "Pending" : "Pendiente";
    case "CONFIRMED":
      return en ? "Confirmed" : "Confirmado";
    case "IN_PRODUCTION":
      return en ? "In production" : "En producción";
    case "READY":
      return en ? "Ready" : "Listo";
    case "OUT_FOR_DELIVERY":
      return en ? "Out for delivery" : "En camino";
    case "COMPLETED":
      return en ? "Completed" : "Completado";
    case "CANCELLED":
      return en ? "Canceled" : "Cancelado";
    default:
      return status;
  }
}

export function customerOrderLifecycleLabel(input: {
  status: string;
  fulfillmentStatus: string;
  locale?: string;
}): string {
  const locale = input.locale ?? "es-MX";
  if (input.status === "CANCELLED" || input.fulfillmentStatus === "CANCELLED") {
    return orderStatusLabel("CANCELLED", locale);
  }
  if (input.status === "PENDING_PAYMENT") {
    return orderStatusLabel("PENDING_PAYMENT", locale);
  }
  if (input.status === "EXPIRED") {
    return orderStatusLabel("EXPIRED", locale);
  }
  return fulfillmentStatusLabel(input.fulfillmentStatus, locale);
}
