"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { getPrisma } from "@/server/db/prisma";
import { normalizePromotionCode } from "@/modules/promotions/domain/code";
import { validatePromotionActivation } from "@/modules/promotions/domain/activation";
import { mexicoCityLocalToUtc } from "@/modules/promotions/domain/admin-datetime";
import { moneyInputToMinor } from "@/modules/catalog/money-input";
import type { PromotionBenefitType, PromotionMode, PromotionScopeType } from "@/modules/promotions/domain/types";
import {
  auditActionForPromotionStatus,
  canTransitionPromotionStatus,
  parsePromotionStatusForm,
  promotionStatusUpdateError,
  promotionStatusWriteData,
} from "@/modules/promotions/domain/status-transition";

export type AdminPromotionState = { error: string | null; success: string | null };
export const emptyAdminPromotionState: AdminPromotionState = { error: null, success: null };

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalInt(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (!raw) {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function optionalMoney(formData: FormData, name: string) {
  const raw = text(formData, name);
  return raw ? moneyInputToMinor(raw) : null;
}

function parseTargets(formData: FormData) {
  return formData.getAll("targets").map((value) => String(value)).filter(Boolean);
}

async function persistTargets(
  promotionId: string,
  scopeType: PromotionScopeType,
  targets: string[],
) {
  const prisma = getPrisma();
  await prisma.promotionProduct.deleteMany({ where: { promotionId } });
  await prisma.promotionCategory.deleteMany({ where: { promotionId } });
  await prisma.promotionUniverse.deleteMany({ where: { promotionId } });
  await prisma.promotionBusinessLine.deleteMany({ where: { promotionId } });
  if (scopeType === "PRODUCT") {
    await prisma.promotionProduct.createMany({
      data: targets.map((productId) => ({ promotionId, productId })),
    });
  }
  if (scopeType === "CATEGORY") {
    await prisma.promotionCategory.createMany({
      data: targets.map((categoryId) => ({ promotionId, categoryId })),
    });
  }
  if (scopeType === "UNIVERSE") {
    await prisma.promotionUniverse.createMany({
      data: targets.map((universeId) => ({ promotionId, universeId })),
    });
  }
  if (scopeType === "BUSINESS_LINE") {
    await prisma.promotionBusinessLine.createMany({
      data: targets.map((businessLineId) => ({ promotionId, businessLineId })),
    });
  }
}

function parseForm(formData: FormData) {
  const mode = text(formData, "mode") as PromotionMode;
  const benefitType = text(formData, "benefitType") as PromotionBenefitType;
  const scopeType = text(formData, "scopeType") as PromotionScopeType;
  const normalizedCode = mode === "CODE" ? normalizePromotionCode(text(formData, "code")) : null;
  return {
    internalName: text(formData, "internalName"),
    mode,
    benefitType,
    scopeType,
    normalizedCode,
    percentageBps:
      benefitType === "PERCENTAGE" && optionalInt(formData, "percentage") != null
        ? optionalInt(formData, "percentage")! * 100
        : null,
    fixedAmountMinor: benefitType === "FIXED_AMOUNT" ? optionalMoney(formData, "fixedAmount") : null,
    minSubtotalMinor: optionalMoney(formData, "minSubtotal"),
    maxDiscountMinor: optionalMoney(formData, "maxDiscount"),
    startsAt: text(formData, "startsAt") ? mexicoCityLocalToUtc(text(formData, "startsAt")) : null,
    endsAt: text(formData, "endsAt") ? mexicoCityLocalToUtc(text(formData, "endsAt")) : null,
    usageLimitTotal: optionalInt(formData, "usageLimitTotal"),
    usageLimitPerCustomer: optionalInt(formData, "usageLimitPerCustomer"),
    priority: optionalInt(formData, "priority") ?? 0,
    labelEs: text(formData, "labelEs"),
    labelEn: text(formData, "labelEn"),
    descriptionEs: text(formData, "descriptionEs") || null,
    descriptionEn: text(formData, "descriptionEn") || null,
    targets: parseTargets(formData),
  };
}

export async function savePromotionAction(
  previousState: AdminPromotionState,
  formData: FormData,
): Promise<AdminPromotionState> {
  void previousState;
  const admin = await requireAdmin("/admin/promotions");
  const id = text(formData, "id") || null;
  const parsed = parseForm(formData);
  if (!parsed.internalName) {
    return { error: "El nombre interno es obligatorio.", success: null };
  }
  if (!parsed.labelEs) {
    return { error: "El label en español es obligatorio.", success: null };
  }
  if (parsed.mode === "CODE" && !parsed.normalizedCode) {
    return { error: "El código no es válido.", success: null };
  }

  const prisma = getPrisma();
  const data = {
    internalName: parsed.internalName,
    mode: parsed.mode,
    normalizedCode: parsed.normalizedCode,
    benefitType: parsed.benefitType,
    percentageBps: parsed.percentageBps,
    fixedAmountMinor: parsed.fixedAmountMinor,
    minSubtotalMinor: parsed.minSubtotalMinor,
    maxDiscountMinor: parsed.maxDiscountMinor,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    usageLimitTotal: parsed.usageLimitTotal,
    usageLimitPerCustomer: parsed.usageLimitPerCustomer,
    priority: parsed.priority,
    scopeType: parsed.scopeType,
    updatedByAdminId: admin.id,
  };

  let promotion;
  try {
    promotion = id
      ? await prisma.promotion.update({ where: { id }, data })
      : await prisma.promotion.create({
          data: { ...data, status: "DRAFT", createdByAdminId: admin.id },
        });
  } catch {
    return { error: "No se pudo guardar. Revisa que el código no esté repetido.", success: null };
  }

  await prisma.promotionTranslation.upsert({
    where: { promotionId_locale: { promotionId: promotion.id, locale: "es-MX" } },
    create: { promotionId: promotion.id, locale: "es-MX", label: parsed.labelEs, description: parsed.descriptionEs },
    update: { label: parsed.labelEs, description: parsed.descriptionEs },
  });
  if (parsed.labelEn) {
    await prisma.promotionTranslation.upsert({
      where: { promotionId_locale: { promotionId: promotion.id, locale: "en-US" } },
      create: { promotionId: promotion.id, locale: "en-US", label: parsed.labelEn, description: parsed.descriptionEn },
      update: { label: parsed.labelEn, description: parsed.descriptionEn },
    });
  }
  await persistTargets(promotion.id, parsed.scopeType, parsed.targets);
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: id ? "PROMOTION_UPDATED" : "PROMOTION_CREATED",
    resourceType: "Promotion",
    resourceId: promotion.id,
  });
  revalidatePath("/admin/promotions");
  if (!id) {
    redirect(`/admin/promotions/${promotion.id}`);
  }
  return { error: null, success: "Guardado." };
}

