import type { AppLocale } from "@/config/i18n";
import type { ProductType } from "@/modules/catalog/domain";
import type { MoneyAmount } from "@/lib/money";

export type CatalogImage = {
  src: string;
  alt: string;
};

export type CatalogTaxonomyLink = {
  slug: string;
  name: string;
};

export type CatalogPriceKind = "exact" | "from" | "quote";

export type CatalogProductCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  type: ProductType;
  price: MoneyAmount | null;
  priceKind: CatalogPriceKind;
  primaryImage: CatalogImage | null;
  universes: CatalogTaxonomyLink[];
};

export type CatalogProductDetail = CatalogProductCard & {
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gallery: CatalogImage[];
  categories: CatalogTaxonomyLink[];
  leadTimeMinutes: number | null;
  sku: string | null;
  defaultVariantId: string | null;
  publishedAt: Date | null;
};

export type CatalogUniverseCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: CatalogImage | null;
};

export type CatalogListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CatalogSort = "recommended" | "name" | "price-asc" | "price-desc";

export type CatalogListQuery = {
  locale: AppLocale;
  q: string;
  categorySlug: string;
  universeSlug: string;
  type: ProductType | "";
  sort: CatalogSort;
  page: number;
};
