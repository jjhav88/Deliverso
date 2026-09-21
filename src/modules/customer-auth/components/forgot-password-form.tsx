"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyCustomerActionState } from "@/modules/customer-auth/action-state";
import { requestPasswordResetAction } from "@/modules/customer-auth/actions";

type ForgotPasswordFormProps = {
  resetNext: string;
  labels: {
    email: string;
    submit: string;
    pending: string;
  };
};

export function ForgotPasswordForm({ resetNext, labels }: ForgotPasswordFormProps) {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    emptyCustomerActionState,
  );

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="resetNext" value={resetNext} />
      <Input name="email" type="email" label={labels.email} autoComplete="email" required disabled={pending} />
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
      <Button type="submit" disabled={pending} loading={pending}>
        {pending ? labels.pending : labels.submit}
      </Button>
    </form>
  );
}
