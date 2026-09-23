import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { isSupportedCurrency } from "@/config/currency";
import { getPathname, Link } from "@/i18n/navigation";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getCustomerOrderByNumber } from "@/modules/orders/queries";
import { OrderItemsList } from "@/modules/orders/components/order-items";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "orders" });
  return { title: t("detailTitle"), robots: { index: false, follow: false } };
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { locale, orderNumber } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const customer = await requireCustomer(
    getPathname({ locale, href: { pathname: "/cuenta/pedidos/[orderNumber]", params: { orderNumber } } }),
  );
  const order = await getCustomerOrderByNumber({
    customerId: customer.id,
    orderNumber,
    locale,
  });
  if (!order) {
    notFound();
  }
  const t = await getTranslations("orders");
  const displayCurrency =
    order.displayCurrencyCode && isSupportedCurrency(order.displayCurrencyCode)
      ? order.displayCurrencyCode
      : null;

  return (
    <Section>
      <Container>
        <Link href="/cuenta" className="type-caption text-secondary">
          {t("back")}
        </Link>
        <h1 className="type-display-l mt-4">{order.orderNumber}</h1>
        <p className="type-body-sm mt-2 text-muted-foreground">
          {t("status")}: {order.status} · {t("payment")}: {order.paymentStatus}
          {order.customOrder ? ` · ${t("customOrder")}` : ""}
        </p>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section>
            <h2 className="type-h3">{t("products")}</h2>
            <div className="mt-4">
              <OrderItemsList items={order.items} locale={locale} />
            </div>
          </section>
          <section className="grid gap-3">
            <h2 className="type-h3">{t("totals")}</h2>
            <p className="type-body tabular-nums">
              {t("subtotal")}: {formatMoneyFromMinorUnits(order.itemsSubtotalMinor, "MXN", locale)}
            </p>
            <p className="type-body tabular-nums">
              {t("delivery")}: {formatMoneyFromMinorUnits(order.deliveryFeeMinor, "MXN", locale)}
            </p>
            {order.promotionDiscountMinor > 0 ? (
              <p className="type-body tabular-nums">
                {t("promotion")}
                {order.promotionCodeSnapshot ? ` ${order.promotionCodeSnapshot}` : ""}
                {order.promotionLabelSnapshot ? ` · ${order.promotionLabelSnapshot}` : ""}
                : −{formatMoneyFromMinorUnits(order.promotionDiscountMinor, "MXN", locale)}
              </p>
            ) : null}
            <p className="type-h3 tabular-nums">
              {t("charged")}: {formatMoneyFromMinorUnits(order.grandTotalMinor, "MXN", locale)}
            </p>
            {displayCurrency && order.displayTotalMinor != null ? (
              <p className="type-body-sm text-muted-foreground">
                {t("historicDisplay", {
                  amount: formatMoneyFromMinorUnits(order.displayTotalMinor, displayCurrency, locale),
                  provider: order.displayExchangeProvider ?? "ECB",
                  rate: order.displayExchangeRate ?? "—",
                  date: order.displayExchangeSourceDate ?? "—",
                })}
              </p>
            ) : null}
            <h2 className="type-h3 mt-6">{t("customer")}</h2>
            <p className="type-body">{order.customerName}</p>
            <p className="type-body-sm text-muted-foreground">{order.customerEmail}</p>
            {order.customerPhone ? (
              <p className="type-body-sm text-muted-foreground">{order.customerPhone}</p>
            ) : null}
            <h2 className="type-h3 mt-6">{t("fulfillment")}</h2>
            <p className="type-body">{order.fulfillmentMethod}</p>
            <p className="type-body-sm text-muted-foreground">
              {order.requestedDate} · {order.timeWindowStart}–{order.timeWindowEnd}
            </p>
            {order.deliveryZoneName ? (
              <p className="type-body-sm text-muted-foreground">{order.deliveryZoneName}</p>
            ) : null}
            {order.pickupLocationName ? (
              <p className="type-body-sm text-muted-foreground">{order.pickupLocationName}</p>
            ) : null}
            {order.address ? (
              <p className="type-body-sm text-muted-foreground">
                {[order.address.street, order.address.city, order.address.postalCode].filter(Boolean).join(", ")}
              </p>
            ) : null}
          </section>
        </div>
      </Container>
    </Section>
  );
}
