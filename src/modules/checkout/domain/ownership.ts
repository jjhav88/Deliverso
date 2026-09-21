export function checkoutDraftBelongsToCustomer(
  draftCustomerId: string,
  customerId: string,
): boolean {
  return Boolean(draftCustomerId) && draftCustomerId === customerId;
}

export function checkoutDraftMatchesCart(
  draftCartId: string,
  cartId: string,
): boolean {
  return Boolean(draftCartId) && draftCartId === cartId;
}

export function cartOwnedByCustomer(
  cartCustomerId: string | null | undefined,
  customerId: string,
): boolean {
  return Boolean(cartCustomerId) && cartCustomerId === customerId;
}

export function canAuthorizeCheckoutDraft(input: {
  draftCustomerId: string;
  draftCartId: string;
  customerId: string;
  cartId: string;
  cartCustomerId: string | null | undefined;
}): boolean {
  return (
    checkoutDraftBelongsToCustomer(input.draftCustomerId, input.customerId) &&
    checkoutDraftMatchesCart(input.draftCartId, input.cartId) &&
    cartOwnedByCustomer(input.cartCustomerId, input.customerId)
  );
}
