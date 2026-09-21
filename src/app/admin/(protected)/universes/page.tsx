import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { listAdminUniverses } from "@/modules/catalog/queries";

type PageProps = {
  searchParams: Promise<{ ok?: string }>;
};

export default async function AdminUniversesPage({ searchParams }: PageProps) {
  const { ok } = await searchParams;
  const items = await listAdminUniverses();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2">Universos</h2>
          <p className="mt-2 max-w-2xl type-body text-muted-foreground">
            Universos temáticos del catálogo. Se activan o desactivan; no hay
            hard delete.
          </p>
        </div>
        <Link
          href="/admin/universes/new"
          className={buttonClassName({ variant: "secondary" })}
        >
          + Nuevo universo
        </Link>
      </div>
      {ok === "created" ? (
        <p role="status" className="type-caption text-secondary">
          Universo creado.
        </p>
      ) : null}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-[var(--admin-surface)] px-6 py-16 text-center">
          <p className="type-h3">Aún no hay universos.</p>
          <p className="mx-auto mt-3 max-w-md type-body text-muted-foreground">
            Crea el primero para clasificar productos y destacarlo en el Home.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-[var(--admin-surface)]">
          <table className="w-full min-w-[40rem] text-left">
            <thead>
              <tr className="border-b border-border type-caption text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Actualizado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 type-body">{item.name}</td>
                  <td className="px-4 py-3 type-caption">
                    {item.isActive ? "Activo" : "Inactivo"}
                  </td>
                  <td className="px-4 py-3 type-caption tabular-nums">
                    {item.productCount}
                  </td>
                  <td className="px-4 py-3 type-caption tabular-nums">
                    {item.sortOrder}
                  </td>
                  <td className="px-4 py-3 type-caption">
                    {item.updatedAt.toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/universes/${item.id}`}
                      className="type-label text-secondary hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
