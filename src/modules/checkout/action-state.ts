export type CheckoutActionState = {
  error: string | null;
  success: string | null;
};

export const emptyCheckoutActionState: CheckoutActionState = {
  error: null,
  success: null,
};
