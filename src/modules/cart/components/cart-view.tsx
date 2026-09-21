"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button, buttonClassName } from "@/components/ui/button";
import type { CartView } from "@/modules/cart/types";
import { emptyCartActionState } from "@/modules/cart/action-state";
import {
  clearCartAction,
  removeCartItemAction,
  updateCartItemQuantityAction,
} from "@/modules/cart/actions";
import { QuantitySelector } from "@/modules/catalog/components/quantity-selector";
import { useState } from "react";

type CartPageViewProps = {
  cart: CartView;
  labels: {
    empty: string;
    discover: string;
    subtotal: string;
    keepShopping: string;
    clear: string;
    confirmClear: string;
    quantity: string;
    decrease: string;
    increase: string;
    remove: string;
    unavailable: string;
    configUnavailable: string;
    update: string;
    unitPrice: string;
    lineTotal: string;
    checkout?: string;
    reviewCart?: string;
    pendingPaymentTitle?: string;
    pendingPaymentBody?: string;
    confirmingPaymentTitle?: string;
    confirmingPaymentBody?: string;
    viewOrder?: string;
    continuePayment?: string;
    confirmCancelPending?: string;
  };
  canCheckout?: boolean;
  locked?: boolean;
  mode?: "active" | "pending_payment" | "confirming_payment";
  pendingLabel?: string;
  cancelLabel?: string;
  cancelAction?: (formData: FormData) => void | Promise<void>;
  orderNumber?: string;
};

