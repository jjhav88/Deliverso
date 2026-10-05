import { getOrderProgressState } from "@/modules/operations/domain/progress";
import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";
import { cn } from "@/lib/cn";

export function OrderProgress({
  orderStatus,
  fulfillmentStatus,
  fulfillmentMethod,
  locale = "es-MX",
  cancelledLabel,
}: {
  orderStatus: OrderStatus | string;
  fulfillmentStatus: FulfillmentStatus | string;
  fulfillmentMethod: FulfillmentMethod;
  locale?: string;
  cancelledLabel: string;
}) {
  const progress = getOrderProgressState({
    orderStatus,
    fulfillmentStatus,
    fulfillmentMethod,
    locale,
  });

  if (progress.cancelled) {
    return <p className="type-body">{cancelledLabel}</p>;
  }

  if (progress.inactive) {
    return null;
  }

  return (
    <ol className="grid gap-3">
      {progress.steps.map((step, index) => {
        const done = progress.completed || index < progress.currentIndex;
        const current = !progress.completed && index === progress.currentIndex;
        return (
          <li
            key={step.id}
            className="flex items-start gap-3"
            aria-current={current ? "step" : undefined}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full type-caption",
                done || current
                  ? "bg-secondary text-secondary-foreground"
                  : "border border-border text-muted-foreground",
              )}
            >
              {done ? "✓" : index + 1}
            </span>
            <span className={cn("type-body", current ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
