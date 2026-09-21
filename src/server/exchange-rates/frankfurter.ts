import { z } from "zod";
import { supportedCurrencies, type CurrencyCode } from "@/config/currency";
import type { BatchExchangeRateProvider, ExchangeRateBatchQuote } from "@/server/exchange-rates/provider";
import { FRANKFURTER_PROVIDER, FRANKFURTER_SOURCE } from "@/server/exchange-rates/provider";
import type { ExchangeRateQuote, ExchangeRateRequest } from "@/server/exchange-rates/types";

const frankfurterRateRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  base: z.string(),
  quote: z.string(),
  rate: z.number().positive(),
});

const frankfurterRatesSchema = z.array(frankfurterRateRowSchema).min(1);

const DEFAULT_API_BASE = "https://api.frankfurter.dev";
const TIMEOUT_MS = 5_000;

export class FrankfurterExchangeRateProvider implements BatchExchangeRateProvider {
  constructor(
    private readonly apiBase = process.env.EXCHANGE_RATE_API_BASE?.trim() ||
      DEFAULT_API_BASE,
  ) {}

  async getQuote(request: ExchangeRateRequest): Promise<ExchangeRateQuote> {
    const [quote] = await this.getQuotes({
      baseCurrency: request.baseCurrency,
      quoteCurrencies: [request.quoteCurrency],
    });
    if (!quote) {
      throw new Error("Frankfurter did not return the requested quote.");
    }
    return quote;
  }

  async getQuotes(input: {
    baseCurrency: CurrencyCode;
    quoteCurrencies: readonly CurrencyCode[];
  }): Promise<ExchangeRateBatchQuote[]> {
    const quotes = input.quoteCurrencies.filter((code) => code !== input.baseCurrency);
    if (quotes.length === 0) {
      return [];
    }

    const url = new URL("/v2/rates", this.apiBase.replace(/\/$/, ""));
    url.searchParams.set("base", input.baseCurrency);
    url.searchParams.set("quotes", quotes.join(","));
    url.searchParams.set("providers", "ecb");

    const raw = await this.fetchWithRetry(url);
    const parsed = frankfurterRatesSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error("Frankfurter response failed validation.");
    }

    const fetchedAt = new Date();
    return quotes.map((quoteCurrency) => {
      const row = parsed.data.find(
        (item) =>
          item.base === input.baseCurrency && item.quote === quoteCurrency,
      );
      const rate = extractRateString(raw, quoteCurrency);
      if (!row || !rate) {
        throw new Error(`Frankfurter omitted ${quoteCurrency}.`);
      }

      return {
        baseCurrency: input.baseCurrency,
        quoteCurrency,
        rate,
        fetchedAt,
        provider: FRANKFURTER_PROVIDER,
        source: FRANKFURTER_SOURCE,
        sourceDate: row.date,
      };
    });
  }

  private async fetchWithRetry(url: URL): Promise<string> {
    try {
      return await this.fetchOnce(url);
    } catch {
      return this.fetchOnce(url);
    }
  }

  private async fetchOnce(url: URL): Promise<string> {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Frankfurter HTTP ${response.status}`);
    }

    return response.text();
  }
}

export function extractRateString(rawJson: string, quote: CurrencyCode): string | null {
  const match = rawJson.match(
    new RegExp(
      `"quote"\\s*:\\s*"${quote}"\\s*,\\s*"rate"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)`,
    ),
  );
  if (match?.[1]) {
    return match[1];
  }

  return (
    rawJson.match(
      new RegExp(
        `"rate"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)\\s*,\\s*"quote"\\s*:\\s*"${quote}"`,
      ),
    )?.[1] ?? null
  );
}

export function isSupportedQuoteCurrency(value: string): value is CurrencyCode {
  return (supportedCurrencies as readonly string[]).includes(value);
}
