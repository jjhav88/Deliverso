import { formatMoney } from "@/lib/money/format";
import { convertMinorUnits } from "@/lib/money/convert";
import {
  identityDisplayMoney,
  type DisplayMoney,
  type DisplayRate,
} from "@/lib/money/display";
import type { MoneyAmount } from "@/lib/money/types";
import type { AppLocale } from "@/config/i18n";
import { baseCurrency, type CurrencyCode } from "@/config/currency";

export function toDisplayMoney(input: {
  amount: MoneyAmount;
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  rate: DisplayRate | null;
}): DisplayMoney {
  const original = identityDisplayMoney(
    input.amount,
    formatMoney(input.amount, input.locale),
  );

  if (input.displayCurrency === input.amount.currency) {
    return original;
  }

  if (!input.rate || input.rate.quoteCurrency !== input.displayCurrency) {
    return { ...original, unavailable: true };
  }

  try {
    const amountMinor = convertMinorUnits({
      amountMinor: input.amount.amountMinor,
      from: input.amount.currency,
      to: input.displayCurrency,
      rate: input.rate.rate,
    });
    const converted: MoneyAmount = {
      amountMinor,
      currency: input.displayCurrency,
    };

    return {
      amountMinor,
      currency: input.displayCurrency,
      formatted: formatMoney(converted, input.locale),
      originalAmountMinor: input.amount.amountMinor,
      originalCurrency: input.amount.currency,
      rate: input.rate.rate,
      sourceDate: input.rate.sourceDate || null,
      fetchedAt: input.rate.fetchedAt.toISOString(),
      provider: input.rate.provider,
      stale: input.rate.stale,
      unavailable: false,
    };
  } catch {
    return { ...original, unavailable: true };
  }
}

export function displayUsesConversion(money: DisplayMoney): boolean {
  return (
    money.currency !== money.originalCurrency &&
    money.originalCurrency === baseCurrency &&
    !money.unavailable
  );
}
