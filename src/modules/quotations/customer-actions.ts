"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import { requireCustomer } from "@/modules/customer-auth/queries";
import { getPrisma } from "@/server/db/prisma";
import { queueTransactionalEmail } from "@/modules/email/queue";
import { generateQuoteNumber } from "@/modules/quotations/domain/quote-number";
import {
  canCustomerCancel,
  canCustomerDecline,
  canCustomerReply,
} from "@/modules/quotations/domain/lifecycle";
import { uploadQuoteAttachment } from "@/modules/quotations/storage";
import { acceptQuotationAndCreateOrder } from "@/modules/quotations/convert";
import { createOrGetPaymentIntentForOrder } from "@/modules/payments/create-intent";
import type { QuotationActionState } from "@/modules/quotations/action-state";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function revalidateQuotes() {
  revalidatePath("/cotizaciones");
  revalidatePath("/en/quotes");
  revalidatePath("/admin/quotations");
}

export async function submitQuotationAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const rawLocale = await getLocale();
  const locale = isAppLocale(rawLocale) ? rawLocale : "es-MX";
  const next = getPathname({ locale, href: "/cotizaciones" });
  const customer = await requireCustomer(next);
  const productId = text(formData, "productId");
  const notes = text(formData, "customerMessage");
  const description = [text(formData, "requestDescription"), notes].filter(Boolean).join("\n\n");
  if (!productId || description.length < 8) {
    return { error: "Cuéntanos un poco más sobre tu idea.", success: null };
  }
  const prisma = getPrisma();
  const product = await prisma.product.findFirst({
    where: { id: productId, type: "CUSTOM_QUOTE", status: "PUBLISHED" },
    include: { translations: true },
  });
  if (!product) {
    return { error: "Este producto ya no está disponible.", success: null };
  }
  const translation =
    product.translations.find((item) => item.locale === locale) ??
    product.translations.find((item) => item.locale === "es-MX");
  const files = formData.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length > 5) {
    return { error: "Puedes adjuntar hasta 5 imágenes.", success: null };
  }

  let quotation;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      quotation = await prisma.quotation.create({
        data: {
          quoteNumber: generateQuoteNumber(),
          customerId: customer.id,
          productId: product.id,
          locale,
          customerNameSnapshot: customer.displayName || customer.email,
          customerEmailSnapshot: customer.email,
          customerPhoneSnapshot: customer.phone,
          productNameSnapshot: translation?.name ?? "Creación personalizada",
          productSlugSnapshot: translation?.slug ?? product.id,
          requestTitle: text(formData, "requestTitle") || null,
          requestDescription: description,
          eventDate: text(formData, "eventDate") ? new Date(`${text(formData, "eventDate")}T00:00:00.000Z`) : null,
          guestCount: text(formData, "guestCount") ? Number.parseInt(text(formData, "guestCount"), 10) : null,
          events: {
            create: { type: "QUOTE_SUBMITTED", actorType: "CUSTOMER", actorId: customer.id },
          },
        },
      });
      break;
    } catch {
      if (attempt === 4) {
        return { error: "No pudimos enviar tu solicitud.", success: null };
      }
    }
  }
  if (!quotation) {
    return { error: "No pudimos enviar tu solicitud.", success: null };
  }

  for (const [index, file] of files.entries()) {
    const uploaded = await uploadQuoteAttachment({
      customerId: customer.id,
      quotationId: quotation.id,
      file,
      currentCount: index,
    });
    if (uploaded.ok) {
      await prisma.quoteAttachment.create({
        data: {
          quotationId: quotation.id,
          storagePath: uploaded.storagePath,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
        },
      });
    }
  }

  await queueTransactionalEmail({
    template: "QUOTE_RECEIVED",
    eventKey: `quote:${quotation.id}:received:v1`,
    recipientEmail: customer.email,
    recipientName: customer.displayName,
    locale,
    referenceType: "Quotation",
    referenceId: quotation.id,
  });
  revalidateQuotes();
  redirect(
    `${getPathname({
      locale,
      href: { pathname: "/cotizaciones/[quoteNumber]", params: { quoteNumber: quotation.quoteNumber } },
    })}?enviada=1`,
  );
}

