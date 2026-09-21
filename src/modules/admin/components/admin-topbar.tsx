import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SessionIdentity } from "@/modules/account/components/session-identity";
import { profileDisplayName } from "@/modules/account/domain/presentation";
import { AdminMobileNav } from "@/modules/admin/components/admin-mobile-nav";
import { logoutAdminAction } from "@/modules/auth/actions/logout";
import type { PublicAdminProfile } from "@/modules/auth/types";

type AdminTopbarProps = {
  title: string;
  pathname: string;
  admin: PublicAdminProfile;
};

const roleLabel = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
} as const;

function AdminProfileLink({
  href,
  className,
  "aria-label": ariaLabel,
  children,
}: {
  href: string;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function AdminTopbar({ title, pathname, admin }: AdminTopbarProps) {
  const displayName = profileDisplayName(admin);

  return (
    <header className="flex h-[var(--admin-topbar-height)] items-center justify-between gap-3 border-b border-border bg-[var(--admin-surface)] px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <AdminMobileNav pathname={pathname} />
        <h1 className="truncate type-h3 text-foreground">{title}</h1>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Badge variant="accent">{roleLabel[admin.role]}</Badge>
        <SessionIdentity
          displayName={displayName}
          avatarUrl={admin.avatarUrl}
          profileHref="/admin/profile"
          profileLabel="Mi perfil"
          signOutLabel="Cerrar sesión"
          menuLabel="Menú de cuenta"
          logoutAction={logoutAdminAction}
          profileLink={AdminProfileLink}
        />
      </div>
    </header>
  );
}
