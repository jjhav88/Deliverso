export const legalDocumentTypes = [
  "PRIVACY_NOTICE",
  "TERMS",
  "DELIVERY_POLICY",
  "REFUND_POLICY",
  "COOKIE_POLICY",
] as const;

export type LegalDocumentType = (typeof legalDocumentTypes)[number];

export const legalDocumentStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type LegalDocumentStatus = (typeof legalDocumentStatuses)[number];

export const privacyRequestTypes = [
  "ACCESS",
  "RECTIFICATION",
  "CANCELLATION",
  "OPPOSITION",
  "OTHER",
] as const;
export type PrivacyRequestType = (typeof privacyRequestTypes)[number];

export const privacyRequestStatuses = [
  "RECEIVED",
  "IN_REVIEW",
  "RESOLVED",
  "REJECTED",
] as const;
export type PrivacyRequestStatus = (typeof privacyRequestStatuses)[number];

export const LEGAL_PRIMARY_LOCALE = "es-MX";
export const LEGAL_INITIAL_VERSION = "1.0";
export const COMMERCIAL_NAME = "DELIVERSO";

export const legalDocumentPublicPath = {
  PRIVACY_NOTICE: "/aviso-de-privacidad",
  TERMS: "/terminos",
  DELIVERY_POLICY: "/entregas-y-recogidas",
  REFUND_POLICY: "/cancelaciones-y-reembolsos",
  COOKIE_POLICY: "/cookies",
} as const;

export const legalDocumentLabels: Record<LegalDocumentType, string> = {
  PRIVACY_NOTICE: "Aviso de Privacidad",
  TERMS: "Términos y Condiciones",
  DELIVERY_POLICY: "Entregas y recogidas",
  REFUND_POLICY: "Cancelaciones y reembolsos",
  COOKIE_POLICY: "Cookies",
};

export const privacyRequestTypeLabels: Record<PrivacyRequestType, string> = {
  ACCESS: "Acceso",
  RECTIFICATION: "Rectificación",
  CANCELLATION: "Cancelación",
  OPPOSITION: "Oposición",
  OTHER: "Otro",
};

export const privacyRequestStatusLabels: Record<PrivacyRequestStatus, string> = {
  RECEIVED: "Recibida",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelta",
  REJECTED: "Rechazada",
};

export type LegalIdentity = {
  commercialName: string;
  legalEntityName: string | null;
  rfc: string | null;
  legalAddress: string | null;
  legalPhone: string | null;
  contactEmail: string | null;
  privacyEmail: string | null;
  legalCountry: string;
};

export const legalRequiredFields = [
  "legalEntityName",
  "rfc",
  "legalAddress",
  "legalPhone",
  "contactEmail",
  "privacyEmail",
] as const;

export type LegalRequiredField = (typeof legalRequiredFields)[number];

export type LegalReadiness =
  | { status: "READY"; missing: [] }
  | { status: "INCOMPLETE"; missing: LegalRequiredField[] };

export type OrderLegalSnapshot = {
  termsVersion: string;
  deliveryPolicyVersion: string;
  refundPolicyVersion: string;
};

export const TERMS_REQUIRED_MESSAGE =
  "Debes aceptar los Términos y Condiciones y las políticas aplicables para continuar.";

export function isLegalDocumentType(value: string): value is LegalDocumentType {
  return (legalDocumentTypes as readonly string[]).includes(value);
}

export function isPrivacyRequestType(value: string): value is PrivacyRequestType {
  return (privacyRequestTypes as readonly string[]).includes(value);
}

export function isPrivacyRequestStatus(value: string): value is PrivacyRequestStatus {
  return (privacyRequestStatuses as readonly string[]).includes(value);
}

export function isPublicLegalDocument(status: string): boolean {
  return status === "PUBLISHED";
}
