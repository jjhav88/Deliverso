import "server-only";
import type { ProductStatus, ProductType } from "@/modules/catalog/domain";
import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { minutesToLeadTime } from "@/modules/catalog/lead-time";
import { minorToMoneyInput } from "@/modules/catalog/money-input";
import { productListQuerySchema } from "@/modules/catalog/validation";

const PRODUCT_PAGE_SIZE = 20;

export type CatalogTranslation = {
  name: string;
  slug: string;
  description: string;
};

export type ProductFormTranslation = CatalogTranslation & {
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
};

export type TaxonomyOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type CategoryOption = TaxonomyOption & {
  businessLineId: string;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  priceMinor: number | null;
  businessLineName: string;
  imageUrl: string | null;
  updatedAt: Date;
};

export type AdminProductFormState = {
  id: string | null;
  type: ProductType;
  status: ProductStatus;
  businessLineId: string;
  leadTimeValue: string;
  leadTimeUnit: "minutes" | "hours" | "days";
  priceInput: string;
  quotePrice: boolean;
  sku: string;
  categoryIds: string[];
  universeIds: string[];
  primaryMediaAssetId: string | null;
  primaryMediaUrl: string | null;
  gallery: Array<{ id: string; url: string }>;
  es: ProductFormTranslation;
  en: ProductFormTranslation;
  publishedAt: Date | null;
  archivedAt: Date | null;
};

export type AdminUniverseListItem = {
  id: string;
  name: string;
  isActive: boolean;
  productCount: number;
  sortOrder: number;
  updatedAt: Date;
};

export type AdminUniverseFormState = {
  id: string | null;
  isActive: boolean;
  sortOrder: number;
  featuredMediaAssetId: string | null;
  featuredMediaUrl: string | null;
  es: CatalogTranslation;
  en: CatalogTranslation;
};

export type AdminBusinessLineListItem = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
};

export type AdminCategoryListItem = {
  id: string;
  name: string;
  businessLineName: string;
  businessLineId: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
};

const emptyTranslation = (): CatalogTranslation => ({
  name: "",
  slug: "",
  description: "",
});

const emptyProductTranslation = (): ProductFormTranslation => ({
  ...emptyTranslation(),
  shortDescription: "",
  seoTitle: "",
  seoDescription: "",
});

function pickTranslation<T extends { locale: string }>(
  items: readonly T[],
  locale: string,
): T | undefined {
  return items.find((item) => item.locale === locale);
}

export async function listBusinessLineOptions(): Promise<TaxonomyOption[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().businessLine.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { translations: true },
  });

  return rows.map((row) => ({
    id: row.id,
    isActive: row.isActive,
    name:
      pickTranslation(row.translations, "es-MX")?.name ??
      pickTranslation(row.translations, "en-US")?.name ??
      "Línea sin nombre",
  }));
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { translations: true },
  });

  return rows.map((row) => ({
    id: row.id,
    businessLineId: row.businessLineId,
    isActive: row.isActive,
    name:
      pickTranslation(row.translations, "es-MX")?.name ??
      "Categoría sin nombre",
  }));
}

export async function listUniverseOptions(): Promise<TaxonomyOption[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().universe.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { translations: true },
  });

  return rows.map((row) => ({
    id: row.id,
    isActive: row.isActive,
    name:
      pickTranslation(row.translations, "es-MX")?.name ?? "Universo sin nombre",
  }));
}

export async function listAdminBusinessLines(): Promise<AdminBusinessLineListItem[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().businessLine.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { translations: true },
  });

  return rows.map((row) => ({
    id: row.id,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt,
    name: pickTranslation(row.translations, "es-MX")?.name ?? "Línea sin nombre",
  }));
}

export async function getAdminBusinessLine(
  id: string,
): Promise<(AdminBusinessLineListItem & { es: CatalogTranslation; en: CatalogTranslation }) | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const row = await getPrisma().businessLine.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!row) {
    return null;
  }

  const es = pickTranslation(row.translations, "es-MX");
  const en = pickTranslation(row.translations, "en-US");

  return {
    id: row.id,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt,
    name: es?.name ?? "Línea sin nombre",
    es: {
      name: es?.name ?? "",
      slug: es?.slug ?? "",
      description: es?.description ?? "",
    },
    en: {
      name: en?.name ?? "",
      slug: en?.slug ?? "",
      description: en?.description ?? "",
    },
  };
}

