import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { pendingOrderTtlMs } from "@/config/payments";
import type { CurrencyCode } from "@/config/currency";
import { toDisplayMoney } from "@/lib/money/to-display";
import { getQuoteFromSet, type ExchangeRateSet } from "@/server/exchange-rates/rate-set";
import { getPrisma } from "@/server/db/prisma";
import { getCartView } from "@/modules/cart/queries";
import { canEnterCheckout } from "@/modules/checkout/domain/cart-gate";
import { evaluateCheckoutReady } from "@/modules/checkout/domain/ready";
import { buildCheckoutTotals } from "@/modules/checkout/domain/summary";
import { calendarDateFromDb } from "@/modules/checkout/domain/timezone";
import {
  getCartLeadMinutes,
  getFulfillmentCatalog,
  toScheduleDays,
} from "@/modules/checkout/queries";
import { generateOrderNumber } from "@/modules/orders/domain/order-number";
import { buildOrderItemSnapshots } from "@/modules/orders/snapshots";
import { resolveCartPromotion } from "@/modules/promotions/resolve";
import { createPromotionReservation } from "@/modules/promotions/reservation";
import type { AppLocale } from "@/config/i18n";

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; alreadyExisted: boolean }
  | { ok: false; code: "CHANGED" | "NOT_READY" | "NO_DRAFT" | "CART_LOCKED" | "PROMOTION_UNAVAILABLE" | "ZERO_VALUE" };

const cartItemInclude = {
  product: {
    include: {
      translations: { select: { locale: true, name: true, slug: true } },
      optionGroups: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          translations: { select: { locale: true, name: true } },
          options: {
            orderBy: { sortOrder: "asc" as const },
            include: { translations: { select: { locale: true, name: true } } },
          },
        },
      },
      media: {
        where: { role: "PRIMARY" as const },
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: { mediaAsset: { select: { bucket: true, objectPath: true } } },
      },
    },
  },
  variant: {
    select: {
      id: true,
      isActive: true,
      priceMinor: true,
      translations: { select: { locale: true, name: true } },
    },
  },
  options: { select: { optionId: true } },
} as const;

