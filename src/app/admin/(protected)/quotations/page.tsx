import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { listAdminQuotations } from "@/modules/quotations/admin-queries";
import { quotationStatusLabel } from "@/modules/quotations/domain/labels";
import { quotationStatuses } from "@/modules/quotations/domain/types";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function AdminQuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const items = await listAdminQuotations({ status: params.status, q: params.q });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="type-h2">Cotizaciones</h2>
        <p className="mt-2 max-w-2xl type-body text-muted-foreground">
          Pedidos personalizados. Sin carrito ni promociones. MXN minor units.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="grid gap-1 type-caption">
          Estado
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          >
            <option value="">Todos</option>
            {quotationStatuses.map((status) => (
              <option key={status} value={status}>
                {quotationStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Buscar
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Número, cliente o producto"
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          />
        </label>
        <button type="submit" className={buttonClassName({ variant: "secondary", size: "sm" })}>
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-[var(--admin-surface)] px-6 py-16 text-center">
          <p className="type-h3">Aún no hay cotizaciones.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-[var(--admin-surface)]">
          <table className="w-full min-w-[56rem] text-left">
            <thead>
              <tr className="border-b border-border type-caption text-muted-foreground">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Solicitud</th>
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Vigencia</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotations/${item.id}`} className="type-label text-secondary hover:underline">
                      {item.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 type-caption">
                    {item.customerNameSnapshot}
                    <br />
                    {item.customerEmailSnapshot}
                  </td>
                  <td className="px-4 py-3 type-caption">{item.productNameSnapshot}</td>
                  <td className="px-4 py-3 type-caption">
                    {new Date(item.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3 type-caption">
                    {item.eventDate ? new Date(item.eventDate).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td className="px-4 py-3 type-caption">{quotationStatusLabel(item.status)}</td>
                  <td className="px-4 py-3 type-caption tabular-nums">
                    {item.quotedTotalMinor != null
                      ? formatMoneyFromMinorUnits(item.quotedTotalMinor, "MXN", "es-MX")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 type-caption">
                    {item.validUntil ? new Date(item.validUntil).toLocaleString("es-MX") : "—"}
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
