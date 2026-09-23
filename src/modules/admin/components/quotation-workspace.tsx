"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { emptyQuotationActionState } from "@/modules/quotations/action-state";
import {
  cancelQuotationByAdminAction,
  offerQuotationAction,
  requestQuotationInfoAction,
  saveQuotationInternalNotesAction,
  startQuotationReviewAction,
} from "@/modules/quotations/admin-actions";

type Option = { id: string; name: string };

export function QuotationWorkspace({
  quotationId,
  status,
  notes,
  pickups,
  zones,
}: {
  quotationId: string;
  status: string;
  notes: string;
  pickups: Option[];
  zones: Option[];
}) {
  const [infoState, infoAction, infoPending] = useActionState(
    requestQuotationInfoAction,
    emptyQuotationActionState,
  );
  const [notesState, notesAction, notesPending] = useActionState(
    saveQuotationInternalNotesAction,
    emptyQuotationActionState,
  );
  const [offerState, offerAction, offerPending] = useActionState(
    offerQuotationAction,
    emptyQuotationActionState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelQuotationByAdminAction,
    emptyQuotationActionState,
  );

  return (
    <div className="grid gap-8">
      {status === "SUBMITTED" ? (
        <form action={startQuotationReviewAction}>
          <input type="hidden" name="quotationId" value={quotationId} />
          <Button type="submit" variant="secondary">
            Iniciar revisión
          </Button>
        </form>
      ) : null}

      <form action={notesAction} className="grid gap-3">
        <input type="hidden" name="quotationId" value={quotationId} />
        <label className="grid gap-2">
          <span className="type-caption">Notas internas (nunca visibles al cliente)</span>
          <textarea
            name="adminInternalNotes"
            defaultValue={notes}
            rows={4}
            className="rounded-md border border-border-strong bg-surface-elevated px-3 py-3"
          />
        </label>
        {notesState.success ? <p role="status" className="type-caption text-secondary">{notesState.success}</p> : null}
        <Button type="submit" variant="secondary" loading={notesPending} disabled={notesPending}>
          Guardar notas internas
        </Button>
      </form>

      {(status === "SUBMITTED" || status === "IN_REVIEW") ? (
        <form action={infoAction} className="grid gap-3">
          <input type="hidden" name="quotationId" value={quotationId} />
          <label className="grid gap-2">
            <span className="type-caption">Pedir información al cliente</span>
            <textarea name="message" required rows={4} className="rounded-md border border-border-strong bg-surface-elevated px-3 py-3" />
          </label>
          {infoState.error ? <p role="alert" className="type-caption text-destructive">{infoState.error}</p> : null}
          {infoState.success ? <p role="status" className="type-caption text-secondary">{infoState.success}</p> : null}
          <Button type="submit" variant="secondary" loading={infoPending} disabled={infoPending}>
            Solicitar información
          </Button>
        </form>
      ) : null}

      {(status === "SUBMITTED" || status === "IN_REVIEW" || status === "NEEDS_INFO" || status === "QUOTED") ? (
        <form action={offerAction} className="grid gap-3">
          <input type="hidden" name="quotationId" value={quotationId} />
          <h3 className="type-h3">Propuesta económica</h3>
          <label className="grid gap-2">
            <span className="type-caption">Subtotal MXN</span>
            <input name="subtotal" required inputMode="decimal" className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3" />
          </label>
          <label className="grid gap-2">
            <span className="type-caption">Entrega MXN</span>
            <input name="delivery" defaultValue="0" inputMode="decimal" className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3" />
          </label>
          <label className="grid gap-2">
            <span className="type-caption">Vigencia (Mexico City)</span>
            <input type="datetime-local" name="validUntil" required className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3" />
          </label>
          <label className="grid gap-2">
            <span className="type-caption">Fulfillment</span>
            <select name="fulfillmentMethod" required className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3">
              <option value="DELIVERY">Entrega</option>
              <option value="PICKUP">Recogida</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="type-caption">Punto de recogida</span>
            <select name="pickupLocationId" className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3">
              <option value="">—</option>
              {pickups.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="type-caption">Zona de entrega</span>
            <select name="deliveryZoneId" className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3">
              <option value="">—</option>
              {zones.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="type-caption">Mensaje para el cliente</span>
            <textarea name="message" rows={4} className="rounded-md border border-border-strong bg-surface-elevated px-3 py-3" />
          </label>
          {offerState.error ? <p role="alert" className="type-caption text-destructive">{offerState.error}</p> : null}
          {offerState.success ? <p role="status" className="type-caption text-secondary">{offerState.success}</p> : null}
          <Button type="submit" loading={offerPending} disabled={offerPending}>
            Emitir oferta
          </Button>
        </form>
      ) : null}

      {status !== "CONVERTED" && status !== "CANCELED" && status !== "EXPIRED" && status !== "DECLINED" && status !== "ACCEPTED" ? (
        <form action={cancelAction} className="grid gap-3">
          <input type="hidden" name="quotationId" value={quotationId} />
          <label className="grid gap-2">
            <span className="type-caption">Cancelar (mensaje opcional al cliente)</span>
            <textarea name="message" rows={3} className="rounded-md border border-border-strong bg-surface-elevated px-3 py-3" />
          </label>
          {cancelState.error ? <p role="alert" className="type-caption text-destructive">{cancelState.error}</p> : null}
          <Button type="submit" variant="ghost" loading={cancelPending} disabled={cancelPending}>
            Cancelar solicitud
          </Button>
        </form>
      ) : null}
    </div>
  );
}
