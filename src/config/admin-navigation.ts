import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  CakeSlice,
  House,
  Images,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export const adminNavigationIds = [
  "dashboard",
  "home",
  "media",
  "products",
  "universes",
  "orders",
  "customers",
  "promotions",
  "settings",
] as const;

export type AdminNavigationId = (typeof adminNavigationIds)[number];

export type AdminModuleAvailability = "ready" | "soon";

export type AdminNavigationItem = {
  id: AdminNavigationId;
  href: `/admin` | `/admin/${string}`;
  label: string;
  icon: LucideIcon;
  availability: AdminModuleAvailability;
};

export const adminNavigation: readonly AdminNavigationItem[] = [
  {
    id: "dashboard",
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    availability: "ready",
  },
  {
    id: "home",
    href: "/admin/home",
    label: "Inicio",
    icon: House,
    availability: "ready",
  },
  {
    id: "media",
    href: "/admin/media",
    label: "Media",
    icon: Images,
    availability: "ready",
  },
  {
    id: "products",
    href: "/admin/products",
    label: "Productos",
    icon: CakeSlice,
    availability: "ready",
  },
  {
    id: "universes",
    href: "/admin/universes",
    label: "Universos",
    icon: Sparkles,
    availability: "ready",
  },
  {
    id: "orders",
    href: "/admin/orders",
    label: "Pedidos",
    icon: ShoppingBag,
    availability: "ready",
  },
  {
    id: "customers",
    href: "/admin/customers",
    label: "Clientes",
    icon: Users,
    availability: "ready",
  },
  {
    id: "promotions",
    href: "/admin/promotions",
    label: "Promociones",
    icon: BadgePercent,
    availability: "soon",
  },
  {
    id: "settings",
    href: "/admin/settings",
    label: "Configuración",
    icon: Settings,
    availability: "ready",
  },
];

export function getAdminNavigationItem(pathname: string) {
  if (pathname === "/admin") {
    return adminNavigation[0];
  }

  return (
    adminNavigation.find(
      (item) => item.href !== "/admin" && pathname.startsWith(item.href),
    ) ?? adminNavigation[0]
  );
}
