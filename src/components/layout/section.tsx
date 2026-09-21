import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  surface?: "default" | "subtle" | "dark";
};

const surfaceClasses = {
  default: "",
  subtle: "bg-surface-subtle",
  dark: "surface-dark",
} as const;

export function Section({
  children,
  className,
  id,
  surface = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-[var(--section-space)]", surfaceClasses[surface], className)}
    >
      {children}
    </section>
  );
}
