import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { CustomerProfileForm } from "@/modules/customer-auth/components/profile-form";
import { signAvatarUrl } from "@/modules/avatars/service";
import { listCustomerOrders, getCustomerPendingPaymentOrder } from "@/modules/orders/queries";
import { listRecentCustomerQuotations } from "@/modules/quotations/queries";
import { quotationStatusLabel } from "@/modules/quotations/domain/labels";
import { quoteRequiresCustomerAttention } from "@/modules/quotations/domain/attention";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

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
  return { title: t("dashboard.title"), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const customer = await requireCustomer("/cuenta");
  const t = await getTranslations("account");
  const ordersT = await getTranslations("orders");
  const hello = customer.displayName || customer.email;
  const avatarUrl = await signAvatarUrl(customer.avatarPath);
  const [orders, pending, recentQuotes] = await Promise.all([
    listCustomerOrders(customer.id),
    getCustomerPendingPaymentOrder(customer.id),
    listRecentCustomerQuotations(customer.id, 3),
  ]);
  const attentionQuote = recentQuotes.find((item) => quoteRequiresCustomerAttention(item.status));

  return (
    <Section>
      <Container>
        <h1 className="type-display-l">{t("dashboard.title")}</h1>
        <p className="type-body mt-4 text-muted-foreground">
          {t("dashboard.hello", { name: hello })}
        </p>

        {attentionQuote ? (
          <div className="mt-8 rounded-lg border border-border-strong bg-muted/40 p-5">
            <p className="type-body">{t("dashboard.quoteAttention")}</p>
            <Link
              href={{ pathname: "/cotizaciones/[quoteNumber]", params: { quoteNumber: attentionQuote.quoteNumber } }}
              className="mt-3 inline-block type-label tracking-[0.12em] text-secondary"
            >
              {t("dashboard.reviewQuote")}
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section>
            <h2 className="type-h2">{t("dashboard.profile")}</h2>
            <div className="mt-6">
              <CustomerProfileForm
                email={customer.email}
                displayName={customer.displayName ?? ""}
                phone={customer.phone ?? ""}
                avatarUrl={avatarUrl}
                labels={{
                  email: t("email"),
                  displayName: t("displayName"),
                  phone: t("phone"),
                  submit: t("dashboard.save"),
                  pending: t("pending"),
                  photo: t("avatar"),
                  choosePhoto: t("chooseAvatar"),
                  removePhoto: t("removeAvatar"),
                  photoHelper: t("avatarHelper"),
                }}
              />
            </div>
          </section>
          <section>
            <h2 className="type-h2">{t("dashboard.orders")}</h2>
            {pending ? (
              <p className="type-body mt-4">
                {t("dashboard.pendingPayment")}{" "}
                <Link
                  href={{ pathname: "/pago/[orderNumber]", params: { orderNumber: pending.orderNumber } }}
                  className="type-label tracking-[0.12em] text-secondary"
                >
                  {t("dashboard.continuePayment")}
                </Link>
              </p>
            ) : null}
            {orders.length === 0 ? (
              <p className="type-body mt-4 text-muted-foreground">{t("dashboard.ordersEmpty")}</p>
            ) : (
              <ul className="mt-4 grid gap-4">
                {orders.map((order) => (
                  <li key={order.orderNumber} className="grid gap-1">
                    <Link
                      href={{ pathname: "/cuenta/pedidos/[orderNumber]", params: { orderNumber: order.orderNumber } }}
                      className="type-label tracking-[0.12em] text-secondary"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="type-body-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(locale)} · {order.status} ·{" "}
                      {formatMoneyFromMinorUnits(order.grandTotalMinor, "MXN", locale)} · {order.fulfillmentMethod} ·{" "}
                      {order.requestedDate}
                      {order.customOrder ? ` · ${t("dashboard.customOrder")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="sr-only">{ordersT("list")}</p>
            <div className="mt-8">
              <h3 className="type-h3">{t("dashboard.purchaseData")}</h3>
              <p className="type-body-sm mt-2 text-muted-foreground">{t("dashboard.purchaseDataHint")}</p>
              <p className="type-body mt-3">{hello}</p>
              {customer.phone ? (
                <p className="type-body-sm text-muted-foreground">{customer.phone}</p>
              ) : null}
            </div>
            <section className="mt-10">
              <h2 className="type-h2">{t("dashboard.quotes")}</h2>
              {recentQuotes.length === 0 ? (
                <p className="type-body mt-4 text-muted-foreground">{t("dashboard.quotesEmpty")}</p>
              ) : (
                <ul className="mt-4 grid gap-4">
                  {recentQuotes.map((quote) => (
                    <li key={quote.quoteNumber} className="grid gap-1">
                      <Link
                        href={{ pathname: "/cotizaciones/[quoteNumber]", params: { quoteNumber: quote.quoteNumber } }}
                        className="type-label tracking-[0.12em] text-secondary"
                      >
                        {quote.quoteNumber}
                      </Link>
                      <p className="type-body-sm text-muted-foreground">
                        {quote.productNameSnapshot} · {quotationStatusLabel(quote.status, locale)} ·{" "}
                        {new Date(quote.createdAt).toLocaleDateString(locale)}
                        {quote.quotedTotalMinor != null
                          ? ` · ${formatMoneyFromMinorUnits(quote.quotedTotalMinor, "MXN", locale)}`
                          : ""}
                      </p>
                      {quoteRequiresCustomerAttention(quote.status) ? (
                        <p className="type-caption text-secondary">{t("dashboard.needsAttention")}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/cotizaciones" className="mt-4 inline-block type-label tracking-[0.12em] text-secondary">
                {t("dashboard.viewAllQuotes")}
              </Link>
            </section>
            <Link href="/carrito" className="mt-6 inline-block type-label tracking-[0.12em] text-secondary">
              {t("dashboard.cart")}
            </Link>
          </section>
        </div>
      </Container>
    </Section>
  );
}
