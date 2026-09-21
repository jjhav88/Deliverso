"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import {
  refreshExchangeRatesAction,
  type ExchangeRateRefreshState,
} from "@/modules/settings/exchange-rate-actions";

export type ExchangeRateAdminRow = {
  quote: string;
  rate: string | null;
};

export type ExchangeRateAdminStatus = {
  provider: string;
  source: string;
  baseCurrency: string;
  fetchedAt: string | null;
  sourceDate: string | null;
  stale: boolean;
  rows: ExchangeRateAdminRow[];
};

const initial: ExchangeRateRefreshState = { error: null, success: null };

export function ExchangeRatesPanel({ status }: { status: ExchangeRateAdminStatus }) {
  const [state, action, pending] = useActionState(
    refreshExchangeRatesAction,
    initial,
  );

  return (
    <section className="mx-auto mt-10 max-w-2xl rounded-lg border border-border bg-[var(--admin-surface)] p-5">
      <h2 className="type-h2">Tipos de cambio</h2>
      <p className="mt-2 type-body text-muted-foreground">
        Tasas de referencia para visualización. No se pueden editar a mano.
      </p>
      <dl className="mt-5 grid gap-2 type-body-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Proveedor</dt>
          <dd>{status.source} vía Frankfurter</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Base</dt>
          <dd>{status.baseCurrency}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Última consulta</dt>
          <dd>{status.fetchedAt ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Fecha de referencia</dt>
          <dd>{status.sourceDate ?? "—"}</dd>
        </div>
      </dl>
      <ul className="mt-5 grid gap-2 type-body-sm">
        {status.rows.map((row) => (
          <li key={row.quote} className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {status.baseCurrency} → {row.quote}
            </span>
            <span>{row.rate ?? "—"}</span>
          </li>
        ))}
      </ul>
      {status.stale ? (
        <p className="mt-3 type-caption text-muted-foreground">
          La última referencia está en modo de respaldo.
        </p>
      ) : null}
      <form action={action} className="mt-6">
        <Button type="submit" disabled={pending}>
          Actualizar tasas
        </Button>
      </form>
      <AdminFeedback error={state.error} success={state.success} />
    </section>
  );
}
