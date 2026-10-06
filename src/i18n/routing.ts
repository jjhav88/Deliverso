import { defineRouting } from "next-intl/routing";
import { defaultLocale, localePathPrefixes, supportedLocales } from "@/config/i18n";
import { appPathnames } from "@/config/navigation";

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localeDetection: false,
  // Middleware cannot know whether a dynamic Product/Universe has a real EN
  // translation, so it must not emit HTTP Link hreflang. Metadata API is
  // the hreflang authority (HTML + sitemap).
  alternateLinks: false,
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      "en-US": `/${localePathPrefixes["en-US"]}`,
    },
  },
  pathnames: appPathnames,
});
