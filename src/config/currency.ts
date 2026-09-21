export const currencyCookie = {
  name: "deliverso_currency",
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax",
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
} as const;

export const baseCurrency = "MXN" as const;

export const supportedCurrencies = ["MXN", "USD", "EUR", "CAD", "GBP"] as const;

export type CurrencyCode = (typeof supportedCurrencies)[number];

export type CurrencyRole = "display" | "payment";

/**
 * Moneda usada para mostrar precios convertidos al usuario.
 * No implica que el cobro se realice en esa moneda.
 */
export type DisplayCurrency = CurrencyCode;

/**
 * Moneda con la que se presentará el cobro.
 * Stripe determinará más adelante el conjunto realmente cobrable.
 * MXN siempre es una moneda de pago válida en esta arquitectura.
 */
export type PaymentCurrency = CurrencyCode;

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return (supportedCurrencies as readonly string[]).includes(value);
}

/**
 * Dígitos fraccionarios oficiales (unidades menores) por moneda.
 * Añadir una moneda nueva requiere registrar este valor aquí.
 */
export const currencyMinorUnits = {
  MXN: 2,
  USD: 2,
  EUR: 2,
  CAD: 2,
  GBP: 2,
} as const satisfies Record<CurrencyCode, number>;

export function getCurrencyMinorUnits(currency: CurrencyCode): number {
  return currencyMinorUnits[currency];
}

/** Alias documentado para conversión FX. */
export function getCurrencyMinorUnit(currency: CurrencyCode): number {
  return getCurrencyMinorUnits(currency);
}

/**
 * MXN es la única moneda de pago garantizada hasta que Stripe
 * confirme el resto. El resto puede usarse como display currency.
 */
export function isGuaranteedPaymentCurrency(
  currency: CurrencyCode,
): currency is typeof baseCurrency {
  return currency === baseCurrency;
}
