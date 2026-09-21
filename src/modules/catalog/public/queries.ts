import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { AppLocale } from "@/config/i18n";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { CATALOG_PAGE_SIZE } from "@/modules/catalog/public/list-query";
import {
  mapProductCard,
  mapProductDetail,
  mapUniverseCard,
} from "@/modules/catalog/public/mappers";
import { pickRelatedProductIds } from "@/modules/catalog/public/related";
import { sortCatalogRows } from "@/modules/catalog/public/sort";
import { paginateIds } from "@/modules/catalog/public/url-state";
import type {
  CatalogListQuery,
  CatalogListResult,
  CatalogProductCard,
  CatalogProductDetail,
  CatalogTaxonomyLink,
  CatalogUniverseCard,
} from "@/modules/catalog/public/types";
import { translationSlugs, type TranslationSlug } from "@/modules/catalog/public/seo";

const productCardSelect = (locale: AppLocale) =>
  ({
    id: true,
    type: true,
    translations: {
      where: { locale },
      select: {
        locale: true,
        name: true,
        slug: true,
        shortDescription: true,
      },
      take: 1,
    },
    variants: {
      where: { isDefault: true, isActive: true },
      select: { id: true, priceMinor: true, sku: true },
      take: 1,
    },
    media: {
      where: { role: "PRIMARY" },
      orderBy: { sortOrder: "asc" },
      take: 1,
      select: {
        role: true,
        sortOrder: true,
        mediaAsset: {
          select: {
            bucket: true,
            objectPath: true,
            translations: {
              where: { locale },
              select: { locale: true, altText: true },
              take: 1,
            },
          },
        },
      },
    },
    universes: {
      orderBy: { sortOrder: "asc" },
      select: {
        universe: {
          select: {
            isActive: true,
            translations: {
              where: { locale },
              select: { locale: true, slug: true, name: true },
              take: 1,
            },
          },
        },
      },
    },
  }) satisfies Prisma.ProductSelect;

function publishedWhere(
  locale: AppLocale,
  extra: Prisma.ProductWhereInput[] = [],
): Prisma.ProductWhereInput {
  return {
    AND: [
      { status: "PUBLISHED" },
      { translations: { some: { locale } } },
      ...extra,
    ],
  };
}

