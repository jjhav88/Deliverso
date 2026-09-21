export type CartCheckoutMode = "active" | "pending_payment" | "confirming_payment";

export function resolveCartCheckoutMode(input: {
  cartStatus?: string | null;
  pendingOrderNumber?: string | null;
  paymentIntentStatus?: string | null;
}): CartCheckoutMode {
  if (input.cartStatus === "PENDING_PAYMENT" && input.pendingOrderNumber) {
    if (input.paymentIntentStatus === "succeeded") {
      return "confirming_payment";
    }
    return "pending_payment";
  }
  return "active";
}

export function shouldOfferContinuePayment(mode: CartCheckoutMode): boolean {
  return mode === "pending_payment";
}

export function shouldOfferCancelPendingOrder(mode: CartCheckoutMode): boolean {
  return mode === "pending_payment";
}
