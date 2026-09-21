import { baseCurrency, type DisplayCurrency } from "@/config/currency";
import { defaultLocale, type AppLocale } from "@/config/i18n";

export const preferenceDefaults = {
  locale: defaultLocale,
  displayCurrency: baseCurrency,
} as const;

/**
 * Orden de resolución previsto para idioma y moneda.
 * No se usa geolocalización para decidir la moneda.
 */
export const preferenceResolutionOrder = [
  "explicit",
  "authenticatedUser",
  "context",
  "default",
] as const;

export type PreferenceSource = (typeof preferenceResolutionOrder)[number];

export type LocalePreference = AppLocale;

export type CurrencyPreference = {
  displayCurrency: DisplayCurrency;
};

export type UserPreferences = {
  locale: LocalePreference;
  currency: CurrencyPreference;
};
