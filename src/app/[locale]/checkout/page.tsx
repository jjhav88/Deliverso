import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CatalogRateBanner } from "@/modules/catalog/components/catalog-rate-banner";
import { CheckoutFlow } from "@/modules/checkout/components/checkout-flow";
import { buildCheckoutPageModel } from "@/modules/checkout/queries";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ paso?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("checkout");
  const catalogT = await getTranslations("catalog");
  const displayCurrency = await getDisplayCurrency();
  const rateSet = await getExchangeRateSet();
  const model = await buildCheckoutPageModel({
    locale,
    displayCurrency,
    rateSet,
    requestedStep: query.paso,
  });
  const selectedSlot = model.availableDates
    .flatMap((day) => day.slots)
    .find((slot) => slot.id === model.draft.timeWindowId);

  return (
    <Section>
      <Container>
        <h1 className="type-display-l">{t("title")}</h1>
        <CatalogRateBanner
          locale={locale}
          displayCurrency={displayCurrency}
          rateSet={rateSet}
          note={catalogT("fxNote")}
          unavailable={catalogT("fxUnavailable")}
        />
        <CheckoutFlow
          step={model.step}
          draft={{
            status: model.draft.status,
            contactName: model.draft.contactName,
            contactEmail: model.draft.contactEmail,
            contactPhone: model.draft.contactPhone,
            fulfillmentMethod: model.draft.fulfillmentMethod,
            pickupLocationId: model.draft.pickupLocationId,
            customerNotes: model.draft.customerNotes,
            requestedDate: model.draft.requestedDate,
            timeWindowId: model.draft.timeWindowId,
          }}
          address={
            model.address
              ? {
                  postalCode: model.address.postalCode,
                  state: model.address.state,
                  city: model.address.city,
                  locality: model.address.locality,
                  street: model.address.street,
                  exteriorNumber: model.address.exteriorNumber,
                  interiorNumber: model.address.interiorNumber,
                  reference: model.address.reference,
                }
              : null
          }
          cart={model.cart}
          pickups={model.pickups}
          availableDates={model.availableDates}
          selectedZoneName={model.selectedZone?.name ?? null}
          selectedPickupName={model.selectedPickup?.name ?? null}
          selectedSlotLabel={
            selectedSlot ? `${selectedSlot.startTime}–${selectedSlot.endTime}` : null
          }
          displaySubtotal={model.displaySubtotal.formatted}
          displayFee={model.displayFee.formatted}
          displayEstimated={model.displayEstimated.formatted}
          displayPromotion={
            model.totals.promotionDiscountMinor > 0
              ? `−${formatMoneyFromMinorUnits(model.totals.promotionDiscountMinor, "MXN", locale)}`
              : model.totals.promotionLabel
          }
          promotionInvalidated={model.totals.promotionInvalidated}
          canMarkReady={model.canMarkReady}
          locale={locale}
          readyMessage={
            model.readyIssues.includes("ZONE_INACTIVE")
              ? t("unavailablePostal")
              : model.readyIssues.includes("MINIMUM_ORDER") && model.selectedZone?.minimumOrderMinor != null
                ? t("minimumOrder", {
                    amount: formatMoneyFromMinorUnits(model.selectedZone.minimumOrderMinor, "MXN", locale),
                  })
                : null
          }
          labels={{
            stepContact: t("steps.contact"),
            stepFulfillment: t("steps.fulfillment"),
            stepDate: t("steps.date"),
            stepReview: t("steps.review"),
            summary: t("summary"),
            subtotal: t("subtotal"),
            delivery: t("deliveryFee"),
            estimated: t("estimated"),
            promotion: t("promotion"),
            promotionUnavailable: t("promotionUnavailable"),
            name: t("name"),
            email: t("email"),
            phone: t("phone"),
            continue: t("continue"),
            method: t("method"),
            deliveryMethod: t("delivery"),
            pickupMethod: t("pickup"),
            useMethod: t("useMethod"),
            postalCode: t("postalCode"),
            state: t("state"),
            city: t("city"),
            locality: t("locality"),
            street: t("street"),
            exterior: t("exterior"),
            interior: t("interior"),
            reference: t("reference"),
            pickupPoint: t("pickupPoint"),
            noPickup: t("noPickup"),
            date: t("date"),
            slot: t("slot"),
            selectDate: t("selectDate"),
            selectTime: t("selectTime"),
            noDates: t("noDates"),
            noTimes: t("noTimes"),
            customer: t("customer"),
            products: t("products"),
            fulfillment: t("fulfillment"),
            notes: t("notes"),
            saveNotes: t("saveNotes"),
            confirm: t("confirm"),
            ready: t("ready"),
            continuePayment: t("continuePayment"),
            paymentCurrencyNote: t("paymentCurrencyNote"),
            backCart: t("backCart"),
          }}
        />
      </Container>
    </Section>
  );
}
