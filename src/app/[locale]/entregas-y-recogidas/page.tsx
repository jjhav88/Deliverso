import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { LegalPublicPage } from "@/modules/legal/components/legal-public-page";
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
    title: "Entregas y recogidas",
    pathname: getPathname({ locale, href: "/entregas-y-recogidas" }),
  });
}

export default async function DeliveryPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return <LegalPublicPage type="DELIVERY_POLICY" locale={locale} />;
}
