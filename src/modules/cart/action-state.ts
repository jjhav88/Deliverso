export type CartActionState = {
  error: string | null;
  success: string | null;
};

export const emptyCartActionState: CartActionState = {
  error: null,
  success: null,
};