export function CartPageView({
  cart,
  labels,
  canCheckout,
  locked,
  mode = "active",
  pendingLabel,
  cancelLabel,
  cancelAction,
  orderNumber,
}: CartPageViewProps) {
  const [updateState, updateAction] = useActionState(
    updateCartItemQuantityAction,
    emptyCartActionState,
  );
  const [removeState, removeAction] = useActionState(
    removeCartItemAction,
    emptyCartActionState,
  );
  const [clearState, clearAction, clearing] = useActionState(
    clearCartAction,
    emptyCartActionState,
  );

  if (cart.items.length === 0) {
    return (
      <div className="mt-10 max-w-md">
        <p className="type-body text-muted-foreground">{labels.empty}</p>
        <Link href="/productos" className="mt-6 inline-block type-label tracking-[0.12em] text-secondary">
          {labels.discover}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]">
      <ul className="grid gap-8">
        {cart.items.map((item) => (
          <CartLine
            key={item.id}
            item={item}
            labels={labels}
            locked={locked}
            updateAction={updateAction}
            removeAction={removeAction}
          />
        ))}
      </ul>
      <aside className="h-fit rounded-lg border border-border p-5">
        <p className="type-label tracking-[0.12em] text-secondary">{labels.subtotal}</p>
        <p className="type-h2 mt-3 tabular-nums">{cart.displaySubtotal.formatted}</p>
        {(updateState.error || removeState.error || clearState.error) ? (
          <p role="alert" className="mt-3 type-caption text-destructive">
            {updateState.error || removeState.error || clearState.error}
          </p>
        ) : null}
        {mode === "pending_payment" && orderNumber ? (
          <div className="mt-6 grid gap-4">
            <div>
              <p className="type-h3">{labels.pendingPaymentTitle}</p>
              <p className="type-body-sm mt-2 text-muted-foreground">{labels.pendingPaymentBody}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={{ pathname: "/pago/[orderNumber]", params: { orderNumber } }}
                className={buttonClassName({ className: "w-full sm:w-auto" })}
              >
                {pendingLabel ?? labels.continuePayment}
              </Link>
              <Link
                href="/productos"
                className={buttonClassName({ variant: "outline", className: "w-full sm:w-auto" })}
              >
                {labels.keepShopping}
              </Link>
            </div>
          </div>
        ) : mode === "confirming_payment" && orderNumber ? (
          <div className="mt-6 grid gap-4">
            <div>
              <p className="type-h3">{labels.confirmingPaymentTitle}</p>
              <p className="type-body-sm mt-2 text-muted-foreground">{labels.confirmingPaymentBody}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={{ pathname: "/pedido/[orderNumber]/confirmacion", params: { orderNumber } }}
                className={buttonClassName({ className: "w-full sm:w-auto" })}
              >
                {labels.viewOrder}
              </Link>
              <Link
                href="/productos"
                className={buttonClassName({ variant: "outline", className: "w-full sm:w-auto" })}
              >
                {labels.keepShopping}
              </Link>
            </div>
          </div>
        ) : canCheckout ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/checkout" className={buttonClassName({ className: "w-full sm:w-auto" })}>
              {labels.checkout}
            </Link>
            <Link
              href="/productos"
              className={buttonClassName({ variant: "outline", className: "w-full sm:w-auto" })}
            >
              {labels.keepShopping}
            </Link>
          </div>
        ) : labels.reviewCart && cart.items.length > 0 ? (
          <p className="mt-6 type-caption text-destructive">{labels.reviewCart}</p>
        ) : (
          <Link href="/productos" className="mt-6 inline-block type-label tracking-[0.12em] text-secondary">
            {labels.keepShopping}
          </Link>
        )}
        {mode === "pending_payment" && cancelAction && orderNumber ? (
          <form
            action={cancelAction}
            className="mt-4"
            onSubmit={(event) => {
              if (labels.confirmCancelPending && !window.confirm(labels.confirmCancelPending)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="orderNumber" value={orderNumber} />
            <Button type="submit" variant="ghost" size="sm">
              {cancelLabel}
            </Button>
          </form>
        ) : mode === "active" ? (
          <form
            action={clearAction}
            className="mt-4"
            onSubmit={(event) => {
              if (!window.confirm(labels.confirmClear)) {
                event.preventDefault();
              }
            }}
          >
            <Button type="submit" variant="ghost" size="sm" loading={clearing}>
              {labels.clear}
            </Button>
          </form>
        ) : null}
      </aside>
    </div>
  );
}

function CartLine({
  item,
  labels,
  locked,
  updateAction,
  removeAction,
}: {
  item: CartView["items"][number];
  labels: CartPageViewProps["labels"];
  locked?: boolean;
  updateAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);

  return (
    <li className="grid gap-4 border-b border-border pb-8 sm:grid-cols-[7rem_minmax(0,1fr)]">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        {item.imageSrc ? (
          <Image src={item.imageSrc} alt={item.imageAlt} fill className="object-cover" sizes="112px" />
        ) : null}
      </div>
      <div>
        <p className="type-h3">{item.name}</p>
        {item.configuration.length > 0 ? (
          <ul className="mt-2 grid gap-1">
            {item.configuration.map((line) => (
              <li key={line.groupName} className="type-body-sm text-muted-foreground">
                {line.groupName}: {line.optionNames.join(", ")}
              </li>
            ))}
          </ul>
        ) : null}
        {!item.valid ? (
          <p role="alert" className="mt-2 type-caption text-destructive">
            {item.issues.some((issue) => issue.code === "PRODUCT_UNAVAILABLE")
              ? labels.unavailable
              : labels.configUnavailable}
          </p>
        ) : null}
        <dl className="mt-3 grid gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2 type-body-sm tabular-nums">
            <dt className="text-muted-foreground">{labels.unitPrice}</dt>
            <dd>{item.displayUnitPrice?.formatted ?? "—"}</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 type-body tabular-nums">
            <dt className="type-body-sm text-muted-foreground">{labels.lineTotal}</dt>
            <dd className="font-medium">{item.displayLineTotal?.formatted ?? "—"}</dd>
          </div>
        </dl>
        {locked ? null : (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <form action={updateAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="quantity" value={String(quantity)} />
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              decreaseLabel={labels.decrease}
              increaseLabel={labels.increase}
              inputLabel={labels.quantity}
            />
            <Button type="submit" variant="secondary" size="sm">
              {labels.update}
            </Button>
          </form>
          <form action={removeAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <Button type="submit" variant="ghost" size="sm" aria-label={`${labels.remove} ${item.name}`}>
              {labels.remove}
            </Button>
          </form>
        </div>
        )}
      </div>
    </li>
  );
}
