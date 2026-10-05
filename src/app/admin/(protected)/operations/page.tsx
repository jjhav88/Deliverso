import Link from "next/link";
import { OperationsFilters } from "@/modules/operations/components/operations-filters";
import { OperationsMetricsCards } from "@/modules/operations/components/operations-metrics";
import { OperationsOrderCard } from "@/modules/operations/components/operations-order-card";
import { getOperationsMetrics, listOperationsOrders } from "@/modules/operations/queries";

type PageProps = {
  searchParams: Promise<{
    view?: string;
    method?: string;
    fulfillmentStatus?: string;
    type?: string;
    q?: string;
    page?: string;
  }>;
};

function emptyCopy(view: string | undefined) {
  if (view === "overdue") {
    return "Todo al día. No hay pedidos atrasados.";
  }
  if (view === "tomorrow") {
    return "No hay pedidos programados para mañana.";
  }
  if (view === "week") {
    return "No hay pedidos programados en los próximos 7 días.";
  }
  if (view === "all") {
    return "No hay pedidos operativos con estos filtros.";
  }
  return "No hay pedidos programados para hoy.";
}

export default async function AdminOperationsPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [metrics, list] = await Promise.all([
    getOperationsMetrics(),
    listOperationsOrders(filters),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="type-label tracking-[0.18em] text-secondary">Operación</p>
        <h2 className="type-h2 mt-3">Centro operativo</h2>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          Producción, entregas y recogidas del día. Order sigue siendo la autoridad.
        </p>
      </div>

      <OperationsMetricsCards metrics={metrics} />
      <OperationsFilters filters={filters} />

      {list.missingSchedule.length > 0 ? (
        <section className="grid gap-4">
          <h3 className="type-h3">Requiere programación</h3>
          <p className="type-body-sm text-muted-foreground">
            Pedidos operativos sin fecha u horario válido de fulfillment.
          </p>
          <div className="grid gap-4 xl:grid-cols-2">
            {list.missingSchedule.map((order) => (
              <OperationsOrderCard key={`missing-${order.id}`} order={order} />
            ))}
          </div>
        </section>
      ) : null}

      {list.pendingPayment.length > 0 ? (
        <section className="grid gap-4">
          <h3 className="type-h3">Pendientes de pago</h3>
          <p className="type-body-sm text-muted-foreground">
            No cuentan como producción confirmada hasta que el pago esté completado.
          </p>
          <div className="grid gap-4 xl:grid-cols-2">
            {list.pendingPayment.map((order) => (
              <OperationsOrderCard key={`pending-${order.id}`} order={order} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        {list.items.length === 0 ? (
          <p className="type-body text-muted-foreground">{emptyCopy(filters.view)}</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {list.items.map((order) => (
              <OperationsOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {filters.view === "all" && list.pageCount > 1 ? (
        <p className="type-caption text-muted-foreground">
          Página {list.page} de {list.pageCount} · {list.total} pedidos
          {list.page < list.pageCount ? (
            <>
              {" · "}
              <Link
                href={`/admin/operations?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])),
                  ),
                  page: String(list.page + 1),
                }).toString()}`}
                className="text-secondary"
              >
                Siguiente
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
