import Link from "next/link";
import { listAdminOrders } from "@/modules/admin/orders/queries";
import { orderStatuses } from "@/modules/orders/domain/status";
import { paymentStatuses } from "@/modules/orders/domain/payment-status";
import { fulfillmentStatuses } from "@/modules/orders/domain/fulfillment-status";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type PageProps = {
  searchParams: Promise<{
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const result = await listAdminOrders(filters);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="type-h2">Pedidos</h2>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          Pedidos inmutables. Los importes no se editan después de la creación.
        </p>
      </div>

      <form className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-4 md:grid-cols-3">
        <label className="grid gap-1 type-caption">
          Pedido
          <select name="status" defaultValue={filters.status ?? ""} className="min-h-10 border border-border px-2">
            <option value="">Todos</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Pago
          <select
            name="paymentStatus"
            defaultValue={filters.paymentStatus ?? ""}
            className="min-h-10 border border-border px-2"
          >
            <option value="">Todos</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Fulfillment
          <select
            name="fulfillmentStatus"
            defaultValue={filters.fulfillmentStatus ?? ""}
            className="min-h-10 border border-border px-2"
          >
            <option value="">Todos</option>
            {fulfillmentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Desde
          <input type="date" name="from" defaultValue={filters.from ?? ""} className="min-h-10 border border-border px-2" />
        </label>
        <label className="grid gap-1 type-caption">
          Hasta
          <input type="date" name="to" defaultValue={filters.to ?? ""} className="min-h-10 border border-border px-2" />
        </label>
        <label className="grid gap-1 type-caption md:col-span-3">
          Buscar número o correo
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            className="min-h-10 border border-border px-2"
          />
        </label>
        <button type="submit" className="type-label text-secondary">
          Filtrar
        </button>
      </form>

      {result.items.length === 0 ? (
        <p className="type-body text-muted-foreground">Todavía no hay pedidos.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-[var(--admin-surface)]">
          <table className="w-full min-w-[56rem] text-left">
            <thead>
              <tr className="border-b border-border type-caption text-muted-foreground">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Fulfillment</th>
                <th className="px-4 py-3 font-medium">Solicitada</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-secondary">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customerEmail}</td>
                  <td className="px-4 py-3">{formatAdminDate(order.createdAt)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatMoneyFromMinorUnits(order.grandTotalMinor, "MXN", "es-MX")}
                  </td>
                  <td className="px-4 py-3">{order.paymentStatus}</td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">{order.fulfillmentStatus}</td>
                  <td className="px-4 py-3">{order.requestedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.pageCount > 1 ? (
        <p className="type-caption text-muted-foreground">
          Página {result.page} de {result.pageCount} · {result.total} pedidos
          {result.page < result.pageCount ? (
            <>
              {" · "}
              <Link
                href={`/admin/orders?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])),
                  ),
                  page: String(result.page + 1),
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
