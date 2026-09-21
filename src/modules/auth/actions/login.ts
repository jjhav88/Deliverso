"use server";

import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { findActiveAdminByAuthUserId } from "@/modules/auth/authorization/require-admin";
import { getSafeAdminPath } from "@/modules/auth/authorization/safe-redirect";
import { adminLoginSchema } from "@/modules/auth/validation/login-schema";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type AdminLoginState = {
  error: string | null;
};

const GENERIC_INVALID = "Las credenciales no son válidas.";
const GENERIC_UNAUTHORIZED = "No tienes acceso administrativo.";

export async function loginAdminAction(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { error: GENERIC_INVALID };
  }

  if (!hasSupabaseAuthConfig() || !hasRuntimeDatabaseUrl()) {
    return { error: GENERIC_UNAUTHORIZED };
  }

  const destination = getSafeAdminPath(parsed.data.next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: GENERIC_INVALID };
  }

  const { data: verified, error: verifyError } = await supabase.auth.getUser();

  if (verifyError || !verified.user || verified.user.id !== data.user.id) {
    await supabase.auth.signOut();
    return { error: GENERIC_INVALID };
  }

  const admin = await findActiveAdminByAuthUserId(verified.user.id);

  if (!admin) {
    await supabase.auth.signOut();
    return { error: GENERIC_UNAUTHORIZED };
  }

  await getPrisma().adminAccount.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "ADMIN_LOGIN",
  });

  redirect(destination);
}
