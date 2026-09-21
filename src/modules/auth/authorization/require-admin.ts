import "server-only";
import { redirect } from "next/navigation";
import { canAdminStatusSignIn } from "@/modules/auth/domain/admin-status";
import { canAccessAdminPanel } from "@/modules/auth/domain/admin-role";
import type { AuthenticatedAdmin } from "@/modules/auth/types";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { getVerifiedAuthUser } from "@/server/supabase/session";

function loginPath(next?: string): string {
  if (!next || next === "/admin/login") {
    return "/admin/login";
  }

  return `/admin/login?next=${encodeURIComponent(next)}`;
}

async function rejectAdminSession(next?: string): Promise<never> {
  if (hasSupabaseAuthConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect(loginPath(next));
}

export async function findActiveAdminByAuthUserId(
  authUserId: string,
): Promise<AuthenticatedAdmin | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const account = await getPrisma().adminAccount.findUnique({
    where: { authUserId },
  });

  if (!account) {
    return null;
  }

  if (!canAdminStatusSignIn(account.status) || !canAccessAdminPanel(account.role)) {
    return null;
  }

  return {
    id: account.id,
    authUserId: account.authUserId,
    email: account.email,
    displayName: account.displayName,
    avatarPath: account.avatarPath,
    role: account.role,
    status: account.status,
  };
}

export async function getOptionalAdmin(): Promise<AuthenticatedAdmin | null> {
  if (!hasSupabaseAuthConfig() || !hasRuntimeDatabaseUrl()) {
    return null;
  }

  const user = await getVerifiedAuthUser();
  if (!user) {
    return null;
  }

  return findActiveAdminByAuthUserId(user.id);
}

export async function requireAdmin(next = "/admin"): Promise<AuthenticatedAdmin> {
  if (!hasSupabaseAuthConfig() || !hasRuntimeDatabaseUrl()) {
    redirect(loginPath(next));
  }

  const user = await getVerifiedAuthUser();
  if (!user) {
    redirect(loginPath(next));
  }

  const admin = await findActiveAdminByAuthUserId(user.id);
  if (!admin) {
    await rejectAdminSession(next);
  }

  return admin as AuthenticatedAdmin;
}
