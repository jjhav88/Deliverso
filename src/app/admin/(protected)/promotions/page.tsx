import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { listAdminPromotions } from "@/modules/promotions/admin-queries";
import { utcToMexicoCityLocal } from "@/modules/promotions/domain/admin-datetime";

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

function benefitLabel(row: {
  benefitType: string;
  percentageBps: number | null;
  fixedAmountMinor: number | null;
}) {
  if (row.benefitType === "PERCENTAGE" && row.percentageBps) {
    return `${row.percentageBps / 100}%`;
  }
  if (row.benefitType === "FIXED_AMOUNT" && row.fixedAmountMinor) {
    return `$${(row.fixedAmountMinor / 100).toFixed(2)} MXN`;
  }
  if (row.benefitType === "FREE_DELIVERY") {
    return "Envío gratis";
  }
  return row.benefitType;
}

function windowLabel(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt && !endsAt) {
    return "Sin vigencia";
  }
  return `${startsAt ? utcToMexicoCityLocal(startsAt) : "—"} → ${endsAt ? utcToMexicoCityLocal(endsAt) : "—"}`;
}

export default async function AdminPromotionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const items = await listAdminPromotions({ status: params.status, q: params.q });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="type-h2">Promociones</h2>
          <p className="mt-2 max-w-2xl type-body text-muted-foreground">
            Motor de descuentos en MXN. Una promoción por pedido. Sin hard delete.
          </p>
        </div>
        <Link href="/admin/promotions/new" className={buttonClassName({ variant: "secondary" })}>
          + Nueva promoción
        </Link>
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
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PAUSED">PAUSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </label>
        <label className="grid gap-1 type-caption">
          Buscar
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Nombre o código"
            className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
          />
        </label>
        <button type="submit" className={buttonClassName({ variant: "secondary", size: "sm" })}>
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-[var(--admin-surface)] px-6 py-16 text-center">
          <p className="type-h3">Aún no hay promociones.</p>
          <p className="mx-auto mt-3 max-w-md type-body text-muted-foreground">
            Crea un borrador y actívalo cuando la regla esté completa.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-[var(--admin-surface)]">
          <table className="w-full min-w-[56rem] text-left">
            <thead>
              <tr className="border-b border-border type-caption text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Modo</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Beneficio</th>
                <th className="px-4 py-3 font-medium">Vigencia</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Usos</th>
                <th className="px-4 py-3 font-medium">Prioridad</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 type-body">{item.internalName}</td>
                  <td className="px-4 py-3 type-caption">{item.mode === "CODE" ? "Código" : "Automática"}</td>
                  <td className="px-4 py-3 type-caption">{item.normalizedCode ?? "—"}</td>
                  <td className="px-4 py-3 type-caption">{benefitLabel(item)}</td>
                  <td className="px-4 py-3 type-caption">{windowLabel(item.startsAt, item.endsAt)}</td>
                  <td className="px-4 py-3 type-caption">{item.derivedLabel}</td>
                  <td className="px-4 py-3 type-caption tabular-nums">
                    {item.usedCount}
                    {item.usageLimitTotal != null ? ` / ${item.usageLimitTotal}` : ""}
                  </td>
                  <td className="px-4 py-3 type-caption tabular-nums">{item.priority}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/promotions/${item.id}`} className="type-label text-secondary hover:underline">
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
