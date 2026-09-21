import type { CurrencyCode } from "@/config/currency";
import type { AppLocale } from "@/config/i18n";

export function getCurrencyDisplayName(
  locale: AppLocale,
  code: CurrencyCode,
): string {
  return new Intl.DisplayNames(locale, { type: "currency" }).of(code) ?? code;
}
