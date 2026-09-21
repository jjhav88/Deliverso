import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { adminNavigation } from "@/config/admin-navigation";
import { brandConfig } from "@/config/brand";

type AdminSidebarProps = {
  pathname: string;
  onNavigate?: () => void;
};

export function AdminSidebar({ pathname, onNavigate }: AdminSidebarProps) {
  return (
    <div className="admin-sidebar flex h-full flex-col px-4 py-6">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="mb-8 flex items-center gap-3 px-1"
      >
        <BrandLogo surface="dark" className="h-auto w-28" />
        <span className="sr-only">{brandConfig.name} Admin</span>
      </Link>

      <nav aria-label="Navegación administrativa" className="flex flex-1 flex-col gap-1">
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className="admin-sidebar-link"
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.6} />
              <span>{item.label}</span>
              {item.availability === "soon" ? (
                <span className="ml-auto text-[0.65rem] uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--deliverso-gold)_80%,white)]">
                  Pronto
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
