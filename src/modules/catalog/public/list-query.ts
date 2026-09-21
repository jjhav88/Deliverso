import { z } from "zod";
import { productTypes } from "@/modules/catalog/domain";
import type { CatalogListQuery, CatalogSort } from "@/modules/catalog/public/types";
import type { AppLocale } from "@/config/i18n";

export const CATALOG_PAGE_SIZE = 12;

const sortValues = [
  "recommended",
  "name",
  "price-asc",
  "price-desc",
] as const satisfies readonly CatalogSort[];

export const catalogListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  categoria: z.string().trim().max(80).optional().default(""),
  universo: z.string().trim().max(80).optional().default(""),
  tipo: z.enum(["", ...productTypes]).optional().default(""),
  orden: z.enum(sortValues).optional().default("recommended"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export function parseCatalogListQuery(
  locale: AppLocale,
  raw: Record<string, string | string[] | undefined>,
): CatalogListQuery {
  const parsed = catalogListQuerySchema.safeParse({
    q: first(raw.q),
    categoria: first(raw.categoria),
    universo: first(raw.universo),
    tipo: first(raw.tipo) ?? "",
    orden: first(raw.orden),
    page: first(raw.page),
  });

  if (!parsed.success) {
    return {
      locale,
      q: "",
      categorySlug: "",
      universeSlug: "",
      type: "",
      sort: "recommended",
      page: 1,
    };
  }

  return {
    locale,
    q: parsed.data.q,
    categorySlug: parsed.data.categoria,
    universeSlug: parsed.data.universo,
    type: parsed.data.tipo,
    sort: parsed.data.orden,
    page: parsed.data.page,
  };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
