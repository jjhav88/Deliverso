import { COMMERCIAL_NAME, type LegalIdentity } from "@/modules/legal/domain/types";

const PENDING = "pendiente de publicación";

export function legalIdentityReplacements(identity: LegalIdentity): Record<string, string> {
  return {
    commercialName: COMMERCIAL_NAME,
    legalEntityName: identity.legalEntityName?.trim() || PENDING,
    rfc: identity.rfc?.trim() || PENDING,
    legalAddress: identity.legalAddress?.trim() || PENDING,
    legalPhone: identity.legalPhone?.trim() || PENDING,
    contactEmail: identity.contactEmail?.trim() || PENDING,
    privacyEmail: identity.privacyEmail?.trim() || PENDING,
    legalCountry: identity.legalCountry?.trim() || "México",
  };
}

export function interpolateLegalBody(body: string, identity: LegalIdentity): string {
  const values = legalIdentityReplacements(identity);
  return body.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}
