import "server-only";
import { notFound } from "next/navigation";
import {
  hasRequiredRole,
  type AdminRole,
} from "@/modules/auth/domain/admin-role";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import type { AuthenticatedAdmin } from "@/modules/auth/types";

export async function requireRole(
  allowed: readonly AdminRole[],
  next = "/admin",
): Promise<AuthenticatedAdmin> {
  const admin = await requireAdmin(next);

  if (!hasRequiredRole(admin.role, allowed)) {
    notFound();
  }

  return admin;
}
