"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { refundReasons } from "@/modules/cancellations/domain/types";
import { refundReasonLabel } from "@/modules/cancellations/domain/labels";
import {
  cancelPendingOrderByAdmin,
  createAdminRefundAction,
  retryFailedRefundAction,
  approveCancellationRequest,
  rejectCancellationRequest,
} from "@/modules/cancellations/admin-actions";
import { emptyCancellationActionState } from "@/modules/cancellations/action-state";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

export function AdminRefundForm({
  orderId,
  paidMinor,
  refundedMinor,
  refundableMinor,
  canRefund,
  failedRefundId,
}: {
  orderId: string;
  paidMinor: number;
  refundedMinor: number;
  refundableMinor: number;
  canRefund: boolean;
  failedRefundId?: string | null;
}) {
  const [type, setType] = useState<"FULL" | "PARTIAL">("FULL");
  const [amountMajor, setAmountMajor] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createAdminRefundAction,
    emptyCancellationActionState,
  );
  const [retryState, retryAction, retryPending] = useActionState(
    retryFailedRefundAction,
    emptyCancellationActionState,
  );

  const previewMinor = useMemo(() => {
    if (type === "FULL") {
      return refundableMinor;
    }
    const major = Number(amountMajor.replace(",", "."));
    if (!Number.isFinite(major) || major <= 0) {
      return 0;
    }
    return Math.round(major * 100);
  }, [amountMajor, refundableMinor, type]);

  const confirmLabel = `Esta acción solicitará a Stripe un reembolso de ${formatMoneyFromMinorUnits(previewMinor, "MXN", "es-MX")}.`;

  if (!canRefund && !failedRefundId) {
    return null;
  }

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
      <h3 className="type-h3">Reembolso</h3>
      <p className="type-body-sm tabular-nums">
        Total pagado {formatMoneyFromMinorUnits(paidMinor, "MXN", "es-MX")} · Ya reembolsado{" "}
        {formatMoneyFromMinorUnits(refundedMinor, "MXN", "es-MX")} · Disponible{" "}
        {formatMoneyFromMinorUnits(refundableMinor, "MXN", "es-MX")}
      </p>
      {canRefund ? (
        <form action={action} className="grid gap-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="type" value={type} />
          <fieldset className="grid gap-2">
            <legend className="type-caption">Tipo</legend>
            <label className="flex items-center gap-2 type-body-sm">
              <input
                type="radio"
                name="typeChoice"
                checked={type === "FULL"}
                onChange={() => setType("FULL")}
              />
              Reembolso total restante
            </label>
            <label className="flex items-center gap-2 type-body-sm">
              <input
                type="radio"
                name="typeChoice"
                checked={type === "PARTIAL"}
                onChange={() => setType("PARTIAL")}
              />
              Reembolso parcial
            </label>
          </fieldset>
          {type === "PARTIAL" ? (
            <label className="grid gap-1 type-caption">
              Monto (MXN)
              <input
                name="amountMajor"
                inputMode="decimal"
                value={amountMajor}
                onChange={(event) => setAmountMajor(event.target.value)}
                className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
              />
            </label>
          ) : null}
          <label className="grid gap-1 type-caption">
            Motivo
            <select
              name="reason"
              required
              className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3"
            >
              {refundReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {refundReasonLabel(reason)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 type-caption">
            Nota interna (opcional)
            <textarea
              name="internalNote"
              rows={3}
              className="rounded-md border border-border-strong bg-surface-elevated px-3 py-2"
            />
          </label>
          <p className="type-body-sm tabular-nums">
            Nuevo reembolso: {formatMoneyFromMinorUnits(previewMinor, "MXN", "es-MX")} · Neto estimado:{" "}
            {formatMoneyFromMinorUnits(Math.max(0, paidMinor - refundedMinor - previewMinor), "MXN", "es-MX")}
          </p>
          {state.error ? (
            <p role="alert" className="type-caption text-destructive">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="type-caption text-secondary">
              {state.success}
            </p>
          ) : null}
          {confirmOpen ? (
            <div className="grid gap-3 rounded-md border border-border-strong p-4">
              <p className="type-body-sm">{confirmLabel}</p>
              <label className="flex items-center gap-2 type-body-sm">
                <input type="checkbox" name="confirm" value="1" required />
                Confirmo este reembolso
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="destructive" loading={pending} disabled={pending || previewMinor <= 0}>
                  Enviar a Stripe
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Volver
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" onClick={() => setConfirmOpen(true)} disabled={previewMinor <= 0}>
              Revisar reembolso
            </Button>
          )}
        </form>
      ) : null}
      {failedRefundId ? (
        <form action={retryAction} className="grid gap-2">
          <input type="hidden" name="refundId" value={failedRefundId} />
          <input type="hidden" name="orderId" value={orderId} />
          {retryState.error ? (
            <p role="alert" className="type-caption text-destructive">
              {retryState.error}
            </p>
          ) : null}
          {retryState.success ? (
            <p role="status" className="type-caption text-secondary">
              {retryState.success}
            </p>
          ) : null}
          <Button type="submit" variant="secondary" loading={retryPending} disabled={retryPending}>
            Reintentar reembolso fallido
          </Button>
        </form>
      ) : null}
    </section>
  );
}

