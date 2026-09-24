import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { listAdminCancellationRequests } from "@/modules/cancellations/queries";
import { cancellationRequestStatuses } from "@/modules/cancellations/domain/types";
import { cancellationStatusLabel, refundReasonLabel } from "@/modules/cancellations/domain/labels";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import { AdminReviewCancellationForm } from "@/modules/cancellations/components/admin-refund-form";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminCancellationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status ?? "REQUESTED";
  const items = await listAdminCancellationRequests({ status });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="type-h2">Cancelaciones</h2>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          Bandeja de solicitudes del cliente. Aprobar inicia un reembolso total; no marca el dinero
          como devuelto hasta que Stripe confirme.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="grid gap-1 type-caption">
          Estado
          <select
            name="status"
            defaultValue={status}
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          >
            <option value="">Todas</option>
            {cancellationRequestStatuses.map((status) => (
              <option key={status} value={status}>
                {cancellationStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClassName({ variant: "secondary", size: "sm" })}>
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-[var(--admin-surface)] px-6 py-16 text-center">
          <p className="type-h3">No hay solicitudes.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-[var(--admin-surface)]">
          <table className="w-full min-w-[56rem] text-left">
            <thead>
              <tr className="border-b border-border type-caption text-muted-foreground">
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Fulfillment</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium">Solicitada</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${item.orderId}`} className="type-label text-secondary hover:underline">
                      {item.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 type-caption">
                    {item.customerName}
                    <br />
                    {item.customerEmail}
                  </td>
                  <td className="px-4 py-3 type-caption tabular-nums">
                    {formatMoneyFromMinorUnits(item.grandTotalMinor, "MXN", "es-MX")}
                  </td>
                  <td className="px-4 py-3 type-caption">{item.fulfillmentStatus}</td>
                  <td className="px-4 py-3 type-caption">{refundReasonLabel(item.reason)}</td>
                  <td className="px-4 py-3 type-caption">
                    {new Date(item.createdAt).toLocaleString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="type-caption">{cancellationStatusLabel(item.status)}</p>
                    {item.status === "REQUESTED" ? (
                      <div className="mt-3 max-w-md">
                        <AdminReviewCancellationForm requestId={item.id} canReview />
                      </div>
                    ) : null}
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
