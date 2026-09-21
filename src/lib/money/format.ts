import {
  getCurrencyMinorUnits,
  type CurrencyCode,
} from "@/config/currency";
import type { AppLocale } from "@/config/i18n";
import type { MoneyAmount } from "@/lib/money/types";

function assertIntegerMinorUnits(amountMinor: number): void {
  if (!Number.isInteger(amountMinor)) {
    throw new Error("MoneyAmount.amountMinor must be an integer.");
  }
}

/**
 * Convierte unidades menores a unidades mayores solo para Intl.NumberFormat.
 * El valor persistido permanece en enteros.
 */
export function minorUnitsToMajor(
  amountMinor: number,
  currency: CurrencyCode,
): number {
  assertIntegerMinorUnits(amountMinor);
  const scale = 10 ** getCurrencyMinorUnits(currency);
  return amountMinor / scale;
}

export function formatMoney(
  amount: MoneyAmount,
  locale: AppLocale,
): string {
  assertIntegerMinorUnits(amount.amountMinor);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: amount.currency,
  }).format(minorUnitsToMajor(amount.amountMinor, amount.currency));
}

export function formatMoneyFromMinorUnits(
  amountMinor: number,
  currency: CurrencyCode,
  locale: AppLocale,
): string {
  return formatMoney({ amountMinor, currency }, locale);
}
