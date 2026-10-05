import type { Metadata } from "next";
import { defaultLocale, type AppLocale } from "@/config/i18n";
import { seoRobots, canonicalOrigin } from "@/modules/seo/env";

export function buildCanonicalUrl(pathname: string, origin?: string): string | undefined {
  const resolved = origin ?? canonicalOrigin();
  if (!resolved) {
    return undefined;
  }
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }
  return `${resolved}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function absoluteUrl(pathname: string): string | undefined {
  return buildCanonicalUrl(pathname);
}

export function withXDefault(
  languages: Record<string, string>,
): Record<string, string> {
  const fallback = languages[defaultLocale] ?? Object.values(languages)[0];
  if (!fallback) {
    return languages;
  }
  return { ...languages, "x-default": fallback };
}

export function catalogLanguages(
  locales: readonly { locale: AppLocale; path: string }[],
  origin?: string,
): Record<string, string> | undefined {
  const languages: Record<string, string> = {};
  for (const item of locales) {
    const url = buildCanonicalUrl(item.path, origin);
    if (url) {
      languages[item.locale] = url;
    }
  }
  const withDefault = withXDefault(languages);
  return Object.keys(withDefault).length > 0 ? withDefault : undefined;
}

export function openGraphLocale(locale: AppLocale): string {
  return locale === "en-US" ? "en_US" : "es_MX";
}

export function brandPageTitle(title: string): string {
  return title.replace(/\s*\|\s*DELIVERSO\s*$/i, "").trim();
}

export function publicPageMetadata(input: {
  title: string;
  description: string;
  pathname: string;
  locale: AppLocale;
  languages?: Record<string, string>;
  index?: boolean;
  images?: Array<{ url: string; alt?: string }>;
  origin?: string;
}): Metadata {
  const canonical = buildCanonicalUrl(input.pathname, input.origin) ?? input.pathname;
  const indexable = input.index ?? true;
  const ogImage = input.images?.[0];
  const defaultImage = buildCanonicalUrl("/brand/logos/deliverso-logo-color.png", input.origin);

  return {
    title: brandPageTitle(input.title),
    description: input.description,
    robots: seoRobots(indexable),
    alternates: {
      canonical,
      languages: input.languages,
    },
    openGraph: {
      type: "website",
      siteName: "DELIVERSO",
      locale: openGraphLocale(input.locale),
      url: canonical,
      title: brandPageTitle(input.title),
      description: input.description,
      images: ogImage
        ? [{ url: ogImage.url, alt: ogImage.alt ?? "DELIVERSO" }]
        : defaultImage
          ? [{ url: defaultImage, alt: "DELIVERSO" }]
          : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: brandPageTitle(input.title),
      description: input.description,
      images: ogImage
        ? [ogImage.url]
        : defaultImage
          ? [defaultImage]
          : undefined,
    },
  };
}

export function privatePageMetadata(input: {
  title: string;
  pathname?: string;
  origin?: string;
}): Metadata {
  const canonical = input.pathname
    ? (buildCanonicalUrl(input.pathname, input.origin) ?? input.pathname)
    : undefined;

  return {
    title: brandPageTitle(input.title),
    robots: seoRobots(false),
    ...(canonical ? { alternates: { canonical } } : {}),
  };
}
