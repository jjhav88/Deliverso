import type { ReactNode } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { AdminAppFrame } from "@/modules/admin/components/admin-app-frame";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { signAvatarUrl } from "@/modules/avatars/service";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  await connection();
  const headerList = await headers();
  const nextPath = headerList.get("x-admin-pathname") ?? "/admin";
  const admin = await requireAdmin(
    nextPath.startsWith("/admin") ? nextPath : "/admin",
  );

  const avatarUrl = await signAvatarUrl(admin.avatarPath);

  return (
    <AdminAppFrame
      admin={{
        email: admin.email,
        displayName: admin.displayName,
        avatarUrl,
        role: admin.role,
      }}
    >
      {children}
    </AdminAppFrame>
  );
}
