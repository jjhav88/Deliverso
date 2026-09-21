"use server";

import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { getOptionalAdmin } from "@/modules/auth/authorization/require-admin";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function logoutAdminAction() {
  const admin = await getOptionalAdmin();

  if (admin) {
    try {
      await writeAdminAuditLog({
        actorAdminId: admin.id,
        action: "ADMIN_LOGOUT",
      });
    } catch {
      // Logout must still invalidate the session.
    }
  }

  if (hasSupabaseAuthConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
