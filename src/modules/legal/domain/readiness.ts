import {
  legalRequiredFields,
  type LegalIdentity,
  type LegalReadiness,
  type LegalRequiredField,
} from "@/modules/legal/domain/types";

function filled(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function getLegalReadiness(identity: LegalIdentity): LegalReadiness {
  const missing = legalRequiredFields.filter((field) => !filled(identity[field]));
  if (missing.length === 0) {
    return { status: "READY", missing: [] };
  }
  return { status: "INCOMPLETE", missing: missing as LegalRequiredField[] };
}

export const legalFieldLabels: Record<LegalRequiredField, string> = {
  legalEntityName: "Nombre / razón social del responsable",
  rfc: "RFC",
  legalAddress: "Domicilio legal",
  legalPhone: "Teléfono",
  contactEmail: "Correo de contacto",
  privacyEmail: "Correo de privacidad / ARCO",
};
