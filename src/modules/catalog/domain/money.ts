import { baseCurrency } from "@/config/currency";

export function isMasterCurrency(code: string): boolean {
  return code === baseCurrency;
}

export function assertMasterCurrency(code: string): void {
  if (!isMasterCurrency(code)) {
    throw new Error(`Master prices must be persisted in ${baseCurrency}.`);
  }
}

/**
 * Null means no master price (CUSTOM_QUOTE).
 * Zero is a real amount, never a synonym for "unpriced".
 */
export function hasMasterPrice(
  priceMinor: number | null | undefined,
): priceMinor is number {
  return priceMinor !== null && priceMinor !== undefined;
}
