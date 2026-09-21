import { baseCurrency, supportedCurrencies, type CurrencyCode } from "@/config/currency";
import type { DisplayRate } from "@/lib/money/display";
import { FRANKFURTER_SOURCE } from "@/server/exchange-rates/provider";

export type ExchangeRateSet = {
  baseCurrency: typeof baseCurrency;
  rates: Partial<Record<CurrencyCode, DisplayRate>>;
  fetchedAt: Date | null;
  sourceDate: string | null;
  provider: string | null;
  stale: boolean;
  unavailable: boolean;
};

export function createIdentityRateSet(): ExchangeRateSet {
  return {
    baseCurrency,
    rates: {},
    fetchedAt: null,
    sourceDate: null,
    provider: null,
    stale: false,
    unavailable: false,
  };
}

export function getQuoteFromSet(
  set: ExchangeRateSet,
  quote: CurrencyCode,
): DisplayRate | null {
  if (quote === baseCurrency) {
    return {
      quoteCurrency: baseCurrency,
      rate: "1",
      sourceDate: set.sourceDate ?? "",
      fetchedAt: set.fetchedAt ?? new Date(0),
      provider: set.provider ?? "identity",
      source: FRANKFURTER_SOURCE,
      stale: false,
    };
  }
  return set.rates[quote] ?? null;
}

export function snapshotRowsToRateSet(
  rows: Array<{
    quoteCurrency: string;
    rate: { toString(): string };
    sourceDate: Date;
    fetchedAt: Date;
    provider: string;
    source: string;
  }>,
  stale: boolean,
): ExchangeRateSet {
  const rates: ExchangeRateSet["rates"] = {};
  for (const row of rows) {
    if (!(supportedCurrencies as readonly string[]).includes(row.quoteCurrency)) {
      continue;
    }
    const quote = row.quoteCurrency as CurrencyCode;
    rates[quote] = {
      quoteCurrency: quote,
      rate: row.rate.toString(),
      sourceDate: row.sourceDate.toISOString().slice(0, 10),
      fetchedAt: row.fetchedAt,
      provider: row.provider,
      source: row.source,
      stale,
    };
  }

  const first = rows[0];
  return {
    baseCurrency,
    rates,
    fetchedAt: first?.fetchedAt ?? null,
    sourceDate: first ? first.sourceDate.toISOString().slice(0, 10) : null,
    provider: first?.provider ?? null,
    stale,
    unavailable: Object.keys(rates).length === 0,
  };
}
