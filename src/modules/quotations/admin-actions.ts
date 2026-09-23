"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { getPrisma } from "@/server/db/prisma";
import { queueTransactionalEmail } from "@/modules/email/queue";
import { mexicoCityLocalToUtc } from "@/modules/promotions/domain/admin-datetime";
import { moneyInputToMinor } from "@/modules/catalog/money-input";
import { buildQuoteOfferTotals } from "@/modules/quotations/domain/money";
import {
  canAdminCancel,
  canAdminOffer,
  canAdminRequestInfo,
  canAdminStartReview,
} from "@/modules/quotations/domain/lifecycle";
import type { QuotationActionState } from "@/modules/quotations/action-state";
import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function revalidateAdmin(id: string) {
  revalidatePath("/admin/quotations");
  revalidatePath(`/admin/quotations/${id}`);
  revalidatePath("/cotizaciones");
  revalidatePath("/en/quotes");
}

export async function startQuotationReviewAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/quotations");
  const id = text(formData, "quotationId");
  const prisma = getPrisma();
  const quote = await prisma.quotation.findUnique({ where: { id } });
  if (!quote || !canAdminStartReview(quote.status)) {
    return;
  }
  await prisma.quotation.update({ where: { id }, data: { status: "IN_REVIEW" } });
  await prisma.quotationEvent.create({
    data: { quotationId: id, type: "QUOTE_REVIEW_STARTED", actorType: "ADMIN", actorId: admin.id },
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "QUOTATION_REVIEW_STARTED",
    resourceType: "Quotation",
    resourceId: id,
  });
  revalidateAdmin(id);
}

export async function requestQuotationInfoAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/quotations");
  const id = text(formData, "quotationId");
  const message = text(formData, "message");
  if (!message) {
    return { error: "Escribe el mensaje para el cliente.", success: null };
  }
  const prisma = getPrisma();
  const quote = await prisma.quotation.findUnique({ where: { id } });
  if (!quote || !canAdminRequestInfo(quote.status)) {
    return { error: "No pudimos pedir información.", success: null };
  }
  await prisma.$transaction([
    prisma.quotation.update({ where: { id }, data: { status: "NEEDS_INFO" } }),
    prisma.quoteMessage.create({
      data: { quotationId: id, authorType: "ADMIN", authorAdminId: admin.id, message },
    }),
    prisma.quotationEvent.create({
      data: { quotationId: id, type: "QUOTE_INFO_REQUESTED", actorType: "ADMIN", actorId: admin.id },
    }),
  ]);
  await queueTransactionalEmail({
    template: "QUOTE_NEEDS_INFO",
    eventKey: `quote:${id}:needs-info:${Date.now()}`,
    recipientEmail: quote.customerEmailSnapshot,
    recipientName: quote.customerNameSnapshot,
    locale: quote.locale,
    referenceType: "Quotation",
    referenceId: id,
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "QUOTATION_INFO_REQUESTED",
    resourceType: "Quotation",
    resourceId: id,
  });
  revalidateAdmin(id);
  return { error: null, success: "Solicitamos información al cliente." };
}

export async function saveQuotationInternalNotesAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/quotations");
  const id = text(formData, "quotationId");
  await getPrisma().quotation.update({
    where: { id },
    data: { adminInternalNotes: text(formData, "adminInternalNotes") || null },
  });
  void admin;
  revalidateAdmin(id);
  return { error: null, success: "Notas internas guardadas." };
}

