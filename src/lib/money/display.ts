import type { CurrencyCode } from "@/config/currency";
import type { MoneyAmount } from "@/lib/money/types";

export type DisplayMoney = {
  amountMinor: number;
  currency: CurrencyCode;
  formatted: string;
  originalAmountMinor: number;
  originalCurrency: CurrencyCode;
  rate: string | null;
  sourceDate: string | null;
  fetchedAt: string | null;
  provider: string | null;
  stale: boolean;
  unavailable: boolean;
};

export type DisplayRate = {
  quoteCurrency: CurrencyCode;
  rate: string;
  sourceDate: string;
  fetchedAt: Date;
  provider: string;
  source: string;
  stale: boolean;
};

export function identityDisplayMoney(
  amount: MoneyAmount,
  formatted: string,
): DisplayMoney {
  return {
    amountMinor: amount.amountMinor,
    currency: amount.currency,
    formatted,
    originalAmountMinor: amount.amountMinor,
    originalCurrency: amount.currency,
    rate: amount.currency === "MXN" ? "1" : null,
    sourceDate: null,
    fetchedAt: null,
    provider: null,
    stale: false,
    unavailable: false,
  };
}
