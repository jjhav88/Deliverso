import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

const messageImports = {
  "es-MX": () => import("../../messages/es-MX.json"),
  "en-US": () => import("../../messages/en-US.json"),
} as const;

export default getRequestConfig(async ({ locale, requestLocale }) => {
  let resolvedLocale = locale;

  if (!resolvedLocale) {
    const requested = await requestLocale;
    resolvedLocale = hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;
  }

  if (!hasLocale(routing.locales, resolvedLocale)) {
    resolvedLocale = routing.defaultLocale;
  }

  const messages = (await messageImports[resolvedLocale]()).default;

  return {
    locale: resolvedLocale,
    messages,
  };
});
