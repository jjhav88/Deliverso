import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const badgeVariants = [
  "default",
  "secondary",
  "accent",
  "success",
  "warning",
  "destructive",
] as const;

export type BadgeVariant = (typeof badgeVariants)[number];

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 type-caption font-medium tracking-[0.04em] uppercase",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
