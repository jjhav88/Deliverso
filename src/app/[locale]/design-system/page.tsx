import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DesignSystemShowcase } from "@/design-system/demo/showcase";
import { routing } from "@/i18n/routing";
import { seoRobots } from "@/modules/seo/env";

type DesignSystemPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: DesignSystemPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return { robots: seoRobots(false) };
  }

  const t = await getTranslations({ locale, namespace: "designSystem.meta" });

  return {
    title: t("title"),
    description: t("description"),
    robots: seoRobots(false),
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
