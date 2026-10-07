"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyPrivacyRequestActionState,
  submitPrivacyRequestAction,
} from "@/modules/legal/privacy-actions";
import { privacyRequestTypeLabels, privacyRequestTypes } from "@/modules/legal/domain/types";

export function ArcoRequestForm({
  defaultEmail,
  labels,
}: {
  defaultEmail?: string;
  labels: {
    type: string;
    email: string;
    message: string;
    submit: string;
    verifyNote: string;
  };
}) {
  const [state, action, pending] = useActionState(
    submitPrivacyRequestAction,
    emptyPrivacyRequestActionState,
  );

  if (state.success) {
    return (
      <p role="status" className="rounded-md border border-border p-4 type-body">
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="grid max-w-xl gap-5">
      <label className="grid gap-2">
        <span className="type-label tracking-[0.12em] text-secondary">{labels.type}</span>
        <select
          name="type"
          required
          className="min-h-11 rounded-md border border-border-strong bg-background px-3"
          defaultValue="ACCESS"
        >
          {privacyRequestTypes.map((type) => (
            <option key={type} value={type}>
              {privacyRequestTypeLabels[type]}
            </option>
          ))}
        </select>
      </label>
      <Input
        name="email"
        type="email"
        label={labels.email}
        defaultValue={defaultEmail ?? ""}
        required
        disabled={pending}
      />
      <Textarea name="message" label={labels.message} required minLength={12} rows={6} disabled={pending} />
      <p className="type-caption text-muted-foreground">{labels.verifyNote}</p>
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} loading={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
