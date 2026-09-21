import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DesignSystemShowcase } from "@/design-system/demo/showcase";
import { routing } from "@/i18n/routing";

type DesignSystemPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: DesignSystemPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return { robots: { index: false, follow: false } };
  }

  const t = await getTranslations({ locale, namespace: "designSystem.meta" });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DesignSystemPage({
  params,
}: DesignSystemPageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <DesignSystemShowcase />;
}
