import Link from "next/link";
import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { buttonClassName } from "@/components/ui/button";
import { listAdminCategories } from "@/modules/catalog/queries";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const { ok } = await searchParams;
  const items = await listAdminCategories();

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products/categories" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2">Categorías</h2>
          <p className="mt-2 type-body text-muted-foreground">
            Cada categoría pertenece a una línea de negocio.
          </p>
        </div>
        <Link
          href="/admin/products/categories/new"
          className={buttonClassName({ variant: "secondary" })}
        >
          + Nueva categoría
        </Link>
      </div>
      {ok === "created" ? (
        <p role="status" className="type-caption text-secondary">
          Categoría creada.
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="type-body text-muted-foreground">Aún no hay categorías.</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-[var(--admin-surface)] px-4 py-4"
            >
              <div>
                <p className="type-body">{item.name}</p>
                <p className="type-caption text-muted-foreground">
                  {item.businessLineName} · {item.isActive ? "Activa" : "Inactiva"}
                </p>
              </div>
              <Link
                href={`/admin/products/categories/${item.id}`}
                className="type-label text-secondary hover:underline"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
