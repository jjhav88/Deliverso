import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CustomerAuthShell } from "@/modules/customer-auth/components/auth-shell";
import { CustomerLoginForm } from "@/modules/customer-auth/components/login-form";
import { getSafeCustomerPath } from "@/modules/customer-auth/domain/safe-path";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; reason?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("login.title"), robots: { index: false, follow: false } };
}

export default async function CustomerLoginPage({ params, searchParams }: PageProps) {
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
        <CustomerAuthShell title={t("login.title")} intro={t("login.intro")}>
          <CustomerLoginForm
            nextPath={nextPath}
            blocked={query.reason === "blocked" || customer?.status === "BLOCKED"}
            labels={{
              email: t("email"),
              password: t("password"),
              submit: t("login.submit"),
              pending: t("pending"),
              register: t("login.register"),
              noAccount: t("login.noAccount"),
              forgot: t("login.forgot"),
              blocked: t("blocked"),
            }}
          />
        </CustomerAuthShell>
      </Container>
    </Section>
  );
}
