"use server";

import { revalidatePath } from "next/cache";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { LEGAL_PRIMARY_LOCALE, isLegalDocumentType } from "@/modules/legal/domain/types";
import { isPrivacyRequestStatus } from "@/modules/legal/domain/types";
import { getPrisma } from "@/server/db/prisma";

export type LegalAdminState = {
  error: string | null;
  success: string | null;
};

export const emptyLegalAdminState: LegalAdminState = { error: null, success: null };

function revalidateLegal() {
  revalidatePath("/admin/legal");
  revalidatePath("/aviso-de-privacidad");
  revalidatePath("/terminos");
  revalidatePath("/entregas-y-recogidas");
  revalidatePath("/cancelaciones-y-reembolsos");
  revalidatePath("/cookies");
  revalidatePath("/en/privacy");
  revalidatePath("/en/terms");
  revalidatePath("/en/delivery-and-pickup");
  revalidatePath("/en/cancellations-and-refunds");
  revalidatePath("/en/cookies");
}

function nextVersion(current: string): string {
  const match = /^(\d+)\.(\d+)$/.exec(current.trim());
  if (!match) {
    return `${current}-next`;
  }
  return `${match[1]}.${Number(match[2]) + 1}`;
}

export async function createLegalDraftAction(
  previousState: LegalAdminState,
  formData: FormData,
): Promise<LegalAdminState> {
  void previousState;
  const admin = await requireAdmin("/admin/legal");
  const typeRaw = String(formData.get("type") ?? "");
  if (!isLegalDocumentType(typeRaw)) {
    return { error: "Tipo de documento inválido.", success: null };
  }
  const prisma = getPrisma();
  const latest = await prisma.legalDocument.findFirst({
    where: { type: typeRaw, locale: LEGAL_PRIMARY_LOCALE },
    orderBy: { createdAt: "desc" },
  });
  const existingDraft = await prisma.legalDocument.findFirst({
    where: { type: typeRaw, locale: LEGAL_PRIMARY_LOCALE, status: "DRAFT" },
  });
  if (existingDraft) {
    return { error: "Ya existe un borrador de este documento. Edítalo o publícalo.", success: null };
  }
  const published = await prisma.legalDocument.findFirst({
    where: { type: typeRaw, locale: LEGAL_PRIMARY_LOCALE, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  const source = published ?? latest;
  if (!source) {
    return { error: "No hay un documento base.", success: null };
  }
  await prisma.legalDocument.create({
    data: {
      type: typeRaw,
      locale: LEGAL_PRIMARY_LOCALE,
      version: nextVersion(source.version),
      status: "DRAFT",
      title: source.title,
      body: source.body,
      effectiveAt: new Date(),
    },
  });
  void admin;
  revalidateLegal();
  return { error: null, success: "Borrador creado. No es público hasta publicarlo." };
}

export async function saveLegalDraftAction(
  previousState: LegalAdminState,
  formData: FormData,
): Promise<LegalAdminState> {
  void previousState;
  await requireAdmin("/admin/legal");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id || title.length < 3 || body.length < 40) {
    return { error: "El borrador necesita título y contenido.", success: null };
  }
  const prisma = getPrisma();
  const document = await prisma.legalDocument.findUnique({ where: { id } });
  if (!document || document.status !== "DRAFT") {
    return { error: "Solo se puede editar un borrador. Las versiones publicadas no se modifican en silencio.", success: null };
  }
  await prisma.legalDocument.update({
    where: { id },
    data: { title, body },
  });
  revalidateLegal();
  return { error: null, success: "Borrador guardado." };
}

export async function publishLegalDocumentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/legal");
  const id = String(formData.get("id") ?? "");
  const prisma = getPrisma();
  const document = await prisma.legalDocument.findUnique({ where: { id } });
  if (!document || document.status === "ARCHIVED") {
    return;
  }
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.legalDocument.updateMany({
      where: {
        type: document.type,
        locale: document.locale,
        status: "PUBLISHED",
        id: { not: document.id },
      },
      data: { status: "ARCHIVED", archivedAt: now },
    });
    await tx.legalDocument.update({
      where: { id: document.id },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        effectiveAt: now,
        archivedAt: null,
      },
    });
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "LEGAL_DOCUMENT_PUBLISHED",
    resourceType: "LegalDocument",
    resourceId: document.id,
    metadata: { type: document.type, version: document.version },
  });
  revalidateLegal();
}

export async function archiveLegalDocumentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/legal");
  const id = String(formData.get("id") ?? "");
  const prisma = getPrisma();
  const document = await prisma.legalDocument.findUnique({ where: { id } });
  if (!document || document.status === "ARCHIVED") {
    return;
  }
  await prisma.legalDocument.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "LEGAL_DOCUMENT_ARCHIVED",
    resourceType: "LegalDocument",
    resourceId: document.id,
    metadata: { type: document.type, version: document.version },
  });
  revalidateLegal();
}

export async function updatePrivacyRequestAction(
  previousState: LegalAdminState,
  formData: FormData,
): Promise<LegalAdminState> {
  void previousState;
  const admin = await requireAdmin("/admin/legal/privacy-requests");
  const id = String(formData.get("id") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const adminNotes = String(formData.get("adminNotes") ?? "").trim() || null;
  if (!isPrivacyRequestStatus(statusRaw)) {
    return { error: "Estado inválido.", success: null };
  }
  const resolved = statusRaw === "RESOLVED" || statusRaw === "REJECTED" ? new Date() : null;
  await getPrisma().privacyRequest.update({
    where: { id },
    data: {
      status: statusRaw,
      adminNotes,
      resolvedAt: resolved,
      reviewedById: admin.id,
    },
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "PRIVACY_REQUEST_UPDATED",
    resourceType: "PrivacyRequest",
    resourceId: id,
    metadata: { status: statusRaw },
  });
  revalidatePath("/admin/legal/privacy-requests");
  return { error: null, success: "Solicitud actualizada. La resolución es manual; no se borraron datos automáticamente." };
}
