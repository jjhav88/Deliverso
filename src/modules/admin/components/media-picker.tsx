"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type MediaPickerItem = {
  id: string;
  publicUrl: string;
  originalFilename: string | null;
};

type MediaPickerProps = {
  items: MediaPickerItem[];
  label: string;
  selectedId: string | null;
  selectedUrl: string | null;
  onSelect: (id: string | null, url: string | null) => void;
  disabled?: boolean;
};

export function MediaPicker({
  items,
  label,
  selectedId,
  selectedUrl,
  onSelect,
  disabled,
}: MediaPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function openPicker() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closePicker() {
    setOpen(false);
    dialogRef.current?.close();
    openerRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="type-label text-foreground">{label}</p>
      {selectedUrl ? (
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border bg-muted">
          <Image src={selectedUrl} alt="" fill className="object-cover" sizes="180px" />
        </div>
      ) : (
        <div className="flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-border-strong bg-muted type-caption text-muted-foreground">
          Sin imagen
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          ref={openerRef}
          type="button"
          disabled={disabled}
          onClick={openPicker}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border-strong px-3.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Seleccionar imagen
        </button>
        {selectedId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(null, null)}
          >
            Quitar
          </Button>
        ) : null}
      </div>
      <dialog
        ref={dialogRef}
        aria-labelledby="media-picker-title"
        onClose={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-50 m-auto h-[min(36rem,90dvh)] w-[min(48rem,92vw)] rounded-lg border border-border bg-[var(--admin-surface)] p-0",
          "open:flex open:flex-col",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="media-picker-title" className="type-h3">
            Biblioteca de Media
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={closePicker}>
            Cancelar
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <p className="type-body text-muted-foreground">
              Sube imágenes en Media para seleccionarlas aquí.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={item.id === selectedId}
                    aria-current={item.id === selectedId ? "true" : undefined}
                    onClick={() => {
                      onSelect(item.id, item.publicUrl);
                      closePicker();
                    }}
                    className={cn(
                      "relative aspect-[3/4] w-full overflow-hidden rounded-md border",
                      item.id === selectedId
                        ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]"
                        : "border-border",
                    )}
                  >
                    <Image
                      src={item.publicUrl}
                      alt={item.originalFilename ?? ""}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
      {open ? null : null}
    </div>
  );
}
