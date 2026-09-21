export type OrderActionState = {
  error: string | null;
  success: string | null;
};

export const emptyOrderActionState: OrderActionState = {
  error: null,
  success: null,
};

export const ORDER_CHANGED_MESSAGE =
  "Tu pedido cambió. Revisa la información antes de continuar.";
