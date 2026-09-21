import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "accent",
] as const;

export const buttonSizes = ["sm", "md", "lg"] as const;

export type ButtonVariant = (typeof buttonVariants)[number];
export type ButtonSize = (typeof buttonSizes)[number];

type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:translate-y-px",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:translate-y-px",
  outline:
    "border border-border-strong bg-transparent text-foreground hover:bg-muted active:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted active:bg-muted",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 active:translate-y-px",
  accent:
    "bg-accent text-accent-foreground hover:opacity-90 active:translate-y-px",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 gap-1.5 px-3.5 text-sm",
  md: "min-h-11 gap-2 px-5 text-sm",
  lg: "min-h-12 gap-2 px-6 text-base",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonClassNameOptions = {}): string {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium tracking-wide",
    "transition-[background-color,opacity,transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
