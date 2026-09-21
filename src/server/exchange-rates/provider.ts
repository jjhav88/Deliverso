import type { CurrencyCode } from "@/config/currency";
import type { ExchangeRateProvider, ExchangeRateQuote } from "@/server/exchange-rates/types";

export const FRANKFURTER_PROVIDER = "FRANKFURTER_ECB" as const;
export const FRANKFURTER_SOURCE = "ECB" as const;

export type ExchangeRateBatchRequest = {
  baseCurrency: CurrencyCode;
  quoteCurrencies: readonly CurrencyCode[];
};

export type ExchangeRateBatchQuote = ExchangeRateQuote & {
  source: typeof FRANKFURTER_SOURCE | string;
  sourceDate: string;
};

export interface BatchExchangeRateProvider extends ExchangeRateProvider {
  getQuotes(request: ExchangeRateBatchRequest): Promise<ExchangeRateBatchQuote[]>;
}