export function AdminCancelPendingForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
      <h3 className="type-h3">Cancelar pedido pendiente</h3>
      <p className="type-body-sm text-muted-foreground">
        No hay pago succeeded. Se cancela el PaymentIntent si aplica y se libera la promoción.
      </p>
      {open ? (
        <form action={cancelPendingOrderByAdmin} className="grid gap-3">
          <input type="hidden" name="orderId" value={orderId} />
          <label className="flex items-center gap-2 type-body-sm">
            <input type="checkbox" name="confirm" value="1" required />
            Confirmo cancelar este pedido sin reembolso
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="destructive" size="sm">
              Cancelar pedido
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Volver
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Cancelar pedido pendiente
        </Button>
      )}
    </section>
  );
}

export function AdminCancelPaidForm({
  orderId,
  refundableMinor,
}: {
  orderId: string;
  refundableMinor: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createAdminRefundAction,
    emptyCancellationActionState,
  );
  const amount = formatMoneyFromMinorUnits(refundableMinor, "MXN", "es-MX");
  return (
    <section className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-6">
      <h3 className="type-h3">Cancelar pedido</h3>
      <p className="type-body-sm">
        Cancela el pedido y solicita a Stripe un reembolso total restante de {amount}.
      </p>
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="type-caption text-secondary">
          {state.success}
        </p>
      ) : null}
      {open ? (
        <form action={action} className="grid gap-3">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="type" value="FULL" />
          <input type="hidden" name="cancelsOrder" value="1" />
          <input type="hidden" name="reason" value="OTHER" />
          <label className="flex items-center gap-2 type-body-sm">
            <input type="checkbox" name="confirm" value="1" required />
            Esta acción solicitará a Stripe un reembolso de {amount}.
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="destructive" loading={pending} disabled={pending}>
              Confirmar cancelación y reembolso
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Volver
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Cancelar pedido
        </Button>
      )}
    </section>
  );
}

export function AdminReviewCancellationForm({
  requestId,
  canReview,
}: {
  requestId: string;
  canReview: boolean;
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveCancellationRequest,
    emptyCancellationActionState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectCancellationRequest,
    emptyCancellationActionState,
  );

  if (!canReview) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form action={approveAction} className="grid gap-3">
        <input type="hidden" name="requestId" value={requestId} />
        <label className="grid gap-1 type-caption">
          Mensaje al cliente (opcional)
          <textarea
            name="adminMessage"
            rows={3}
            className="rounded-md border border-border-strong bg-surface-elevated px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 type-body-sm">
          <input type="checkbox" name="confirm" value="1" required />
          Aprobar y solicitar reembolso total a Stripe
        </label>
        {approveState.error ? (
          <p role="alert" className="type-caption text-destructive">
            {approveState.error}
          </p>
        ) : null}
        {approveState.success ? (
          <p role="status" className="type-caption text-secondary">
            {approveState.success}
          </p>
        ) : null}
        <Button type="submit" loading={approvePending} disabled={approvePending}>
          Aprobar
        </Button>
      </form>
      <form action={rejectAction} className="grid gap-3">
        <input type="hidden" name="requestId" value={requestId} />
        <label className="grid gap-1 type-caption">
          Mensaje al cliente (opcional)
          <textarea
            name="adminMessage"
            rows={3}
            className="rounded-md border border-border-strong bg-surface-elevated px-3 py-2"
          />
        </label>
        {rejectState.error ? (
          <p role="alert" className="type-caption text-destructive">
            {rejectState.error}
          </p>
        ) : null}
        {rejectState.success ? (
          <p role="status" className="type-caption text-secondary">
            {rejectState.success}
          </p>
        ) : null}
        <Button type="submit" variant="outline" loading={rejectPending} disabled={rejectPending}>
          Rechazar
        </Button>
      </form>
    </div>
  );
}
