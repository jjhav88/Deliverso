import { getPathname } from "@/i18n/navigation";
import { getPublicAppUrl } from "@/config/site";
import type { AppLocale } from "@/config/i18n";

type LocalizedHref = Parameters<typeof getPathname>[0]["href"];

export function localizedPath(locale: AppLocale, href: LocalizedHref): string {
  return getPathname({ locale, href });
}

export function absoluteUrl(pathname: string): string | undefined {
  const base = getPublicAppUrl();
  if (!base) {
    return undefined;
  }

  return `${base}${pathname}`;
}

export function catalogLanguages(
  locales: readonly { locale: AppLocale; path: string }[],
): Record<string, string> | undefined {
  const languages: Record<string, string> = {};
  for (const item of locales) {
    const url = absoluteUrl(item.path);
    if (url) {
      languages[item.locale] = url;
    }
  }
  return Object.keys(languages).length > 0 ? languages : undefined;
}
