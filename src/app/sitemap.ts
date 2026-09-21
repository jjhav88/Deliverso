import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/config/site";
import { supportedLocales, type AppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { getSitemapCatalogEntries } from "@/modules/catalog/public/queries";
import { productDetailHref, universeDetailHref } from "@/modules/catalog/public/href";

function urlFor(locale: AppLocale, href: Parameters<typeof getPathname>[0]["href"]): string | null {
  const base = getPublicAppUrl();
  if (!base) {
    return null;
  }

  return `${base}${getPathname({ locale, href })}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const staticHrefs = ["/", "/productos", "/universos"] as const;

  for (const href of staticHrefs) {
    const languages: Record<string, string> = {};
    for (const locale of supportedLocales) {
      const url = urlFor(locale, href);
      if (url) {
        languages[locale] = url;
      }
    }

    const canonical = languages["es-MX"];
    if (canonical) {
      entries.push({
        url: canonical,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  const catalog = await getSitemapCatalogEntries();

  for (const product of catalog.products) {
    const languages: Record<string, string> = {};
    for (const translation of product.translations) {
      const url = urlFor(translation.locale, productDetailHref(translation.slug));
      if (url) {
        languages[translation.locale] = url;
      }
    }

    for (const translation of product.translations) {
      const url = languages[translation.locale];
      if (!url) {
        continue;
      }
      entries.push({
        url,
        lastModified: product.updatedAt,
        alternates: { languages },
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

    for (const translation of universe.translations) {
      const url = languages[translation.locale];
      if (!url) {
        continue;
      }
      entries.push({
        url,
        lastModified: universe.updatedAt,
        alternates: { languages },
      });
    }
  }

  return entries;
}
