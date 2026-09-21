import { Link } from "@/i18n/navigation";
import { catalogQueryToSearchParams } from "@/modules/catalog/public/url-state";
import type { CatalogListQuery } from "@/modules/catalog/public/types";
import { CATALOG_PAGE_SIZE } from "@/modules/catalog/public/list-query";

type CatalogPaginationProps = {
  query: CatalogListQuery;
  total: number;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
};

function listHref(query: CatalogListQuery) {
  return {
    pathname: "/productos" as const,
    query: Object.fromEntries(catalogQueryToSearchParams(query).entries()),
  };
}

export function CatalogPagination({
  query,
  total,
  previousLabel,
  nextLabel,
  pageLabel,
}: CatalogPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  if (pageCount <= 1) {
    return null;
  }

  const previous = query.page > 1 ? listHref({ ...query, page: query.page - 1 }) : null;
  const next = query.page < pageCount ? listHref({ ...query, page: query.page + 1 }) : null;

  return (
    <nav
      aria-label={pageLabel}
      className="mt-12 flex items-center justify-between gap-4"
    >
      {previous ? (
        <Link href={previous} className="type-label tracking-[0.12em] text-secondary">
          {previousLabel}
        </Link>
      ) : (
        <span className="type-label tracking-[0.12em] text-muted-foreground">
          {previousLabel}
        </span>
      )}
      <p className="type-caption text-muted-foreground">
        {query.page} / {pageCount}
      </p>
      {next ? (
        <Link href={next} className="type-label tracking-[0.12em] text-secondary">
          {nextLabel}
        </Link>
      ) : (
        <span className="type-label tracking-[0.12em] text-muted-foreground">
          {nextLabel}
        </span>
      )}
    </nav>
  );
}
