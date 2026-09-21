import type { AppLocale } from "@/config/i18n";
import { baseCurrency, type CurrencyCode } from "@/config/currency";
import { getQuoteFromSet, type ExchangeRateSet } from "@/server/exchange-rates/rate-set";

type CatalogRateBannerProps = {
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  rateSet: ExchangeRateSet;
  note: string;
  unavailable: string;
};

export function CatalogRateBanner({
  locale,
  displayCurrency,
  rateSet,
  note,
  unavailable,
}: CatalogRateBannerProps) {
  if (displayCurrency === baseCurrency) {
    return null;
  }

  const quote = getQuoteFromSet(rateSet, displayCurrency);
  if (!quote || rateSet.unavailable) {
    return <p className="type-caption mt-4 text-muted-foreground">{unavailable}</p>;
  }

  const date = quote.sourceDate
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${quote.sourceDate}T00:00:00Z`))
    : "";

  return (
    <p className="type-caption mt-4 text-muted-foreground">
      {note.replace("{date}", date)}
    </p>
  );
}
