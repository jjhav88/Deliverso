import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CustomerAuthShell } from "@/modules/customer-auth/components/auth-shell";
import { ForgotPasswordForm } from "@/modules/customer-auth/components/forgot-password-form";
import { getPathname } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("forgot.title"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const resetNext = getPathname({ locale, href: "/cuenta/restablecer-contrasena" });

  return (
    <Section>
      <Container>
        <CustomerAuthShell title={t("forgot.title")} intro={t("forgot.intro")}>
          <ForgotPasswordForm
            resetNext={resetNext}
            labels={{
              email: t("email"),
              submit: t("forgot.submit"),
              pending: t("pending"),
            }}
          />
        </CustomerAuthShell>
      </Container>
    </Section>
  );
}
