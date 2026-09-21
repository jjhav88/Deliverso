import { Button } from "@/components/ui/button";
import { retryEmailOutbox } from "@/modules/email/admin-actions";
import Link from "next/link";
import type { getEmailAdminState } from "@/modules/email/admin-queries";

type CommunicationsPanelProps = {
  state: Awaited<ReturnType<typeof getEmailAdminState>>;
};

export function CommunicationsPanel({ state }: CommunicationsPanelProps) {
  return (
    <section className="mx-auto mt-10 max-w-2xl">
      <h2 className="type-h2">Comunicaciones</h2>
      <p className="mt-2 type-body text-muted-foreground">
        Emails transaccionales. El envío no ocurre dentro del webhook ni de las
        acciones de Admin.
      </p>

      <dl className="mt-6 grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-5 type-body">
        <div>
          <dt className="type-caption text-muted-foreground">Provider</dt>
          <dd>{state.provider}</dd>
        </div>
        <div>
          <dt className="type-caption text-muted-foreground">Mode</dt>
          <dd>{state.mode === "sandbox" ? "Sandbox" : state.mode}</dd>
        </div>
        <div>
          <dt className="type-caption text-muted-foreground">From</dt>
          <dd>{state.from}</dd>
        </div>
        <div>
          <dt className="type-caption text-muted-foreground">Sandbox recipient</dt>
          <dd>{state.sandboxRecipientMasked ?? "—"}</dd>
        </div>
      </dl>

      <ul className="mt-6 grid grid-cols-2 gap-3 type-body sm:grid-cols-5">
        <li>Pending: {state.counters.pending}</li>
        <li>Processing: {state.counters.processing}</li>
        <li>Failed: {state.counters.failed}</li>
        <li>Dead: {state.counters.dead}</li>
        <li>Sent today: {state.counters.sentToday}</li>
      </ul>

      <p className="mt-6">
        <Link href="/admin/settings/email-preview" className="type-label tracking-[0.12em] text-secondary">
          Vista previa de plantillas
        </Link>
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left type-caption">
          <thead>
            <tr>
              <th className="py-2">Template</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Created</th>
              <th>Sent</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.recent.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="py-2">{row.template}</td>
                <td>{row.recipientMasked}</td>
                <td>{row.status}</td>
                <td>{row.attemptCount}</td>
                <td>{row.createdAt.slice(0, 16)}</td>
                <td>{row.sentAt ? row.sentAt.slice(0, 16) : "—"}</td>
                <td>
                  {row.status === "FAILED" || row.status === "DEAD" ? (
                    <form action={retryEmailOutbox}>
                      <input type="hidden" name="outboxId" value={row.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Reintentar
                      </Button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
