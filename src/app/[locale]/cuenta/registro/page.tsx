import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CustomerAuthShell } from "@/modules/customer-auth/components/auth-shell";
import { CustomerRegisterForm } from "@/modules/customer-auth/components/register-form";
import { getSafeCustomerPath } from "@/modules/customer-auth/domain/safe-path";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("register.title"), robots: { index: false, follow: false } };
}

export default async function CustomerRegisterPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const query = await searchParams;
  const nextPath = getSafeCustomerPath(query.next);
  const customer = await getOptionalCustomer();
  if (customer && canCustomerShop(customer.status)) {
    redirect(nextPath);
  }

  const t = await getTranslations("account");
  return (
    <Section>
      <Container>
        <CustomerAuthShell title={t("register.title")} intro={t("register.intro")}>
          <CustomerRegisterForm
            nextPath={nextPath}
            labels={{
              email: t("email"),
              password: t("password"),
              confirm: t("confirmPassword"),
              requirements: t("passwordHelp"),
              terms: t("register.terms"),
              privacy: t("register.privacy"),
              acceptPrefix: t("register.accept"),
              and: t("register.and"),
              submit: t("register.submit"),
              pending: t("pending"),
              checkEmail: t("register.checkEmail"),
              checkEmailBody: t("register.checkEmailBody"),
              home: t("register.home"),
              hasAccount: t("register.hasAccount"),
              login: t("register.login"),
            }}
          />
        </CustomerAuthShell>
      </Container>
    </Section>
  );
}
