"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { MediaUploadDialog } from "@/modules/admin/components/media-upload-dialog";
import { emptyMediaActionState } from "@/modules/media/action-state";
import { deleteMediaAction, updateMediaAction } from "@/modules/media/actions";
import type { AdminMediaItem } from "@/modules/media/queries";

type MediaLibraryProps = {
  items: Array<Omit<AdminMediaItem, "createdAt"> & { createdAt: string }>;
};

export function MediaLibrary({ items }: MediaLibraryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    updateMediaAction,
    emptyMediaActionState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteMediaAction,
    emptyMediaActionState,
  );

  useEffect(() => {
    if (deleting || !deleteState.success) {
      return;
    }

    deleteDialogRef.current?.close();
    headingRef.current?.focus();
  }, [deleting, deleteState.success]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="type-h2 outline-none">
            Biblioteca de Media
          </h2>
          <p className="mt-2 max-w-2xl type-body text-muted-foreground">
            Sube fotografías para reutilizarlas en el Home, productos y universos.
          </p>
        </div>
        <MediaUploadDialog />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <AdminFeedback error={state.error} success={state.success} />
        {pendingDelete ? null : (
          <AdminFeedback error={deleteState.error} success={deleteState.success} />
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-border-strong bg-[var(--admin-surface)] px-6 py-16 text-center">
          <p className="type-h3">Tu biblioteca está vacía.</p>
          <p className="mx-auto mt-3 max-w-md type-body text-muted-foreground">
            Sube las primeras fotografías de DELIVERSO para utilizarlas en el sitio.
          </p>
          <div className="mt-6 flex justify-center">
            <MediaUploadDialog />
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-lg border border-border bg-[var(--admin-surface)]"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={item.publicUrl}
                  alt={item.altEs || item.originalFilename || ""}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 22vw, (min-width: 640px) 44vw, 92vw"
                />
                {item.inUse ? (
                  <span className="absolute left-3 top-3">
                    <Badge>En uso{item.usageLabel ? ` · ${item.usageLabel}` : ""}</Badge>
                  </span>
                ) : null}
              </div>
              <form action={formAction} className="flex flex-col gap-3 p-4">
                <input type="hidden" name="id" value={item.id} />
                <p className="type-caption text-muted-foreground">
                  {item.originalFilename ?? item.id.slice(0, 8)}
                  {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                  {item.mimeType ? ` · ${item.mimeType.replace("image/", "")}` : ""}
                  {` · ${new Date(item.createdAt).toLocaleDateString("es-MX")}`}
                </p>
                <Input
                  name="altEs"
                  label="ALT ES"
                  defaultValue={item.altEs}
                  disabled={pending}
                />
                <Input
                  name="altEn"
                  label="ALT EN"
                  defaultValue={item.altEn}
                  disabled={pending}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="outline" size="sm" loading={pending}>
                    Guardar
                  </Button>
                  <a
                    href={item.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center rounded-md px-3 text-sm text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Ver
                  </a>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={item.inUse || deleting}
                    title={item.inUse ? "Esta imagen está siendo utilizada y no puede eliminarse." : undefined}
                    onClick={() => {
                      if (item.inUse) {
                        return;
                      }
                      setPendingDelete(item.id);
                      deleteDialogRef.current?.showModal();
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
                {item.inUse ? (
                  <p className="type-caption text-muted-foreground">
                    Esta imagen está siendo utilizada y no puede eliminarse.
                  </p>
                ) : null}
              </form>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-media-title"
        className="fixed inset-0 z-50 m-auto w-[min(26rem,92vw)] rounded-lg border border-border bg-[var(--admin-surface)] p-6"
        onClose={() => setPendingDelete(null)}
      >
        <h2 id="delete-media-title" className="type-h3">
          Eliminar imagen
        </h2>
        <p className="mt-3 type-body text-muted-foreground">
          Esta acción eliminará el archivo de la biblioteca.
        </p>
        <form action={deleteAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={pendingDelete ?? ""} />
          <AdminFeedback error={deleteState.error} success={null} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => deleteDialogRef.current?.close()}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" loading={deleting}>
              Eliminar
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
