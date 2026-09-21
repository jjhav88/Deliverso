export const defaultLocale = "es-MX" as const;

export const supportedLocales = ["es-MX", "en-US"] as const;

export type AppLocale = (typeof supportedLocales)[number];

/**
 * Prefijos visibles en la URL. El locale predeterminado no usa prefijo
 * (`localePrefix: as-needed`). Añadir un idioma nuevo implica registrar
 * aquí su código BCP 47 y su prefijo corto.
 */
export const localePathPrefixes = {
  "es-MX": "",
  "en-US": "en",
} as const satisfies Record<AppLocale, string>;

export function isAppLocale(value: string): value is AppLocale {
  return (supportedLocales as readonly string[]).includes(value);
}