export async function changePromotionStatusAction(
  previousState: AdminPromotionState,
  formData: FormData,
): Promise<AdminPromotionState> {
  void previousState;
  const admin = await requireAdmin("/admin/promotions");
  const parsed = parsePromotionStatusForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error, success: null };
  }

  const prisma = getPrisma();
  const current = await prisma.promotion.findUnique({
    where: { id: parsed.promotionId },
    include: { translations: true, products: true, categories: true, universes: true, businessLines: true },
  });
  if (!current) {
    return { error: promotionStatusUpdateError, success: null };
  }
  if (!canTransitionPromotionStatus(current.status, parsed.status)) {
    return { error: promotionStatusUpdateError, success: null };
  }
  if (parsed.status === "ACTIVE") {
    const es = current.translations.find((item) => item.locale === "es-MX");
    const targetCount =
      current.scopeType === "PRODUCT"
        ? current.products.length
        : current.scopeType === "CATEGORY"
          ? current.categories.length
          : current.scopeType === "UNIVERSE"
            ? current.universes.length
            : current.scopeType === "BUSINESS_LINE"
              ? current.businessLines.length
              : 1;
    const issues = validatePromotionActivation({
      mode: current.mode,
      normalizedCode: current.normalizedCode,
      labelEs: es?.label ?? "",
      benefitType: current.benefitType,
      percentageBps: current.percentageBps,
      fixedAmountMinor: current.fixedAmountMinor,
      minSubtotalMinor: current.minSubtotalMinor,
      maxDiscountMinor: current.maxDiscountMinor,
      startsAt: current.startsAt,
      endsAt: current.endsAt,
      usageLimitTotal: current.usageLimitTotal,
      usageLimitPerCustomer: current.usageLimitPerCustomer,
      scopeType: current.scopeType,
      targetCount,
    });
    if (issues.length > 0) {
      redirect(`/admin/promotions/${parsed.promotionId}?error=activation`);
    }
  }

  try {
    await prisma.promotion.update({
      where: { id: parsed.promotionId },
      data: promotionStatusWriteData(parsed.status, admin.id),
    });
  } catch {
    return { error: promotionStatusUpdateError, success: null };
  }

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: auditActionForPromotionStatus(parsed.status),
    resourceType: "Promotion",
    resourceId: parsed.promotionId,
  });
  revalidatePath("/admin/promotions");
  revalidatePath(`/admin/promotions/${parsed.promotionId}`);
  redirect(`/admin/promotions/${parsed.promotionId}`);
}
