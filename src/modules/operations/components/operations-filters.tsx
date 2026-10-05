import Link from "next/link";
import { fulfillmentStatuses } from "@/modules/orders/domain/fulfillment-status";
import { fulfillmentStatusLabel } from "@/modules/orders/domain/labels";
import type { OperationsView } from "@/modules/operations/dto";

const views: Array<{ id: OperationsView; label: string }> = [
  { id: "today", label: "Hoy" },
  { id: "tomorrow", label: "Mañana" },
  { id: "week", label: "Próximos 7 días" },
  { id: "overdue", label: "Atrasados" },
  { id: "all", label: "Todos" },
];

export function OperationsFilters({
  filters,
}: {
  filters: {
    view?: string;
    method?: string;
    fulfillmentStatus?: string;
    type?: string;
    q?: string;
  };
}) {
  const currentView = filters.view ?? "today";
  const paramsFor = (view: string) => {
    const params = new URLSearchParams();
    params.set("view", view);
    if (filters.method) params.set("method", filters.method);
    if (filters.fulfillmentStatus) params.set("fulfillmentStatus", filters.fulfillmentStatus);
    if (filters.type) params.set("type", filters.type);
    if (filters.q) params.set("q", filters.q);
    return `/admin/operations?${params.toString()}`;
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vista operativa">
        {views.map((view) => {
          const selected = currentView === view.id;
          return (
            <Link
              key={view.id}
              href={paramsFor(view.id)}
              role="tab"
              aria-selected={selected}
              className={
                selected
                  ? "rounded-full bg-primary px-4 py-2 type-label text-primary-foreground"
                  : "rounded-full border border-border px-4 py-2 type-label text-foreground hover:bg-muted"
              }
            >
              {view.label}
            </Link>
          );
        })}
      </div>
      <form className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-4 md:grid-cols-4">
        <input type="hidden" name="view" value={currentView} />
        <label className="grid gap-1 type-caption">
          Método
          <select name="method" defaultValue={filters.method ?? ""} className="min-h-10 border border-border bg-background px-2">
            <option value="">Todos</option>
            <option value="DELIVERY">Entrega</option>
            <option value="PICKUP">Recogida</option>
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Estado operativo
          <select
            name="fulfillmentStatus"
            defaultValue={filters.fulfillmentStatus ?? ""}
            className="min-h-10 border border-border bg-background px-2"
          >
            <option value="">Todos</option>
            {fulfillmentStatuses
              .filter((status) => status !== "CANCELLED")
              .map((status) => (
                <option key={status} value={status}>
                  {fulfillmentStatusLabel(status)}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Tipo
          <select name="type" defaultValue={filters.type ?? "all"} className="min-h-10 border border-border bg-background px-2">
            <option value="all">Todos</option>
            <option value="standard">Estándar</option>
            <option value="custom">Personalizado</option>
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Buscar
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Número, cliente o producto"
            className="min-h-10 border border-border bg-background px-2"
          />
        </label>
        <button type="submit" className="type-label text-secondary md:col-span-4">
          Filtrar
        </button>
      </form>
    </div>
  );
}
