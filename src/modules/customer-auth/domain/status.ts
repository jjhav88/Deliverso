export const customerStatuses = ["ACTIVE", "BLOCKED"] as const;

export type CustomerStatus = (typeof customerStatuses)[number];

export function isCustomerStatus(value: string): value is CustomerStatus {
  return customerStatuses.includes(value as CustomerStatus);
}

export function canCustomerShop(status: CustomerStatus): boolean {
  return status === "ACTIVE";
}
