"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getAdminNavigationItem } from "@/config/admin-navigation";
import { AdminShell } from "@/modules/admin/components/admin-shell";
import type { PublicAdminProfile } from "@/modules/auth/types";
import { LegalIncompleteBanner } from "@/modules/legal/components/legal-incomplete-banner";
import type { LegalReadiness } from "@/modules/legal/domain/types";

type AdminAppFrameProps = {
  admin: PublicAdminProfile;
  legalReadiness: LegalReadiness;
  children: ReactNode;
};

export function AdminAppFrame({ admin, legalReadiness, children }: AdminAppFrameProps) {
  const pathname = usePathname();
  const current = getAdminNavigationItem(pathname);
  const title = pathname.startsWith("/admin/profile")
    ? "Mi perfil"
    : pathname.startsWith("/admin/legal/privacy-requests")
      ? "Privacidad"
      : current.label;

  return (
    <AdminShell title={title} pathname={pathname} admin={admin}>
      <LegalIncompleteBanner readiness={legalReadiness} />
      {children}
    </AdminShell>
  );
}
