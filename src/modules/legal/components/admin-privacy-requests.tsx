"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import { emptyLegalAdminState, updatePrivacyRequestAction } from "@/modules/legal/admin-actions";
import {
  privacyRequestStatusLabels,
  privacyRequestStatuses,
  privacyRequestTypeLabels,
  type PrivacyRequestType,
  type PrivacyRequestStatus,
} from "@/modules/legal/domain/types";

type RequestRow = {
  id: string;
  type: string;
  email: string;
  status: string;
  createdAt: Date;
  customerId: string | null;
  message?: string;
  adminNotes?: string | null;
};

export function AdminPrivacyRequestTable({ requests }: { requests: RequestRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[40rem] text-left type-body-sm">
        <thead>
          <tr>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-t border-border">
              <td className="px-4 py-3">
                {privacyRequestTypeLabels[request.type as PrivacyRequestType] ?? request.type}
              </td>
              <td className="px-4 py-3">{request.createdAt.toISOString().slice(0, 10)}</td>
              <td className="px-4 py-3">{request.customerId ? "Cuenta asociada" : "Sin cuenta"}</td>
              <td className="px-4 py-3">
                {privacyRequestStatusLabels[request.status as PrivacyRequestStatus] ?? request.status}
              </td>
              <td className="px-4 py-3">
                <a href={`/admin/legal/privacy-requests/${request.id}`} className="text-secondary">
                  Revisar
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 ? (
        <p className="px-4 py-6 type-body text-muted-foreground">No hay solicitudes.</p>
      ) : null}
    </div>
  );
}

export function AdminPrivacyRequestReview({ request }: { request: RequestRow & { message: string } }) {
  const [state, action, pending] = useActionState(updatePrivacyRequestAction, emptyLegalAdminState);

  return (
    <form action={action} className="grid max-w-xl gap-5">
      <input type="hidden" name="id" value={request.id} />
      <p className="type-body-sm text-muted-foreground">
        {privacyRequestTypeLabels[request.type as PrivacyRequestType]} · {request.createdAt.toISOString().slice(0, 10)} ·{" "}
        {request.customerId ? "Cuenta asociada" : "Sin cuenta"}
      </p>
      <p className="type-caption text-muted-foreground">
        Correo de contacto (necesario para verificar): {request.email}
      </p>
      <p className="whitespace-pre-wrap rounded-md border border-border p-4 type-body">{request.message}</p>
      <label className="grid gap-2">
        <span className="type-caption">Estado</span>
        <select
          name="status"
          defaultValue={request.status}
          className="min-h-11 rounded-md border border-border-strong bg-background px-3"
        >
          {privacyRequestStatuses.map((status) => (
            <option key={status} value={status}>
              {privacyRequestStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <Textarea
        name="adminNotes"
        label="Notas internas (no se envían al cliente automáticamente)"
        defaultValue={request.adminNotes ?? ""}
        rows={5}
        disabled={pending}
      />
      <p className="type-caption text-muted-foreground">
        Verifica la identidad de forma manual antes de resolver. No hay borrado automático.
      </p>
      <AdminFeedback error={state.error} success={state.success} />
      <Button type="submit" loading={pending} disabled={pending}>
        Guardar revisión
      </Button>
    </form>
  );
}
