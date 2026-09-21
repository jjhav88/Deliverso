import "server-only";
import { baseCurrency } from "@/config/currency";
import { FX_QUOTE_CURRENCIES, loadExchangeRateSet } from "@/server/exchange-rates/service";
import { FRANKFURTER_SOURCE } from "@/server/exchange-rates/provider";
import type { ExchangeRateAdminStatus } from "@/modules/admin/components/exchange-rates-panel";

export async function getExchangeRateAdminStatus(): Promise<ExchangeRateAdminStatus> {
  const set = await loadExchangeRateSet();
  return {
    provider: set.provider ?? "FRANKFURTER_ECB",
    source: FRANKFURTER_SOURCE,
    baseCurrency,
    fetchedAt: set.fetchedAt?.toISOString() ?? null,
    sourceDate: set.sourceDate,
    stale: set.stale,
    rows: FX_QUOTE_CURRENCIES.map((quote) => ({
      quote,
      rate: set.rates[quote]?.rate ?? null,
    })),
  };
}
