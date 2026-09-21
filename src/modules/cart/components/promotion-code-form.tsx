"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyCartActionState } from "@/modules/cart/action-state";
import { applyPromotionCodeToCart, removePromotionFromCart } from "@/modules/promotions/customer-actions";
import type { CartPromotionView } from "@/modules/cart/types";

type Props = {
  promotion: CartPromotionView | null;
  labels: {
    title: string;
    apply: string;
    applied: string;
    remove: string;
    unavailable: string;
    deliveryHint: string;
  };
};

export function PromotionCodeForm({ promotion, labels }: Props) {
  const [state, action, pending] = useActionState(applyPromotionCodeToCart, emptyCartActionState);

  return (
    <div className="mt-6 grid gap-3">
      <p className="type-label tracking-[0.12em] text-secondary">{labels.title}</p>
      {promotion?.applied && promotion.label ? (
        <div className="grid gap-2">
          <p className="type-body-sm">
            {labels.applied}
            {promotion.code ? ` · ${promotion.code}` : ""} — {promotion.label}
          </p>
          <form action={removePromotionFromCart}>
            <Button type="submit" variant="ghost" size="sm">
              {labels.remove}
            </Button>
          </form>
        </div>
      ) : (
        <form action={action} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Input name="code" label={labels.title} autoComplete="off" disabled={pending} />
          <Button type="submit" variant="secondary" disabled={pending} loading={pending}>
            {labels.apply}
          </Button>
        </form>
      )}
      {state.error || promotion?.invalidated ? (
        <p role="alert" className="type-caption text-destructive">
          {state.error ?? labels.unavailable}
        </p>
      ) : null}
      {promotion?.deliveryHint ? (
        <p className="type-caption text-muted-foreground">{labels.deliveryHint}</p>
      ) : null}
    </div>
  );
}
