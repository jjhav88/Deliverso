import { getCurrencyMinorUnits } from "@/config/currency";

const MXN_MINORS = getCurrencyMinorUnits("MXN");

export function moneyInputToMinor(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) {
    throw new Error("Precio inválido.");
  }

  const normalized = trimmed.replace(",", ".");
  const [whole, fraction = ""] = normalized.split(".");
  const padded = fraction.padEnd(MXN_MINORS, "0");
  return Number.parseInt(whole, 10) * 10 ** MXN_MINORS + Number.parseInt(padded || "0", 10);
}

export function minorToMoneyInput(amountMinor: number | null | undefined): string {
  if (amountMinor === null || amountMinor === undefined) {
    return "";
  }

  const divisor = 10 ** MXN_MINORS;
  const whole = Math.trunc(amountMinor / divisor);
  const fraction = Math.abs(amountMinor % divisor)
    .toString()
    .padStart(MXN_MINORS, "0");
  return `${whole}.${fraction}`;
}
