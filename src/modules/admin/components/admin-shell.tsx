import { AdminSidebar } from "@/modules/admin/components/admin-sidebar";
import { AdminTopbar } from "@/modules/admin/components/admin-topbar";
import type { PublicAdminProfile } from "@/modules/auth/types";
import type { ReactNode } from "react";
import "@/modules/admin/admin.css";

type AdminShellProps = {
  title: string;
  pathname: string;
  admin: PublicAdminProfile;
  children: ReactNode;
};

export function AdminShell({
  title,
  pathname,
  admin,
  children,
}: AdminShellProps) {
  return (
    <div className="admin-app lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="hidden h-dvh lg:sticky lg:top-0 lg:block">
        <AdminSidebar pathname={pathname} />
      </aside>
      <div className="flex min-h-dvh flex-col">
        <AdminTopbar title={title} pathname={pathname} admin={admin} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
