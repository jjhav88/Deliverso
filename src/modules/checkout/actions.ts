"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { getPrisma } from "@/server/db/prisma";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import type { CheckoutActionState } from "@/modules/checkout/action-state";
import {
  checkoutAddressSchema,
  checkoutContactSchema,
  checkoutFulfillmentMethodSchema,
  checkoutNotesSchema,
  checkoutPickupSchema,
  checkoutSlotSchema,
} from "@/modules/checkout/validation";
import {
  buildCheckoutPageModel,
  expireStaleCheckoutDrafts,
  findDeliveryCoverageByPostalCode,
  getCartLeadMinutes,
  getFulfillmentCatalog,
  requireCheckoutContext,
  toScheduleDays,
} from "@/modules/checkout/queries";
import { getCartView } from "@/modules/cart/queries";
import { sanitizeCheckoutNotes } from "@/modules/checkout/domain/notes";
import { isRequestedSlotValid } from "@/modules/checkout/domain/dates";
import { calendarDateFromDb } from "@/modules/checkout/domain/timezone";
import { canEnterCheckout } from "@/modules/checkout/domain/cart-gate";
import { meetsMinimumOrder } from "@/modules/checkout/domain/fulfillment";
import {
  minimumOrderMessage,
  unavailablePostalCodeMessage,
} from "@/modules/checkout/domain/postal-code";
import { canAuthorizeCheckoutDraft } from "@/modules/checkout/domain/ownership";
import { formatMoneyFromMinorUnits } from "@/lib/money/format";
import type { AppLocale } from "@/config/i18n";

function formString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function unavailableDeliveryMessage(hasPickup: boolean): string {
  return hasPickup
    ? `${unavailablePostalCodeMessage} Puedes elegir recogida.`
    : unavailablePostalCodeMessage;
}

function formatMinimumOrderAmount(amountMinor: number, locale: string): string {
  const safe: AppLocale = isAppLocale(locale) ? locale : "es-MX";
  return formatMoneyFromMinorUnits(amountMinor, "MXN", safe);
}

function checkoutPath(locale: string, step?: string) {
  const safe = isAppLocale(locale) ? locale : "es-MX";
  const path = getPathname({ locale: safe, href: "/checkout" });
  return step ? `${path}?paso=${step}` : path;
}

function revalidateCheckout() {
  revalidatePath("/checkout");
  revalidatePath("/en/checkout");
  revalidatePath("/carrito");
  revalidatePath("/en/cart");
}

async function authorizeDraft() {
  const context = await requireCheckoutContext();
  if (
    !canAuthorizeCheckoutDraft({
      draftCustomerId: context.draft.customerId,
      draftCartId: context.draft.cartId,
      customerId: context.customer.id,
      cartId: context.cart.id,
      cartCustomerId: context.cart.customerId,
    })
  ) {
    return null;
  }
  await expireStaleCheckoutDrafts(context.cart.id);
  return context;
}