export async function createOrderFromCheckoutDraft(input: {
  customerId: string;
  checkoutDraftId: string;
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  rateSet: ExchangeRateSet;
}): Promise<CreateOrderResult> {
  const prisma = getPrisma();
  const existing = await prisma.order.findUnique({
    where: { checkoutDraftId: input.checkoutDraftId },
    select: { id: true, orderNumber: true },
  });
  if (existing) {
    return {
      ok: true,
      orderId: existing.id,
      orderNumber: existing.orderNumber,
      alreadyExisted: true,
    };
  }

  const draft = await prisma.checkoutDraft.findUnique({
    where: { id: input.checkoutDraftId },
    include: {
      address: true,
      cart: { select: { id: true, status: true, customerId: true, selectedPromotionId: true } },
    },
  });

  if (
    !draft ||
    draft.customerId !== input.customerId ||
    draft.cart.customerId !== input.customerId
  ) {
    return { ok: false, code: "NO_DRAFT" };
  }

  if (draft.cart.status === "PENDING_PAYMENT") {
    const pending = await prisma.order.findFirst({
      where: { cartId: draft.cart.id, status: "PENDING_PAYMENT" },
      select: { id: true, orderNumber: true },
    });
    if (pending) {
      return {
        ok: true,
        orderId: pending.id,
        orderNumber: pending.orderNumber,
        alreadyExisted: true,
      };
    }
    return { ok: false, code: "CART_LOCKED" };
  }

  if (draft.status !== "READY_FOR_PAYMENT" || draft.cart.status !== "ACTIVE") {
    return { ok: false, code: "NOT_READY" };
  }

  const cart = await getCartView({
    locale: input.locale,
    displayCurrency: input.displayCurrency,
    rateSet: input.rateSet,
  });
  const catalog = await getFulfillmentCatalog();
  const leadMinutes = await getCartLeadMinutes(
    draft.cartId,
    cart.items.filter((item) => item.valid).map((item) => item.productId),
  );
  const selectedZone = draft.deliveryZoneId
    ? catalog.zones.find((zone) => zone.id === draft.deliveryZoneId) ?? null
    : null;
  const selectedPickup = draft.pickupLocationId
    ? catalog.pickups.find((item) => item.id === draft.pickupLocationId) ?? null
    : null;
  const selectedWindow = draft.timeWindowId
    ? catalog.schedules
        .flatMap((schedule) => schedule.windows)
        .find((window) => window.id === draft.timeWindowId) ?? null
    : null;

  const issues = evaluateCheckoutReady({
    now: new Date(),
    customerStatus: "ACTIVE",
    draftStatus: draft.status,
    expiresAt: draft.expiresAt,
    contactName: draft.contactName,
    contactEmail: draft.contactEmail,
    contactPhone: draft.contactPhone,
    fulfillmentMethod: draft.fulfillmentMethod,
    deliveryZoneId: draft.deliveryZoneId,
    pickupLocationId: draft.pickupLocationId,
    requestedDate: draft.requestedDate ? calendarDateFromDb(draft.requestedDate) : null,
    timeWindowId: draft.timeWindowId,
    itemsSubtotalMinor: cart.subtotal.amountMinor,
    pricingValid: cart.items.every((item) => item.valid),
    cart,
    zone: selectedZone
      ? { id: selectedZone.id, isActive: selectedZone.isActive, minimumOrderMinor: selectedZone.minimumOrderMinor }
      : null,
    pickup: selectedPickup ? { id: selectedPickup.id, isActive: selectedPickup.isActive } : null,
    address: draft.address,
    leadMinutes,
    schedule: draft.fulfillmentMethod ? toScheduleDays(catalog.schedules, draft.fulfillmentMethod) : [],
    blackouts: catalog.blackouts.map((item) => ({
      date: calendarDateFromDb(item.date),
      fulfillmentMethod: item.fulfillmentMethod,
      isActive: item.isActive,
    })),
  });

  if (issues.length > 0 || !canEnterCheckout(cart) || !draft.fulfillmentMethod || !draft.requestedDate || !selectedWindow) {
    await prisma.checkoutDraft.update({
      where: { id: draft.id },
      data: { status: "IN_PROGRESS" },
    });
    return { ok: false, code: "CHANGED" };
  }

  const baseTotals = buildCheckoutTotals({
    itemsSubtotalMinor: cart.subtotal.amountMinor,
    method: draft.fulfillmentMethod,
    zoneFeeMinor: selectedZone?.deliveryFeeMinor,
  });
  const promotion = await resolveCartPromotion({
    customerId: draft.customerId,
    selectedPromotionId: draft.selectedPromotionId ?? draft.cart.selectedPromotionId,
    items: cart.items
      .filter((item) => item.valid && item.lineTotal)
      .map((item) => ({ productId: item.productId, lineTotalMinor: item.lineTotal!.amountMinor })),
    subtotalMinor: cart.subtotal.amountMinor,
    locale: input.locale,
    deliveryFeeMinor: baseTotals.deliveryFeeMinor,
    fulfillmentMethod: draft.fulfillmentMethod,
  });
  if (promotion.invalidated) {
    await prisma.checkoutDraft.update({
      where: { id: draft.id },
      data: { status: "IN_PROGRESS", selectedPromotionId: null },
    });
    return { ok: false, code: "PROMOTION_UNAVAILABLE" };
  }
  if (promotion.totals.grandTotalMinor <= 0) {
    return { ok: false, code: "ZERO_VALUE" };
  }
  const totals = {
    itemsSubtotalMinor: baseTotals.itemsSubtotalMinor,
    deliveryFeeMinor: baseTotals.deliveryFeeMinor,
    estimatedTotalMinor: promotion.totals.grandTotalMinor,
  };

  const itemRows = await prisma.cartItem.findMany({
    where: { cartId: draft.cartId },
    orderBy: { createdAt: "asc" },
    include: cartItemInclude,
  });

  let snapshots;
  try {
    snapshots = buildOrderItemSnapshots(itemRows);
  } catch {
    await prisma.checkoutDraft.update({
      where: { id: draft.id },
      data: { status: "IN_PROGRESS" },
    });
    return { ok: false, code: "CHANGED" };
  }

  const snapshotSubtotal = snapshots.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  if (snapshotSubtotal !== totals.itemsSubtotalMinor) {
    await prisma.checkoutDraft.update({
      where: { id: draft.id },
      data: { status: "IN_PROGRESS" },
    });
    return { ok: false, code: "CHANGED" };
  }

  const display =
    input.displayCurrency === "MXN"
      ? null
      : toDisplayMoney({
          amount: { amountMinor: totals.estimatedTotalMinor, currency: "MXN" },
          locale: input.locale,
          displayCurrency: input.displayCurrency,
          rate: getQuoteFromSet(input.rateSet, input.displayCurrency),
        });

  const requestedDate = calendarDateFromDb(draft.requestedDate);
  const expiresAt = new Date(Date.now() + pendingOrderTtlMs);
  const pickupAddress = selectedPickup
    ? [selectedPickup.addressLine, selectedPickup.city, selectedPickup.state, selectedPickup.postalCode]
        .filter(Boolean)
        .join(", ")
    : null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    try {
      const created = await prisma.$transaction(async (tx) => {
        const duplicate = await tx.order.findUnique({
          where: { checkoutDraftId: draft.id },
          select: { id: true, orderNumber: true },
        });
        if (duplicate) {
          return duplicate;
        }

        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: draft.customerId,
            cartId: draft.cartId,
            checkoutDraftId: draft.id,
            status: "PENDING_PAYMENT",
            paymentStatus: "NOT_STARTED",
            fulfillmentStatus: "PENDING",
            currencyCode: "MXN",
            itemsSubtotalMinor: totals.itemsSubtotalMinor,
            deliveryFeeMinor: totals.deliveryFeeMinor,
            promotionId: promotion.quote?.promotionId ?? null,
            promotionCodeSnapshot: promotion.quote?.normalizedCode ?? null,
            promotionLabelSnapshot: promotion.quote?.label ?? null,
            promotionBenefitType: promotion.quote?.benefitType ?? null,
            promotionDiscountMinor: promotion.totals.promotionDiscountMinor,
            promotionEligibleSubtotalMinor: promotion.quote?.eligibleSubtotalMinor ?? null,
            grandTotalMinor: totals.estimatedTotalMinor,
            displayCurrencyCode:
              display && !display.unavailable ? display.currency : null,
            displayTotalMinor: display && !display.unavailable ? display.amountMinor : null,
            displayExchangeRate: display && !display.unavailable && display.rate ? display.rate : null,
            displayExchangeProvider: display && !display.unavailable ? display.provider : null,
            displayExchangeSourceDate:
              display && !display.unavailable && display.sourceDate
                ? new Date(`${display.sourceDate}T00:00:00.000Z`)
                : null,
            customerName: draft.contactName ?? "",
            customerEmail: draft.contactEmail ?? "",
            locale: input.locale,
            customerPhone: draft.contactPhone,
            fulfillmentMethod: draft.fulfillmentMethod!,
            requestedDate: new Date(`${requestedDate}T00:00:00.000Z`),
            timeWindowLabel: selectedWindow.label,
            timeWindowStart: selectedWindow.startTime,
            timeWindowEnd: selectedWindow.endTime,
            customerNotes: draft.customerNotes,
            deliveryZoneId: selectedZone?.id ?? null,
            deliveryZoneName: selectedZone?.name ?? null,
            pickupLocationId: selectedPickup?.id ?? null,
            pickupLocationName: selectedPickup?.name ?? null,
            pickupAddressSnapshot: pickupAddress,
            pickupInstructionsSnapshot: selectedPickup?.instructions ?? null,
            expiresAt,
            items: {
              create: snapshots.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                productType: item.productType,
                quantity: item.quantity,
                baseUnitPriceMinor: item.baseUnitPriceMinor,
                optionsDeltaMinor: item.optionsDeltaMinor,
                configuredUnitPriceMinor: item.configuredUnitPriceMinor,
                lineTotalMinor: item.lineTotalMinor,
                currencyCode: item.currencyCode,
                productNameEs: item.productNameEs,
                productNameEn: item.productNameEn,
                productSlugEs: item.productSlugEs,
                productSlugEn: item.productSlugEn,
                variantNameEs: item.variantNameEs,
                variantNameEn: item.variantNameEn,
                primaryImageSnapshot: item.primaryImageSnapshot,
                sortOrder: item.sortOrder,
                options: {
                  create: item.options,
                },
              })),
            },
            address: draft.address
              ? {
                  create: {
                    countryCode: draft.address.countryCode,
                    postalCode: draft.address.postalCode,
                    state: draft.address.state,
                    city: draft.address.city,
                    locality: draft.address.locality,
                    street: draft.address.street,
                    exteriorNumber: draft.address.exteriorNumber,
                    interiorNumber: draft.address.interiorNumber,
                    reference: draft.address.reference,
                  },
                }
              : undefined,
            events: {
              create: { type: "ORDER_CREATED" },
            },
          },
          select: { id: true, orderNumber: true },
        });

        await tx.cart.update({
          where: { id: draft.cartId },
          data: { status: "PENDING_PAYMENT" },
        });
        await tx.checkoutDraft.update({
          where: { id: draft.id },
          data: { status: "CONVERTED_TO_ORDER" },
        });

        if (promotion.quote?.isEligible && promotion.quote.reason !== "DELIVERY_PENDING") {
          const reserved = await createPromotionReservation(tx, {
            promotionId: promotion.quote.promotionId,
            customerId: draft.customerId,
            orderId: order.id,
            expiresAt,
            now: new Date(),
          });
          if (!reserved.ok) {
            throw new Error("PROMOTION_LIMIT");
          }
        }

        return order;
      });

      return {
        ok: true,
        orderId: created.id,
        orderNumber: created.orderNumber,
        alreadyExisted: created.orderNumber !== orderNumber,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "PROMOTION_LIMIT") {
        return { ok: false, code: "PROMOTION_UNAVAILABLE" };
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await prisma.order.findUnique({
          where: { checkoutDraftId: draft.id },
          select: { id: true, orderNumber: true },
        });
        if (raced) {
          return {
            ok: true,
            orderId: raced.id,
            orderNumber: raced.orderNumber,
            alreadyExisted: true,
          };
        }
        continue;
      }
      throw error;
    }
  }

  return { ok: false, code: "NOT_READY" };
}
