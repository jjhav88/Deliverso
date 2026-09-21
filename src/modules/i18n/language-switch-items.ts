import "server-only";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/config/i18n";
import { supportedLocales } from "@/config/i18n";
import { localeSwitchHref, parsePublicPathname } from "@/modules/i18n/locale-switch";
import {
  findActiveUniverseSlugs,
  findPublishedProductSlugs,
} from "@/modules/i18n/resolve-locale-switch";
import type { LanguageSwitchItem } from "@/modules/i18n/language-switch-types";

export type { LanguageSwitchItem };

export async function getLanguageSwitchItems(): Promise<LanguageSwitchItem[]> {
  const currentLocale = (await getLocale()) as AppLocale;
  const pathnameHeader = (await headers()).get("x-deliverso-pathname") ?? "";
  const parsed = parsePublicPathname(pathnameHeader);

  let available = new Set<AppLocale>(supportedLocales);
  if (parsed.kind === "product" && parsed.slug) {
    const slugs = await findPublishedProductSlugs(parsed.slug);
    available = new Set(slugs.map((item) => item.locale));
    available.add(currentLocale);
  }
  if (parsed.kind === "universe" && parsed.slug) {
    const slugs = await findActiveUniverseSlugs(parsed.slug);
    available = new Set(slugs.map((item) => item.locale));
    available.add(currentLocale);
  }

  return supportedLocales.map((locale) => ({
    locale,
    disabled: !available.has(locale),
    href: localeSwitchHref({
      to: locale,
      pathname: parsed.pathname,
      slug: parsed.slug,
    }),
  }));
}
