import type { CatalogListQuery, CatalogSort } from "@/modules/catalog/public/types";
import { CATALOG_PAGE_SIZE } from "@/modules/catalog/public/list-query";

export function catalogQueryToSearchParams(
  query: Pick<
    CatalogListQuery,
    "q" | "categorySlug" | "universeSlug" | "type" | "sort" | "page"
  >,
): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }
  if (query.categorySlug) {
    params.set("categoria", query.categorySlug);
  }
  if (query.universeSlug) {
    params.set("universo", query.universeSlug);
  }
  if (query.type) {
    params.set("tipo", query.type);
  }
  if (query.sort !== "recommended") {
    params.set("orden", query.sort);
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params;
}

export function catalogHrefWithParams(
  pathname: string,
  query: Pick<
    CatalogListQuery,
    "q" | "categorySlug" | "universeSlug" | "type" | "sort" | "page"
  >,
): string {
  const params = catalogQueryToSearchParams(query);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function hasCatalogFilters(
  query: Pick<CatalogListQuery, "q" | "categorySlug" | "universeSlug" | "type">,
): boolean {
  return Boolean(query.q || query.categorySlug || query.universeSlug || query.type);
}

export function paginateIds(
  ids: readonly string[],
  page: number,
  pageSize = CATALOG_PAGE_SIZE,
): { page: number; pageCount: number; pageIds: string[]; total: number } {
  const total = ids.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    total,
    page: total === 0 ? 1 : safePage,
    pageCount: total === 0 ? 1 : pageCount,
    pageIds: ids.slice(start, start + pageSize),
  };
}

export function isCatalogSort(value: string): value is CatalogSort {
  return (
    value === "recommended" ||
    value === "name" ||
    value === "price-asc" ||
    value === "price-desc"
  );
}
