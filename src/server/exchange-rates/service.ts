import "server-only";
import { cache } from "react";
import { baseCurrency, type CurrencyCode } from "@/config/currency";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getPrisma } from "@/server/db/prisma";
import { FrankfurterExchangeRateProvider } from "@/server/exchange-rates/frankfurter";
import {
  FRANKFURTER_PROVIDER,
  FRANKFURTER_SOURCE,
  type BatchExchangeRateProvider,
} from "@/server/exchange-rates/provider";
import { classifyFxSnapshotSet, FX_FRESH_TTL_MS } from "@/server/exchange-rates/policy";
import {
  createIdentityRateSet,
  snapshotRowsToRateSet,
  type ExchangeRateSet,
} from "@/server/exchange-rates/rate-set";

export { FX_FRESH_TTL_MS, FX_STALE_TTL_MS } from "@/server/exchange-rates/policy";
export { createIdentityRateSet, getQuoteFromSet } from "@/server/exchange-rates/rate-set";
export type { ExchangeRateSet };

export const FX_QUOTE_CURRENCIES = ["USD", "EUR", "CAD", "GBP"] as const satisfies readonly CurrencyCode[];

const defaultProvider = new FrankfurterExchangeRateProvider();

export const getExchangeRateSet = cache(async (): Promise<ExchangeRateSet> => {
  return loadExchangeRateSet();
});

export async function loadExchangeRateSet(
  now = new Date(),
  provider: BatchExchangeRateProvider = defaultProvider,
): Promise<ExchangeRateSet> {
  if (!hasRuntimeDatabaseUrl()) {
    return createIdentityRateSet();
  }

  const stored = await loadLatestSnapshots();
  const freshness = classifyFxSnapshotSet(
    stored.map((row) => row.fetchedAt),
    now,
    FX_QUOTE_CURRENCIES.length,
  );
  if (freshness === "fresh") {
    return snapshotRowsToRateSet(stored, false);
  }

  try {
    const quotes = await provider.getQuotes({
      baseCurrency,
      quoteCurrencies: FX_QUOTE_CURRENCIES,
    });
    await persistQuotes(quotes, now);
    const refreshed = await loadLatestSnapshots();
    return snapshotRowsToRateSet(refreshed, false);
  } catch (error) {
    console.error("[fx] Provider unavailable; using snapshot fallback.", error);
    if (freshness === "stale") {
      return snapshotRowsToRateSet(stored, true);
    }
    return {
      ...createIdentityRateSet(),
      unavailable: true,
    };
  }
}

export async function refreshExchangeRates(
  provider: BatchExchangeRateProvider = defaultProvider,
  now = new Date(),
): Promise<ExchangeRateSet> {
  const quotes = await provider.getQuotes({
    baseCurrency,
    quoteCurrencies: FX_QUOTE_CURRENCIES,
  });
  await persistQuotes(quotes, now);
  return snapshotRowsToRateSet(await loadLatestSnapshots(), false);
}

async function loadLatestSnapshots() {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  return getPrisma().exchangeRateSnapshot.findMany({
    where: {
      baseCurrency,
      provider: FRANKFURTER_PROVIDER,
      quoteCurrency: { in: [...FX_QUOTE_CURRENCIES] },
    },
    distinct: ["quoteCurrency"],
    orderBy: [{ quoteCurrency: "asc" }, { fetchedAt: "desc" }],
  });
}

async function persistQuotes(
  quotes: Array<{
    quoteCurrency: CurrencyCode;
    rate: string;
    sourceDate: string;
    fetchedAt: Date;
    provider: string;
    source: string;
  }>,
  now: Date,
) {
  const prisma = getPrisma();
  const expiresAt = new Date(now.getTime() + FX_FRESH_TTL_MS);

  await prisma.$transaction(
    quotes.map((quote) =>
      prisma.exchangeRateSnapshot.upsert({
        where: {
          baseCurrency_quoteCurrency_provider_sourceDate: {
            baseCurrency,
            quoteCurrency: quote.quoteCurrency,
            provider: quote.provider,
            sourceDate: new Date(`${quote.sourceDate}T00:00:00.000Z`),
          },
        },
        update: {
          rate: quote.rate,
          source: quote.source,
          fetchedAt: quote.fetchedAt,
          expiresAt,
        },
        create: {
          baseCurrency,
          quoteCurrency: quote.quoteCurrency,
          rate: quote.rate,
          provider: quote.provider,
          source: quote.source || FRANKFURTER_SOURCE,
          sourceDate: new Date(`${quote.sourceDate}T00:00:00.000Z`),
          fetchedAt: quote.fetchedAt,
          expiresAt,
        },
      }),
    ),
  );
}

