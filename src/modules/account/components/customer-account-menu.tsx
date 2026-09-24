"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ProfileAvatar } from "@/modules/account/components/profile-avatar";
import { logoutCustomerAction } from "@/modules/customer-auth/actions";
import type { CustomerAccountMenuItem } from "@/modules/quotations/domain/attention";
import { cn } from "@/lib/cn";

type CustomerAccountMenuProps = {
  displayName: string;
  avatarUrl: string | null;
  menuLabel: string;
  signOutLabel: string;
  items: CustomerAccountMenuItem[];
  attentionCount: number;
};

export function CustomerAccountMenu({
  displayName,
  avatarUrl,
  menuLabel,
  signOutLabel,
  items,
  attentionCount,
}: CustomerAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex min-h-11 max-w-[14rem] items-center gap-2 rounded-md px-2 text-foreground",
          "hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
        )}
      >
        <span className="relative">
          <ProfileAvatar src={avatarUrl} displayName={displayName} alt="" />
          {attentionCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground"
            >
              {attentionCount}
            </span>
          ) : null}
        </span>
        <span className="hidden truncate type-body-sm sm:inline">{displayName}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-56 rounded-md border border-border bg-surface-elevated p-2 shadow-lg"
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-3 rounded-md px-3 py-2 type-body-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <span>
                {item.label}
                {item.badge ? ` (${item.badge})` : ""}
              </span>
              {item.badge ? (
                <span
                  aria-hidden="true"
                  className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-accent-foreground"
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
          <form action={logoutCustomerAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full rounded-md px-3 py-2 text-left type-body-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {signOutLabel}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
