import "server-only";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { checkoutDraftTtlMs } from "@/config/fulfillment";
import type { AppLocale } from "@/config/i18n";
import type { CurrencyCode } from "@/config/currency";
import { toDisplayMoney } from "@/lib/money/to-display";
import { getQuoteFromSet, type ExchangeRateSet } from "@/server/exchange-rates/rate-set";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getCurrentCartRecord } from "@/server/cart/session";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getCustomerPendingPaymentOrder } from "@/modules/orders/queries";
import { getCartView as loadCartView } from "@/modules/cart/queries";
import type { CartView } from "@/modules/cart/types";
import { canAuthorizeCheckoutDraft } from "@/modules/checkout/domain/ownership";
import { canEnterCheckout } from "@/modules/checkout/domain/cart-gate";
import { isDraftExpired, isOperationalDraft } from "@/modules/checkout/domain/status";
import { maxLeadTimeMinutes } from "@/modules/checkout/domain/lead-time";
import { buildCheckoutTotals } from "@/modules/checkout/domain/summary";
import { nextCheckoutStep } from "@/modules/checkout/domain/summary";
import { fulfillmentInvariantHolds, type FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import { calendarDateFromDb } from "@/modules/checkout/domain/timezone";
import { getAvailableFulfillmentDates, type AvailableDate, type ScheduleDay } from "@/modules/checkout/domain/dates";
import { evaluateCheckoutReady } from "@/modules/checkout/domain/ready";
import {
  buildPostalZoneMapping,
  normalizeMexicanPostalCode,
  resolveDeliveryZone,
} from "@/modules/checkout/domain/postal-code";

export type CheckoutDraftRecord = {
  id: string;
  customerId: string;
  cartId: string;
  status: "IN_PROGRESS" | "READY_FOR_PAYMENT" | "CONVERTED_TO_ORDER" | "EXPIRED";
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  fulfillmentMethod: FulfillmentMethod | null;
  deliveryZoneId: string | null;
  pickupLocationId: string | null;
  requestedDate: string | null;
  timeWindowId: string | null;
  customerNotes: string | null;
  expiresAt: Date;
};

function cartPath(locale: string) {
  const safe = isAppLocale(locale) ? locale : "es-MX";
  return getPathname({ locale: safe, href: "/carrito" });
}

function paymentPath(locale: string, orderNumber: string) {
  const safe = isAppLocale(locale) ? locale : "es-MX";
  return getPathname({
    locale: safe,
    href: { pathname: "/pago/[orderNumber]", params: { orderNumber } },
  });
}

export async function expireStaleCheckoutDrafts(cartId: string): Promise<void> {
  if (!hasRuntimeDatabaseUrl()) {
    return;
  }
  await getPrisma().checkoutDraft.updateMany({
    where: {
      cartId,
      status: { in: ["IN_PROGRESS", "READY_FOR_PAYMENT"] },
      expiresAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });
}

export async function getOrCreateCheckoutDraft() {
  const locale = await getLocale();
  const customer = await requireCustomer(
    getPathname({ locale: isAppLocale(locale) ? locale : "es-MX", href: "/checkout" }),
  );
  const cart = await getCurrentCartRecord();
  if (!cart || !cart.customerId || cart.customerId !== customer.id) {
    redirect(cartPath(locale));
  }
  if (cart.status === "PENDING_PAYMENT") {
    const pending = await getCustomerPendingPaymentOrder(customer.id);
    if (pending) {
      redirect(paymentPath(locale, pending.orderNumber));
    }
  }

  await expireStaleCheckoutDrafts(cart.id);

  const prisma = getPrisma();
  const existing = await prisma.checkoutDraft.findFirst({
    where: {
      cartId: cart.id,
      customerId: customer.id,
      status: { in: ["IN_PROGRESS", "READY_FOR_PAYMENT"] },
    },
    orderBy: { updatedAt: "desc" },
    include: { address: true },
  });

  const expiresAt = new Date(Date.now() + checkoutDraftTtlMs);

  if (existing && !isDraftExpired(existing.expiresAt)) {
    const renewed = await prisma.checkoutDraft.update({
      where: { id: existing.id },
      data: {
        expiresAt,
        contactEmail: customer.email,
      },
      include: { address: true },
    });
    return { customer, cart, draft: mapDraft(renewed), address: renewed.address };
  }

  if (existing) {
    await prisma.checkoutDraft.update({
      where: { id: existing.id },
      data: { status: "EXPIRED" },
    });
  }

  const created = await prisma.checkoutDraft.create({
    data: {
      customerId: customer.id,
      cartId: cart.id,
      status: "IN_PROGRESS",
      contactName: customer.displayName,
      contactEmail: customer.email,
      contactPhone: customer.phone,
      expiresAt,
    },
    include: { address: true },
  });

  return { customer, cart, draft: mapDraft(created), address: created.address };
}

function mapDraft(row: {
  id: string;
  customerId: string;
  cartId: string;
  status: "IN_PROGRESS" | "READY_FOR_PAYMENT" | "CONVERTED_TO_ORDER" | "EXPIRED";
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  fulfillmentMethod: FulfillmentMethod | null;
  deliveryZoneId: string | null;
  pickupLocationId: string | null;
  requestedDate: Date | null;
  timeWindowId: string | null;
  customerNotes: string | null;
  expiresAt: Date;
}): CheckoutDraftRecord {
  return {
    id: row.id,
    customerId: row.customerId,
    cartId: row.cartId,
    status: row.status,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    fulfillmentMethod: row.fulfillmentMethod,
    deliveryZoneId: row.deliveryZoneId,
    pickupLocationId: row.pickupLocationId,
    requestedDate: row.requestedDate ? calendarDateFromDb(row.requestedDate) : null,
    timeWindowId: row.timeWindowId,
    customerNotes: row.customerNotes,
    expiresAt: row.expiresAt,
  };
}

export async function requireCheckoutContext() {
  const locale = await getLocale();
  const customer = await requireCustomer(
    getPathname({ locale: isAppLocale(locale) ? locale : "es-MX", href: "/checkout" }),
  );
  const cart = await getCurrentCartRecord();
  if (!cart) {
    redirect(cartPath(locale));
  }
  if (cart.status === "PENDING_PAYMENT") {
    const pending = await getCustomerPendingPaymentOrder(customer.id);
    if (pending) {
      redirect(paymentPath(locale, pending.orderNumber));
    }
  }

  await expireStaleCheckoutDrafts(cart.id);
  const draftRow = await getPrisma().checkoutDraft.findFirst({
    where: {
      cartId: cart.id,
      customerId: customer.id,
      status: { in: ["IN_PROGRESS", "READY_FOR_PAYMENT"] },
    },
    include: { address: true },
  });

  if (
    !draftRow ||
    !canAuthorizeCheckoutDraft({
      draftCustomerId: draftRow.customerId,
      draftCartId: draftRow.cartId,
      customerId: customer.id,
      cartId: cart.id,
      cartCustomerId: cart.customerId,
    })
  ) {
    redirect(cartPath(locale));
  }

  if (isDraftExpired(draftRow.expiresAt) || !isOperationalDraft(draftRow.status)) {
    await getPrisma().checkoutDraft.update({
      where: { id: draftRow.id },
      data: { status: "EXPIRED" },
    });
    redirect(cartPath(locale));
  }

  return {
    customer,
    cart,
    draft: mapDraft(draftRow),
    address: draftRow.address,
  };
}

export async function getCartLeadMinutes(cartId: string, validProductIds: string[]): Promise<number> {
  if (validProductIds.length === 0) {
    return 0;
  }
  const items = await getPrisma().cartItem.findMany({
    where: { cartId, productId: { in: validProductIds } },
    select: { product: { select: { minimumLeadTimeMinutes: true } } },
  });
  return maxLeadTimeMinutes(items.map((item) => item.product.minimumLeadTimeMinutes));
}

export async function findDeliveryCoverageByPostalCode(rawPostalCode: unknown) {
  const postalCode = normalizeMexicanPostalCode(rawPostalCode);
  if (!postalCode) {
    return { status: "invalid" as const };
  }

  const prisma = getPrisma();
  const exact = await prisma.deliveryPostalCode.findUnique({
    where: {
      countryCode_postalCode: {
        countryCode: "MX",
        postalCode,
      },
    },
    include: { zone: true },
  });

  const row =
    exact ??
    (
      await prisma.deliveryPostalCode.findMany({
        where: { countryCode: "MX" },
        include: { zone: true },
      })
    ).find((item) => normalizeMexicanPostalCode(item.postalCode) === postalCode) ??
    null;

  if (!row) {
    return { status: "missing" as const };
  }
  if (!row.zone.isActive) {
    return { status: "inactive" as const, zone: row.zone };
  }
  return { status: "found" as const, zone: row.zone, postalCode };
}

export async function getFulfillmentCatalog() {
  const prisma = getPrisma();
  const [zones, pickups, schedules, blackouts] = await Promise.all([
    prisma.deliveryZone.findMany({
      orderBy: { sortOrder: "asc" },
      include: { postalCodes: true },
    }),
    prisma.pickupLocation.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.fulfillmentWeeklySchedule.findMany({
      include: { windows: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.fulfillmentBlackoutDate.findMany({ where: { isActive: true } }),
  ]);
  return { zones, pickups, schedules, blackouts };
}

export function toScheduleDays(
  schedules: Array<{
    fulfillmentMethod: FulfillmentMethod;
    dayOfWeek: number;
    isActive: boolean;
    windows: Array<{ id: string; startTime: string; endTime: string; isActive: boolean; label: string | null }>;
  }>,
  method: FulfillmentMethod,
): ScheduleDay[] {
  return schedules
    .filter((row) => row.fulfillmentMethod === method)
    .map((row) => ({
      dayOfWeek: row.dayOfWeek,
      isActive: row.isActive,
      windows: row.windows,
    }));
}

export async function buildCheckoutPageModel(input: {
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  rateSet: ExchangeRateSet;
  requestedStep?: string | null;
}) {
  const created = await getOrCreateCheckoutDraft();
  const cart = await loadCartView({
    locale: input.locale,
    displayCurrency: input.displayCurrency,
    rateSet: input.rateSet,
  });

  if (!canEnterCheckout(cart)) {
    redirect(getPathname({ locale: input.locale, href: "/carrito" }));
  }

  const catalog = await getFulfillmentCatalog();
  const leadMinutes = await getCartLeadMinutes(
    created.cart.id,
    cart.items.filter((item) => item.valid).map((item) => item.productId),
  );
  const zoneMap = buildPostalZoneMapping(catalog.zones);
  const selectedZone = created.draft.deliveryZoneId
    ? catalog.zones.find((zone) => zone.id === created.draft.deliveryZoneId) ?? null
    : created.address
      ? resolveDeliveryZone({
          countryCode: created.address.countryCode,
          postalCode: created.address.postalCode,
          mapping: zoneMap,
        })
      : null;
  const selectedPickup = created.draft.pickupLocationId
    ? catalog.pickups.find((item) => item.id === created.draft.pickupLocationId) ?? null
    : null;
  const totals = buildCheckoutTotals({
    itemsSubtotalMinor: cart.subtotal.amountMinor,
    method: created.draft.fulfillmentMethod,
    zoneFeeMinor: selectedZone?.deliveryFeeMinor,
  });
  const availableDates: AvailableDate[] = created.draft.fulfillmentMethod
    ? getAvailableFulfillmentDates({
        now: new Date(),
        leadMinutes,
        method: created.draft.fulfillmentMethod,
        schedule: toScheduleDays(catalog.schedules, created.draft.fulfillmentMethod),
        blackouts: catalog.blackouts.map((item) => ({
          date: calendarDateFromDb(item.date),
          fulfillmentMethod: item.fulfillmentMethod,
          isActive: item.isActive,
        })),
      })
    : [];

  const readyIssues = evaluateCheckoutReady({
    now: new Date(),
    customerStatus: created.customer.status,
    draftStatus: created.draft.status,
    expiresAt: created.draft.expiresAt,
    contactName: created.draft.contactName,
    contactEmail: created.draft.contactEmail,
    contactPhone: created.draft.contactPhone,
    fulfillmentMethod: created.draft.fulfillmentMethod,
    deliveryZoneId: created.draft.deliveryZoneId,
    pickupLocationId: created.draft.pickupLocationId,
    requestedDate: created.draft.requestedDate,
    timeWindowId: created.draft.timeWindowId,
    itemsSubtotalMinor: cart.subtotal.amountMinor,
    pricingValid: cart.items.every((item) => item.valid),
    cart,
    zone: selectedZone
      ? { id: selectedZone.id, isActive: selectedZone.isActive, minimumOrderMinor: selectedZone.minimumOrderMinor }
      : null,
    pickup: selectedPickup ? { id: selectedPickup.id, isActive: selectedPickup.isActive } : null,
    address: created.address,
    leadMinutes,
    schedule: created.draft.fulfillmentMethod
      ? toScheduleDays(catalog.schedules, created.draft.fulfillmentMethod)
      : [],
    blackouts: catalog.blackouts.map((item) => ({
      date: calendarDateFromDb(item.date),
      fulfillmentMethod: item.fulfillmentMethod,
      isActive: item.isActive,
    })),
  });

  if (created.draft.status === "READY_FOR_PAYMENT" && readyIssues.length > 0) {
    await getPrisma().checkoutDraft.update({
      where: { id: created.draft.id },
      data: { status: "IN_PROGRESS" },
    });
    created.draft.status = "IN_PROGRESS";
  }

  const hasContact = Boolean(created.draft.contactName && created.draft.contactPhone);
  const hasFulfillment = fulfillmentInvariantHolds({
    method: created.draft.fulfillmentMethod,
    deliveryZoneId: created.draft.deliveryZoneId,
    pickupLocationId: created.draft.pickupLocationId,
  });
  const hasSlot = Boolean(created.draft.requestedDate && created.draft.timeWindowId);
  const step = nextCheckoutStep({
    hasContact,
    hasFulfillment,
    hasSlot,
    requested: input.requestedStep,
  });

  const display = (amountMinor: number) =>
    toDisplayMoney({
      amount: { amountMinor, currency: "MXN" },
      locale: input.locale,
      displayCurrency: input.displayCurrency,
      rate: getQuoteFromSet(input.rateSet, input.displayCurrency),
    });

  return {
    customer: created.customer,
    draft: created.draft,
    address: created.address,
    cart,
    step,
    leadMinutes,
    totals,
    displaySubtotal: display(totals.itemsSubtotalMinor),
    displayFee: display(totals.deliveryFeeMinor),
    displayEstimated: display(totals.estimatedTotalMinor),
    zones: catalog.zones.filter((zone) => zone.isActive),
    pickups: catalog.pickups,
    availableDates,
    selectedZone,
    selectedPickup,
    readyIssues,
    canMarkReady: readyIssues.length === 0,
  };
}

export async function getLatestCheckoutContact(customerId: string) {
  return getPrisma().checkoutDraft.findFirst({
    where: { customerId },
    orderBy: { updatedAt: "desc" },
    select: { contactName: true, contactEmail: true, contactPhone: true },
  });
}

export function assertCheckoutCart(cart: CartView, locale: AppLocale): void {
  if (!canEnterCheckout(cart)) {
    redirect(getPathname({ locale, href: "/carrito" }));
  }
}
