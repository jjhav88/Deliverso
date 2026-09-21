import Link from "next/link";
import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { ProductList } from "@/modules/admin/components/product-list";
import { buttonClassName } from "@/components/ui/button";
import {
  listAdminProducts,
  listBusinessLineOptions,
} from "@/modules/catalog/queries";

const flashMessages: Record<string, string> = {
  created: "Producto creado.",
  published: "Producto publicado.",
  deleted: "Producto eliminado.",
};

type AdminProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const [result, lines] = await Promise.all([
    listAdminProducts(params),
    listBusinessLineOptions(),
  ]);
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "ALL";
  const type = typeof params.type === "string" ? params.type : "ALL";
  const businessLineId =
    typeof params.businessLineId === "string" ? params.businessLineId : "";
  const sort = typeof params.sort === "string" ? params.sort : "updated";
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filterParams = new URLSearchParams();
  if (q) filterParams.set("q", q);
  if (status !== "ALL") filterParams.set("status", status);
  if (type !== "ALL") filterParams.set("type", type);
  if (businessLineId) filterParams.set("businessLineId", businessLineId);
  if (sort !== "updated") filterParams.set("sort", sort);

  function pageHref(page: number) {
    const params = new URLSearchParams(filterParams);
    if (page > 1) {
      params.set("page", String(page));
    }
    const query = params.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  }

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2">Productos</h2>
          <p className="mt-2 max-w-2xl type-body text-muted-foreground">
            Archiva lo que no debe venderse. Elimina pruebas o altas erróneas;
            las fotos se quedan en Media.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className={buttonClassName({ variant: "secondary" })}
        >
          + Nuevo producto
        </Link>
      </div>

      {typeof params.ok === "string" && params.ok in flashMessages ? (
        <p role="status" className="type-caption text-secondary">
          {flashMessages[params.ok]}
        </p>
      ) : null}

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-4 md:grid-cols-5"
      >
        <label className="flex flex-col gap-2 type-label md:col-span-2">
          Buscar
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre, slug o SKU"
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3 type-body"
          />
        </label>
        <label className="flex flex-col gap-2 type-label">
          Estado
          <select
            name="status"
            defaultValue={status}
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          >
            <option value="ALL">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 type-label">
          Tipo
          <select
            name="type"
            defaultValue={type}
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          >
            <option value="ALL">Todos</option>
            <option value="STANDARD">Estándar</option>
            <option value="CONFIGURABLE">Configurable</option>
            <option value="CUSTOM_QUOTE">Cotización</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 type-label">
          Línea
          <select
            name="businessLineId"
            defaultValue={businessLineId}
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          >
            <option value="">Todas</option>
            {lines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 type-label">
          Orden
          <select
            name="sort"
            defaultValue={sort}
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          >
            <option value="updated">Más recientes</option>
            <option value="name">Nombre</option>
          </select>
        </label>
        <div className="md:col-span-5">
          <button
            type="submit"
            className={buttonClassName({ variant: "outline", size: "sm" })}
          >
            Filtrar
          </button>
        </div>
      </form>

      {result.total === 0 && !q && status === "ALL" && type === "ALL" && !businessLineId ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-[var(--admin-surface)] px-6 py-16 text-center">
          <p className="type-h3">Tu catálogo está vacío.</p>
          <p className="mx-auto mt-3 max-w-md type-body text-muted-foreground">
            Empieza creando el primer producto de DELIVERSO.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/admin/products/new"
              className={buttonClassName({ variant: "secondary" })}
            >
              Crear producto
            </Link>
          </div>
        </div>
      ) : result.items.length === 0 ? (
        <p className="type-body text-muted-foreground">
          No hay productos con esos filtros.
        </p>
      ) : (
        <>
          <ProductList items={result.items} />
          {pageCount > 1 ? (
            <nav aria-label="Paginación" className="flex justify-center gap-2">
              {result.page > 1 ? (
                <Link
                  href={pageHref(result.page - 1)}
                  className={buttonClassName({ variant: "outline", size: "sm" })}
                >
                  Anterior
                </Link>
              ) : null}
              <p className="inline-flex min-h-10 items-center type-caption">
                Página {result.page} de {pageCount}
              </p>
              {result.page < pageCount ? (
                <Link
                  href={pageHref(result.page + 1)}
                  className={buttonClassName({ variant: "outline", size: "sm" })}
                >
                  Siguiente
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
