"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getAdminNavigationItem } from "@/config/admin-navigation";
import { AdminShell } from "@/modules/admin/components/admin-shell";
import type { PublicAdminProfile } from "@/modules/auth/types";

type AdminAppFrameProps = {
  admin: PublicAdminProfile;
  children: ReactNode;
};

export function AdminAppFrame({ admin, children }: AdminAppFrameProps) {
  const pathname = usePathname();
  const current = getAdminNavigationItem(pathname);

  return (
    <AdminShell title={current.label} pathname={pathname} admin={admin}>
      {children}
    </AdminShell>
  );
}
