import type { CatalogListQuery, CatalogTaxonomyLink } from "@/modules/catalog/public/types";
import type { ProductType } from "@/modules/catalog/domain";
import "@/modules/catalog/catalog.css";

type CatalogFiltersProps = {
  action: string;
  query: CatalogListQuery;
  categories: CatalogTaxonomyLink[];
  universes: CatalogTaxonomyLink[];
  labels: {
    search: string;
    searchPlaceholder: string;
    category: string;
    universe: string;
    type: string;
    sort: string;
    all: string;
    apply: string;
    types: Record<ProductType, string>;
    sorts: {
      recommended: string;
      name: string;
      "price-asc": string;
      "price-desc": string;
    };
  };
};

export function CatalogFilters({
  action,
  query,
  categories,
  universes,
  labels,
}: CatalogFiltersProps) {
  return (
    <form method="get" action={action} className="catalog-filters">
      <div className="catalog-filters-fields">
        <label className="grid gap-1.5">
          <span className="type-caption text-muted-foreground">{labels.search}</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q}
            placeholder={labels.searchPlaceholder}
            className="min-h-11 rounded-md border border-border bg-background px-3 type-body-sm"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="type-caption text-muted-foreground">{labels.category}</span>
          <select
            name="categoria"
            defaultValue={query.categorySlug}
            className="min-h-11 rounded-md border border-border bg-background px-3 type-body-sm"
          >
            <option value="">{labels.all}</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-caption text-muted-foreground">{labels.universe}</span>
          <select
            name="universo"
            defaultValue={query.universeSlug}
            className="min-h-11 rounded-md border border-border bg-background px-3 type-body-sm"
          >
            <option value="">{labels.all}</option>
            {universes.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="type-caption text-muted-foreground">{labels.type}</span>
          <select
            name="tipo"
            defaultValue={query.type}
            className="min-h-11 rounded-md border border-border bg-background px-3 type-body-sm"
          >
            <option value="">{labels.all}</option>
            <option value="STANDARD">{labels.types.STANDARD}</option>
            <option value="CONFIGURABLE">{labels.types.CONFIGURABLE}</option>
            <option value="CUSTOM_QUOTE">{labels.types.CUSTOM_QUOTE}</option>
          </select>
        </label>
      </div>
      <div className="catalog-filters-actions">
        <label className="grid min-w-[12rem] gap-1.5">
          <span className="type-caption text-muted-foreground">{labels.sort}</span>
          <select
            name="orden"
            defaultValue={query.sort}
            className="min-h-11 rounded-md border border-border bg-background px-3 type-body-sm"
          >
            <option value="recommended">{labels.sorts.recommended}</option>
            <option value="name">{labels.sorts.name}</option>
            <option value="price-asc">{labels.sorts["price-asc"]}</option>
            <option value="price-desc">{labels.sorts["price-desc"]}</option>
          </select>
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-md bg-primary px-5 type-label tracking-[0.12em] text-primary-foreground"
        >
          {labels.apply}
        </button>
      </div>
    </form>
  );
}
