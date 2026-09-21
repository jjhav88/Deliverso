"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/modules/account/components/profile-avatar";
type ProfileActionState = {
  error: string | null;
  success: string | null;
};

type AvatarFieldProps = {
  displayName: string;
  avatarUrl?: string | null;
  accept: string;
  labels: {
    photo: string;
    choose: string;
    remove: string;
    pending: string;
    helper: string;
  };
  uploadAction: (
    previousState: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
  removeAction: (
    previousState: ProfileActionState,
    formData: FormData,
  ) => Promise<ProfileActionState>;
  initialState: ProfileActionState;
};

export function AvatarField({
  displayName,
  avatarUrl,
  accept,
  labels,
  uploadAction,
  removeAction,
  initialState,
}: AvatarFieldProps) {
  const [uploadState, upload, uploading] = useActionState(uploadAction, initialState);
  const [removeState, remove, removing] = useActionState(removeAction, initialState);
  const message = uploadState.error || removeState.error;
  const success = uploadState.success || removeState.success;
  const pending = uploading || removing;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          src={avatarUrl}
          displayName={displayName}
          alt={labels.photo}
          className="size-16"
        />
        <div className="grid gap-1">
          <p className="type-label">{labels.photo}</p>
          <p className="type-caption text-muted-foreground">{labels.helper}</p>
        </div>
      </div>
      <form action={upload} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-2">
          <span className="type-label">{labels.choose}</span>
          <input
            type="file"
            name="avatar"
            accept={accept}
            disabled={pending}
            className="min-h-11 w-full type-body-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2"
          />
        </label>
        <Button type="submit" variant="secondary" disabled={pending} loading={uploading}>
          {uploading ? labels.pending : labels.choose}
        </Button>
      </form>
      {avatarUrl ? (
        <form action={remove}>
          <Button type="submit" variant="ghost" disabled={pending} loading={removing}>
            {removing ? labels.pending : labels.remove}
          </Button>
        </form>
      ) : null}
      {message ? (
        <p role="alert" className="type-caption text-destructive">
          {message}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="type-caption text-secondary">
          {success}
        </p>
      ) : null}
    </div>
  );
}
