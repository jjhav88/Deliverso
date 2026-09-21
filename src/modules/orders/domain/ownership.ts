export function canAccessCustomerOrder(input: {
  orderCustomerId: string;
  customerId: string;
}): boolean {
  return Boolean(input.orderCustomerId) && input.orderCustomerId === input.customerId;
}

export function isCartWritable(status: string): boolean {
  return status === "ACTIVE";
}

export function isCartLockedForPayment(status: string): boolean {
  return status === "PENDING_PAYMENT";
}
