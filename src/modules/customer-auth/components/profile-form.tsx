"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyCustomerActionState } from "@/modules/customer-auth/action-state";
import { updateCustomerProfileAction } from "@/modules/customer-auth/actions";

type ProfileFormProps = {
  email: string;
  displayName: string;
  phone: string;
  labels: {
    email: string;
    displayName: string;
    phone: string;
    submit: string;
    pending: string;
  };
};

export function CustomerProfileForm({ email, displayName, phone, labels }: ProfileFormProps) {
  const [state, action, pending] = useActionState(
    updateCustomerProfileAction,
    emptyCustomerActionState,
  );

  return (
    <form action={action} className="grid max-w-md gap-5">
      <Input name="email" label={labels.email} value={email} readOnly disabled />
      <Input name="displayName" label={labels.displayName} defaultValue={displayName} disabled={pending} />
      <Input name="phone" label={labels.phone} defaultValue={phone} disabled={pending} />
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
