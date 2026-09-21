import Link from "next/link";
import { CatalogSubnav } from "@/modules/admin/components/catalog-subnav";
import { buttonClassName } from "@/components/ui/button";
import { listAdminBusinessLines } from "@/modules/catalog/queries";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function AdminBusinessLinesPage({ searchParams }: PageProps) {
  const { ok } = await searchParams;
  const items = await listAdminBusinessLines();

  return (
    <div className="flex flex-col gap-8">
      <CatalogSubnav pathname="/admin/products/business-lines" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2">Líneas de negocio</h2>
          <p className="mt-2 type-body text-muted-foreground">
            Familias comerciales de DELIVERSO. Cada producto debe pertenecer a
            una. Ejemplos: Pastelería, Mesas dulces, Personalizados.
          </p>
        </div>
        <Link
          href="/admin/products/business-lines/new"
          className={buttonClassName({ variant: "secondary" })}
        >
          + Nueva línea
        </Link>
      </div>
      {ok === "created" ? (
        <p role="status" className="type-caption text-secondary">
          Línea de negocio creada.
        </p>
      ) : null}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-[var(--admin-surface)] px-6 py-12 text-center">
          <p className="type-h3">Aún no hay líneas de negocio.</p>
          <p className="mx-auto mt-3 max-w-md type-body text-muted-foreground">
            Créalas antes de añadir productos. Sirven para clasificar el
            catálogo, no se rellenan solas.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/admin/products/business-lines/new"
              className={buttonClassName({ variant: "secondary" })}
            >
              Crear la primera línea
            </Link>
          </div>
        </div>
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
                  {item.isActive ? "Activa" : "Inactiva"} · orden {item.sortOrder}
                </p>
              </div>
              <Link
                href={`/admin/products/business-lines/${item.id}`}
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
