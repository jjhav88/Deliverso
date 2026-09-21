"use client";

import { useActionState, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  checkoutDateSelectOptions,
  checkoutTimeSelectOptions,
  nextCheckoutTimeAfterDateChange,
  resolveCheckoutSlotSelection,
} from "@/modules/checkout/domain/date-label";
import { emptyCheckoutActionState } from "@/modules/checkout/action-state";
import {
  markCheckoutReady,
  saveCheckoutContact,
  saveCheckoutNotes,
  saveDeliveryAddress,
  setFulfillmentMethod,
  setPickupLocation,
  setRequestedFulfillment,
} from "@/modules/checkout/actions";
import { startOrderPayment } from "@/modules/orders/actions";
import { emptyOrderActionState } from "@/modules/orders/action-state";
import type { CheckoutStep } from "@/modules/checkout/domain/summary";
import type { AvailableDate } from "@/modules/checkout/domain/dates";
import type { CartView } from "@/modules/cart/types";

type Labels = Record<string, string>;

type CheckoutFlowProps = {
  step: CheckoutStep;
  draft: {
    status: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    fulfillmentMethod: "DELIVERY" | "PICKUP" | null;
    pickupLocationId: string | null;
    customerNotes: string | null;
    requestedDate: string | null;
    timeWindowId: string | null;
  };
  address: {
    postalCode: string;
    state: string;
    city: string;
    locality: string | null;
    street: string;
    exteriorNumber: string | null;
    interiorNumber: string | null;
    reference: string | null;
  } | null;
  cart: CartView;
  pickups: Array<{
    id: string;
    name: string;
    addressLine: string;
    city: string;
    instructions: string | null;
  }>;
  availableDates: AvailableDate[];
  selectedZoneName: string | null;
  selectedPickupName: string | null;
  selectedSlotLabel: string | null;
  displaySubtotal: string;
  displayFee: string;
  displayEstimated: string;
  canMarkReady: boolean;
  readyMessage: string | null;
  locale: string;
  labels: Labels;
};

