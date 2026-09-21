"use client";

import { useActionState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyCustomerActionState } from "@/modules/customer-auth/action-state";
import { loginCustomerAction } from "@/modules/customer-auth/actions";

type CustomerLoginFormProps = {
  nextPath: string;
  blocked?: boolean;
  labels: {
    email: string;
    password: string;
    submit: string;
    pending: string;
    register: string;
    noAccount: string;
    forgot: string;
    blocked: string;
  };
};

export function CustomerLoginForm({ nextPath, blocked, labels }: CustomerLoginFormProps) {
  const [state, action, pending] = useActionState(loginCustomerAction, emptyCustomerActionState);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={nextPath} />
      <Input name="email" type="email" label={labels.email} autoComplete="username" required disabled={pending} />
      <Input
        name="password"
        type="password"
        label={labels.password}
        autoComplete="current-password"
        required
        disabled={pending}
      />
      {blocked ? (
        <p role="alert" className="type-caption text-destructive">
          {labels.blocked}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} loading={pending}>
        {pending ? labels.pending : labels.submit}
      </Button>
      <p className="type-body-sm text-muted-foreground">
        {labels.noAccount}{" "}
        <Link
          href={{ pathname: "/cuenta/registro", query: { next: nextPath } }}
          className="text-secondary"
        >
          {labels.register}
        </Link>
      </p>
      <Link href="/cuenta/recuperar-contrasena" className="type-body-sm text-secondary">
        {labels.forgot}
      </Link>
    </form>
  );
}
