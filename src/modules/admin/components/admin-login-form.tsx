"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loginAdminAction,
  type AdminLoginState,
} from "@/modules/auth/actions/login";

const initialState: AdminLoginState = { error: null };

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const [state, formAction, pending] = useActionState(
    loginAdminAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={nextPath} />
      <Input
        name="email"
        type="email"
        label="Correo electrónico"
        autoComplete="username"
        required
        disabled={pending}
      />
      <Input
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
        disabled={pending}
      />
      {state.error ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