export async function offerQuotationAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/quotations");
  const id = text(formData, "quotationId");
  const prisma = getPrisma();
  const quote = await prisma.quotation.findUnique({
    where: { id },
    include: { offers: { select: { version: true }, orderBy: { version: "desc" }, take: 1 } },
  });
  if (!quote || !canAdminOffer(quote.status)) {
    return { error: "No pudimos emitir la oferta.", success: null };
  }
  let subtotal: number | null;
  let delivery: number | null;
  try {
    subtotal = moneyInputToMinor(text(formData, "subtotal"));
    delivery = moneyInputToMinor(text(formData, "delivery")) ?? 0;
  } catch {
    return { error: "Revisa los importes MXN.", success: null };
  }
  if (subtotal == null) {
    return { error: "El subtotal es obligatorio.", success: null };
  }
  const totals = buildQuoteOfferTotals({ subtotalMinor: subtotal, deliveryFeeMinor: delivery ?? 0 });
  if ("ok" in totals) {
    return { error: "La oferta no puede ser $0 ni negativa.", success: null };
  }
  const validUntil = mexicoCityLocalToUtc(text(formData, "validUntil"));
  if (!validUntil || validUntil.getTime() <= Date.now()) {
    return { error: "La vigencia debe ser una fecha futura en Mexico City.", success: null };
  }
  const method = text(formData, "fulfillmentMethod") as FulfillmentMethod;
  if (method !== "DELIVERY" && method !== "PICKUP") {
    return { error: "Elige entrega o recogida.", success: null };
  }
  const nextVersion = (quote.offers[0]?.version ?? 0) + 1;
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    if (quote.activeOfferId) {
      await tx.quoteOffer.update({
        where: { id: quote.activeOfferId },
        data: { supersededAt: now },
      });
    }
    const offer = await tx.quoteOffer.create({
      data: {
        quotationId: id,
        version: nextVersion,
        subtotalMinor: totals.subtotalMinor,
        deliveryFeeMinor: totals.deliveryFeeMinor,
        totalMinor: totals.totalMinor,
        fulfillmentMethod: method,
        validUntil,
        message: text(formData, "message") || null,
        pickupLocationId: text(formData, "pickupLocationId") || null,
        deliveryZoneId: text(formData, "deliveryZoneId") || null,
        createdByAdminId: admin.id,
      },
    });
    await tx.quotation.update({
      where: { id },
      data: {
        status: "QUOTED",
        quotedSubtotalMinor: totals.subtotalMinor,
        deliveryFeeMinor: totals.deliveryFeeMinor,
        quotedTotalMinor: totals.totalMinor,
        fulfillmentMethod: method,
        pickupLocationId: text(formData, "pickupLocationId") || null,
        deliveryZoneId: text(formData, "deliveryZoneId") || null,
        validUntil,
        activeOfferId: offer.id,
      },
    });
    await tx.quotationEvent.create({
      data: {
        quotationId: id,
        type: "QUOTE_OFFERED",
        actorType: "ADMIN",
        actorId: admin.id,
        metadata: { version: nextVersion },
      },
    });
  });
  await queueTransactionalEmail({
    template: "QUOTE_OFFERED",
    eventKey: `quote:${id}:offered:v${nextVersion}`,
    recipientEmail: quote.customerEmailSnapshot,
    recipientName: quote.customerNameSnapshot,
    locale: quote.locale,
    referenceType: "Quotation",
    referenceId: id,
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "QUOTATION_OFFERED",
    resourceType: "Quotation",
    resourceId: id,
  });
  revalidateAdmin(id);
  return { error: null, success: `Oferta v${nextVersion} enviada.` };
}

export async function cancelQuotationByAdminAction(
  previousState: QuotationActionState,
  formData: FormData,
): Promise<QuotationActionState> {
  void previousState;
  const admin = await requireAdmin("/admin/quotations");
  const id = text(formData, "quotationId");
  const prisma = getPrisma();
  const quote = await prisma.quotation.findUnique({ where: { id } });
  if (!quote || !canAdminCancel(quote.status) || quote.status === "ACCEPTED" || quote.status === "CONVERTED") {
    return { error: "No se puede cancelar esta cotización.", success: null };
  }
  const message = text(formData, "message");
  await prisma.quotation.update({ where: { id }, data: { status: "CANCELED", canceledAt: new Date() } });
  if (message) {
    await prisma.quoteMessage.create({
      data: { quotationId: id, authorType: "ADMIN", authorAdminId: admin.id, message },
    });
  }
  await prisma.quotationEvent.create({
    data: { quotationId: id, type: "QUOTE_CANCELED", actorType: "ADMIN", actorId: admin.id },
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "QUOTATION_CANCELED",
    resourceType: "Quotation",
    resourceId: id,
  });
  revalidateAdmin(id);
  return { error: null, success: "Cotización cancelada." };
}
