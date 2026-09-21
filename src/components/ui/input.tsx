import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: ReactNode;
  error?: string;
};

export function Input({
  id,
  label,
  helperText,
  error,
  required,
  disabled,
  className,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="type-label text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-11 w-full rounded-md border bg-surface-elevated px-3.5 type-body text-foreground",
          "placeholder:text-muted-foreground/70",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70",
          error ? "border-destructive" : "border-border-strong",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="type-caption text-destructive">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="type-caption text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
