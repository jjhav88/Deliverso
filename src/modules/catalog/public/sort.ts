import type { ProductType } from "@/modules/catalog/domain";
import { hasMasterPrice } from "@/modules/catalog/domain/money";
import type { CatalogSort } from "@/modules/catalog/public/types";

export type CatalogSortRow = {
  id: string;
  name: string;
  type: ProductType;
  priceMinor: number | null;
  publishedAt: Date | null;
};

export function isUnpricedForSort(row: CatalogSortRow): boolean {
  return row.type === "CUSTOM_QUOTE" || !hasMasterPrice(row.priceMinor);
}

export function compareCatalogSortRows(
  a: CatalogSortRow,
  b: CatalogSortRow,
  sort: CatalogSort,
  locale: string,
): number {
  if (sort === "name") {
    return a.name.localeCompare(b.name, locale);
  }

  if (sort === "price-asc" || sort === "price-desc") {
    const aUnpriced = isUnpricedForSort(a);
    const bUnpriced = isUnpricedForSort(b);

    if (aUnpriced !== bUnpriced) {
      return aUnpriced ? 1 : -1;
    }

    if (!aUnpriced && !bUnpriced) {
      const direction = sort === "price-asc" ? 1 : -1;
      const byPrice = ((a.priceMinor ?? 0) - (b.priceMinor ?? 0)) * direction;
      if (byPrice !== 0) {
        return byPrice;
      }
    }

    return a.name.localeCompare(b.name, locale);
  }

  const aTime = a.publishedAt?.getTime() ?? 0;
  const bTime = b.publishedAt?.getTime() ?? 0;
  if (aTime !== bTime) {
    return bTime - aTime;
  }

  return a.name.localeCompare(b.name, locale);
}

export function sortCatalogRows(
  rows: readonly CatalogSortRow[],
  sort: CatalogSort,
  locale: string,
): CatalogSortRow[] {
  return [...rows].sort((a, b) => compareCatalogSortRows(a, b, sort, locale));
}
