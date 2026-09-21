import type { ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly SelectOption[];
  helperText?: ReactNode;
  error?: string;
};

export function Select({
  id,
  label,
  options,
  helperText,
  error,
  required,
  disabled,
  className,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={selectId} className="type-label text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <select
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-11 w-full appearance-none rounded-md border bg-surface-elevated px-3.5 pr-10 type-body text-foreground",
            "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70",
            error ? "border-destructive" : "border-border-strong",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-muted-foreground"
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
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
