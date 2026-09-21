import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { logoutAdminAction } from "@/modules/auth/actions/logout";
import { AdminMobileNav } from "@/modules/admin/components/admin-mobile-nav";
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

export function AdminTopbar({ title, pathname, admin }: AdminTopbarProps) {
  return (
    <header className="flex h-[var(--admin-topbar-height)] items-center justify-between gap-3 border-b border-border bg-[var(--admin-surface)] px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <AdminMobileNav pathname={pathname} />
        <h1 className="truncate type-h3 text-foreground">{title}</h1>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate type-body-sm text-foreground">
            {admin.displayName ?? admin.email}
          </p>
          <p className="truncate type-caption text-muted-foreground">{admin.email}</p>
        </div>
        <Badge variant="accent">{roleLabel[admin.role]}</Badge>
        <form action={logoutAdminAction}>
          <button
            type="submit"
            className={buttonClassName({
              variant: "ghost",
              size: "sm",
              className: "min-h-11 min-w-11 px-2",
            })}
            aria-label="Cerrar sesión"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  );
}
