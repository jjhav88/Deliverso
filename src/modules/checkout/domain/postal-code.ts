import {
  isSupportedDeliveryCountry,
  type DeliveryCountryCode,
} from "@/config/fulfillment";

/**
 * CP mexicano como string. Nunca Number/parseInt.
 * Conserva ceros iniciales: "06600" !== "6600".
 */
export function normalizeMexicanPostalCode(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const digits = raw.trim().replace(/\D/g, "");
  if (digits.length !== 5) {
    return null;
  }
  return digits;
}

export function normalizePostalCode(countryCode: string, raw: string): string {
  if (countryCode === "MX") {
    return normalizeMexicanPostalCode(raw) ?? "";
  }
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

export function isValidPostalCode(countryCode: string, postalCode: string): boolean {
  if (!isSupportedDeliveryCountry(countryCode)) {
    return false;
  }
  if (countryCode === "MX") {
    return normalizeMexicanPostalCode(postalCode) !== null;
  }
  return postalCode.length > 0;
}

export function parsePostalCodeList(raw: string, countryCode: DeliveryCountryCode = "MX"): string[] {
  return parsePostalCodeListDetailed(raw, countryCode).codes;
}

export function parsePostalCodeListDetailed(
  raw: string,
  countryCode: DeliveryCountryCode = "MX",
): { codes: string[]; invalid: string[] } {
  const seen = new Set<string>();
  const codes: string[] = [];
  const invalid: string[] = [];
  for (const part of raw.split(/[\s,;]+/)) {
    const token = part.trim();
    if (!token) {
      continue;
    }
    const normalized =
      countryCode === "MX" ? normalizeMexicanPostalCode(token) : normalizePostalCode(countryCode, token);
    if (!normalized || !isValidPostalCode(countryCode, normalized)) {
      invalid.push(token);
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    codes.push(normalized);
  }
  return { codes, invalid };
}

export type DeliveryZoneLike = {
  id: string;
  isActive: boolean;
  deliveryFeeMinor: number;
  minimumOrderMinor: number | null;
};

export type DeliveryZoneLookup<T extends DeliveryZoneLike> =
  | { status: "invalid" }
  | { status: "missing" }
  | { status: "inactive"; zone: T }
  | { status: "found"; zone: T };

export function lookupDeliveryZone<T extends DeliveryZoneLike>(input: {
  countryCode: string;
  postalCode: string;
  mapping: ReadonlyMap<string, T>;
}): DeliveryZoneLookup<T> {
  if (!isSupportedDeliveryCountry(input.countryCode)) {
    return { status: "invalid" };
  }
  const normalized = normalizePostalCode(input.countryCode, input.postalCode);
  if (!normalized || !isValidPostalCode(input.countryCode, normalized)) {
    return { status: "invalid" };
  }
  const zone = input.mapping.get(`${input.countryCode}:${normalized}`);
  if (!zone) {
    return { status: "missing" };
  }
  if (!zone.isActive) {
    return { status: "inactive", zone };
  }
  return { status: "found", zone };
}

export function resolveDeliveryZone<T extends DeliveryZoneLike>(input: {
  countryCode: string;
  postalCode: string;
  mapping: ReadonlyMap<string, T>;
}): T | null {
  const result = lookupDeliveryZone(input);
  return result.status === "found" ? result.zone : null;
}

export function buildPostalZoneMapping<T extends DeliveryZoneLike>(
  zones: ReadonlyArray<T & { postalCodes: ReadonlyArray<{ countryCode: string; postalCode: string }> }>,
): Map<string, T> {
  const mapping = new Map<string, T>();
  for (const zone of zones) {
    for (const code of zone.postalCodes) {
      const normalized = normalizePostalCode(code.countryCode, code.postalCode);
      if (!normalized) {
        continue;
      }
      mapping.set(`${code.countryCode}:${normalized}`, zone);
    }
  }
  return mapping;
}

export const unavailablePostalCodeMessage =
  "No tenemos entrega disponible en este código postal.";

export function minimumOrderMessage(formattedAmount: string): string {
  return `Esta zona requiere un pedido mínimo de ${formattedAmount}.`;
}
