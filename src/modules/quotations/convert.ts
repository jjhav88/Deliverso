import "server-only";
import { pendingOrderTtlMs } from "@/config/payments";
import { getPrisma } from "@/server/db/prisma";
import { generateOrderNumber } from "@/modules/orders/domain/order-number";
import { queueTransactionalEmail } from "@/modules/email/queue";
import { evaluateQuotationConversion } from "@/modules/quotations/domain/conversion";

export async function acceptQuotationAndCreateOrder(input: {
  quotationId: string;
  customerId: string;
}) {
  const prisma = getPrisma();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const quote = await tx.quotation.findUnique({
      where: { id: input.quotationId },
      include: {
        activeOffer: true,
        address: true,
        product: { include: { translations: true } },
        pickupLocation: true,
        order: { select: { id: true, orderNumber: true } },
      },
    });
    if (!quote || quote.customerId !== input.customerId) {
      return { ok: false as const, code: "NOT_FOUND" as const };
    }
    if (quote.order) {
      return { ok: true as const, orderId: quote.order.id, orderNumber: quote.order.orderNumber, alreadyExisted: true };
    }
    if (quote.status === "ACCEPTED" || quote.status === "CONVERTED") {
      const existing = await tx.order.findUnique({
        where: { quotationId: quote.id },
        select: { id: true, orderNumber: true },
      });
      if (existing) {
        return { ok: true as const, orderId: existing.id, orderNumber: existing.orderNumber, alreadyExisted: true };
      }
    }
    const decision = evaluateQuotationConversion({
      ownerId: quote.customerId,
      customerId: input.customerId,
      status: quote.status,
      now,
      validUntil: quote.validUntil,
      hasActiveOffer: Boolean(quote.activeOffer),
      alreadyHasOrder: false,
      totals: quote.activeOffer
        ? {
            subtotalMinor: quote.activeOffer.subtotalMinor,
            deliveryFeeMinor: quote.activeOffer.deliveryFeeMinor,
            totalMinor: quote.activeOffer.totalMinor,
          }
        : null,
      fulfillmentMethod: quote.activeOffer?.fulfillmentMethod ?? null,
      hasAddress: Boolean(quote.address),
      hasPickup: Boolean(quote.pickupLocation || quote.activeOffer?.pickupLocationId),
    });
    if (!decision.ok) {
      return { ok: false as const, code: decision.code };
    }
    const offer = quote.activeOffer!;

    const pickup = quote.pickupLocation
      ?? (offer.pickupLocationId
        ? await tx.pickupLocation.findUnique({ where: { id: offer.pickupLocationId } })
        : null);
    const productEs = quote.product?.translations.find((item) => item.locale === "es-MX");
    const productEn = quote.product?.translations.find((item) => item.locale === "en-US");
    const requested = quote.requestedFulfillmentDate ?? quote.eventDate ?? now;
    const requestedDate = requested instanceof Date ? requested : now;

    let created;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        created = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            customerId: quote.customerId,
            quotationId: quote.id,
            acceptedOfferId: offer.id,
            customOrder: true,
            quotationNumberSnapshot: quote.quoteNumber,
            quotationDescriptionSnapshot: quote.requestDescription,
            status: "PENDING_PAYMENT",
            paymentStatus: "NOT_STARTED",
            fulfillmentStatus: "PENDING",
            currencyCode: "MXN",
            itemsSubtotalMinor: offer.subtotalMinor,
            deliveryFeeMinor: offer.deliveryFeeMinor,
            promotionDiscountMinor: 0,
            grandTotalMinor: offer.totalMinor,
            customerName: quote.customerNameSnapshot,
            customerEmail: quote.customerEmailSnapshot,
            locale: quote.locale,
            customerPhone: quote.customerPhoneSnapshot,
            fulfillmentMethod: offer.fulfillmentMethod,
            requestedDate,
            timeWindowLabel: "Cotización",
            timeWindowStart: "10:00",
            timeWindowEnd: "18:00",
            customerNotes: quote.requestTitle,
            pickupLocationId: pickup?.id ?? null,
            pickupLocationName: pickup?.name ?? null,
            pickupAddressSnapshot: pickup
              ? [pickup.addressLine, pickup.city, pickup.state, pickup.postalCode].filter(Boolean).join(", ")
              : null,
            pickupInstructionsSnapshot: pickup?.instructions ?? null,
            expiresAt: new Date(now.getTime() + pendingOrderTtlMs),
            items: {
              create: {
                productId: quote.productId,
                productType: "CUSTOM_QUOTE",
                quantity: 1,
                baseUnitPriceMinor: offer.subtotalMinor,
                optionsDeltaMinor: 0,
                configuredUnitPriceMinor: offer.subtotalMinor,
                lineTotalMinor: offer.subtotalMinor,
                productNameEs: productEs?.name ?? quote.productNameSnapshot,
                productNameEn: productEn?.name ?? null,
                productSlugEs: productEs?.slug ?? quote.productSlugSnapshot,
                productSlugEn: productEn?.slug ?? null,
              },
            },
            ...(quote.address
              ? {
                  address: {
                    create: {
                      countryCode: quote.address.countryCode,
                      postalCode: quote.address.postalCode,
                      state: quote.address.state,
                      city: quote.address.city,
                      locality: quote.address.locality,
                      street: quote.address.street,
                      exteriorNumber: quote.address.exteriorNumber,
                      interiorNumber: quote.address.interiorNumber,
                      reference: quote.address.reference,
                    },
                  },
                }
              : {}),
            events: { create: { type: "CREATED_FROM_QUOTATION" } },
          },
        });
        break;
      } catch (error) {
        if (attempt === 4) {
          throw error;
        }
      }
    }
    if (!created) {
      return { ok: false as const, code: "UNAVAILABLE" as const };
    }

    await tx.quotation.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED", acceptedAt: now },
    });
    await tx.quotationEvent.create({
      data: {
        quotationId: quote.id,
        type: "QUOTE_ACCEPTED",
        actorType: "CUSTOMER",
        actorId: input.customerId,
      },
    });
    await queueTransactionalEmail(
      {
        template: "QUOTE_ACCEPTED",
        eventKey: `quote:${quote.id}:accepted:v1`,
        recipientEmail: quote.customerEmailSnapshot,
        recipientName: quote.customerNameSnapshot,
        locale: quote.locale,
        referenceType: "Quotation",
        referenceId: quote.id,
      },
      tx,
    );
    return { ok: true as const, orderId: created.id, orderNumber: created.orderNumber, alreadyExisted: false };
  });
}
