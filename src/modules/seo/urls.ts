import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/config/i18n";
import { buildCanonicalUrl, withXDefault } from "@/modules/seo/canonical";

export {
  absoluteUrl,
  brandPageTitle,
  buildCanonicalUrl,
  catalogLanguages,
  openGraphLocale,
  privatePageMetadata,
  publicPageMetadata,
  withXDefault,
} from "@/modules/seo/canonical";

type LocalizedHref = Parameters<typeof getPathname>[0]["href"];

export function localizedPath(locale: AppLocale, href: LocalizedHref): string {
  return getPathname({ locale, href });
}

export function buildLocaleAlternates(
  href: LocalizedHref,
  locales: readonly AppLocale[] = ["es-MX", "en-US"],
  origin?: string,
): Record<string, string> | undefined {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const url = buildCanonicalUrl(localizedPath(locale, href), origin);
    if (url) {
      languages[locale] = url;
    }
  }
  const withDefault = withXDefault(languages);
  return Object.keys(withDefault).length > 0 ? withDefault : undefined;
}
