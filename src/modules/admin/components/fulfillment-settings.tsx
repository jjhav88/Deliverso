"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminFeedback } from "@/modules/admin/components/admin-feedback";
import {
  emptyFulfillmentAdminState,
  type FulfillmentAdminState,
  type PersistedScheduleWindow,
} from "@/modules/fulfillment/admin-action-state";
import {
  saveBlackoutAction,
  saveDeliveryZoneAction,
  savePickupLocationAction,
  saveScheduleDayAction,
} from "@/modules/fulfillment/admin-actions";
import { minorToMoneyInput } from "@/modules/catalog/money-input";

const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type Zone = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  deliveryFeeMinor: number;
  minimumOrderMinor: number | null;
  postalCodes: { postalCode: string }[];
};

type Pickup = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  instructions: string | null;
};

type Schedule = {
  id: string;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  dayOfWeek: number;
  isActive: boolean;
  windows: { id: string; startTime: string; endTime: string; label: string | null; isActive?: boolean }[];
};

type Blackout = {
  id: string;
  date: string;
  fulfillmentMethod: "DELIVERY" | "PICKUP" | null;
  reason: string | null;
  isActive: boolean;
};

export function FulfillmentSettings({
  configured,
  zones,
  pickups,
  schedules,
  blackouts,
}: {
  configured: boolean;
  zones: Zone[];
  pickups: Pickup[];
  schedules: Schedule[];
  blackouts: Blackout[];
}) {
  return (
    <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-10">
      <div>
        <h2 className="type-h2">Entrega y recogida</h2>
        <p className="mt-2 type-body text-muted-foreground">
          {configured ? "Configurado" : "Pendiente"} — zonas, puntos de recogida y horarios en hora de
          Ciudad de México.
        </p>
      </div>

      <section className="grid gap-6">
        <h3 className="type-h3">Zonas de entrega</h3>
        {zones.map((zone) => (
          <ZoneForm key={zone.id} zone={zone} />
        ))}
        <ZoneForm />
      </section>

      <section className="grid gap-6">
        <h3 className="type-h3">Puntos de recogida</h3>
        {pickups.map((pickup) => (
          <PickupForm key={pickup.id} pickup={pickup} />
        ))}
        <PickupForm />
      </section>

      <section className="grid gap-6">
        <h3 className="type-h3">Horarios</h3>
        {(["DELIVERY", "PICKUP"] as const).map((method) => (
          <div key={method} className="grid gap-4">
            <p className="type-label tracking-[0.12em] text-secondary">
              {method === "DELIVERY" ? "Entrega" : "Recogida"}
            </p>
            {schedules
              .filter((day) => day.fulfillmentMethod === method)
              .map((day) => (
                <ScheduleForm key={day.id} day={day} />
              ))}
          </div>
        ))}
      </section>

      <section className="grid gap-6">
        <h3 className="type-h3">Fechas no disponibles</h3>
        {blackouts.map((item) => (
          <BlackoutForm key={item.id} blackout={item} />
        ))}
        <BlackoutForm />
      </section>
    </div>
  );
}

function ZoneForm({ zone }: { zone?: Zone }) {
  const [state, action, pending] = useActionState(saveDeliveryZoneAction, emptyFulfillmentAdminState);
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-5">
      {zone ? <input type="hidden" name="id" value={zone.id} /> : null}
      <Input name="name" label="Nombre" defaultValue={zone?.name ?? ""} required disabled={pending} />
      <Input
        name="deliveryFee"
        label="Costo MXN"
        defaultValue={zone ? minorToMoneyInput(zone.deliveryFeeMinor) : "0.00"}
        required
        disabled={pending}
      />
      <Input
        name="minimumOrder"
        label="Pedido mínimo MXN (opcional)"
        defaultValue={zone?.minimumOrderMinor != null ? minorToMoneyInput(zone.minimumOrderMinor) : ""}
        disabled={pending}
      />
      <Input name="sortOrder" label="Orden" type="number" defaultValue={String(zone?.sortOrder ?? 0)} disabled={pending} />
      <label className="flex items-center gap-2 type-body-sm">
        <input type="checkbox" name="isActive" defaultChecked={zone?.isActive ?? true} />
        Activa
      </label>
      <Textarea
        name="postalCodes"
        label="Códigos postales"
        helperText="Uno por línea o separados por coma. Exactamente 5 dígitos. Conserva ceros iniciales (06600)."
        defaultValue={zone?.postalCodes.map((item) => item.postalCode).join("\n") ?? ""}
        rows={4}
        disabled={pending}
      />
      <AdminFeedback error={state.error} success={state.success} />
      <Button type="submit" disabled={pending} loading={pending}>
        {zone ? "Actualizar zona" : "Crear zona"}
      </Button>
    </form>
  );
}

