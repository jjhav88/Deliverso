import { baseCurrency, isSupportedCurrency, type CurrencyCode } from "@/config/currency";

/**
 * Interpreta una preferencia de moneda proveniente de cookie u otra fuente no confiable.
 * Valores inválidos caen siempre a MXN.
 */
export function parseCurrencyPreference(
  value: string | undefined | null,
): CurrencyCode {
  if (!value) {
    return baseCurrency;
  }

  const normalized = value.trim().toUpperCase();

  if (isSupportedCurrency(normalized)) {
    return normalized;
  }

  return baseCurrency;
}
