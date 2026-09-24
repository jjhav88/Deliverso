import type {
  CancellationRequestStatus,
  OrderFinancialStatus,
  RefundReason,
  RefundStatus,
} from "@/modules/cancellations/domain/types";

export function refundReasonLabel(reason: RefundReason, locale = "es-MX"): string {
  const en = locale === "en-US";
  switch (reason) {
    case "CUSTOMER_REQUEST":
      return en ? "Customer request" : "Solicitud del cliente";
    case "DUPLICATE":
      return en ? "Duplicate charge" : "Cargo duplicado";
    case "PRODUCT_UNAVAILABLE":
      return en ? "Product unavailable" : "Producto no disponible";
    case "FULFILLMENT_ISSUE":
      return en ? "Fulfillment issue" : "Problema de entrega";
    case "ORDER_ERROR":
      return en ? "Order error" : "Error en el pedido";
    case "QUALITY_ISSUE":
      return en ? "Quality issue" : "Problema de calidad";
    case "OTHER":
      return en ? "Other" : "Otro";
  }
}

export function cancellationStatusLabel(
  status: CancellationRequestStatus,
  locale = "es-MX",
): string {
  const en = locale === "en-US";
  switch (status) {
    case "REQUESTED":
      return en ? "Pending review" : "Pendiente de revisión";
    case "APPROVED":
      return en ? "Approved" : "Aprobada";
    case "REJECTED":
      return en ? "Rejected" : "Rechazada";
    case "WITHDRAWN":
      return en ? "Withdrawn" : "Retirada";
    case "COMPLETED":
      return en ? "Completed" : "Completada";
  }
}

export function refundStatusLabel(status: RefundStatus, locale = "es-MX"): string {
  const en = locale === "en-US";
  switch (status) {
    case "PENDING":
      return en ? "Pending" : "Pendiente";
    case "PROCESSING":
      return en ? "Processing" : "En proceso";
    case "SUCCEEDED":
      return en ? "Succeeded" : "Exitoso";
    case "FAILED":
      return en ? "Failed" : "Fallido";
    case "CANCELED":
      return en ? "Canceled" : "Cancelado";
  }
}

export function financialStatusLabel(status: OrderFinancialStatus, locale = "es-MX"): string {
  const en = locale === "en-US";
  switch (status) {
    case "UNPAID":
      return en ? "Unpaid" : "Sin pagar";
    case "PAID":
      return en ? "Paid" : "Pagado";
    case "PARTIALLY_REFUNDED":
      return en ? "Partially refunded" : "Reembolso parcial";
    case "REFUNDED":
      return en ? "Refunded" : "Reembolsado";
    case "CANCELED_UNPAID":
      return en ? "Canceled" : "Cancelado";
  }
}

export function cancellationEligibilityMessage(
  reason: "not_paid" | "already_canceled" | "ineligible_fulfillment" | "active_request",
  locale = "es-MX",
): string {
  const en = locale === "en-US";
  switch (reason) {
    case "not_paid":
      return en
        ? "This order is not eligible for a cancellation request."
        : "Este pedido no admite una solicitud de cancelación.";
    case "already_canceled":
      return en ? "This order is already canceled." : "Este pedido ya está cancelado.";
    case "active_request":
      return en
        ? "A cancellation request is already in review."
        : "Ya hay una solicitud de cancelación en revisión.";
    case "ineligible_fulfillment":
      return en
        ? "This order is already in production. Contact support if you need help."
        : "Este pedido ya está en producción. Contáctanos si necesitas ayuda.";
  }
}
