"use client";

import { useActionState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyCustomerActionState } from "@/modules/customer-auth/action-state";
import { registerCustomerAction } from "@/modules/customer-auth/actions";
import { CUSTOMER_PASSWORD_MIN } from "@/modules/customer-auth/validation";

type CustomerRegisterFormProps = {
  nextPath: string;
  labels: {
    email: string;
    password: string;
    confirm: string;
    requirements: string;
    terms: string;
    privacy: string;
    acceptPrefix: string;
    and: string;
    submit: string;
    pending: string;
    checkEmail: string;
    checkEmailBody: string;
    home: string;
    hasAccount: string;
    login: string;
  };
};

export function CustomerRegisterForm({ nextPath, labels }: CustomerRegisterFormProps) {
  const [state, action, pending] = useActionState(registerCustomerAction, emptyCustomerActionState);

  if (state.success === "CHECK_EMAIL") {
    return (
      <div className="grid gap-4">
        <h2 className="type-h2">{labels.checkEmail}</h2>
        <p className="type-body text-muted-foreground">{labels.checkEmailBody}</p>
        <Link href="/" className="type-label tracking-[0.12em] text-secondary">
          {labels.home}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={nextPath} />
      <Input name="email" type="email" label={labels.email} autoComplete="email" required disabled={pending} />
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
      <label className="flex items-start gap-3 type-body-sm">
        <input type="checkbox" name="termsAccepted" required className="mt-1" />
        <span>
          {labels.acceptPrefix}{" "}
          <Link href="/terminos" className="text-secondary">
            {labels.terms}
          </Link>
        </span>
      </label>
      <label className="flex items-start gap-3 type-body-sm">
        <input type="checkbox" name="privacyAccepted" required className="mt-1" />
        <span>
          {labels.acceptPrefix}{" "}
          <Link href="/aviso-de-privacidad" className="text-secondary">
            {labels.privacy}
          </Link>
        </span>
      </label>
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} loading={pending}>
        {pending ? labels.pending : labels.submit}
      </Button>
      <p className="type-body-sm text-muted-foreground">
        {labels.hasAccount}{" "}
        <Link
          href={{ pathname: "/cuenta/iniciar-sesion", query: { next: nextPath } }}
          className="text-secondary"
        >
          {labels.login}
        </Link>
      </p>
    </form>
  );
}