export async function listAdminCategories(): Promise<AdminCategoryListItem[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      translations: true,
      businessLine: { include: { translations: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    businessLineId: row.businessLineId,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt,
    name: pickTranslation(row.translations, "es-MX")?.name ?? "Categoría sin nombre",
    businessLineName:
      pickTranslation(row.businessLine.translations, "es-MX")?.name ?? "Línea",
  }));
}

export async function getAdminCategory(id: string) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const row = await getPrisma().category.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!row) {
    return null;
  }

  const es = pickTranslation(row.translations, "es-MX");
  const en = pickTranslation(row.translations, "en-US");

  return {
    id: row.id,
    businessLineId: row.businessLineId,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    es: {
      name: es?.name ?? "",
      slug: es?.slug ?? "",
      description: es?.description ?? "",
    },
    en: {
      name: en?.name ?? "",
      slug: en?.slug ?? "",
      description: en?.description ?? "",
    },
  };
}

export async function listAdminUniverses(): Promise<AdminUniverseListItem[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().universe.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      translations: true,
      _count: { select: { products: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt,
    productCount: row._count.products,
    name: pickTranslation(row.translations, "es-MX")?.name ?? "Universo sin nombre",
  }));
}

export async function getAdminUniverse(id: string): Promise<AdminUniverseFormState | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const row = await getPrisma().universe.findUnique({
    where: { id },
    include: {
      translations: true,
      featuredMedia: true,
    },
  });

  if (!row) {
    return null;
  }

  const es = pickTranslation(row.translations, "es-MX");
  const en = pickTranslation(row.translations, "en-US");

  return {
    id: row.id,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    featuredMediaAssetId: row.featuredMediaAssetId,
    featuredMediaUrl: row.featuredMedia ? mediaAssetPublicUrl(row.featuredMedia) : null,
    es: {
      name: es?.name ?? "",
      slug: es?.slug ?? "",
      description: es?.description ?? "",
    },
    en: {
      name: en?.name ?? "",
      slug: en?.slug ?? "",
      description: en?.description ?? "",
    },
  };
}

export function emptyProductFormState(): AdminProductFormState {
  return {
    id: null,
    type: "STANDARD",
    status: "DRAFT",
    businessLineId: "",
    leadTimeValue: "",
    leadTimeUnit: "hours",
    priceInput: "",
    quotePrice: false,
    sku: "",
    categoryIds: [],
    universeIds: [],
    primaryMediaAssetId: null,
    primaryMediaUrl: null,
    gallery: [],
    es: emptyProductTranslation(),
    en: emptyProductTranslation(),
    publishedAt: null,
    archivedAt: null,
  };
}

