import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type BreadcrumbItem = {
  label: string;
  href?: ComponentProps<typeof Link>["href"];
  current?: boolean;
};

type CatalogBreadcrumbsProps = {
  label: string;
  items: BreadcrumbItem[];
};

export function CatalogBreadcrumbs({ label, items }: CatalogBreadcrumbsProps) {
  return (
    <nav aria-label={label} className="type-caption text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href && !item.current ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current={item.current ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
