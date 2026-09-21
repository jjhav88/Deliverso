import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { getPathname, Link } from "@/i18n/navigation";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getOwnedOrderRecord } from "@/modules/orders/queries";
import { toCustomerOrderDetail } from "@/modules/orders/mappers";
import { OrderItemsList } from "@/modules/orders/components/order-items";
import { cancelPendingOrder } from "@/modules/orders/actions";
import { createOrGetPaymentIntentForOrder } from "@/modules/payments/create-intent";
import { StripePaymentForm } from "@/modules/payments/components/payment-form";
import { canInitializePaymentElement } from "@/modules/orders/domain/payment-status";
import { getStripePublishableKey, shouldShowStripeTestBadge } from "@/server/stripe/env";
import { resolvePublicAppUrl } from "@/config/site";
import { isSupportedCurrency } from "@/config/currency";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "payment" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function PaymentPage({ params }: PageProps) {
  const { locale, orderNumber } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const customer = await requireCustomer(
    getPathname({ locale, href: { pathname: "/pago/[orderNumber]", params: { orderNumber } } }),
  );
  const row = await getOwnedOrderRecord({ customerId: customer.id, orderNumber });
  if (!row) {
    notFound();
  }
  const t = await getTranslations("payment");
  const order = toCustomerOrderDetail(row, locale);
  const mxnTotal = formatMoneyFromMinorUnits(order.grandTotalMinor, "MXN", locale);

  if (order.status === "PAID" || order.paymentStatus === "SUCCEEDED") {
    return (
      <Section>
        <Container>
          <h1 className="type-display-l">{t("title")}</h1>
          <p className="type-body mt-4">{t("alreadyPaid")}</p>
          <Link
            href={{ pathname: "/pedido/[orderNumber]/confirmacion", params: { orderNumber } }}
            className="mt-6 inline-block type-label tracking-[0.12em] text-secondary"
          >
            {t("seeConfirmation")}
          </Link>
        </Container>
      </Section>
    );
  }

  if (order.status === "CANCELLED" || order.status === "EXPIRED") {
    return (
      <Section>
        <Container>
          <h1 className="type-display-l">{t("title")}</h1>
          <p className="type-body mt-4">{order.status === "EXPIRED" ? t("expired") : t("cancelled")}</p>
          <Link href="/carrito" className="mt-6 inline-block type-label tracking-[0.12em] text-secondary">
            {t("backCart")}
          </Link>
        </Container>
      </Section>
    );
  }

  const intent = await createOrGetPaymentIntentForOrder(row.id);
  const confirmationPath = getPathname({
    locale,
    href: { pathname: "/pedido/[orderNumber]/confirmacion", params: { orderNumber } },
  });

  if (intent.status === "succeeded") {
    return (
      <Section>
        <Container>
          <h1 className="type-display-l">{t("title")}</h1>
          <p role="status" className="type-body mt-4">
            {t("syncingPaid")}
          </p>
          <Link
            href={{ pathname: "/pedido/[orderNumber]/confirmacion", params: { orderNumber } }}
            className="mt-6 inline-block type-label tracking-[0.12em] text-secondary"
          >
            {t("refreshStatus")}
          </Link>
        </Container>
      </Section>
    );
  }

  if (!canInitializePaymentElement(intent.status) || !intent.clientSecret) {
    return (
      <Section>
        <Container>
          <h1 className="type-display-l">{t("title")}</h1>
          <p role="status" className="type-body mt-4">
            {intent.status === "canceled" ? t("cancelled") : t("loadError")}
          </p>
          <Link
            href={{ pathname: "/pedido/[orderNumber]/confirmacion", params: { orderNumber } }}
            className="mt-6 inline-block type-label tracking-[0.12em] text-secondary"
          >
            {t("refreshStatus")}
          </Link>
        </Container>
      </Section>
    );
  }

  const appUrl = resolvePublicAppUrl() ?? "";

  return (
    <Section>
      <Container>
        <h1 className="type-display-l">{t("title")}</h1>
        {shouldShowStripeTestBadge() ? (
          <p className="mt-3 type-caption text-muted-foreground">{t("testMode")}</p>
        ) : null}
        <p className="type-body mt-4">
          {t("order")} {order.orderNumber}
        </p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
          <div className="grid gap-6">
            <section>
              <h2 className="type-h3">{t("products")}</h2>
              <div className="mt-4">
                <OrderItemsList items={order.items} locale={locale} />
              </div>
            </section>
            <section className="grid gap-2">
              <p className="type-body">
                {t("chargeMxn")}: <span className="tabular-nums">{mxnTotal}</span>
              </p>
              {order.displayCurrencyCode &&
              order.displayTotalMinor != null &&
              isSupportedCurrency(order.displayCurrencyCode) ? (
                <p className="type-body-sm text-muted-foreground">
                  {t("displayReference", {
                    amount: formatMoneyFromMinorUnits(
                      order.displayTotalMinor,
                      order.displayCurrencyCode,
                      locale,
                    ),
                  })}
                </p>
              ) : null}
              <p className="type-body-sm text-muted-foreground">{t("mxnNote")}</p>
            </section>
            <StripePaymentForm
              publishableKey={getStripePublishableKey()}
              clientSecret={intent.clientSecret}
              returnUrl={`${appUrl}${confirmationPath}`}
              paymentIntentStatus={intent.status}
              amountLabel={`${t("chargeMxn")}: ${mxnTotal}`}
              secureLabel={t("secure")}
              payLabel={t("pay", { amount: mxnTotal })}
              processingLabel={t("processing")}
              loadingFormLabel={t("loadingForm")}
              loadingPayLabel={t("loadingPay")}
              loadErrorLabel={t("loadError")}
              declineLabel={t("failed")}
            />
            <form action={cancelPendingOrder}>
              <input type="hidden" name="orderNumber" value={orderNumber} />
              <Button type="submit" variant="ghost">
                {t("cancelReturn")}
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </Section>
  );
}