export function CheckoutFlow(props: CheckoutFlowProps) {
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
      <div className="grid gap-8">
        <ol className="flex flex-wrap gap-4 type-label tracking-[0.12em] text-muted-foreground">
          <li className={props.step === "datos" ? "text-secondary" : undefined}>{props.labels.stepContact}</li>
          <li className={props.step === "entrega" ? "text-secondary" : undefined}>{props.labels.stepFulfillment}</li>
          <li className={props.step === "fecha" ? "text-secondary" : undefined}>{props.labels.stepDate}</li>
          <li className={props.step === "revisar" ? "text-secondary" : undefined}>{props.labels.stepReview}</li>
        </ol>
        {props.step === "datos" ? <ContactStep {...props} /> : null}
        {props.step === "entrega" ? <FulfillmentStep {...props} /> : null}
        {props.step === "fecha" ? <DateStep {...props} /> : null}
        {props.step === "revisar" ? <ReviewStep {...props} /> : null}
      </div>
      <aside className="h-fit rounded-lg border border-border p-5 lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
        <p className="type-label tracking-[0.12em] text-secondary">{props.labels.summary}</p>
        <ul className="mt-4 grid gap-3">
          {props.cart.items.map((item) => (
            <li key={item.id} className="type-body-sm">
              {item.quantity} × {item.name}
            </li>
          ))}
        </ul>
        <dl className="mt-5 grid gap-2 type-body-sm">
          <div className="flex justify-between gap-3">
            <dt>{props.labels.subtotal}</dt>
            <dd className="tabular-nums">{props.displaySubtotal}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{props.labels.delivery}</dt>
            <dd className="tabular-nums">{props.displayFee}</dd>
          </div>
          <div className="flex justify-between gap-3 type-body font-medium">
            <dt>{props.labels.estimated}</dt>
            <dd className="tabular-nums">{props.displayEstimated}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

function ContactStep({ draft, labels }: CheckoutFlowProps) {
  const [state, action, pending] = useActionState(saveCheckoutContact, emptyCheckoutActionState);
  return (
    <form action={action} className="grid max-w-md gap-5">
      <Input name="contactName" label={labels.name} autoComplete="name" defaultValue={draft.contactName ?? ""} required disabled={pending} />
      <Input name="contactEmail" type="email" label={labels.email} autoComplete="email" value={draft.contactEmail ?? ""} readOnly disabled />
      <Input name="contactPhone" label={labels.phone} autoComplete="tel" defaultValue={draft.contactPhone ?? ""} required disabled={pending} />
      {state.error ? <p role="alert" className="type-caption text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} loading={pending}>{labels.continue}</Button>
    </form>
  );
}

function FulfillmentStep({ draft, address, pickups, labels }: CheckoutFlowProps) {
  const [methodState, methodAction] = useActionState(setFulfillmentMethod, emptyCheckoutActionState);
  const [addressState, addressAction, addressPending] = useActionState(saveDeliveryAddress, emptyCheckoutActionState);
  const [pickupState, pickupAction, pickupPending] = useActionState(setPickupLocation, emptyCheckoutActionState);
  const method = draft.fulfillmentMethod ?? "DELIVERY";

  return (
    <div className="grid gap-8">
      <form action={methodAction} className="grid gap-3">
        <fieldset className="grid gap-3">
          <legend className="type-label tracking-[0.12em] text-secondary">{labels.method}</legend>
          <label className="flex min-h-11 items-center gap-3">
            <input type="radio" name="method" value="DELIVERY" defaultChecked={method === "DELIVERY"} />
            {labels.deliveryMethod}
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="radio" name="method" value="PICKUP" defaultChecked={method === "PICKUP"} />
            {labels.pickupMethod}
          </label>
        </fieldset>
        <Button type="submit" variant="secondary" size="sm">{labels.useMethod}</Button>
        {methodState.error ? <p role="alert" className="type-caption text-destructive">{methodState.error}</p> : null}
      </form>

      {method === "DELIVERY" ? (
        <form action={addressAction} className="grid max-w-lg gap-4">
          <Input
            name="postalCode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            pattern="[0-9]{5}"
            spellCheck={false}
            label={labels.postalCode}
            defaultValue={address?.postalCode ?? ""}
            required
            disabled={addressPending}
          />
          <Input name="state" label={labels.state} autoComplete="address-level1" defaultValue={address?.state ?? ""} required disabled={addressPending} />
          <Input name="city" label={labels.city} autoComplete="address-level2" defaultValue={address?.city ?? ""} required disabled={addressPending} />
          <Input name="locality" label={labels.locality} defaultValue={address?.locality ?? ""} disabled={addressPending} />
          <Input name="street" label={labels.street} autoComplete="address-line1" defaultValue={address?.street ?? ""} required disabled={addressPending} />
          <Input name="exteriorNumber" label={labels.exterior} autoComplete="address-line2" defaultValue={address?.exteriorNumber ?? ""} disabled={addressPending} />
          <Input name="interiorNumber" label={labels.interior} defaultValue={address?.interiorNumber ?? ""} disabled={addressPending} />
          <Input name="reference" label={labels.reference} defaultValue={address?.reference ?? ""} disabled={addressPending} />
          <input type="hidden" name="country" value="MX" autoComplete="country" />
          {addressState.error ? <p role="alert" className="type-caption text-destructive">{addressState.error}</p> : null}
          <Button type="submit" disabled={addressPending} loading={addressPending}>{labels.continue}</Button>
        </form>
      ) : (
        <form action={pickupAction} className="grid gap-4">
          <fieldset className="grid gap-3">
            <legend className="type-label tracking-[0.12em] text-secondary">{labels.pickupPoint}</legend>
            {pickups.length === 0 ? (
              <p className="type-body text-muted-foreground">{labels.noPickup}</p>
            ) : (
              pickups.map((pickup) => (
                <label key={pickup.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <input type="radio" name="pickupLocationId" value={pickup.id} defaultChecked={draft.pickupLocationId === pickup.id} required />
                  <span>
                    <span className="type-body font-medium">{pickup.name}</span>
                    <span className="mt-1 block type-body-sm text-muted-foreground">
                      {pickup.addressLine}, {pickup.city}
                    </span>
                  </span>
                </label>
              ))
            )}
          </fieldset>
          {pickupState.error ? <p role="alert" className="type-caption text-destructive">{pickupState.error}</p> : null}
          <Button type="submit" disabled={pickupPending || pickups.length === 0} loading={pickupPending}>
            {labels.continue}
          </Button>
        </form>
      )}
    </div>
  );
}

function DateStep({ draft, availableDates, labels, locale }: CheckoutFlowProps) {
  const [state, action, pending] = useActionState(setRequestedFulfillment, emptyCheckoutActionState);
  const dates = availableDates.filter((item) => item.slots.length > 0);
  const initial = resolveCheckoutSlotSelection({
    availableDates: dates,
    requestedDate: draft.requestedDate,
    timeWindowId: draft.timeWindowId,
  });
  const [date, setDate] = useState(initial.date);
  const [timeWindowId, setTimeWindowId] = useState(initial.timeWindowId);
  const slots = dates.find((item) => item.date === date)?.slots ?? [];
  const dateError = state.error && !date ? state.error : undefined;
  const timeError = state.error && date ? state.error : undefined;

  if (dates.length === 0) {
    return <p className="type-body text-muted-foreground">{labels.noDates}</p>;
  }

  return (
    <form action={action} className="grid max-w-md gap-6">
      <div className="grid gap-5 rounded-lg border border-border p-5">
        <Select
          name="requestedDate"
          label={labels.date}
          value={date}
          error={dateError}
          onChange={(event) => {
            setDate(event.target.value);
            setTimeWindowId(nextCheckoutTimeAfterDateChange());
          }}
          options={checkoutDateSelectOptions({
            availableDates: dates,
            locale,
            placeholder: labels.selectDate,
          })}
        />
        <Select
          name="timeWindowId"
          label={labels.slot}
          value={timeWindowId}
          disabled={!date}
          error={timeError}
          onChange={(event) => setTimeWindowId(event.target.value)}
          options={checkoutTimeSelectOptions({
            availableDates: dates,
            date,
            placeholder: labels.selectTime,
          })}
        />
        {date && slots.length === 0 ? (
          <p role="status" className="type-caption text-muted-foreground">
            {labels.noTimes}
          </p>
        ) : null}
      </div>
      {state.error && date && slots.length > 0 && timeWindowId ? (
        <p role="alert" className="type-caption text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending || !date || slots.length === 0 || !timeWindowId} loading={pending}>
        {labels.continue}
      </Button>
    </form>
  );
}

function ReviewStep(props: CheckoutFlowProps) {
  const [notesState, notesAction, notesPending] = useActionState(saveCheckoutNotes, emptyCheckoutActionState);
  const [readyState, readyAction, readyPending] = useActionState(markCheckoutReady, emptyCheckoutActionState);
  const [payState, payAction, payPending] = useActionState(startOrderPayment, emptyOrderActionState);
  const ready = props.draft.status === "READY_FOR_PAYMENT";

  return (
    <div className="grid gap-8">
      <section className="grid gap-2">
        <h2 className="type-h3">{props.labels.customer}</h2>
        <p className="type-body">{props.draft.contactName}</p>
        <p className="type-body-sm text-muted-foreground">{props.draft.contactEmail}</p>
        <p className="type-body-sm text-muted-foreground">{props.draft.contactPhone}</p>
      </section>
      <section className="grid gap-2">
        <h2 className="type-h3">{props.labels.products}</h2>
        <ul className="grid gap-2">
          {props.cart.items.map((item) => (
            <li key={item.id}>
              <p className="type-body">{item.quantity} × {item.name}</p>
              {item.configuration.map((line) => (
                <p key={line.groupName} className="type-body-sm text-muted-foreground">
                  {line.groupName}: {line.optionNames.join(", ")}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-2">
        <h2 className="type-h3">{props.labels.fulfillment}</h2>
        <p className="type-body">
          {props.draft.fulfillmentMethod === "PICKUP" ? props.labels.pickupMethod : props.labels.deliveryMethod}
        </p>
        <p className="type-body-sm text-muted-foreground">
          {props.draft.fulfillmentMethod === "PICKUP"
            ? props.selectedPickupName
            : [props.address?.street, props.address?.city, props.selectedZoneName].filter(Boolean).join(" · ")}
        </p>
        <p className="type-body-sm text-muted-foreground">
          {props.draft.requestedDate} {props.selectedSlotLabel}
        </p>
      </section>
      <form action={notesAction} className="grid max-w-lg gap-3">
        <Textarea
          name="customerNotes"
          label={props.labels.notes}
          defaultValue={props.draft.customerNotes ?? ""}
          maxLength={1000}
          disabled={notesPending}
        />
        {notesState.error ? <p role="alert" className="type-caption text-destructive">{notesState.error}</p> : null}
        <Button type="submit" variant="secondary" size="sm" disabled={notesPending} loading={notesPending}>
          {props.labels.saveNotes}
        </Button>
      </form>
      {props.readyMessage ? (
        <p role="alert" className="type-caption text-destructive">{props.readyMessage}</p>
      ) : null}
      {ready ? (
        <form action={payAction} className="grid gap-3">
          <p role="status" className="type-body text-secondary">{props.labels.ready}</p>
          <p className="type-body-sm text-muted-foreground">{props.labels.paymentCurrencyNote}</p>
          {payState.error ? <p role="alert" className="type-caption text-destructive">{payState.error}</p> : null}
          <Button type="submit" disabled={payPending} loading={payPending}>
            {props.labels.continuePayment}
          </Button>
        </form>
      ) : (
        <form action={readyAction}>
          {readyState.error ? <p role="alert" className="mb-3 type-caption text-destructive">{readyState.error}</p> : null}
          <Button type="submit" disabled={!props.canMarkReady || readyPending} loading={readyPending}>
            {props.labels.confirm}
          </Button>
        </form>
      )}
      <Link href="/carrito" className="type-label tracking-[0.12em] text-secondary">
        {props.labels.backCart}
      </Link>
    </div>
  );
}
