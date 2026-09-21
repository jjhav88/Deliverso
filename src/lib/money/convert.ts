import Decimal from "decimal.js";
import { getCurrencyMinorUnit } from "@/config/currency";
import type { CurrencyCode } from "@/config/currency";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export const CONVERSION_ROUNDING = "ROUND_HALF_UP" as const;

export function convertMinorUnits(input: {
  amountMinor: number;
  from: CurrencyCode;
  to: CurrencyCode;
  rate: string;
}): number {
  if (!Number.isInteger(input.amountMinor)) {
    throw new Error("amountMinor must be an integer.");
  }

  if (input.from === input.to) {
    return input.amountMinor;
  }

  const rate = new Decimal(input.rate);
  if (!rate.isFinite() || rate.lte(0)) {
    throw new Error("Exchange rate must be a positive decimal.");
  }

  const fromScale = new Decimal(10).pow(getCurrencyMinorUnit(input.from));
  const toScale = new Decimal(10).pow(getCurrencyMinorUnit(input.to));
  const major = new Decimal(input.amountMinor).div(fromScale);
  return major.mul(rate).mul(toScale).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}
