"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { refundReasons, type RefundReason } from "@/modules/cancellations/domain/types";
import {
  requestOrderCancellation,
  withdrawCancellationRequest,
} from "@/modules/cancellations/customer-actions";
import { emptyCancellationActionState } from "@/modules/cancellations/action-state";

type Labels = {
  request: string;
  confirm: string;
  close: string;
  reason: string;
  message: string;
  messageOptional: string;
  submit: string;
  withdraw: string;
  pending: string;
  reasons: Record<RefundReason, string>;
};

export function RequestCancellationForm({
  orderNumber,
  canRequest,
  requestId,
  canWithdraw,
  labels,
}: {
  orderNumber: string;
  canRequest: boolean;
  requestId?: string;
  canWithdraw: boolean;
  labels: Labels;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    requestOrderCancellation,
    emptyCancellationActionState,
  );
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(
    withdrawCancellationRequest,
    emptyCancellationActionState,
  );

  return (
    <div className="grid gap-3">
      {canRequest ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => dialogRef.current?.showModal()}
          >
            {labels.request}
          </Button>
          <dialog
            ref={dialogRef}
            className="w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-border bg-background p-6 text-foreground backdrop:bg-black/40"
          >
            <form action={action} className="grid gap-4">
              <input type="hidden" name="orderNumber" value={orderNumber} />
              <h2 className="type-h3">{labels.confirm}</h2>
              <label className="grid gap-2">
                <span className="type-label tracking-[0.12em] text-secondary">{labels.reason}</span>
                <select
                  name="reason"
                  required
                  className="min-h-11 rounded-md border border-border-strong bg-background px-3"
                >
                  {refundReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {labels.reasons[reason]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="type-label tracking-[0.12em] text-secondary">
                  {labels.message} <span className="text-muted-foreground">{labels.messageOptional}</span>
                </span>
                <textarea
                  name="customerMessage"
                  rows={4}
                  className="rounded-md border border-border-strong bg-background px-3 py-3"
                />
              </label>
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
              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={pending} disabled={pending}>
                  {labels.submit}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => dialogRef.current?.close()}
                >
                  {labels.close}
                </Button>
              </div>
            </form>
          </dialog>
        </>
      ) : null}

      {canWithdraw && requestId ? (
        <form action={withdrawAction} className="grid gap-2">
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <input type="hidden" name="requestId" value={requestId} />
          {withdrawState.error ? (
            <p role="alert" className="type-caption text-destructive">
              {withdrawState.error}
            </p>
          ) : null}
          <Button type="submit" variant="ghost" loading={withdrawPending} disabled={withdrawPending}>
            {labels.withdraw}
          </Button>
        </form>
      ) : null}
      <p className="sr-only">{labels.pending}</p>
    </div>
  );
}
