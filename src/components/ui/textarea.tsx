import type { ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helperText?: ReactNode;
  error?: string;
};

export function Textarea({
  id,
  label,
  helperText,
  error,
  required,
  disabled,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={textareaId} className="type-label text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        ) : null}
      </label>
      <textarea
        id={textareaId}
        required={required}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-28 w-full resize-y rounded-md border bg-surface-elevated px-3.5 py-3 type-body text-foreground",
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
