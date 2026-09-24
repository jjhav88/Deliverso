import type { QuotationStatus } from "@/modules/quotations/domain/types";

const es: Record<QuotationStatus, string> = {
  SUBMITTED: "Recibida",
  IN_REVIEW: "En revisión",
  NEEDS_INFO: "Información requerida",
  QUOTED: "Cotización lista",
  ACCEPTED: "Aceptada",
  DECLINED: "Rechazada",
  EXPIRED: "Vencida",
  CANCELED: "Cancelada",
  CONVERTED: "Convertida en pedido",
};

const en: Record<QuotationStatus, string> = {
  SUBMITTED: "Received",
  IN_REVIEW: "In review",
  NEEDS_INFO: "More information needed",
  QUOTED: "Quote ready",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELED: "Canceled",
  CONVERTED: "Converted to order",
};

export function quotationStatusLabel(status: QuotationStatus, locale = "es-MX"): string {
  return locale === "en-US" ? en[status] : es[status];
}
