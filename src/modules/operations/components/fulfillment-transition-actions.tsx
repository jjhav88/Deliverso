"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import {
  emptyFulfillmentActionState,
  updateOrderFulfillmentStatus,
} from "@/modules/operations/actions";
import { fulfillmentActionLabel } from "@/modules/operations/domain/transitions";

export function FulfillmentTransitionActions({
  orderId,
  method,
  transitions,
}: {
  orderId: string;
  method: FulfillmentMethod;
  transitions: FulfillmentStatus[];
}) {
  const [state, action, pending] = useActionState(
    updateOrderFulfillmentStatus,
    emptyFulfillmentActionState,
  );

  if (transitions.length === 0 && !state.error) {
    return null;
  }

  return (
    <div className="grid gap-2">
      {state.error ? (
        <p role="alert" className="type-body-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="type-body-sm text-secondary" aria-live="polite">
          {state.success}
        </p>
      ) : null}
      {transitions.map((status) => (
        <form key={status} action={action}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="fulfillmentStatus" value={status} />
          <Button type="submit" variant="secondary" size="sm" loading={pending}>
            {fulfillmentActionLabel(status, method)}
          </Button>
        </form>
      ))}
    </div>
  );
}
