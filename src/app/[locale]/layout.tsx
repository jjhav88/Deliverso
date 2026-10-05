import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { DocumentLang } from "@/components/i18n/document-lang";
import { headers } from "next/headers";
import { siteConfig } from "@/config/site";
import { isAppLocale } from "@/config/i18n";
import { routing } from "@/i18n/routing";
import { productionPublicOrigin, seoRobots, isSeoIndexableRequest } from "@/modules/seo/env";
import { buildCanonicalUrl } from "@/modules/seo/urls";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { title: siteConfig.name, robots: seoRobots(false) };
  }

  const t = await getTranslations({ locale, namespace: "metadata" });
  const host = (await headers()).get("host");
  const origin = isSeoIndexableRequest(host)
    ? productionPublicOrigin
    : buildCanonicalUrl("/")?.replace(/\/$/, "") ?? undefined;
  const ogImage = buildCanonicalUrl("/brand/logos/deliverso-logo-color.png", origin);

  return {
    applicationName: siteConfig.name,
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    title: {
      default: t("title"),
      template: "%s | DELIVERSO",
    },
    description: t("description"),
    robots: seoRobots(true, host),
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/brand/logos/deliverso-logo-icon-color.png" },
      ],
      apple: "/brand/logos/deliverso-logo-icon-color.png",
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      siteName: "DELIVERSO",
      locale: locale === "en-US" ? "en_US" : "es_MX",
      title: t("title"),
      description: t("description"),
      images: ogImage ? [{ url: ogImage, alt: "DELIVERSO" }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider messages={{}}>
      <DocumentLang locale={locale} />
      <StorefrontShell>{children}</StorefrontShell>
    </NextIntlClientProvider>
  );
}
