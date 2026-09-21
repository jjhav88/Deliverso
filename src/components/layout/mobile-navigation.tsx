"use client";

import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import { MainNav, type NavLinkItem } from "@/components/layout/main-nav";
import {
  CurrencySelector,
  type CurrencyOption,
} from "@/components/preferences/currency-selector";
import { LanguageSelector } from "@/components/preferences/language-selector";
import type { LanguageSwitchItem } from "@/modules/i18n/language-switch-types";
import type { CurrencyCode } from "@/config/currency";
import { brandConfig } from "@/config/brand";
import type { AppLocale } from "@/config/i18n";
import type { StaticAppPathname } from "@/config/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type MobileNavigationProps = {
  navItems: readonly NavLinkItem[];
  labels: {
    openMenu: string;
    closeMenu: string;
    language: string;
    locales: Record<AppLocale, string>;
    languageUnavailable: string;
    currency: string;
    account: string;
  };
  currency: CurrencyCode;
  currencyOptions: readonly CurrencyOption[];
  languageItems: readonly LanguageSwitchItem[];
  accountHref: StaticAppPathname;
};

export function MobileNavigation({
  navItems,
  labels,
  currency,
  currencyOptions,
  languageItems,
  accountHref,
}: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function openMenu() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeMenu() {
    setOpen(false);
    dialogRef.current?.close();
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={labels.openMenu}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="mobile-navigation"
        onClick={openMenu}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
          "hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>
      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-label={labels.openMenu}
        onClose={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-50 m-0 h-dvh w-full max-h-none max-w-none bg-background p-0 text-foreground",
          "open:flex open:flex-col",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-[var(--page-gutter)] py-3">
          <p className="type-label tracking-[0.18em] text-foreground">
            {brandConfig.name}
          </p>
          <button
            type="button"
            aria-label={labels.closeMenu}
            onClick={closeMenu}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground",
              "hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
            )}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-[var(--page-gutter)] py-8">
          <nav>
            <MainNav
              items={navItems}
              orientation="vertical"
              onNavigate={closeMenu}
            />
          </nav>
          <Link
            href={accountHref}
            onClick={closeMenu}
            className="type-label tracking-[0.12em] text-secondary"
          >
            {labels.account}
          </Link>
          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <LanguageSelector
              items={languageItems}
              labels={{
                language: labels.language,
                locales: labels.locales,
                unavailable: labels.languageUnavailable,
              }}
              onNavigate={closeMenu}
            />
            <CurrencySelector
              current={currency}
              options={currencyOptions}
              label={labels.currency}
            />
          </div>
        </div>
      </dialog>
    </div>
  );
}
