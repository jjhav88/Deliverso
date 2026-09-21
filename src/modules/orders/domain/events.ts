export const orderEventTypes = [
  "ORDER_CREATED",
  "PAYMENT_SUCCEEDED",
  "PAYMENT_FAILED",
  "PAYMENT_PROCESSING",
  "PAYMENT_CANCELED",
  "PAYMENT_AMOUNT_MISMATCH",
  "FULFILLMENT_STATUS_CHANGED",
  "ORDER_CANCELLED",
  "ORDER_EXPIRED",
] as const;

export type OrderEventType = (typeof orderEventTypes)[number];
