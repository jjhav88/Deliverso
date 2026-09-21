export const adminStatuses = ["ACTIVE", "DISABLED"] as const;

export type AdminStatus = (typeof adminStatuses)[number];

export function isAdminStatus(value: string): value is AdminStatus {
  return (adminStatuses as readonly string[]).includes(value);
}

export function canAdminStatusSignIn(status: AdminStatus): boolean {
  return status === "ACTIVE";
}
