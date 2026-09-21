import Link from "next/link";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/products/categories", label: "Categorías" },
  { href: "/admin/products/business-lines", label: "Líneas de negocio" },
] as const;

type CatalogSubnavProps = {
  pathname: string;
};

export function CatalogSubnav({ pathname }: CatalogSubnavProps) {
  return (
    <nav aria-label="Secciones de catálogo" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive =
          item.href === "/admin/products"
            ? pathname === "/admin/products" ||
              pathname.startsWith("/admin/products/new") ||
              /^\/admin\/products\/[0-9a-f-]+$/i.test(pathname)
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-md px-3.5 type-label",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