function PickupForm({ pickup }: { pickup?: Pickup }) {
  const [state, action, pending] = useActionState(savePickupLocationAction, emptyFulfillmentAdminState);
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-5">
      {pickup ? <input type="hidden" name="id" value={pickup.id} /> : null}
      <Input name="name" label="Nombre" defaultValue={pickup?.name ?? ""} required disabled={pending} />
      <Input name="addressLine" label="Dirección" defaultValue={pickup?.addressLine ?? ""} required disabled={pending} />
      <Input name="city" label="Ciudad" defaultValue={pickup?.city ?? ""} required disabled={pending} />
      <Input name="state" label="Estado" defaultValue={pickup?.state ?? ""} required disabled={pending} />
      <Input
        name="postalCode"
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={5}
        pattern="[0-9]{5}"
        spellCheck={false}
        label="Código postal"
        defaultValue={pickup?.postalCode ?? ""}
        required
        disabled={pending}
      />
      <Textarea name="instructions" label="Instrucciones" defaultValue={pickup?.instructions ?? ""} disabled={pending} />
      <Input name="sortOrder" label="Orden" type="number" defaultValue={String(pickup?.sortOrder ?? 0)} disabled={pending} />
      <label className="flex items-center gap-2 type-body-sm">
        <input type="checkbox" name="isActive" defaultChecked={pickup?.isActive ?? true} />
        Activo
      </label>
      <AdminFeedback error={state.error} success={state.success} />
      <Button type="submit" disabled={pending} loading={pending}>
        {pickup ? "Actualizar punto" : "Crear punto"}
      </Button>
    </form>
  );
}

function ScheduleForm({ day }: { day: Schedule }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveScheduleDayAction, emptyFulfillmentAdminState);
  const windows = state.windows ?? day.windows;
  const formKey = `${day.id}:${state.revision ?? windows.map((window) => window.id).join(",")}`;

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, state.revision, router]);

  return (
    <ScheduleDayFields
      key={formKey}
      day={day}
      windows={windows}
      state={state}
      action={action}
      pending={pending}
    />
  );
}

function ScheduleDayFields({
  day,
  windows,
  state,
  action,
  pending,
}: {
  day: Schedule;
  windows: PersistedScheduleWindow[];
  state: FulfillmentAdminState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const initial =
    windows.length > 0 ? windows : [{ id: "", startTime: "10:00", endTime: "14:00", label: "" }];
  const [rows, setRows] = useState(initial);

  return (
    <form action={action} className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-4">
      <input type="hidden" name="scheduleId" value={day.id} />
      <input type="hidden" name="fulfillmentMethod" value={day.fulfillmentMethod} />
      <input type="hidden" name="dayOfWeek" value={String(day.dayOfWeek)} />
      <label className="flex items-center gap-2 type-body-sm">
        <input type="checkbox" name="isActive" defaultChecked={day.isActive} />
        {dayLabels[day.dayOfWeek - 1]} activo
      </label>
      {rows.map((window, index) => (
        <div key={`${window.id || "new"}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input type="hidden" name="windowId" value={window.id} />
          <Input name="startTime" label="Inicio" defaultValue={window.startTime} disabled={pending} />
          <Input name="endTime" label="Fin" defaultValue={window.endTime} disabled={pending} />
          <Input name="label" label="Etiqueta" defaultValue={window.label ?? ""} disabled={pending} />
          <button
            type="button"
            className="self-end min-h-11 type-caption text-secondary"
            onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
          >
            Quitar
          </button>
        </div>
      ))}
      <div className="grid gap-2 sm:grid-cols-3">
        <input type="hidden" name="windowId" value="" />
        <Input name="startTime" label="Nueva franja" defaultValue="" disabled={pending} />
        <Input name="endTime" label="Fin" defaultValue="" disabled={pending} />
        <Input name="label" label="Etiqueta" defaultValue="" disabled={pending} />
      </div>
      <AdminFeedback error={state.error} success={state.success} />
      <Button type="submit" variant="secondary" disabled={pending} loading={pending}>
        Guardar {dayLabels[day.dayOfWeek - 1]}
      </Button>
    </form>
  );
}

function BlackoutForm({ blackout }: { blackout?: Blackout }) {
  const [state, action, pending] = useActionState(saveBlackoutAction, emptyFulfillmentAdminState);
  const date = blackout?.date ?? "";
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-border bg-[var(--admin-surface)] p-4">
      {blackout ? <input type="hidden" name="id" value={blackout.id} /> : null}
      <Input name="date" type="date" label="Fecha" defaultValue={date} required disabled={pending} />
      <label className="grid gap-2 type-label">
        Método
        <select name="fulfillmentMethod" defaultValue={blackout?.fulfillmentMethod ?? ""} className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3">
          <option value="">Ambos</option>
          <option value="DELIVERY">Entrega</option>
          <option value="PICKUP">Recogida</option>
        </select>
      </label>
      <Input name="reason" label="Motivo (opcional)" defaultValue={blackout?.reason ?? ""} disabled={pending} />
      <AdminFeedback error={state.error} success={state.success} />
      <Button type="submit" variant="secondary" disabled={pending} loading={pending}>
        {blackout ? "Actualizar fecha" : "Añadir fecha"}
      </Button>
    </form>
  );
}
