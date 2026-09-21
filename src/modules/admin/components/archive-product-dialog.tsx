"use client";

import { useActionState, useRef } from "react";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { emptyCatalogActionState } from "@/modules/catalog/action-state";
import { archiveProductAction } from "@/modules/catalog/product-actions";
import { Button } from "@/components/ui/button";

type ArchiveProductDialogProps = {
  productId: string;
  disabled?: boolean;
};

export function ArchiveProductDialog({
  productId,
  disabled,
}: ArchiveProductDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    archiveProductAction,
    emptyCatalogActionState,
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => dialogRef.current?.showModal()}
      >
        Archivar
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="archive-product-title"
        className="fixed inset-0 z-50 m-auto w-[min(26rem,92vw)] rounded-lg border border-border bg-[var(--admin-surface)] p-6"
      >
        <h2 id="archive-product-title" className="type-h3">
          Archivar producto
        </h2>
        <p className="mt-3 type-body text-muted-foreground">
          El producto dejará de publicarse. No se elimina; podrás reactivarlo
          como borrador.
        </p>
        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={productId} />
          <AdminFeedback error={state.error} success={state.success} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" loading={pending}>
              Archivar
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