export async function replyQuotationAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const customer = await requireCustomer("/cotizaciones");
  const id = text(formData, "quotationId");
  const message = text(formData, "message");
  if (!message) {
    return { error: "Escribe tu respuesta.", success: null };
  }
  const prisma = getPrisma();
  const quote = await prisma.quotation.findFirst({ where: { id, customerId: customer.id } });
  if (!quote || !canCustomerReply(quote.status)) {
    return { error: "No pudimos actualizar la cotización.", success: null };
  }
  await prisma.$transaction([
    prisma.quoteMessage.create({
      data: { quotationId: id, authorType: "CUSTOMER", authorCustomerId: customer.id, message },
    }),
    prisma.quotation.update({ where: { id }, data: { status: "IN_REVIEW" } }),
    prisma.quotationEvent.create({
      data: { quotationId: id, type: "QUOTE_UPDATED_BY_CUSTOMER", actorType: "CUSTOMER", actorId: customer.id },
    }),
  ]);
  revalidateQuotes();
  return { error: null, success: "Enviamos tu respuesta." };
}

export async function saveQuoteAddressAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const customer = await requireCustomer("/cotizaciones");
  const id = text(formData, "quotationId");
  const quote = await getPrisma().quotation.findFirst({ where: { id, customerId: customer.id } });
  if (!quote || quote.status !== "QUOTED") {
    return { error: "No pudimos guardar la dirección.", success: null };
  }
  const street = text(formData, "street");
  const city = text(formData, "city");
  const postalCode = text(formData, "postalCode");
  if (!street || !city || !postalCode) {
    return { error: "Completa la dirección de entrega.", success: null };
  }
  await getPrisma().quoteAddress.upsert({
    where: { quotationId: id },
    create: {
      quotationId: id,
      countryCode: "MX",
      postalCode,
      state: text(formData, "state") || "CDMX",
      city,
      locality: text(formData, "locality") || null,
      street,
      exteriorNumber: text(formData, "exteriorNumber") || null,
      interiorNumber: text(formData, "interiorNumber") || null,
      reference: text(formData, "reference") || null,
    },
    update: {
      postalCode,
      state: text(formData, "state") || "CDMX",
      city,
      locality: text(formData, "locality") || null,
      street,
      exteriorNumber: text(formData, "exteriorNumber") || null,
      interiorNumber: text(formData, "interiorNumber") || null,
      reference: text(formData, "reference") || null,
    },
  });
  revalidateQuotes();
  return { error: null, success: "Dirección guardada." };
}

export async function acceptQuotationAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const rawLocale = await getLocale();
  const locale = isAppLocale(rawLocale) ? rawLocale : "es-MX";
  const customer = await requireCustomer("/cotizaciones");
  const result = await acceptQuotationAndCreateOrder({
    quotationId: text(formData, "quotationId"),
    customerId: customer.id,
  });
  if (!result.ok) {
    return {
      error:
        result.code === "ADDRESS_REQUIRED"
          ? "Agrega una dirección de entrega antes de aceptar."
          : result.code === "EXPIRED"
            ? "Esta cotización ya no está vigente."
            : "No pudimos aceptar la cotización.",
      success: null,
    };
  }
  await createOrGetPaymentIntentForOrder(result.orderId);
  revalidateQuotes();
  revalidatePath("/cuenta");
  redirect(
    getPathname({
      locale,
      href: { pathname: "/pago/[orderNumber]", params: { orderNumber: result.orderNumber } },
    }),
  );
}

export async function declineQuotationAction(formData: FormData): Promise<void> {
  const customer = await requireCustomer("/cotizaciones");
  const id = text(formData, "quotationId");
  const prisma = getPrisma();
  const quote = await prisma.quotation.findFirst({ where: { id, customerId: customer.id } });
  if (!quote || !canCustomerDecline(quote.status)) {
    return;
  }
  await prisma.quotation.update({ where: { id }, data: { status: "DECLINED", declinedAt: new Date() } });
  await prisma.quotationEvent.create({
    data: { quotationId: id, type: "QUOTE_DECLINED", actorType: "CUSTOMER", actorId: customer.id },
  });
  await queueTransactionalEmail({
    template: "QUOTE_DECLINED",
    eventKey: `quote:${id}:declined:v1`,
    recipientEmail: quote.customerEmailSnapshot,
    recipientName: quote.customerNameSnapshot,
    locale: quote.locale,
    referenceType: "Quotation",
    referenceId: id,
  });
  revalidateQuotes();
}

export async function cancelQuotationAction(formData: FormData): Promise<void> {
  const customer = await requireCustomer("/cotizaciones");
  const id = text(formData, "quotationId");
  const prisma = getPrisma();
  const quote = await prisma.quotation.findFirst({ where: { id, customerId: customer.id } });
  if (!quote || !canCustomerCancel(quote.status)) {
    return;
  }
  await prisma.quotation.update({ where: { id }, data: { status: "CANCELED", canceledAt: new Date() } });
  await prisma.quotationEvent.create({
    data: { quotationId: id, type: "QUOTE_CANCELED", actorType: "CUSTOMER", actorId: customer.id },
  });
  revalidateQuotes();
}
