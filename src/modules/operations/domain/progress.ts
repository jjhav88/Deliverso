import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";

export type OrderProgressStepId =
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED";

export type OrderProgressStep = {
  id: OrderProgressStepId;
  label: string;
};

export type OrderProgressState = {
  cancelled: boolean;
  inactive: boolean;
  currentIndex: number;
  completed: boolean;
  steps: OrderProgressStep[];
};

function labelsFor(method: FulfillmentMethod, locale: string): OrderProgressStep[] {
  const en = locale === "en-US";
  if (method === "PICKUP") {
    return [
      { id: "CONFIRMED", label: en ? "Confirmed" : "Confirmado" },
      { id: "IN_PRODUCTION", label: en ? "Preparation" : "Preparación" },
      { id: "READY", label: en ? "Ready for pickup" : "Listo para recoger" },
      { id: "COMPLETED", label: en ? "Picked up" : "Recogido" },
    ];
  }
  return [
    { id: "CONFIRMED", label: en ? "Confirmed" : "Confirmado" },
    { id: "IN_PRODUCTION", label: en ? "Preparation" : "Preparación" },
    { id: "READY", label: en ? "Ready" : "Listo" },
    { id: "OUT_FOR_DELIVERY", label: en ? "On the way" : "En camino" },
    { id: "COMPLETED", label: en ? "Delivered" : "Entregado" },
  ];
}

function stepIdFor(status: FulfillmentStatus): OrderProgressStepId {
  if (status === "PENDING") {
    return "CONFIRMED";
  }
  if (status === "OUT_FOR_DELIVERY") {
    return "OUT_FOR_DELIVERY";
  }
  if (status === "IN_PRODUCTION") {
    return "IN_PRODUCTION";
  }
  if (status === "READY") {
    return "READY";
  }
  if (status === "COMPLETED") {
    return "COMPLETED";
  }
  return "CONFIRMED";
}

export function getOrderProgressState(input: {
  orderStatus: OrderStatus | string;
  fulfillmentStatus: FulfillmentStatus | string;
  fulfillmentMethod: FulfillmentMethod;
  locale?: string;
}): OrderProgressState {
  const locale = input.locale ?? "es-MX";
  const steps = labelsFor(input.fulfillmentMethod, locale);
  if (input.orderStatus === "CANCELLED" || input.fulfillmentStatus === "CANCELLED") {
    return { cancelled: true, inactive: true, currentIndex: -1, completed: false, steps };
  }
  if (input.orderStatus === "PENDING_PAYMENT" || input.orderStatus === "EXPIRED") {
    return { cancelled: false, inactive: true, currentIndex: -1, completed: false, steps };
  }
  const currentId = stepIdFor(input.fulfillmentStatus as FulfillmentStatus);
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentId),
  );
  return {
    cancelled: false,
    inactive: false,
    currentIndex,
    completed: input.fulfillmentStatus === "COMPLETED",
    steps,
  };
}
