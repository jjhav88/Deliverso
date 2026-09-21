"use client";

import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import { AdminSidebar } from "@/modules/admin/components/admin-sidebar";
import { cn } from "@/lib/cn";

type AdminMobileNavProps = {
  pathname: string;
};

export function AdminMobileNav({ pathname }: AdminMobileNavProps) {
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
        aria-label="Abrir menú administrativo"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="admin-mobile-navigation"
        onClick={openMenu}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground",
          "hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        )}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>
      <dialog
        ref={dialogRef}
        id="admin-mobile-navigation"
        aria-label="Menú administrativo"
        onClose={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-50 m-0 h-dvh w-full max-h-none max-w-none bg-transparent p-0",
          "open:flex",
        )}
      >
        <div className="admin-sidebar flex h-full w-[min(100%,18rem)] flex-col">
          <div className="flex justify-end px-3 pt-3">
            <button
              type="button"
              aria-label="Cerrar menú administrativo"
              onClick={closeMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--admin-sidebar-foreground)] hover:bg-white/10"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <AdminSidebar pathname={pathname} onNavigate={closeMenu} />
        </div>
        <button
          type="button"
          aria-label="Cerrar menú administrativo"
          className="flex-1 bg-black/35"
          onClick={closeMenu}
        />
      </dialog>
    </div>
  );
}
