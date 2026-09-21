import "server-only";
import type { AppLocale } from "@/config/i18n";
import type { ProductType } from "@/modules/catalog/domain";
import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { catalogPriceFromVariant } from "@/modules/catalog/public/price";
import type {
  CatalogImage,
  CatalogProductCard,
  CatalogProductDetail,
  CatalogTaxonomyLink,
  CatalogUniverseCard,
} from "@/modules/catalog/public/types";

type TranslationName = {
  locale: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type MediaRow = {
  role: string;
  sortOrder: number;
  mediaAsset: {
    bucket: string;
    objectPath: string;
    translations: Array<{ locale: string; altText: string | null }>;
  };
};

type UniverseJoin = {
  universe: {
    isActive: boolean;
    translations: Array<{ locale: string; slug: string; name: string }>;
  };
};

type CategoryJoin = {
  category: {
    isActive: boolean;
    translations: Array<{ locale: string; slug: string; name: string }>;
  };
};

export type ProductCardRow = {
  id: string;
  type: ProductType;
  translations: TranslationName[];
  variants: Array<{ id?: string; priceMinor: number | null; sku?: string | null }>;
  media: MediaRow[];
  universes: UniverseJoin[];
};

export type ProductDetailRow = ProductCardRow & {
  minimumLeadTimeMinutes: number | null;
  publishedAt: Date | null;
  translations: TranslationName[];
  categories: CategoryJoin[];
};

function pickLocale<T extends { locale: string }>(
  items: readonly T[],
  locale: AppLocale,
): T | undefined {
  return items.find((item) => item.locale === locale);
}

export function mapCatalogImage(
  media: MediaRow | undefined,
  locale: AppLocale,
  fallbackAlt: string,
): CatalogImage | null {
  if (!media) {
    return null;
  }

  const alt =
    pickLocale(media.mediaAsset.translations, locale)?.altText?.trim() ||
    fallbackAlt;

  return {
    src: mediaAssetPublicUrl(media.mediaAsset),
    alt,
  };
}

export function mapTaxonomyLinks(
  items: readonly UniverseJoin[] | readonly CategoryJoin[],
  locale: AppLocale,
  activeKey: "universe" | "category",
): CatalogTaxonomyLink[] {
  const links: CatalogTaxonomyLink[] = [];

  for (const item of items) {
    const node =
      activeKey === "universe"
        ? (item as UniverseJoin).universe
        : (item as CategoryJoin).category;

    if (!node.isActive) {
      continue;
    }

    const translation = pickLocale(node.translations, locale);
    if (!translation) {
      continue;
    }

    links.push({ slug: translation.slug, name: translation.name });
  }

  return links;
}

export function mapProductCard(
  row: ProductCardRow,
  locale: AppLocale,
): CatalogProductCard | null {
  const translation = pickLocale(row.translations, locale);
  if (!translation) {
    return null;
  }

  const variant = row.variants[0];
  const pricing = catalogPriceFromVariant({
    type: row.type,
    priceMinor: variant?.priceMinor,
  });
  const primary = row.media.find((item) => item.role === "PRIMARY");

  return {
    id: row.id,
    slug: translation.slug,
    name: translation.name,
    shortDescription: translation.shortDescription ?? null,
    type: row.type,
    price: pricing.price,
    priceKind: pricing.priceKind,
    primaryImage: mapCatalogImage(primary, locale, translation.name),
    universes: mapTaxonomyLinks(row.universes, locale, "universe"),
  };
}

export function mapProductDetail(
  row: ProductDetailRow,
  locale: AppLocale,
): CatalogProductDetail | null {
  const card = mapProductCard(row, locale);
  const translation = pickLocale(row.translations, locale);
  if (!card || !translation) {
    return null;
  }

  const galleryMedia = [...row.media]
    .filter((item) => item.role === "PRIMARY" || item.role === "GALLERY")
    .sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === "PRIMARY" ? -1 : 1;
      }
      return a.sortOrder - b.sortOrder;
    });

  const seen = new Set<string>();
  const gallery: CatalogImage[] = [];
  for (const media of galleryMedia) {
    const image = mapCatalogImage(media, locale, translation.name);
    if (!image || seen.has(image.src)) {
      continue;
    }
    seen.add(image.src);
    gallery.push(image);
  }

  return {
    ...card,
    description: translation.description ?? null,
    seoTitle: translation.seoTitle ?? null,
    seoDescription: translation.seoDescription ?? null,
    gallery,
    categories: mapTaxonomyLinks(row.categories, locale, "category"),
    leadTimeMinutes: row.minimumLeadTimeMinutes,
    sku: row.variants[0]?.sku ?? null,
    defaultVariantId: row.variants[0]?.id ?? null,
    publishedAt: row.publishedAt,
  };
}

export function mapUniverseCard(
  row: {
    id: string;
    translations: Array<{
      locale: string;
      slug: string;
      name: string;
      description: string | null;
    }>;
    featuredMedia: {
      bucket: string;
      objectPath: string;
      translations: Array<{ locale: string; altText: string | null }>;
    } | null;
  },
  locale: AppLocale,
): CatalogUniverseCard | null {
  const translation = pickLocale(row.translations, locale);
  if (!translation) {
    return null;
  }

  return {
    id: row.id,
    slug: translation.slug,
    name: translation.name,
    description: translation.description,
    image: row.featuredMedia
      ? {
          src: mediaAssetPublicUrl(row.featuredMedia),
          alt:
            pickLocale(row.featuredMedia.translations, locale)?.altText?.trim() ||
            translation.name,
        }
      : null,
  };
}
