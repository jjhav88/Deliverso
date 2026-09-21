import {
  preferenceDefaults,
  type CurrencyPreference,
  type LocalePreference,
  type UserPreferences,
} from "@/config/preferences";

export type PreferenceSources<T> = {
  explicit?: T;
  authenticatedUser?: T;
  context?: T;
};

/**
 * Resuelve una preferencia según el orden documentado:
 * 1. preferencia explícita guardada
 * 2. configuración del usuario autenticado
 * 3. contexto / localización
 * 4. valor predeterminado
 */
export function resolvePreference<T>(
  sources: PreferenceSources<T>,
  fallback: T,
): T {
  return (
    sources.explicit ??
    sources.authenticatedUser ??
    sources.context ??
    fallback
  );
}

export function resolveLocalePreference(
  sources: PreferenceSources<LocalePreference>,
): LocalePreference {
  return resolvePreference(sources, preferenceDefaults.locale);
}

export function resolveCurrencyPreference(
  sources: PreferenceSources<CurrencyPreference>,
): CurrencyPreference {
  return resolvePreference(sources, {
    displayCurrency: preferenceDefaults.displayCurrency,
  });
}

export function resolveUserPreferences(sources: {
  locale?: PreferenceSources<LocalePreference>;
  currency?: PreferenceSources<CurrencyPreference>;
}): UserPreferences {
  return {
    locale: resolveLocalePreference(sources.locale ?? {}),
    currency: resolveCurrencyPreference(sources.currency ?? {}),
  };
}
