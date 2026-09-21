import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    default: "DELIVERSO Admin",
    template: "%s | DELIVERSO Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

type AdminRootLayoutProps = {
  children: ReactNode;
};

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return children;
}
