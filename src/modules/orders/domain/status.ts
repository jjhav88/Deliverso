export const orderStatuses = ["PENDING_PAYMENT", "PAID", "CANCELLED", "EXPIRED"] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value);
}

const terminalOrderStatuses = new Set<OrderStatus>(["PAID", "CANCELLED", "EXPIRED"]);

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) {
    return true;
  }
  if (from === "PAID") {
    return to === "CANCELLED";
  }
  if (from === "CANCELLED" || from === "EXPIRED") {
    return false;
  }
  return to === "PAID" || to === "CANCELLED" || to === "EXPIRED";
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return terminalOrderStatuses.has(status);
}

export function paymentSuccessPreventsExpiry(input: {
  status: OrderStatus;
  paymentSucceeded: boolean;
}): boolean {
  return input.paymentSucceeded || input.status === "PAID";
}
