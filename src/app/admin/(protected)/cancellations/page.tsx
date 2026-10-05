import { buttonClassName } from "@/components/ui/button";
import { listAdminCancellationRequests } from "@/modules/cancellations/queries";
import { cancellationRequestStatuses } from "@/modules/cancellations/domain/types";
import { cancellationStatusLabel } from "@/modules/cancellations/domain/labels";
import { AdminCancellationCard } from "@/modules/cancellations/components/admin-cancellation-card";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminCancellationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status ?? "REQUESTED";
  const items = await listAdminCancellationRequests({ status });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h2 className="type-h2">Cancelaciones</h2>
        <p className="mt-2 type-body text-muted-foreground">
          Revisa las solicitudes de cancelación de clientes. Los reembolsos solo se consideran
          completados cuando Stripe los confirma.
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
            {cancellationRequestStatuses.map((item) => (
              <option key={item} value={item}>
                {cancellationStatusLabel(item)}
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
        <div className="grid gap-4">
          {items.map((item) => (
            <AdminCancellationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
