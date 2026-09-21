import { defineRouting } from "next-intl/routing";
import { defaultLocale, localePathPrefixes, supportedLocales } from "@/config/i18n";
import { appPathnames } from "@/config/navigation";

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localeDetection: false,
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      "en-US": `/${localePathPrefixes["en-US"]}`,
    },
  },
  pathnames: appPathnames,
});