function listFilters(query: CatalogListQuery): Prisma.ProductWhereInput[] {
  const filters: Prisma.ProductWhereInput[] = [];

  if (query.q) {
    filters.push({
      translations: {
        some: {
          locale: query.locale,
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { shortDescription: { contains: query.q, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  if (query.type) {
    filters.push({ type: query.type });
  }

  if (query.universeSlug) {
    filters.push({
      universes: {
        some: {
          universe: {
            isActive: true,
            translations: {
              some: { locale: query.locale, slug: query.universeSlug },
            },
          },
        },
      },
    });
  }

  if (query.categorySlug) {
    filters.push({
      categories: {
        some: {
          category: {
            isActive: true,
            translations: {
              some: { locale: query.locale, slug: query.categorySlug },
            },
          },
        },
      },
    });
  }

  return filters;
}

export async function getPublishedProducts(
  query: CatalogListQuery,
): Promise<CatalogListResult<CatalogProductCard>> {
  const empty: CatalogListResult<CatalogProductCard> = {
    items: [],
    total: 0,
    page: 1,
    pageSize: CATALOG_PAGE_SIZE,
  };

  if (!hasRuntimeDatabaseUrl()) {
    return empty;
  }

  const prisma = getPrisma();
  const where = publishedWhere(query.locale, listFilters(query));

  const sortRows = await prisma.product.findMany({
    where,
    select: {
      id: true,
      type: true,
      publishedAt: true,
      translations: {
        where: { locale: query.locale },
        select: { name: true },
        take: 1,
      },
      variants: {
        where: { isDefault: true, isActive: true },
        select: { priceMinor: true },
        take: 1,
      },
    },
  });

  const ordered = sortCatalogRows(
    sortRows.map((row) => ({
      id: row.id,
      name: row.translations[0]?.name ?? "",
      type: row.type,
      priceMinor: row.variants[0]?.priceMinor ?? null,
      publishedAt: row.publishedAt,
    })),
    query.sort,
    query.locale,
  );

  const page = paginateIds(
    ordered.map((row) => row.id),
    query.page,
  );

  if (page.pageIds.length === 0) {
    return {
      items: [],
      total: page.total,
      page: page.page,
      pageSize: CATALOG_PAGE_SIZE,
    };
  }

  const rows = await prisma.product.findMany({
    where: { id: { in: page.pageIds } },
    select: productCardSelect(query.locale),
  });

  const byId = new Map(rows.map((row) => [row.id, row]));
  const items = page.pageIds.flatMap((id) => {
    const row = byId.get(id);
    if (!row) {
      return [];
    }
    const mapped = mapProductCard(row, query.locale);
    return mapped ? [mapped] : [];
  });

  return {
    items,
    total: page.total,
    page: page.page,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

export async function getPublishedProductBySlug(
  slug: string,
  locale: AppLocale,
): Promise<{
  product: CatalogProductDetail;
  translations: TranslationSlug[];
} | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const prisma = getPrisma();
  const row = await prisma.product.findFirst({
    where: publishedWhere(locale, [
      { translations: { some: { locale, slug } } },
    ]),
    select: {
      ...productCardSelect(locale),
      minimumLeadTimeMinutes: true,
      publishedAt: true,
      translations: {
        select: {
          locale: true,
          name: true,
          slug: true,
          shortDescription: true,
          description: true,
          seoTitle: true,
          seoDescription: true,
        },
      },
      media: {
        where: { role: { in: ["PRIMARY", "GALLERY"] } },
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
        select: {
          role: true,
          sortOrder: true,
          mediaAsset: {
            select: {
              bucket: true,
              objectPath: true,
              translations: {
                select: { locale: true, altText: true },
              },
            },
          },
        },
      },
      categories: {
        orderBy: { sortOrder: "asc" },
        select: {
          category: {
            select: {
              isActive: true,
              translations: {
                where: { locale },
                select: { locale: true, slug: true, name: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const product = mapProductDetail(row, locale);
  if (!product) {
    return null;
  }

  return {
    product,
    translations: translationSlugs(row.translations),
  };
}

export async function getRelatedProducts(input: {
  productId: string;
  locale: AppLocale;
  universeSlugs: readonly string[];
  categorySlugs: readonly string[];
}): Promise<CatalogProductCard[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const prisma = getPrisma();
  const locale = input.locale;

  const [universeMatches, categoryMatches] = await Promise.all([
    input.universeSlugs.length > 0
      ? prisma.product.findMany({
          where: publishedWhere(locale, [
            { id: { not: input.productId } },
            {
              universes: {
                some: {
                  universe: {
                    isActive: true,
                    translations: {
                      some: { locale, slug: { in: [...input.universeSlugs] } },
                    },
                  },
                },
              },
            },
          ]),
          orderBy: { publishedAt: "desc" },
          take: 6,
          select: { id: true },
        })
      : Promise.resolve([]),
    input.categorySlugs.length > 0
      ? prisma.product.findMany({
          where: publishedWhere(locale, [
            { id: { not: input.productId } },
            {
              categories: {
                some: {
                  category: {
                    isActive: true,
                    translations: {
                      some: {
                        locale,
                        slug: { in: [...input.categorySlugs] },
                      },
                    },
                  },
                },
              },
            },
          ]),
          orderBy: { publishedAt: "desc" },
          take: 6,
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const ids = pickRelatedProductIds({
    currentId: input.productId,
    universeMatches: universeMatches.map((row) => row.id),
    categoryMatches: categoryMatches.map((row) => row.id),
  });

  if (ids.length === 0) {
    return [];
  }

  const rows = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: productCardSelect(locale),
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) {
      return [];
    }
    const mapped = mapProductCard(row, locale);
    return mapped ? [mapped] : [];
  });
}

export async function getPublishedProductsByUniverse(input: {
  locale: AppLocale;
  universeSlug: string;
}): Promise<CatalogProductCard[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const prisma = getPrisma();
  const rows = await prisma.product.findMany({
    where: publishedWhere(input.locale, [
      {
        universes: {
          some: {
            universe: {
              isActive: true,
              translations: {
                some: { locale: input.locale, slug: input.universeSlug },
              },
            },
          },
        },
      },
    ]),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: productCardSelect(input.locale),
  });

  return rows.flatMap((row) => {
    const mapped = mapProductCard(row, input.locale);
    return mapped ? [mapped] : [];
  });
}

export async function getActiveCategories(
  locale: AppLocale,
): Promise<CatalogTaxonomyLink[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().category.findMany({
    where: {
      isActive: true,
      translations: { some: { locale } },
      products: {
        some: {
          product: publishedWhere(locale),
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      translations: {
        where: { locale },
        select: { slug: true, name: true },
        take: 1,
      },
    },
  });

  return rows.flatMap((row) => {
    const translation = row.translations[0];
    return translation
      ? [{ slug: translation.slug, name: translation.name }]
      : [];
  });
}

export async function getActiveUniverses(
  locale: AppLocale,
): Promise<CatalogUniverseCard[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const rows = await getPrisma().universe.findMany({
    where: {
      isActive: true,
      translations: { some: { locale } },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      translations: {
        where: { locale },
        select: {
          locale: true,
          slug: true,
          name: true,
          description: true,
        },
        take: 1,
      },
      featuredMedia: {
        select: {
          bucket: true,
          objectPath: true,
          translations: {
            where: { locale },
            select: { locale: true, altText: true },
            take: 1,
          },
        },
      },
    },
  });

  return rows.flatMap((row) => {
    const mapped = mapUniverseCard(row, locale);
    return mapped ? [mapped] : [];
  });
}

export async function getActiveUniverseBySlug(
  slug: string,
  locale: AppLocale,
): Promise<{
  universe: CatalogUniverseCard;
  translations: TranslationSlug[];
} | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const row = await getPrisma().universe.findFirst({
    where: {
      isActive: true,
      translations: { some: { locale, slug } },
    },
    select: {
      id: true,
      translations: {
        select: {
          locale: true,
          slug: true,
          name: true,
          description: true,
        },
      },
      featuredMedia: {
        select: {
          bucket: true,
          objectPath: true,
          translations: {
            select: { locale: true, altText: true },
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const universe = mapUniverseCard(
    {
      ...row,
      translations: row.translations.filter((item) => item.locale === locale),
    },
    locale,
  );

  if (!universe) {
    return null;
  }

  return {
    universe,
    translations: translationSlugs(row.translations),
  };
}

export async function getSitemapCatalogEntries(): Promise<{
  products: Array<{
    productId: string;
    updatedAt: Date;
    translations: TranslationSlug[];
  }>;
  universes: Array<{
    universeId: string;
    updatedAt: Date;
    translations: TranslationSlug[];
  }>;
}> {
  if (!hasRuntimeDatabaseUrl()) {
    return { products: [], universes: [] };
  }

  const prisma = getPrisma();
  const [productRows, universeRows] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        updatedAt: true,
        translations: { select: { locale: true, slug: true } },
      },
    }),
    prisma.universe.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true,
        translations: { select: { locale: true, slug: true } },
      },
    }),
  ]);

  return {
    products: productRows.map((row) => ({
      productId: row.id,
      updatedAt: row.updatedAt,
      translations: translationSlugs(row.translations),
    })),
    universes: universeRows.map((row) => ({
      universeId: row.id,
      updatedAt: row.updatedAt,
      translations: translationSlugs(row.translations),
    })),
  };
}
