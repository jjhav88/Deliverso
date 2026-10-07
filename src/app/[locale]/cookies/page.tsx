import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { CookieInventoryTable } from "@/modules/legal/components/cookie-inventory-table";
import { LegalPublicPage } from "@/modules/legal/components/legal-public-page";
import { cookiePlatformNotes } from "@/modules/legal/domain/cookie-inventory";
import { legalPageMetadata } from "@/modules/legal/legal-metadata";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: true } };
  }
  return legalPageMetadata({
    title: "Cookies",
    pathname: getPathname({ locale, href: "/cookies" }),
  });
}

export default async function CookiePolicyPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return (
    <LegalPublicPage
      type="COOKIE_POLICY"
      locale={locale}
      extra={
        <>
          <CookieInventoryTable />
          <ul className="mt-8 max-w-3xl list-disc space-y-2 pl-6 type-body-sm text-muted-foreground">
            {cookiePlatformNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      }
    />
  );
}
