import type { MetadataRoute } from "next";
import { supportedLocales, type AppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { headers } from "next/headers";
import { getSitemapCatalogEntries } from "@/modules/catalog/public/queries";
import { productDetailHref, universeDetailHref } from "@/modules/catalog/public/href";
import { isSeoIndexableRequest, productionPublicOrigin } from "@/modules/seo/env";
import { withXDefault } from "@/modules/seo/urls";
import { logError } from "@/server/logging/logger";

export const dynamic = "force-dynamic";

function urlFor(locale: AppLocale, href: Parameters<typeof getPathname>[0]["href"]): string | null {
  return `${productionPublicOrigin}${getPathname({ locale, href })}`;
}

function languagesFor(
  href: Parameters<typeof getPathname>[0]["href"],
  locales: readonly AppLocale[] = supportedLocales,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const url = urlFor(locale, href);
    if (url) {
      languages[locale] = url;
    }
  }
  return withXDefault(languages);
}

function pushStatic(
  entries: MetadataRoute.Sitemap,
  href: Parameters<typeof getPathname>[0]["href"],
) {
  const languages = languagesFor(href);
  for (const locale of supportedLocales) {
    const url = languages[locale];
    if (!url) {
      continue;
    }
    entries.push({
      url,
      alternates: { languages },
    });
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host");
  if (!isSeoIndexableRequest(host)) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  try {
    pushStatic(entries, "/");
    pushStatic(entries, "/productos");
    pushStatic(entries, "/universos");
    pushStatic(entries, "/nosotros");
    pushStatic(entries, "/contacto");

    const catalog = await getSitemapCatalogEntries();

    for (const product of catalog.products) {
      const languages: Record<string, string> = {};
      for (const translation of product.translations) {
        const url = urlFor(translation.locale, productDetailHref(translation.slug));
        if (url) {
          languages[translation.locale] = url;
        }
      }
      const withDefault = withXDefault(languages);
      for (const translation of product.translations) {
        const url = languages[translation.locale];
        if (!url) {
          continue;
        }
        entries.push({
          url,
          lastModified: product.updatedAt,
          alternates: { languages: withDefault },
        });
      }
    }

    for (const universe of catalog.universes) {
      const languages: Record<string, string> = {};
      for (const translation of universe.translations) {
        const url = urlFor(translation.locale, universeDetailHref(translation.slug));
        if (url) {
          languages[translation.locale] = url;
        }
      }
      const withDefault = withXDefault(languages);
      for (const translation of universe.translations) {
        const url = languages[translation.locale];
        if (!url) {
          continue;
        }
        entries.push({
          url,
          lastModified: universe.updatedAt,
          alternates: { languages: withDefault },
        });
      }
    }
  } catch (error) {
    logError({
      event: "SITEMAP_BUILD_FAILED",
      reason: error instanceof Error ? error.name : "UNKNOWN",
    });
  }

  return entries;
}
