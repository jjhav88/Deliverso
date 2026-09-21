import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { DocumentLang } from "@/components/i18n/document-lang";
import { getPublicAppUrl, siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";

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

  if (!hasLocale(routing.locales, locale)) {
    return { title: siteConfig.name };
  }

  const t = await getTranslations({ locale, namespace: "metadata" });
  const appUrl = getPublicAppUrl();

  return {
    title: t("title"),
    description: t("description"),
    applicationName: siteConfig.name,
    ...(appUrl ? { metadataBase: new URL(appUrl) } : {}),
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
