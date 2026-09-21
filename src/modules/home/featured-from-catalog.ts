import "server-only";
import { hasMasterPrice } from "@/modules/catalog/domain/money";
import { MAX_HOME_FEATURED_PRODUCTS, MAX_HOME_FEATURED_UNIVERSES } from "@/modules/catalog/featured";
import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import type { FeaturedProductItem, UniverseItem } from "@/modules/home/types/home-content";
import { selectFeaturedProducts } from "@/modules/home/select-featured-products";
import { productDetailHref, universeDetailHref } from "@/modules/catalog/public/href";
import type { AppLocale } from "@/config/i18n";

function pickExactLocale<T extends { locale: string }>(
  items: readonly T[],
  locale: string,
): T | undefined {
  return items.find((item) => item.locale === locale);
}

function isWithinWindow(
  startsAt: Date | null,
  endsAt: Date | null,
  now: Date,
): boolean {
  if (startsAt && startsAt > now) {
    return false;
  }
  if (endsAt && endsAt <= now) {
    return false;
  }
  return true;
}

export async function loadHomeFeaturedProducts(input: {
  locale: AppLocale;
  quoteLabel: string;
  cardCta: string;
}): Promise<FeaturedProductItem[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const now = new Date();
  const rows = await getPrisma().homeFeaturedProduct.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      product: {
        include: {
          translations: true,
          variants: { where: { isDefault: true }, take: 1 },
          media: {
            where: { role: "PRIMARY" },
            take: 1,
            include: {
              mediaAsset: { include: { translations: true } },
            },
          },
        },
      },
    },
  });

  const visible = rows.filter(
    (row) =>
      row.product.status === "PUBLISHED" &&
      isWithinWindow(row.startsAt, row.endsAt, now) &&
      Boolean(pickExactLocale(row.product.translations, input.locale)),
  );

  return selectFeaturedProducts(visible, MAX_HOME_FEATURED_PRODUCTS).flatMap((row) => {
    const translation = pickExactLocale(row.product.translations, input.locale);
    if (!translation) {
      return [];
    }

    const primary = row.product.media[0];
    const alt =
      pickExactLocale(primary?.mediaAsset.translations ?? [], input.locale)?.altText ??
      translation.name;
    const variant = row.product.variants[0];
    const showPrice =
      row.product.type !== "CUSTOM_QUOTE" && hasMasterPrice(variant?.priceMinor);

    return [
      {
        id: row.product.id,
        name: translation.name,
        description: translation.shortDescription ?? translation.description ?? "",
        ctaLabel:
          row.product.type === "CUSTOM_QUOTE" ? input.quoteLabel : input.cardCta,
        href: productDetailHref(translation.slug),
        imageSrc: primary ? mediaAssetPublicUrl(primary.mediaAsset) : undefined,
        imageAlt: alt,
        price: showPrice
          ? { amountMinor: variant!.priceMinor as number, currency: "MXN" }
          : undefined,
      },
    ];
  });
}

export async function loadHomeFeaturedUniverses(
  locale: AppLocale,
): Promise<UniverseItem[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const now = new Date();
  const rows = await getPrisma().homeFeaturedUniverse.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      universe: { include: { translations: true } },
    },
  });

  const visible = rows.filter(
    (row) =>
      row.universe.isActive &&
      isWithinWindow(row.startsAt, row.endsAt, now) &&
      Boolean(pickExactLocale(row.universe.translations, locale)),
  );

  return visible.slice(0, MAX_HOME_FEATURED_UNIVERSES).flatMap((row) => {
    const translation = pickExactLocale(row.universe.translations, locale);
    if (!translation) {
      return [];
    }

    return [
      {
        id: row.universe.id,
        title: translation.name,
        description: translation.description ?? "",
        href: universeDetailHref(translation.slug),
      },
    ];
  });
}

export type HomeFeaturedSlot = {
  id: string | null;
  sortOrder: number;
  isActive: boolean;
};

export async function getHomeFeaturedAdminSlots(): Promise<{
  products: HomeFeaturedSlot[];
  universes: HomeFeaturedSlot[];
}> {
  const emptyProducts = [1, 2, 3].map((sortOrder) => ({
    id: null,
    sortOrder,
    isActive: true,
  }));
  const emptyUniverses = [1, 2, 3, 4].map((sortOrder) => ({
    id: null,
    sortOrder,
    isActive: true,
  }));

  if (!hasRuntimeDatabaseUrl()) {
    return { products: emptyProducts, universes: emptyUniverses };
  }

  const prisma = getPrisma();
  const [productRows, universeRows] = await Promise.all([
    prisma.homeFeaturedProduct.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.homeFeaturedUniverse.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return {
    products: emptyProducts.map((slot) => {
      const row = productRows.find((item) => item.sortOrder === slot.sortOrder);
      return {
        id: row?.productId ?? null,
        sortOrder: slot.sortOrder,
        isActive: row?.isActive ?? true,
      };
    }),
    universes: emptyUniverses.map((slot) => {
      const row = universeRows.find((item) => item.sortOrder === slot.sortOrder);
      return {
        id: row?.universeId ?? null,
        sortOrder: slot.sortOrder,
        isActive: row?.isActive ?? true,
      };
    }),
  };
}
