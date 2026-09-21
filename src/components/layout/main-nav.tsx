"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { StaticAppPathname } from "@/config/navigation";
import { cn } from "@/lib/cn";

export type NavLinkItem = {
  href: StaticAppPathname;
  label: string;
};

type MainNavProps = {
  items: readonly NavLinkItem[];
  onNavigate?: () => void;
  orientation?: "horizontal" | "vertical";
};

export function MainNav({
  items,
  onNavigate,
  orientation = "horizontal",
}: MainNavProps) {
  const pathname = usePathname();

  return (
    <ul
      className={cn(
        orientation === "horizontal"
          ? "flex items-center gap-6"
          : "flex flex-col gap-1",
      )}
    >
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "inline-flex min-h-11 items-center type-label tracking-[0.14em] text-muted-foreground",
                "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
                "hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive &&
                  "text-foreground underline decoration-accent decoration-2 underline-offset-8",
                orientation === "vertical" && "w-full px-1",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
