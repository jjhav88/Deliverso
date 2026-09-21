"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";
import { accountHref } from "@/config/navigation";
import { ProfileAvatar } from "@/modules/account/components/profile-avatar";
import { logoutAdminAction } from "@/modules/auth/actions/logout";
import { logoutCustomerAction } from "@/modules/customer-auth/actions";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type SessionIdentityProps = {
  variant: "customer" | "admin";
  displayName: string;
  avatarUrl?: string | null;
  profileHref: string;
  profileLabel: string;
  signOutLabel: string;
  menuLabel: string;
};

function ProfileAnchor({
  variant,
  href,
  className,
  "aria-label": ariaLabel,
  children,
}: {
  variant: "customer" | "admin";
  href: string;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}) {
  if (variant === "admin") {
    return (
      <NextLink href={href} className={className} aria-label={ariaLabel}>
        {children}
      </NextLink>
    );
  }

  return (
    <Link href={accountHref} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function SessionIdentity({
  variant,
  displayName,
  avatarUrl,
  profileHref,
  profileLabel,
  signOutLabel,
  menuLabel,
}: SessionIdentityProps) {
  const [open, setOpen] = useState(false);
  const logoutAction = variant === "admin" ? logoutAdminAction : logoutCustomerAction;

  return (
    <>
      <div className="hidden items-center gap-3 lg:flex">
        <ProfileAnchor
          variant={variant}
          href={profileHref}
          aria-label={profileLabel}
          className={cn(
            "inline-flex min-h-11 max-w-[14rem] items-center gap-2 rounded-md px-2 text-foreground",
            "hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
          )}
        >
          <ProfileAvatar src={avatarUrl} displayName={displayName} alt={displayName} />
          <span className="truncate type-body-sm">{displayName}</span>
        </ProfileAnchor>
        <form action={logoutAction}>
          <button
            type="submit"
            className={buttonClassName({ variant: "ghost", size: "sm" })}
          >
            {signOutLabel}
          </button>
        </form>
      </div>

      <div className="relative lg:hidden">
        <button
          type="button"
          aria-label={menuLabel}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md",
            "hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
          )}
        >
          <ProfileAvatar src={avatarUrl} displayName={displayName} alt="" />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 min-w-48 rounded-md border border-border bg-surface-elevated p-2 shadow-lg"
          >
            <ProfileAnchor
              variant={variant}
              href={profileHref}
              className="block rounded-md px-3 py-2 type-body-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {profileLabel}
            </ProfileAnchor>
            <form action={logoutAction}>
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
    </>
  );
}
