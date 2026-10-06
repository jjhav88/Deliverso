"use server";

import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import type { CatalogActionState } from "@/modules/catalog/action-state";
import { nextStatusAfterArchive, nextStatusAfterReactivate } from "@/modules/catalog/archive";
import { parseProductForm } from "@/modules/catalog/form-parse";
import { persistProductRecord, resolvePriceMinor } from "@/modules/catalog/persist";
import { getPublishBlockers } from "@/modules/catalog/publish";
import { revalidateAdminCatalog } from "@/modules/catalog/revalidate";
import {
  applyLockedProductSlugs,
  isProductPublicSlugLocked,
  publishedSlugMutationError,
} from "@/modules/catalog/slug-guard";
import { uniqueConstraintMessage } from "@/modules/catalog/unique-error";
import { productSaveSchema } from "@/modules/catalog/validation";
import { getPrisma } from "@/server/db/prisma";

function firstZodMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Revisa los campos del producto.";
}

async function saveProduct(formData: FormData, mode: "save" | "publish") {
  const admin = await requireAdmin("/admin/products");
  const parsed = productSaveSchema.safeParse(parseProductForm(formData));

  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error), success: null };
  }

  let priceMinor: number | null;
  try {
    priceMinor = resolvePriceMinor(parsed.data);
  } catch {
    return { error: "Precio inválido.", success: null };
  }

  const existing = parsed.data.id
    ? await getPrisma().product.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          status: true,
          publishedAt: true,
          translations: { select: { locale: true, slug: true } },
        },
      })
    : null;

  if (parsed.data.id && !existing) {
    return { error: "El producto no existe.", success: null };
  }

  const storedEsSlug =
    existing?.translations.find((item) => item.locale === "es-MX")?.slug ?? null;
  const storedEnSlug =
    existing?.translations.find((item) => item.locale === "en-US")?.slug ?? null;
  const slugLocked = existing
    ? isProductPublicSlugLocked({
        status: existing.status,
        publishedAt: existing.publishedAt,
      })
    : false;

  let persistInput = parsed.data;
  if (slugLocked) {
    const mutationError = publishedSlugMutationError({
      submittedEsSlug: parsed.data.es.slug,
      submittedEnSlug: parsed.data.en.slug,
      storedEsSlug,
      storedEnSlug,
    });
    if (mutationError) {
      return { error: mutationError, success: null };
    }
    persistInput = applyLockedProductSlugs(parsed.data, {
      es: storedEsSlug,
      en: storedEnSlug,
    });
  }

  let nextStatus = existing?.status ?? "DRAFT";
  if (mode === "publish") {
    const blockers = getPublishBlockers({
      type: persistInput.type,
      businessLineId: persistInput.businessLineId,
      nameEs: persistInput.es.name,
      slugEs: persistInput.es.slug,
      primaryMediaAssetId: persistInput.primaryMediaAssetId,
      priceMinor,
    });
    if (blockers.length > 0) {
      return { error: blockers[0] ?? "No se puede publicar.", success: null };
    }
    nextStatus = "PUBLISHED";
  } else if (nextStatus === "ARCHIVED") {
    nextStatus = "ARCHIVED";
  }

  let productId = parsed.data.id;
  try {
    productId = await getPrisma().$transaction(async (tx) => {
      const id = await persistProductRecord(
        tx,
        persistInput,
        nextStatus,
        parsed.data.id,
        slugLocked
          ? {
              lockedPublicSlugs: {
                es: storedEsSlug ?? persistInput.es.slug,
                en: storedEnSlug,
              },
            }
          : undefined,
      );

      if (mode === "publish") {
        await tx.product.update({
          where: { id },
          data: {
            status: "PUBLISHED",
            publishedAt: existing?.publishedAt ?? new Date(),
            archivedAt: null,
          },
        });
      }

      return id;
    });
  } catch (error) {
    return { error: uniqueConstraintMessage(error), success: null };
  }

  const created = !existing;
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: created
      ? "PRODUCT_CREATED"
      : mode === "publish"
        ? "PRODUCT_PUBLISHED"
        : "PRODUCT_UPDATED",
    resourceType: "Product",
    resourceId: productId,
    metadata: {
      status: nextStatus,
      type: persistInput.type,
    },
  });

  revalidateAdminCatalog();

  if (created || mode === "publish") {
    const ok = mode === "publish" ? "published" : "created";
    redirect(`/admin/products?ok=${ok}`);
  }

  return {
    error: null,
    success: "Producto actualizado.",
  };
}

export async function saveProductAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return saveProduct(formData, "save");
}

export async function publishProductAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return saveProduct(formData, "publish");
}

export async function archiveProductAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Producto no válido.", success: null };
  }

  const existing = await getPrisma().product.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return { error: "El producto no existe.", success: null };
  }

  await getPrisma().product.update({
    where: { id },
    data: {
      status: nextStatusAfterArchive(),
      archivedAt: new Date(),
    },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "PRODUCT_ARCHIVED",
    resourceType: "Product",
    resourceId: id,
    metadata: { status: "ARCHIVED" },
  });

  revalidateAdminCatalog();
  return { error: null, success: "Producto archivado." };
}

export async function reactivateProductAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Producto no válido.", success: null };
  }

  await getPrisma().product.update({
    where: { id },
    data: {
      status: nextStatusAfterReactivate(),
      archivedAt: null,
    },
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "PRODUCT_UPDATED",
    resourceType: "Product",
    resourceId: id,
    metadata: { status: "DRAFT" },
  });

  revalidateAdminCatalog();
  return { error: null, success: "Producto vuelto a borrador." };
}

export async function deleteProductAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Producto no válido.", success: null };
  }

  const existing = await getPrisma().product.findUnique({
    where: { id },
    select: { id: true, status: true, type: true },
  });

  if (!existing) {
    return { error: "El producto no existe.", success: null };
  }

  try {
    await getPrisma().$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
    });
  } catch {
    return {
      error: "No se pudo eliminar el producto. Revisa si sigue en uso.",
      success: null,
    };
  }

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "PRODUCT_DELETED",
    resourceType: "Product",
    resourceId: id,
    metadata: { status: existing.status, type: existing.type },
  });

  revalidateAdminCatalog();
  redirect("/admin/products?ok=deleted");
}