export async function getAdminProduct(id: string): Promise<AdminProductFormState | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const row = await getPrisma().product.findUnique({
    where: { id },
    include: {
      translations: true,
      categories: true,
      universes: true,
      variants: { orderBy: { sortOrder: "asc" } },
      media: {
        orderBy: { sortOrder: "asc" },
        include: { mediaAsset: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  const es = pickTranslation(row.translations, "es-MX");
  const en = pickTranslation(row.translations, "en-US");
  const defaultVariant =
    row.variants.find((item) => item.isDefault) ?? row.variants[0] ?? null;
  const primary = row.media.find((item) => item.role === "PRIMARY");
  const gallery = row.media.filter((item) => item.role === "GALLERY");
  const lead = minutesToLeadTime(row.minimumLeadTimeMinutes);

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    businessLineId: row.businessLineId,
    leadTimeValue: lead.value === null ? "" : String(lead.value),
    leadTimeUnit: lead.unit,
    priceInput: minorToMoneyInput(defaultVariant?.priceMinor),
    quotePrice: row.type === "CUSTOM_QUOTE" && defaultVariant?.priceMinor == null,
    sku: defaultVariant?.sku ?? "",
    categoryIds: row.categories.map((item) => item.categoryId),
    universeIds: row.universes.map((item) => item.universeId),
    primaryMediaAssetId: primary?.mediaAssetId ?? null,
    primaryMediaUrl: primary ? mediaAssetPublicUrl(primary.mediaAsset) : null,
    gallery: gallery.map((item) => ({
      id: item.mediaAssetId,
      url: mediaAssetPublicUrl(item.mediaAsset),
    })),
    es: {
      name: es?.name ?? "",
      slug: es?.slug ?? "",
      shortDescription: es?.shortDescription ?? "",
      description: es?.description ?? "",
      seoTitle: es?.seoTitle ?? "",
      seoDescription: es?.seoDescription ?? "",
    },
    en: {
      name: en?.name ?? "",
      slug: en?.slug ?? "",
      shortDescription: en?.shortDescription ?? "",
      description: en?.description ?? "",
      seoTitle: en?.seoTitle ?? "",
      seoDescription: en?.seoDescription ?? "",
    },
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
  };
}

export type ProductListResult = {
  items: AdminProductListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listAdminProducts(
  raw: Record<string, string | string[] | undefined>,
): Promise<ProductListResult> {
  const parsed = productListQuerySchema.parse({
    q: Array.isArray(raw.q) ? raw.q[0] : raw.q,
    status: Array.isArray(raw.status) ? raw.status[0] : raw.status,
    type: Array.isArray(raw.type) ? raw.type[0] : raw.type,
    businessLineId: Array.isArray(raw.businessLineId)
      ? raw.businessLineId[0]
      : raw.businessLineId,
    sort: Array.isArray(raw.sort) ? raw.sort[0] : raw.sort,
    page: Array.isArray(raw.page) ? raw.page[0] : raw.page,
  });

  if (!hasRuntimeDatabaseUrl()) {
    return { items: [], total: 0, page: 1, pageSize: PRODUCT_PAGE_SIZE };
  }

  const prisma = getPrisma();
  const search = parsed.q;
  const where = {
    ...(parsed.status !== "ALL" ? { status: parsed.status } : {}),
    ...(parsed.type !== "ALL" ? { type: parsed.type } : {}),
    ...(parsed.businessLineId &&
    /^[0-9a-f-]{36}$/i.test(parsed.businessLineId)
      ? { businessLineId: parsed.businessLineId }
      : {}),
    ...(search
      ? {
          OR: [
            {
              translations: {
                some: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { slug: { contains: search, mode: "insensitive" as const } },
                  ],
                },
              },
            },
            {
              variants: {
                some: { sku: { contains: search, mode: "insensitive" as const } },
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE));
  const page = Math.min(parsed.page, pageCount);

  const rows = await prisma.product.findMany({
    where,
    skip: (page - 1) * PRODUCT_PAGE_SIZE,
    take: PRODUCT_PAGE_SIZE,
    orderBy:
      parsed.sort === "name"
        ? { updatedAt: "desc" }
        : { updatedAt: "desc" },
    include: {
      translations: true,
      businessLine: { include: { translations: true } },
      variants: { where: { isDefault: true }, take: 1 },
      media: {
        where: { role: "PRIMARY" },
        take: 1,
        include: { mediaAsset: true },
      },
    },
  });

  const items = rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    updatedAt: row.updatedAt,
    priceMinor: row.variants[0]?.priceMinor ?? null,
    name: pickTranslation(row.translations, "es-MX")?.name ?? "Producto sin nombre",
    businessLineName:
      pickTranslation(row.businessLine.translations, "es-MX")?.name ?? "—",
    imageUrl: row.media[0] ? mediaAssetPublicUrl(row.media[0].mediaAsset) : null,
  }));

  if (parsed.sort === "name") {
    items.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  return { items, total, page, pageSize: PRODUCT_PAGE_SIZE };
}

export async function countCatalogDashboard() {
  if (!hasRuntimeDatabaseUrl()) {
    return { products: 0, published: 0, universes: 0 };
  }

  const prisma = getPrisma();
  const [products, published, universes] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.universe.count(),
  ]);

  return { products, published, universes };
}

export async function listPublishedProductsForHome() {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    include: { translations: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: pickTranslation(row.translations, "es-MX")?.name ?? "Producto",
  }));
}

export async function listActiveUniversesForHome() {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().universe.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { translations: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: pickTranslation(row.translations, "es-MX")?.name ?? "Universo",
  }));
}
