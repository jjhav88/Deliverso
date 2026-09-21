import { isAppLocale, type AppLocale } from "@/config/i18n";

/**
 * Persistence stores locale as a free string.
 * Application code validates against supportedLocales.
 */
export function parsePersistableLocale(value: string): AppLocale {
  if (!isAppLocale(value)) {
    throw new Error(`Unsupported locale for persistence: ${value}`);
  }

  return value;
}