export async function saveCheckoutContact(
  previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void previousState;
  const locale = await getLocale();
  const context = await authorizeDraft();
  if (!context) {
    return { error: "No pudimos guardar tus datos.", success: null };
  }
  const parsed = checkoutContactSchema.safeParse({
    contactName: formData.get("contactName"),
    contactPhone: formData.get("contactPhone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de contacto.", success: null };
  }

  await getPrisma().checkoutDraft.update({
    where: { id: context.draft.id },
    data: {
      contactName: parsed.data.contactName,
      contactPhone: parsed.data.contactPhone,
      contactEmail: context.customer.email,
      status: "IN_PROGRESS",
    },
  });
  revalidateCheckout();
  redirect(checkoutPath(locale, "entrega"));
}

export async function setFulfillmentMethod(
  previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void previousState;
  const context = await authorizeDraft();
  if (!context) {
    return { error: "No pudimos guardar el método de entrega.", success: null };
  }
  const parsed = checkoutFulfillmentMethodSchema.safeParse({ method: formData.get("method") });
  if (!parsed.success) {
    return { error: "Elige entrega o recogida.", success: null };
  }

  await getPrisma().checkoutDraft.update({
    where: { id: context.draft.id },
    data: {
      fulfillmentMethod: parsed.data.method,
      deliveryZoneId: parsed.data.method === "DELIVERY" ? context.draft.deliveryZoneId : null,
      pickupLocationId: parsed.data.method === "PICKUP" ? context.draft.pickupLocationId : null,
      requestedDate: null,
      timeWindowId: null,
      status: "IN_PROGRESS",
    },
  });
  revalidateCheckout();
  return { error: null, success: "Método actualizado." };
}

export async function saveDeliveryAddress(
  previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void previousState;
  const locale = await getLocale();
  const context = await authorizeDraft();
  if (!context) {
    return { error: "No pudimos guardar la dirección.", success: null };
  }
  const parsed = checkoutAddressSchema.safeParse({
    countryCode: "MX",
    postalCode: formString(formData.get("postalCode")),
    state: formString(formData.get("state")),
    city: formString(formData.get("city")),
    locality: formString(formData.get("locality")),
    street: formString(formData.get("street")),
    exteriorNumber: formString(formData.get("exteriorNumber")),
    interiorNumber: formString(formData.get("interiorNumber")),
    reference: formString(formData.get("reference")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa la dirección.", success: null };
  }

  const coverage = await findDeliveryCoverageByPostalCode(parsed.data.postalCode);
  if (coverage.status !== "found") {
    const catalog = await getFulfillmentCatalog();
    return {
      error: unavailableDeliveryMessage(catalog.pickups.length > 0),
      success: null,
    };
  }

  const displayCurrency = await getDisplayCurrency();
  const rateSet = await getExchangeRateSet();
  const cart = await getCartView({
    locale: isAppLocale(locale) ? locale : "es-MX",
    displayCurrency,
    rateSet,
  });
  if (!meetsMinimumOrder(cart.subtotal.amountMinor, coverage.zone.minimumOrderMinor)) {
    return {
      error: minimumOrderMessage(
        formatMinimumOrderAmount(coverage.zone.minimumOrderMinor ?? 0, locale),
      ),
      success: null,
    };
  }
  const zone = coverage.zone;

  const prisma = getPrisma();
  await prisma.checkoutAddress.upsert({
    where: { checkoutDraftId: context.draft.id },
    create: {
      checkoutDraftId: context.draft.id,
      ...parsed.data,
      locality: parsed.data.locality || null,
      exteriorNumber: parsed.data.exteriorNumber || null,
      interiorNumber: parsed.data.interiorNumber || null,
      reference: parsed.data.reference || null,
    },
    update: {
      ...parsed.data,
      locality: parsed.data.locality || null,
      exteriorNumber: parsed.data.exteriorNumber || null,
      interiorNumber: parsed.data.interiorNumber || null,
      reference: parsed.data.reference || null,
    },
  });
  await prisma.checkoutDraft.update({
    where: { id: context.draft.id },
    data: {
      fulfillmentMethod: "DELIVERY",
      deliveryZoneId: zone.id,
      pickupLocationId: null,
      requestedDate: null,
      timeWindowId: null,
      status: "IN_PROGRESS",
    },
  });
  revalidateCheckout();
  redirect(checkoutPath(locale, "fecha"));
}

export async function setPickupLocation(
  previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void previousState;
  const locale = await getLocale();
  const context = await authorizeDraft();
  if (!context) {
    return { error: "No pudimos guardar el punto de recogida.", success: null };
  }
  const parsed = checkoutPickupSchema.safeParse({ pickupLocationId: formData.get("pickupLocationId") });
  if (!parsed.success) {
    return { error: "Elige un punto de recogida.", success: null };
  }
  const location = await getPrisma().pickupLocation.findFirst({
    where: { id: parsed.data.pickupLocationId, isActive: true },
  });
  if (!location) {
    return { error: "Ese punto de recogida ya no está disponible.", success: null };
  }

  await getPrisma().checkoutDraft.update({
    where: { id: context.draft.id },
    data: {
      fulfillmentMethod: "PICKUP",
      pickupLocationId: location.id,
      deliveryZoneId: null,
      requestedDate: null,
      timeWindowId: null,
      status: "IN_PROGRESS",
    },
  });
  revalidateCheckout();
  redirect(checkoutPath(locale, "fecha"));
}

export async function setRequestedFulfillment(
  previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void previousState;
  const locale = await getLocale();
  const context = await authorizeDraft();
  if (!context || !context.draft.fulfillmentMethod) {
    return { error: "Elige primero entrega o recogida.", success: null };
  }
  const parsed = checkoutSlotSchema.safeParse({
    requestedDate: formData.get("requestedDate"),
    timeWindowId: formData.get("timeWindowId"),
  });
  if (!parsed.success) {
    const t = await getTranslations("checkout");
    const requestedDate = formString(formData.get("requestedDate"));
    if (!requestedDate) {
      return { error: t("selectDateError"), success: null };
    }
    return { error: t("selectTimeError"), success: null };
  }

  const displayCurrency = await getDisplayCurrency();
  const rateSet = await getExchangeRateSet();
  const cart = await getCartView({
    locale: isAppLocale(locale) ? locale : "es-MX",
    displayCurrency,
    rateSet,
  });
  const catalog = await getFulfillmentCatalog();
  const leadMinutes = await getCartLeadMinutes(
    context.cart.id,
    cart.items.filter((item) => item.valid).map((item) => item.productId),
  );
  const valid = isRequestedSlotValid({
    now: new Date(),
    leadMinutes,
    method: context.draft.fulfillmentMethod,
    date: parsed.data.requestedDate,
    windowId: parsed.data.timeWindowId,
    schedule: toScheduleDays(catalog.schedules, context.draft.fulfillmentMethod),
    blackouts: catalog.blackouts.map((item) => ({
      date: calendarDateFromDb(item.date),
      fulfillmentMethod: item.fulfillmentMethod,
      isActive: item.isActive,
    })),
  });
  if (!valid) {
    return { error: "Ese horario ya no está disponible. Elige otra fecha o franja.", success: null };
  }

  await getPrisma().checkoutDraft.update({
    where: { id: context.draft.id },
    data: {
      requestedDate: new Date(`${parsed.data.requestedDate}T00:00:00.000Z`),
      timeWindowId: parsed.data.timeWindowId,
      status: "IN_PROGRESS",
    },
  });
  revalidateCheckout();
  redirect(checkoutPath(locale, "revisar"));
}

export async function saveCheckoutNotes(
  previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void previousState;
  const context = await authorizeDraft();
  if (!context) {
    return { error: "No pudimos guardar las notas.", success: null };
  }
  const parsed = checkoutNotesSchema.safeParse({
    customerNotes: String(formData.get("customerNotes") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Las notas son demasiado largas.", success: null };
  }

  await getPrisma().checkoutDraft.update({
    where: { id: context.draft.id },
    data: { customerNotes: sanitizeCheckoutNotes(parsed.data.customerNotes) || null },
  });
  revalidateCheckout();
  return { error: null, success: "Notas guardadas." };
}

export async function markCheckoutReady(
  previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void previousState;
  void formData;
  const locale = await getLocale();
  const model = await buildCheckoutPageModel({
    locale: isAppLocale(locale) ? locale : "es-MX",
    displayCurrency: await getDisplayCurrency(),
    rateSet: await getExchangeRateSet(),
    requestedStep: "revisar",
  });

  if (!canEnterCheckout(model.cart) || !model.canMarkReady) {
    await getPrisma().checkoutDraft.update({
      where: { id: model.draft.id },
      data: { status: "IN_PROGRESS" },
    });
    revalidateCheckout();
    if (model.readyIssues.includes("MINIMUM_ORDER") && model.selectedZone?.minimumOrderMinor != null) {
      return {
        error: minimumOrderMessage(formatMinimumOrderAmount(model.selectedZone.minimumOrderMinor, locale)),
        success: null,
      };
    }
    if (model.readyIssues.includes("ZONE_INACTIVE")) {
      return { error: unavailablePostalCodeMessage, success: null };
    }
    return { error: "Revisa tu pedido. Algo cambió y todavía no podemos continuar al pago.", success: null };
  }

  await getPrisma().checkoutDraft.update({
    where: { id: model.draft.id },
    data: { status: "READY_FOR_PAYMENT" },
  });
  revalidateCheckout();
  redirect(checkoutPath(locale, "revisar"));
}
