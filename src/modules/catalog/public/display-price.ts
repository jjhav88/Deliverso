import type { AppLocale } from "@/config/i18n";
import type { CurrencyCode } from "@/config/currency";
import { catalogPricePrefix } from "@/modules/catalog/public/format-price";
import type { CatalogProductCard } from "@/modules/catalog/public/types";
import { getQuoteFromSet, type ExchangeRateSet } from "@/server/exchange-rates/rate-set";
import { toDisplayMoney } from "@/lib/money/to-display";
import type { DisplayMoney } from "@/lib/money/display";

export function catalogProductDisplayPrice(
  product: Pick<CatalogProductCard, "price" | "priceKind">,
  locale: AppLocale,
  displayCurrency: CurrencyCode,
  rateSet: ExchangeRateSet,
): DisplayMoney | null {
  if (!product.price || product.priceKind === "quote") {
    return null;
  }

  return toDisplayMoney({
    amount: product.price,
    locale,
    displayCurrency,
    rate: getQuoteFromSet(rateSet, displayCurrency),
  });
}

export function formatCatalogDisplayPrice(
  product: Pick<CatalogProductCard, "priceKind">,
  display: DisplayMoney | null,
  locale: AppLocale,
): string | null {
  if (!display) {
    return null;
  }
  const prefix = catalogPricePrefix(product.priceKind, locale);
  return prefix ? `${prefix} ${display.formatted}` : display.formatted;
}
