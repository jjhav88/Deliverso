import type { AppLocale } from "@/config/i18n";
import type { CurrencyCode } from "@/config/currency";
import type { MoneyAmount } from "@/lib/money";
import { formatMoney } from "@/lib/money";
import type { CatalogPriceKind } from "@/modules/catalog/public/types";

export function formatCatalogMoney(
  price: MoneyAmount,
  locale: AppLocale,
  displayCurrency: CurrencyCode,
): string {
  const formatted = formatMoney(
    { amountMinor: price.amountMinor, currency: "MXN" },
    locale,
  );

  if (displayCurrency !== "MXN" && !/\bMXN\b/i.test(formatted)) {
    return `${formatted} MXN`;
  }

  return formatted;
}

export function catalogPricePrefix(
  kind: CatalogPriceKind,
  locale: AppLocale,
): string | null {
  if (kind !== "from") {
    return null;
  }

  return locale === "en-US" ? "From" : "Desde";
}
