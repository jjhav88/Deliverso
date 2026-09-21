"use server";

import { revalidatePath } from "next/cache";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import type { CatalogActionState } from "@/modules/catalog/action-state";
import { isOptionSelectionType, validateOptionGroupRules } from "@/modules/catalog/domain";
import { moneyInputToMinor } from "@/modules/catalog/money-input";
import { getPrisma } from "@/server/db/prisma";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function int(formData: FormData, key: string, fallback: number): number {
  const raw = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isInteger(raw) ? raw : fallback;
}

function revalidateProduct(productId: string) {
  revalidatePath(`/admin/products/${productId}`);
}

export async function createOptionGroupAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const productId = text(formData, "productId");
  const selectionType = text(formData, "selectionType");
  if (!productId || !isOptionSelectionType(selectionType)) {
    return { error: "Grupo inválido.", success: null };
  }

  const isRequired = formData.get("isRequired") === "on";
  const minSelections = int(formData, "minSelections", isRequired ? 1 : 0);
  const maxSelections = int(formData, "maxSelections", 1);
  const ruleError = validateOptionGroupRules({
    selectionType,
    isRequired,
    minSelections,
    maxSelections,
  });
  if (ruleError) {
    return { error: ruleError, success: null };
  }

  const nameEs = text(formData, "nameEs");
  if (!nameEs || !text(formData, "code")) {
    return { error: "Código y nombre en español son obligatorios.", success: null };
  }

  const prisma = getPrisma();
  const last = await prisma.productOptionGroup.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });

  const group = await prisma.productOptionGroup.create({
    data: {
      productId,
      code: text(formData, "code"),
      selectionType,
      isRequired,
      minSelections,
      maxSelections,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      translations: {
        create: [
          { locale: "es-MX", name: nameEs, description: text(formData, "descriptionEs") || null },
          {
            locale: "en-US",
            name: text(formData, "nameEn") || nameEs,
            description: text(formData, "descriptionEn") || null,
          },
        ],
      },
    },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "OPTION_GROUP_CREATED",
    resourceType: "ProductOptionGroup",
    resourceId: group.id,
  });
  revalidateProduct(productId);
  return { error: null, success: "Grupo creado." };
}

export async function updateOptionGroupAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const groupId = text(formData, "groupId");
  const productId = text(formData, "productId");
  const selectionType = text(formData, "selectionType");
  if (!groupId || !isOptionSelectionType(selectionType)) {
    return { error: "Grupo inválido.", success: null };
  }

  const isRequired = formData.get("isRequired") === "on";
  const minSelections = int(formData, "minSelections", isRequired ? 1 : 0);
  const maxSelections = int(formData, "maxSelections", 1);
  const ruleError = validateOptionGroupRules({
    selectionType,
    isRequired,
    minSelections,
    maxSelections,
  });
  if (ruleError) {
    return { error: ruleError, success: null };
  }

  const prisma = getPrisma();
  await prisma.productOptionGroup.update({
    where: { id: groupId },
    data: {
      code: text(formData, "code"),
      selectionType,
      isRequired,
      minSelections,
      maxSelections,
      isActive: formData.get("isActive") === "on",
    },
  });
  await prisma.productOptionGroupTranslation.upsert({
    where: { optionGroupId_locale: { optionGroupId: groupId, locale: "es-MX" } },
    update: { name: text(formData, "nameEs"), description: text(formData, "descriptionEs") || null },
    create: {
      optionGroupId: groupId,
      locale: "es-MX",
      name: text(formData, "nameEs"),
      description: text(formData, "descriptionEs") || null,
    },
  });
  await prisma.productOptionGroupTranslation.upsert({
    where: { optionGroupId_locale: { optionGroupId: groupId, locale: "en-US" } },
    update: { name: text(formData, "nameEn") || text(formData, "nameEs"), description: text(formData, "descriptionEn") || null },
    create: {
      optionGroupId: groupId,
      locale: "en-US",
      name: text(formData, "nameEn") || text(formData, "nameEs"),
      description: text(formData, "descriptionEn") || null,
    },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "OPTION_GROUP_UPDATED",
    resourceType: "ProductOptionGroup",
    resourceId: groupId,
  });
  revalidateProduct(productId);
  return { error: null, success: "Grupo actualizado." };
}

export async function moveOptionGroupAction(formData: FormData): Promise<void> {
  await requireAdmin("/admin/products");
  const groupId = text(formData, "groupId");
  const productId = text(formData, "productId");
  const direction = text(formData, "direction") === "up" ? -1 : 1;
  await swapSort("productOptionGroup", { productId }, groupId, direction);
  revalidateProduct(productId);
}

export async function removeOptionGroupAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/products");
  const groupId = text(formData, "groupId");
  const productId = text(formData, "productId");
  const prisma = getPrisma();
  const used = await prisma.cartItemOption.count({
    where: { option: { optionGroupId: groupId } },
  });

  if (used > 0) {
    await prisma.productOptionGroup.update({
      where: { id: groupId },
      data: { isActive: false },
    });
  } else {
    await prisma.productOptionGroup.delete({ where: { id: groupId } });
  }

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "OPTION_GROUP_UPDATED",
    resourceType: "ProductOptionGroup",
    resourceId: groupId,
    metadata: { deactivated: used > 0 },
  });
  revalidateProduct(productId);
}

