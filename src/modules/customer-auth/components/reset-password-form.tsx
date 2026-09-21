"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyCustomerActionState } from "@/modules/customer-auth/action-state";
import { updatePasswordAction } from "@/modules/customer-auth/actions";
import { CUSTOMER_PASSWORD_MIN } from "@/modules/customer-auth/validation";

type ResetPasswordFormProps = {
  labels: {
    password: string;
    confirm: string;
    requirements: string;
    submit: string;
    pending: string;
  };
};

export function ResetPasswordForm({ labels }: ResetPasswordFormProps) {
  const [state, action, pending] = useActionState(updatePasswordAction, emptyCustomerActionState);

  return (
    <form action={action} className="grid gap-5">
      <Input
        name="password"
        type="password"
        label={labels.password}
        autoComplete="new-password"
        required
        minLength={CUSTOMER_PASSWORD_MIN}
        helperText={labels.requirements}
        disabled={pending}
      />
      <Input
        name="confirmPassword"
        type="password"
        label={labels.confirm}
        autoComplete="new-password"
        required
        minLength={CUSTOMER_PASSWORD_MIN}
        disabled={pending}
      />
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} loading={pending}>
        {pending ? labels.pending : labels.submit}
      </Button>
    </form>
  );
}
