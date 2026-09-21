import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type TextLinkVariant = "inline" | "nav" | "emphasized";

type TextLinkProps = ComponentProps<typeof Link> & {
  variant?: TextLinkVariant;
};

const variantClasses: Record<TextLinkVariant, string> = {
  inline:
    "underline decoration-accent/70 underline-offset-4 hover:decoration-accent",
  nav: "no-underline hover:text-secondary",
  emphasized:
    "font-medium text-secondary underline decoration-transparent underline-offset-4 hover:decoration-accent",
};

export function TextLink({
  variant = "inline",
  className,
  ...props
}: TextLinkProps) {
  return (
    <Link
      className={cn(
        "rounded-sm text-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
