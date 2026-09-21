import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const widths = {
  default: "max-w-[var(--content-max)]",
  narrow: "max-w-[var(--content-max-narrow)]",
  wide: "max-w-[var(--content-max-wide)]",
} as const;

type ContainerProps = {
  children: ReactNode;
  className?: string;
  width?: keyof typeof widths;
};

export function Container({
  children,
  className,
  width = "default",
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-[var(--page-gutter)]",
        widths[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
