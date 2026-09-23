"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { emptyQuotationActionState } from "@/modules/quotations/action-state";
import { submitQuotationAction } from "@/modules/quotations/customer-actions";

type Labels = {
  title: string;
  description: string;
  descriptionHelp: string;
  eventDate: string;
  guestCount: string;
  notes: string;
  attachments: string;
  attachmentsHelp: string;
  submit: string;
};

export function QuoteRequestForm({
  productId,
  productName,
  labels,
}: {
  productId: string;
  productName: string;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState(submitQuotationAction, emptyQuotationActionState);

  return (
    <form action={action} className="grid gap-5" encType="multipart/form-data">
      <input type="hidden" name="productId" value={productId} />
      <p className="type-body">
        <span className="type-caption text-muted-foreground">{productName}</span>
      </p>
      <label className="grid gap-2">
        <span className="type-label tracking-[0.12em] text-secondary">{labels.title}</span>
        <input
          name="requestTitle"
          className="min-h-11 rounded-md border border-border-strong bg-background px-3"
        />
      </label>
      <label className="grid gap-2">
        <span className="type-label tracking-[0.12em] text-secondary">{labels.description}</span>
        <textarea
          name="requestDescription"
          required
          minLength={8}
          rows={6}
          className="rounded-md border border-border-strong bg-background px-3 py-3"
        />
        <span className="type-caption text-muted-foreground">{labels.descriptionHelp}</span>
      </label>
      <label className="grid gap-2">
        <span className="type-label tracking-[0.12em] text-secondary">{labels.eventDate}</span>
        <input
          type="date"
          name="eventDate"
          className="min-h-11 rounded-md border border-border-strong bg-background px-3"
        />
      </label>
      <label className="grid gap-2">
        <span className="type-label tracking-[0.12em] text-secondary">{labels.guestCount}</span>
        <input
          type="number"
          name="guestCount"
          min={1}
          className="min-h-11 rounded-md border border-border-strong bg-background px-3"
        />
      </label>
      <label className="grid gap-2">
        <span className="type-label tracking-[0.12em] text-secondary">{labels.notes}</span>
        <textarea name="customerMessage" rows={3} className="rounded-md border border-border-strong bg-background px-3 py-3" />
      </label>
      <label className="grid gap-2">
        <span className="type-label tracking-[0.12em] text-secondary">{labels.attachments}</span>
        <input
          type="file"
          name="attachments"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="min-h-11"
        />
        <span className="type-caption text-muted-foreground">{labels.attachmentsHelp}</span>
      </label>
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" loading={pending} disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
