"use client";

import NextLink from "next/link";
import { useLocale } from "next-intl";
import type { AppLocale } from "@/config/i18n";
import { supportedLocales } from "@/config/i18n";
import { localeShortLabels } from "@/config/navigation";
import { cn } from "@/lib/cn";
import type { LanguageSwitchItem } from "@/modules/i18n/language-switch-types";

type LanguageSelectorProps = {
  labels: {
    language: string;
    locales: Record<AppLocale, string>;
    unavailable: string;
  };
  items: readonly LanguageSwitchItem[];
  compact?: boolean;
  onNavigate?: () => void;
};

export function LanguageSelector({
  labels,
  items,
  compact = false,
  onNavigate,
}: LanguageSelectorProps) {
  const locale = useLocale();

  return (
    <nav aria-label={labels.language} className="flex items-center gap-1">
      {!compact ? (
        <span className="type-caption mr-1 text-muted-foreground">
          {labels.language}
        </span>
      ) : null}
      {supportedLocales.map((code) => {
        const item = items.find((entry) => entry.locale === code);
        const isActive = locale === code;
        const disabled = Boolean(item?.disabled && !isActive);
        const href = item?.href ?? "/";

        if (disabled) {
          return (
            <span
              key={code}
              title={labels.unavailable}
              aria-label={`${labels.locales[code]}. ${labels.unavailable}`}
              aria-disabled="true"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md type-label text-muted-foreground/50"
            >
              <span aria-hidden="true">{localeShortLabels[code]}</span>
            </span>
          );
        }

        return (
          <NextLink
            key={code}
            href={href}
            hrefLang={code}
            aria-label={labels.locales[code]}
            aria-current={isActive ? "true" : undefined}
            onClick={onNavigate}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md type-label",
              "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "text-foreground underline decoration-accent decoration-2 underline-offset-4"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden="true">{localeShortLabels[code]}</span>
          </NextLink>
        );
      })}
    </nav>
  );
}