export async function createOptionAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const groupId = text(formData, "groupId");
  const productId = text(formData, "productId");
  const nameEs = text(formData, "nameEs");
  if (!groupId || !nameEs || !text(formData, "code")) {
    return { error: "Código y nombre en español son obligatorios.", success: null };
  }

  let priceDeltaMinor = 0;
  try {
    priceDeltaMinor = moneyInputToMinor(text(formData, "priceDelta") || "0") ?? 0;
  } catch {
    return { error: "Ajuste de precio inválido.", success: null };
  }
  if (priceDeltaMinor < 0) {
    return { error: "El ajuste de precio no puede ser negativo.", success: null };
  }

  const prisma = getPrisma();
  const last = await prisma.productOption.aggregate({
    where: { optionGroupId: groupId },
    _max: { sortOrder: true },
  });
  const option = await prisma.productOption.create({
    data: {
      optionGroupId: groupId,
      code: text(formData, "code"),
      priceDeltaMinor,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      translations: {
        create: [
          { locale: "es-MX", name: nameEs, description: text(formData, "descriptionEs") || null },
          {
            locale: "en-US",
            name: text(formData, "nameEn") || nameEs,
            description: text(formData, "descriptionEn") || null,
          },
        ],
      },
    },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "OPTION_CREATED",
    resourceType: "ProductOption",
    resourceId: option.id,
  });
  revalidateProduct(productId);
  return { error: null, success: "Opción creada." };
}

export async function updateOptionAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const optionId = text(formData, "optionId");
  const productId = text(formData, "productId");
  if (!optionId) {
    return { error: "Opción inválida.", success: null };
  }

  let priceDeltaMinor = 0;
  try {
    priceDeltaMinor = moneyInputToMinor(text(formData, "priceDelta") || "0") ?? 0;
  } catch {
    return { error: "Ajuste de precio inválido.", success: null };
  }
  if (priceDeltaMinor < 0) {
    return { error: "El ajuste de precio no puede ser negativo.", success: null };
  }

  const prisma = getPrisma();
  await prisma.productOption.update({
    where: { id: optionId },
    data: {
      code: text(formData, "code"),
      priceDeltaMinor,
      isActive: formData.get("isActive") === "on",
    },
  });
  await prisma.productOptionTranslation.upsert({
    where: { optionId_locale: { optionId, locale: "es-MX" } },
    update: { name: text(formData, "nameEs"), description: text(formData, "descriptionEs") || null },
    create: {
      optionId,
      locale: "es-MX",
      name: text(formData, "nameEs"),
      description: text(formData, "descriptionEs") || null,
    },
  });
  await prisma.productOptionTranslation.upsert({
    where: { optionId_locale: { optionId, locale: "en-US" } },
    update: {
      name: text(formData, "nameEn") || text(formData, "nameEs"),
      description: text(formData, "descriptionEn") || null,
    },
    create: {
      optionId,
      locale: "en-US",
      name: text(formData, "nameEn") || text(formData, "nameEs"),
      description: text(formData, "descriptionEn") || null,
    },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "OPTION_UPDATED",
    resourceType: "ProductOption",
    resourceId: optionId,
  });
  revalidateProduct(productId);
  return { error: null, success: "Opción actualizada." };
}

export async function moveOptionAction(formData: FormData): Promise<void> {
  await requireAdmin("/admin/products");
  const optionId = text(formData, "optionId");
  const groupId = text(formData, "groupId");
  const productId = text(formData, "productId");
  const direction = text(formData, "direction") === "up" ? -1 : 1;
  await swapSort("productOption", { optionGroupId: groupId }, optionId, direction);
  revalidateProduct(productId);
}

export async function removeOptionAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("/admin/products");
  const optionId = text(formData, "optionId");
  const productId = text(formData, "productId");
  const prisma = getPrisma();
  const used = await prisma.cartItemOption.count({ where: { optionId } });

  if (used > 0) {
    await prisma.productOption.update({
      where: { id: optionId },
      data: { isActive: false },
    });
  } else {
    await prisma.productOption.delete({ where: { id: optionId } });
  }

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "OPTION_UPDATED",
    resourceType: "ProductOption",
    resourceId: optionId,
    metadata: { deactivated: used > 0 },
  });
  revalidateProduct(productId);
}

async function swapSort(
  model: "productOptionGroup" | "productOption",
  scope: Record<string, string>,
  id: string,
  direction: number,
) {
  const prisma = getPrisma();
  const rows =
    model === "productOptionGroup"
      ? await prisma.productOptionGroup.findMany({
          where: scope,
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        })
      : await prisma.productOption.findMany({
          where: scope,
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });

  const index = rows.findIndex((row) => row.id === id);
  const swap = rows[index + direction];
  const current = rows[index];
  if (!current || !swap) {
    return;
  }

  if (model === "productOptionGroup") {
    await prisma.$transaction([
      prisma.productOptionGroup.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.productOptionGroup.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
    ]);
    return;
  }

  await prisma.$transaction([
    prisma.productOption.update({ where: { id: current.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.productOption.update({ where: { id: swap.id }, data: { sortOrder: current.sortOrder } }),
  ]);
}
