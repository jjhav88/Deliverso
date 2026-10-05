import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import {
  canTransitionFulfillmentStatus,
  isFulfillmentStatus,
  nextFulfillmentStatuses,
  type FulfillmentStatus,
} from "@/modules/orders/domain/fulfillment-status";
import type { PaymentStatus } from "@/modules/orders/domain/payment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";
import { isOrderCancelledForOperations, isPaidForFulfillment } from "@/modules/operations/domain/eligibility";

export type FulfillmentTransitionOrder = {
  status: OrderStatus | string;
  paymentStatus: PaymentStatus | string;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentMethod: FulfillmentMethod;
};

export type FulfillmentTransitionEvaluation =
  | { ok: true; from: FulfillmentStatus; to: FulfillmentStatus; noop: boolean }
  | {
      ok: false;
      code: "UNPAID" | "CANCELLED" | "INVALID";
      error: string;
    };

export function getAllowedFulfillmentTransitions(
  order: FulfillmentTransitionOrder,
): FulfillmentStatus[] {
  if (isOrderCancelledForOperations(order)) {
    return [];
  }
  if (!isPaidForFulfillment(order)) {
    return [];
  }
  return nextFulfillmentStatuses(order.fulfillmentStatus, order.fulfillmentMethod);
}

export function evaluateFulfillmentTransition(
  order: FulfillmentTransitionOrder,
  nextStatus: string,
): FulfillmentTransitionEvaluation {
  if (!isFulfillmentStatus(nextStatus)) {
    return { ok: false, code: "INVALID", error: "Esa transición de estado no está permitida." };
  }
  if (isOrderCancelledForOperations(order)) {
    return {
      ok: false,
      code: "CANCELLED",
      error: "Este pedido está cancelado y no admite cambios operativos.",
    };
  }
  if (!isPaidForFulfillment(order)) {
    return {
      ok: false,
      code: "UNPAID",
      error: "No se puede operar un pedido hasta que el pago esté confirmado.",
    };
  }
  if (order.fulfillmentStatus === nextStatus) {
    return { ok: true, from: order.fulfillmentStatus, to: nextStatus, noop: true };
  }
  const allowed = getAllowedFulfillmentTransitions(order);
  if (
    !allowed.includes(nextStatus) ||
    !canTransitionFulfillmentStatus({
      from: order.fulfillmentStatus,
      to: nextStatus,
      method: order.fulfillmentMethod,
      orderPaid: true,
    })
  ) {
    return { ok: false, code: "INVALID", error: "Esa transición de estado no está permitida." };
  }
  return { ok: true, from: order.fulfillmentStatus, to: nextStatus, noop: false };
}

export function fulfillmentActionLabel(
  nextStatus: FulfillmentStatus,
  method: FulfillmentMethod,
): string {
  switch (nextStatus) {
    case "CONFIRMED":
      return "Confirmar pedido";
    case "IN_PRODUCTION":
      return "Iniciar producción";
    case "READY":
      return "Marcar como listo";
    case "OUT_FOR_DELIVERY":
      return "Salir a entrega";
    case "COMPLETED":
      return method === "PICKUP" ? "Marcar como recogido" : "Completar pedido";
    default:
      return nextStatus;
  }
}

export function fulfillmentMethodLabel(method: FulfillmentMethod, locale = "es-MX"): string {
  if (locale === "en-US") {
    return method === "PICKUP" ? "Pickup" : "Delivery";
  }
  return method === "PICKUP" ? "Recogida" : "Entrega";
}
