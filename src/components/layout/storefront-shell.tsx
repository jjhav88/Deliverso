import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SiteShell } from "@/components/layout/SiteShell";
import { SkipLink } from "@/components/layout/skip-link";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getTranslations } from "next-intl/server";

type StorefrontShellProps = {
  children: ReactNode;
};

export async function StorefrontShell({ children }: StorefrontShellProps) {
  const t = await getTranslations("storefront");
  const currency = await getDisplayCurrency();

  return (
    <SiteShell>
      <div className="flex min-h-dvh flex-col">
        <SkipLink label={t("skipToContent")} />
        <Header currency={currency} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </SiteShell>
  );
}
