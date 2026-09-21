export const adminRoles = ["SUPER_ADMIN", "ADMIN"] as const;

export type AdminRole = (typeof adminRoles)[number];

export function isAdminRole(value: string): value is AdminRole {
  return (adminRoles as readonly string[]).includes(value);
}

export function canAccessAdminPanel(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function hasRequiredRole(
  role: AdminRole,
  allowed: readonly AdminRole[],
): boolean {
  return allowed.includes(role);
}
