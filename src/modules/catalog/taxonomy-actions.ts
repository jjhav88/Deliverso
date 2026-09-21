"use server";

import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import type { CatalogActionState } from "@/modules/catalog/action-state";
import { parseTaxonomyForm } from "@/modules/catalog/form-parse";
import { persistTaxonomyTranslations } from "@/modules/catalog/persist";
import { revalidateAdminCatalog } from "@/modules/catalog/revalidate";
import { uniqueConstraintMessage } from "@/modules/catalog/unique-error";
import {
  businessLineSaveSchema,
  categorySaveSchema,
  universeSaveSchema,
} from "@/modules/catalog/validation";
import { getPrisma } from "@/server/db/prisma";

function firstZodMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Revisa los campos.";
}

export async function saveBusinessLineAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const parsed = businessLineSaveSchema.safeParse(parseTaxonomyForm(formData));
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error), success: null };
  }

  const created = !parsed.data.id;
  try {
    const id = await getPrisma().$transaction(async (tx) => {
      const row = parsed.data.id
        ? await tx.businessLine.update({
            where: { id: parsed.data.id },
            data: {
              isActive: parsed.data.isActive,
              sortOrder: parsed.data.sortOrder,
            },
          })
        : await tx.businessLine.create({
            data: {
              isActive: parsed.data.isActive,
              sortOrder: parsed.data.sortOrder,
            },
          });

      await persistTaxonomyTranslations(
        tx,
        "businessLine",
        row.id,
        parsed.data.es,
        {
          name: parsed.data.en.name,
          slug: parsed.data.en.slug,
          description: parsed.data.en.description,
        },
      );
      return row.id;
    });

    await writeAdminAuditLog({
      actorAdminId: admin.id,
      action: created ? "BUSINESS_LINE_CREATED" : "BUSINESS_LINE_UPDATED",
      resourceType: "BusinessLine",
      resourceId: id,
      metadata: { isActive: parsed.data.isActive },
    });
  } catch (error) {
    return { error: uniqueConstraintMessage(error), success: null };
  }

  revalidateAdminCatalog();
  if (created) {
    redirect("/admin/products/business-lines?ok=created");
  }
  return { error: null, success: "Línea de negocio actualizada." };
}

export async function saveCategoryAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/products");
  const parsed = categorySaveSchema.safeParse(parseTaxonomyForm(formData));
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error), success: null };
  }

  const created = !parsed.data.id;
  try {
    const id = await getPrisma().$transaction(async (tx) => {
      const row = parsed.data.id
        ? await tx.category.update({
            where: { id: parsed.data.id },
            data: {
              businessLineId: parsed.data.businessLineId,
              isActive: parsed.data.isActive,
              sortOrder: parsed.data.sortOrder,
            },
          })
        : await tx.category.create({
            data: {
              businessLineId: parsed.data.businessLineId,
              isActive: parsed.data.isActive,
              sortOrder: parsed.data.sortOrder,
            },
          });

      await persistTaxonomyTranslations(tx, "category", row.id, parsed.data.es, {
        name: parsed.data.en.name,
        slug: parsed.data.en.slug,
        description: parsed.data.en.description,
      });
      return row.id;
    });

    await writeAdminAuditLog({
      actorAdminId: admin.id,
      action: created ? "CATEGORY_CREATED" : "CATEGORY_UPDATED",
      resourceType: "Category",
      resourceId: id,
      metadata: { isActive: parsed.data.isActive },
    });
  } catch (error) {
    return { error: uniqueConstraintMessage(error), success: null };
  }

  revalidateAdminCatalog();
  if (created) {
    redirect("/admin/products/categories?ok=created");
  }
  return { error: null, success: "Categoría actualizada." };
}

export async function saveUniverseAction(
  _prev: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const admin = await requireAdmin("/admin/universes");
  const parsed = universeSaveSchema.safeParse(parseTaxonomyForm(formData));
  if (!parsed.success) {
    return { error: firstZodMessage(parsed.error), success: null };
  }

  const created = !parsed.data.id;
  try {
    const id = await getPrisma().$transaction(async (tx) => {
      const row = parsed.data.id
        ? await tx.universe.update({
            where: { id: parsed.data.id },
            data: {
              isActive: parsed.data.isActive,
              sortOrder: parsed.data.sortOrder,
              featuredMediaAssetId: parsed.data.featuredMediaAssetId,
            },
          })
        : await tx.universe.create({
            data: {
              isActive: parsed.data.isActive,
              sortOrder: parsed.data.sortOrder,
              featuredMediaAssetId: parsed.data.featuredMediaAssetId,
            },
          });

      await persistTaxonomyTranslations(tx, "universe", row.id, parsed.data.es, {
        name: parsed.data.en.name,
        slug: parsed.data.en.slug,
        description: parsed.data.en.description,
      });
      return row.id;
    });

    await writeAdminAuditLog({
      actorAdminId: admin.id,
      action: created ? "UNIVERSE_CREATED" : "UNIVERSE_UPDATED",
      resourceType: "Universe",
      resourceId: id,
      metadata: { isActive: parsed.data.isActive },
    });
  } catch (error) {
    return { error: uniqueConstraintMessage(error), success: null };
  }

  revalidateAdminCatalog();
  if (created) {
    redirect("/admin/universes?ok=created");
  }
  return { error: null, success: "Universo actualizado." };
}
