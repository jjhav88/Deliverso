import { isAdminRole, type AdminRole } from "@/modules/auth/domain/admin-role";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type GrantAdminInput = {
  authUserId: string;
  email: string;
  role: AdminRole;
  displayName?: string;
};

export type GrantAdminInputError = {
  field: "authUserId" | "email" | "role";
  message: string;
};

export function parseGrantAdminInput(raw: {
  authUserId?: string;
  email?: string;
  role?: string;
  displayName?: string;
}): { ok: true; value: GrantAdminInput } | { ok: false; errors: GrantAdminInputError[] } {
  const errors: GrantAdminInputError[] = [];
  const authUserId = raw.authUserId?.trim() ?? "";
  const email = raw.email?.trim().toLowerCase() ?? "";
  const role = raw.role?.trim() ?? "";
  const displayName = raw.displayName?.trim();

  if (!UUID_PATTERN.test(authUserId)) {
    errors.push({ field: "authUserId", message: "authUserId must be a UUID." });
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({ field: "email", message: "email must be a valid address." });
  }

  if (!isAdminRole(role)) {
    errors.push({
      field: "role",
      message: "role must be SUPER_ADMIN or ADMIN.",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      authUserId,
      email,
      role: role as AdminRole,
      displayName: displayName || undefined,
    },
  };
}
