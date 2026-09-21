"use client";

import { ImageIcon } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { emptyMediaActionState } from "@/modules/media/action-state";
import { uploadMediaAction } from "@/modules/media/actions";
import {
  emptyUploadSelection,
  formatFileSize,
  revokeUploadPreview,
  type UploadSelection,
} from "@/modules/media/format-file-size";

export function MediaUploadDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const [formKey, setFormKey] = useState(0);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function resetAndClose() {
    setFormKey((current) => current + 1);
    dialogRef.current?.close();
    openerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={openDialog}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-5 text-sm text-secondary-foreground hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        + Subir imagen
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="media-upload-title"
        className="fixed inset-0 z-50 m-auto w-[min(28rem,92vw)] rounded-lg border border-border bg-[var(--admin-surface)] p-6"
        onClose={() => {
          setFormKey((current) => current + 1);
          openerRef.current?.focus();
        }}
      >
        <h2 id="media-upload-title" className="type-h3">
          Subir imagen
        </h2>
        <UploadForm key={formKey} onCancel={resetAndClose} onSuccess={resetAndClose} />
      </dialog>
    </>
  );
}

function UploadForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const fileId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<UploadSelection>(emptyUploadSelection);
  const [state, formAction, pending] = useActionState(
    uploadMediaAction,
    emptyMediaActionState,
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
    // Close once per successful upload. onSuccess is a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state.success is the trigger
  }, [state.success]);

  useEffect(() => {
    return () => revokeUploadPreview(selection.previewUrl);
  }, [selection.previewUrl]);

  function applyFile(file: File | undefined) {
    revokeUploadPreview(selection.previewUrl);
    if (!file) {
      setSelection(emptyUploadSelection());
      return;
    }

    setSelection({
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSizeLabel: formatFileSize(file.size),
    });
  }

  function clearFile() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    applyFile(undefined);
  }

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <input
        ref={fileInputRef}
        id={fileId}
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        required
        disabled={pending}
        onChange={(event) => applyFile(event.target.files?.[0])}
        className="peer sr-only"
      />

      {selection.previewUrl ? (
        <div className="flex flex-col gap-3 rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selection.previewUrl}
            alt=""
            className="max-h-48 w-full rounded-md object-contain"
          />
          <div>
            <p className="type-body">{selection.fileName}</p>
            <p className="type-caption text-muted-foreground">{selection.fileSizeLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={fileId}
              className={cn(
                "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-border-strong px-3.5 text-sm",
                "hover:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring",
                pending && "pointer-events-none opacity-45",
              )}
            >
              Cambiar imagen
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={pending}>
              Quitar
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={fileId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-muted/40 px-4 py-10 text-center",
            "transition-colors hover:bg-muted",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring",
            pending && "pointer-events-none opacity-45",
          )}
        >
          <ImageIcon aria-hidden="true" className="h-8 w-8 text-secondary" strokeWidth={1.5} />
          <span className="mt-3 type-label">Seleccionar una imagen</span>
          <span className="mt-1 type-caption text-muted-foreground">
            JPG, PNG, WebP o AVIF · Máx. 10 MB
          </span>
        </label>
      )}

      <Input name="altEs" label="ALT español" disabled={pending} />
      <Input name="altEn" label="ALT English" disabled={pending} />
      {pending ? (
        <p role="status" className="type-caption text-muted-foreground">
          Subiendo imagen...
        </p>
      ) : (
        <AdminFeedback error={state.error} success={null} />
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" variant="secondary" loading={pending}>
          Subir
        </Button>
      </div>
    </form>
  );
}
