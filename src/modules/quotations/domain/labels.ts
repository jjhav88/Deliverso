import type { QuotationStatus } from "@/modules/quotations/domain/types";

const es: Record<QuotationStatus, string> = {
  SUBMITTED: "Recibida",
  IN_REVIEW: "En revisión",
  NEEDS_INFO: "Información requerida",
  QUOTED: "Cotizada",
  ACCEPTED: "Aceptada",
  DECLINED: "Rechazada",
  EXPIRED: "Expirada",
  CANCELED: "Cancelada",
  CONVERTED: "Convertida",
};

const en: Record<QuotationStatus, string> = {
  SUBMITTED: "Received",
  IN_REVIEW: "In review",
  NEEDS_INFO: "More information needed",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELED: "Canceled",
  CONVERTED: "Converted",
};

export function quotationStatusLabel(status: QuotationStatus, locale = "es-MX"): string {
  return locale === "en-US" ? en[status] : es[status];
}
