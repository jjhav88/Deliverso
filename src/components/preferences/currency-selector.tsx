"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { CurrencyCode } from "@/config/currency";
import { cn } from "@/lib/cn";
import { setDisplayCurrencyAction } from "@/server/preferences/set-display-currency";

export type CurrencyOption = {
  code: CurrencyCode;
  name: string;
};

type CurrencySelectorProps = {
  current: CurrencyCode;
  options: readonly CurrencyOption[];
  label: string;
  compact?: boolean;
};

export function CurrencySelector({
  current,
  options,
  label,
  compact = false,
}: CurrencySelectorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2">
      {!compact ? (
        <span className="type-caption text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
      <span className="relative inline-flex">
        <select
          aria-label={label}
          value={current}
          disabled={pending}
          onChange={(event) => {
            const value = event.target.value;
            startTransition(async () => {
              await setDisplayCurrencyAction(value);
              router.refresh();
            });
          }}
          className={cn(
            "min-h-11 min-w-[4.75rem] appearance-none rounded-md border border-transparent bg-transparent py-0 pl-2 pr-7 type-label text-foreground",
            "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
            "hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-wait disabled:opacity-70",
          )}
        >
          {options.map((option) => (
            <option key={option.code} value={option.code} title={option.name}>
              {option.code}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground"
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
      </span>
    </label>
  );
}
