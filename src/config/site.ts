import { brandConfig } from "@/config/brand";
import { baseCurrency } from "@/config/currency";
import { defaultLocale } from "@/config/i18n";

export const siteConfig = {
  name: brandConfig.name,
  taglineKey: brandConfig.taglineKey,
  defaultLocale,
  baseCurrency,
} as const;

/**
 * URL pública canónica. Nunca hardcodear el dominio en componentes.
 * Debe definirse en NEXT_PUBLIC_APP_URL cuando exista un entorno desplegado.
 */
export function getPublicAppUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    return undefined;
  }

  return value.replace(/\/$/, "");
}

/** Localhost only outside production. Production must set NEXT_PUBLIC_APP_URL. */
export function getDevFallbackAppUrl(): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }
  return "http://localhost:3010";
}

export function resolvePublicAppUrl(): string | undefined {
  return getPublicAppUrl() ?? getDevFallbackAppUrl();
}
