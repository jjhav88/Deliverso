"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { emptyQuotationActionState } from "@/modules/quotations/action-state";
import {
  acceptQuotationAction,
  cancelQuotationAction,
  declineQuotationAction,
  replyQuotationAction,
  saveQuoteAddressAction,
} from "@/modules/quotations/customer-actions";

type Labels = {
  accept: string;
  decline: string;
  declineConfirm: string;
  cancel: string;
  cancelConfirm: string;
  reply: string;
  replyPlaceholder: string;
  addressTitle: string;
  street: string;
  exterior: string;
  interior: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  reference: string;
  saveAddress: string;
};

export function QuoteCustomerActions({
  quotationId,
  canReply,
  canCancel,
  canAccept,
  needsAddress,
  labels,
}: {
  quotationId: string;
  canReply: boolean;
  canCancel: boolean;
  canAccept: boolean;
  needsAddress: boolean;
  labels: Labels;
}) {
  const [replyState, replyAction, replyPending] = useActionState(
    replyQuotationAction,
    emptyQuotationActionState,
  );
  const [addressState, addressAction, addressPending] = useActionState(
    saveQuoteAddressAction,
    emptyQuotationActionState,
  );
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptQuotationAction,
    emptyQuotationActionState,
  );

  return (
    <div className="grid gap-8">
      {canReply ? (
        <form action={replyAction} className="grid gap-3">
          <input type="hidden" name="quotationId" value={quotationId} />
          <label className="grid gap-2">
            <span className="type-label tracking-[0.12em] text-secondary">{labels.reply}</span>
            <textarea
              name="message"
              required
              rows={4}
              placeholder={labels.replyPlaceholder}
              className="rounded-md border border-border-strong bg-background px-3 py-3"
            />
          </label>
          {replyState.error ? <p role="alert" className="type-caption text-destructive">{replyState.error}</p> : null}
          {replyState.success ? <p role="status" className="type-caption text-secondary">{replyState.success}</p> : null}
          <Button type="submit" loading={replyPending} disabled={replyPending}>
            {labels.reply}
          </Button>
        </form>
      ) : null}

      {needsAddress ? (
        <form action={addressAction} className="grid gap-3">
          <input type="hidden" name="quotationId" value={quotationId} />
          <h3 className="type-h3">{labels.addressTitle}</h3>
          <label className="grid gap-2">
            <span className="type-caption">{labels.street}</span>
            <input name="street" required className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="type-caption">{labels.exterior}</span>
              <input name="exteriorNumber" className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
            </label>
            <label className="grid gap-2">
              <span className="type-caption">{labels.interior}</span>
              <input name="interiorNumber" className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="type-caption">{labels.locality}</span>
            <input name="locality" className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="type-caption">{labels.city}</span>
              <input name="city" required className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
            </label>
            <label className="grid gap-2">
              <span className="type-caption">{labels.state}</span>
              <input name="state" defaultValue="CDMX" className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="type-caption">{labels.postalCode}</span>
            <input name="postalCode" required className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
          </label>
          <label className="grid gap-2">
            <span className="type-caption">{labels.reference}</span>
            <input name="reference" className="min-h-11 rounded-md border border-border-strong bg-background px-3" />
          </label>
          {addressState.error ? <p role="alert" className="type-caption text-destructive">{addressState.error}</p> : null}
          {addressState.success ? <p role="status" className="type-caption text-secondary">{addressState.success}</p> : null}
          <Button type="submit" variant="secondary" loading={addressPending} disabled={addressPending}>
            {labels.saveAddress}
          </Button>
        </form>
      ) : null}

      {canAccept ? (
        <form action={acceptAction}>
          <input type="hidden" name="quotationId" value={quotationId} />
          {acceptState.error ? <p role="alert" className="mb-3 type-caption text-destructive">{acceptState.error}</p> : null}
          <Button type="submit" loading={acceptPending} disabled={acceptPending}>
            {labels.accept}
          </Button>
        </form>
      ) : null}

      {canAccept ? (
        <form
          action={declineQuotationAction}
          onSubmit={(event) => {
            if (!window.confirm(labels.declineConfirm)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="quotationId" value={quotationId} />
          <Button type="submit" variant="ghost">
            {labels.decline}
          </Button>
        </form>
      ) : null}

      {canCancel ? (
        <form
          action={cancelQuotationAction}
          onSubmit={(event) => {
            if (!window.confirm(labels.cancelConfirm)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="quotationId" value={quotationId} />
          <Button type="submit" variant="ghost">
            {labels.cancel}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
