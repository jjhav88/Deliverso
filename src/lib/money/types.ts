import type { CurrencyCode } from "@/config/currency";

/**
 * Importe de negocio en unidades menores enteras.
 * $450.00 MXN se representa como { amountMinor: 45000, currency: "MXN" }.
 * Nunca usar un decimal flotante como fuente de verdad persistida.
 */
export type MoneyAmount = {
  amountMinor: number;
  currency: CurrencyCode;
};
