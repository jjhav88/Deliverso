"use client";

import { useActionState, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import {
  approveCancellationRequest,
  rejectCancellationRequest,
} from "@/modules/cancellations/admin-actions";
import { emptyCancellationActionState } from "@/modules/cancellations/action-state";
import { approveRefundConfirmCopy } from "@/modules/cancellations/domain/presentation";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

type ReviewPanel = "idle" | "approve" | "reject";

export function AdminReviewCancellationForm({
  requestId,
  canReview,
  refundableMinor,
}: {
  requestId: string;
  canReview: boolean;
  refundableMinor: number;
}) {
  const [panel, setPanel] = useState<ReviewPanel>("idle");
  const confirmRef = useRef<HTMLDialogElement>(null);
  const confirmTitleId = useId();
  const confirmCopyId = useId();
  const [approveState, approveAction, approvePending] = useActionState(
    approveCancellationRequest,
    emptyCancellationActionState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectCancellationRequest,
    emptyCancellationActionState,
  );
  const amountLabel = formatMoneyFromMinorUnits(refundableMinor, "MXN", "es-MX");

  if (!canReview) {
    return null;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h4 className="type-h3">Acción administrativa</h4>
        <p className="mt-2 type-body-sm text-muted-foreground">
          Elige una acción. El reembolso solo se considera completo cuando Stripe lo confirma.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => setPanel("approve")}
          aria-pressed={panel === "approve"}
        >
          Aprobar cancelación
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPanel("reject")}
          aria-pressed={panel === "reject"}
        >
          Rechazar solicitud
        </Button>
      </div>

      {panel === "approve" ? (
        <form action={approveAction} className="grid gap-4 rounded-lg border border-border-strong bg-background p-5">
          <input type="hidden" name="requestId" value={requestId} />
          <h5 className="type-h3">Aprobar cancelación</h5>
          <p className="type-body-sm text-muted-foreground">
            Esta acción solicitará a Stripe un reembolso por el monto reembolsable del pedido.
          </p>
          <p className="type-body tabular-nums">
            Monto a reembolsar: <strong>{amountLabel}</strong>
          </p>
          <Textarea name="adminMessage" label="Mensaje al cliente" helperText="Opcional" rows={3} />
          <label className="flex items-start gap-3 type-body-sm">
            <input
              type="checkbox"
              name="ready"
              value="1"
              required
              className="mt-1 size-4 shrink-0"
            />
            <span>
              Confirmo que deseo aprobar la cancelación y solicitar el reembolso total a Stripe.
            </span>
          </label>
          <AdminFeedback error={approveState.error} success={approveState.success} />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={approvePending}
              onClick={(event) => {
                const form = event.currentTarget.form;
                const ready = form?.querySelector<HTMLInputElement>('input[name="ready"]');
                if (ready && !ready.checked) {
                  ready.reportValidity();
                  return;
                }
                confirmRef.current?.showModal();
              }}
            >
              Aprobar y reembolsar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPanel("idle")}>
              Volver
            </Button>
          </div>
          <dialog
            ref={confirmRef}
            aria-labelledby={confirmTitleId}
            aria-describedby={confirmCopyId}
            className="fixed inset-0 z-50 m-auto w-[min(28rem,92vw)] rounded-lg border border-border bg-[var(--admin-surface)] p-6 text-foreground backdrop:bg-black/40"
          >
            <h2 id={confirmTitleId} className="type-h3">
              Confirmar reembolso
            </h2>
            <p id={confirmCopyId} className="mt-3 type-body text-muted-foreground">
              {approveRefundConfirmCopy(amountLabel)}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => confirmRef.current?.close()}
                disabled={approvePending}
              >
                Volver
              </Button>
              <Button
                type="submit"
                name="confirm"
                value="1"
                variant="destructive"
                loading={approvePending}
                disabled={approvePending}
              >
                Confirmar reembolso
              </Button>
            </div>
          </dialog>
        </form>
      ) : null}

      {panel === "reject" ? (
        <form action={rejectAction} className="grid gap-4 rounded-lg border border-border-strong bg-background p-5">
          <input type="hidden" name="requestId" value={requestId} />
          <h5 className="type-h3">Rechazar solicitud</h5>
          <Textarea name="adminMessage" label="Mensaje al cliente" helperText="Opcional" rows={3} />
          <AdminFeedback error={rejectState.error} success={rejectState.success} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="outline" loading={rejectPending} disabled={rejectPending}>
              Rechazar solicitud
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPanel("idle")}>
              Volver
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
