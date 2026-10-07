"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import {
  archiveLegalDocumentAction,
  createLegalDraftAction,
  emptyLegalAdminState,
  publishLegalDocumentAction,
  saveLegalDraftAction,
} from "@/modules/legal/admin-actions";
import { legalDocumentLabels, legalDocumentTypes } from "@/modules/legal/domain/types";
import type { LegalAdminDocument } from "@/modules/legal/queries";

export function AdminLegalWorkspace({ documents }: { documents: LegalAdminDocument[] }) {
  const [draftState, draftAction, draftPending] = useActionState(
    createLegalDraftAction,
    emptyLegalAdminState,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveLegalDraftAction,
    emptyLegalAdminState,
  );

  const grouped = legalDocumentTypes.map((type) => ({
    type,
    items: documents.filter((item) => item.type === type),
  }));

  return (
    <div className="mx-auto grid max-w-5xl gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="type-h2">Documentos legales</h2>
          <p className="mt-2 type-body text-muted-foreground">
            Solo se muestra al público la versión PUBLISHED. No edites una versión publicada:
            crea un borrador nuevo.
          </p>
        </div>
        <Link href="/admin/legal/privacy-requests" className="type-label tracking-[0.12em] text-secondary">
          Solicitudes ARCO
        </Link>
      </div>

      <form action={draftAction} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-2">
          <span className="type-caption">Nueva versión (borrador)</span>
          <select name="type" className="min-h-11 rounded-md border border-border-strong bg-background px-3">
            {legalDocumentTypes.map((type) => (
              <option key={type} value={type}>
                {legalDocumentLabels[type]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" loading={draftPending} disabled={draftPending}>
          Crear borrador
        </Button>
      </form>
      <AdminFeedback error={draftState.error} success={draftState.success} />
      <AdminFeedback error={saveState.error} success={saveState.success} />

      {grouped.map((group) => (
        <section key={group.type} className="grid gap-4">
          <h3 className="type-h3">{legalDocumentLabels[group.type]}</h3>
          {group.items.map((document) => (
            <article key={document.id} className="rounded-lg border border-border p-5">
              <p className="type-caption text-muted-foreground">
                Versión {document.version} · {document.status} · actualizado{" "}
                {document.updatedAt.toISOString().slice(0, 10)}
              </p>
              {document.status === "DRAFT" ? (
                <form action={saveAction} className="mt-4 grid gap-4">
                  <input type="hidden" name="id" value={document.id} />
                  <Input name="title" label="Título" defaultValue={document.title} disabled={savePending} />
                  <Textarea
                    name="body"
                    label="Cuerpo"
                    defaultValue={document.body}
                    rows={16}
                    disabled={savePending}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" loading={savePending} disabled={savePending}>
                      Guardar borrador
                    </Button>
                    <Button type="submit" formAction={publishLegalDocumentAction} variant="secondary">
                      Publicar
                    </Button>
                    <Button type="submit" formAction={archiveLegalDocumentAction} variant="ghost">
                      Archivar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 grid gap-3">
                  <p className="type-body">{document.title}</p>
                  <p className="type-caption text-muted-foreground">
                    Las versiones publicadas no se editan en silencio. Crea un borrador para
                    cambiar el contenido.
                  </p>
                  {document.status === "PUBLISHED" ? (
                    <form action={archiveLegalDocumentAction}>
                      <input type="hidden" name="id" value={document.id} />
                      <Button type="submit" variant="ghost">
                        Archivar
                      </Button>
                    </form>
                  ) : null}
                </div>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
