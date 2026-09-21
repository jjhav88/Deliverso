"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarField } from "@/modules/account/components/avatar-field";
import { ALLOWED_AVATAR_MIME_TYPES } from "@/modules/avatars/domain/constants";
import {
  emptyAdminProfileActionState,
  removeAdminAvatarAction,
  updateAdminProfileAction,
  uploadAdminAvatarAction,
} from "@/modules/auth/actions/profile";

type AdminProfileFormProps = {
  email: string;
  displayName: string;
  roleLabel: string;
  avatarUrl?: string | null;
};

export function AdminProfileForm({
  email,
  displayName,
  roleLabel,
  avatarUrl,
}: AdminProfileFormProps) {
  const [state, action, pending] = useActionState(
    updateAdminProfileAction,
    emptyAdminProfileActionState,
  );

  return (
    <div className="grid max-w-md gap-8">
      <AvatarField
        displayName={displayName || email}
        avatarUrl={avatarUrl}
        accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
        labels={{
          photo: "Foto de perfil",
          choose: "Subir foto",
          remove: "Quitar foto",
          pending: "Un momento…",
          helper: "JPEG, PNG o WEBP. Máximo 2 MB.",
        }}
        uploadAction={uploadAdminAvatarAction}
        removeAction={removeAdminAvatarAction}
        initialState={emptyAdminProfileActionState}
      />
      <form action={action} className="grid gap-5">
        <Input name="email" label="Correo electrónico" value={email} readOnly disabled />
        <Input name="role" label="Rol" value={roleLabel} readOnly disabled />
        <Input
          name="displayName"
          label="Nombre para mostrar"
          defaultValue={displayName}
          disabled={pending}
        />
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
          {pending ? "Un momento…" : "Guardar perfil"}
        </Button>
      </form>
    </div>
  );
}
