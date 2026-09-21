import { BrandLogo } from "@/components/brand/brand-logo";
import type { ReactNode } from "react";

export function CustomerAuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
      <div className="hidden lg:block">
        <BrandLogo mark="icon" className="h-16 w-auto" />
        <p className="type-label mt-8 tracking-[0.18em] text-secondary">DELIVERSO</p>
        <h1 className="type-display-l mt-4 text-pretty">{title}</h1>
        <p className="type-body mt-4 max-w-md text-muted-foreground">{intro}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface-elevated p-6 sm:p-8">
        <div className="lg:hidden">
          <h1 className="type-h2">{title}</h1>
          <p className="type-body-sm mt-2 text-muted-foreground">{intro}</p>
        </div>
        <div className="mt-6 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
