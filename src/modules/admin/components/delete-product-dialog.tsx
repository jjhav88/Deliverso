"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { emptyCatalogActionState } from "@/modules/catalog/action-state";
import { deleteProductAction } from "@/modules/catalog/product-actions";
import { cn } from "@/lib/cn";

type DeleteProductDialogProps = {
  productId: string;
  productName?: string;
  disabled?: boolean;
  compact?: boolean;
};

export function DeleteProductDialog({
  productId,
  productName,
  disabled,
  compact,
}: DeleteProductDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    deleteProductAction,
    emptyCatalogActionState,
  );

  return (
    <>
      {compact ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => dialogRef.current?.showModal()}
          className="type-label text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Eliminar
        </button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          disabled={disabled}
          onClick={() => dialogRef.current?.showModal()}
        >
          Eliminar
        </Button>
      )}
      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-product-title-${productId}`}
        className="fixed inset-0 z-50 m-auto w-[min(26rem,92vw)] rounded-lg border border-border bg-[var(--admin-surface)] p-6"
      >
        <h2
          id={`delete-product-title-${productId}`}
          className="type-h3"
        >
          Eliminar producto
        </h2>
        <p className="mt-3 type-body text-muted-foreground">
          {productName
            ? `Se eliminará “${productName}” del catálogo.`
            : "Se eliminará este producto del catálogo."}{" "}
          Las fotografías seguirán en la biblioteca de media. Esta acción no se
          puede deshacer.
        </p>
        <form action={formAction} className={cn("mt-6 flex flex-col gap-4")}>
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
              Eliminar
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
