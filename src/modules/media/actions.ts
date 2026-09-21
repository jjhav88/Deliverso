"use server";

import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { PUBLIC_MEDIA_BUCKET } from "@/modules/media/constants";
import { buildMediaObjectPath } from "@/modules/media/object-path";
import { canDeleteMediaAsset, collectMediaUsage } from "@/modules/media/usage";
import {
  mediaValidationMessage,
  validateMediaFile,
} from "@/modules/media/validation";
import { revalidateAdminMedia } from "@/server/cache/revalidate-storefront";
import { getPrisma } from "@/server/db/prisma";
import {
  removePublicMediaObject,
  uploadPublicMediaObject,
} from "@/server/supabase/storage";
import { randomUUID } from "node:crypto";
import type { MediaActionState } from "@/modules/media/action-state";

export async function uploadMediaAction(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const admin = await requireAdmin("/admin/media");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: mediaValidationMessage("missing"), success: null };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateMediaFile({
    sizeBytes: file.size,
    declaredMime: file.type,
    bytes: buffer,
  });

  if (!validated.ok) {
    return { error: mediaValidationMessage(validated.code), success: null };
  }

  const id = randomUUID();
  const objectPath = buildMediaObjectPath({
    id,
    mimeType: validated.mimeType,
  });
  const altEs = String(formData.get("altEs") ?? "").trim() || null;
  const altEn = String(formData.get("altEn") ?? "").trim() || null;

  const uploaded = await uploadPublicMediaObject({
    bucket: PUBLIC_MEDIA_BUCKET,
    objectPath,
    body: buffer,
    contentType: validated.mimeType,
  });

  if ("error" in uploaded) {
    return { error: "No se pudo subir la imagen.", success: null };
  }

  try {
    await getPrisma().$transaction(async (tx) => {
      await tx.mediaAsset.create({
        data: {
          id,
          kind: "IMAGE",
          bucket: PUBLIC_MEDIA_BUCKET,
          objectPath,
          originalFilename: file.name || null,
          mimeType: validated.mimeType,
          sizeBytes: validated.sizeBytes,
          translations: {
            create: [
              { locale: "es-MX", altText: altEs },
              { locale: "en-US", altText: altEn },
            ],
          },
        },
      });
    });
  } catch {
    await removePublicMediaObject({
      bucket: PUBLIC_MEDIA_BUCKET,
      objectPath,
    });
    return { error: "No se pudo guardar la imagen.", success: null };
  }

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "MEDIA_UPLOADED",
    resourceType: "MediaAsset",
    resourceId: id,
    metadata: { mimeType: validated.mimeType },
  });

  revalidateAdminMedia();
  return { error: null, success: "Imagen subida correctamente." };
}

export async function updateMediaAction(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const admin = await requireAdmin("/admin/media");
  const id = String(formData.get("id") ?? "");
  const altEs = String(formData.get("altEs") ?? "").trim() || null;
  const altEn = String(formData.get("altEn") ?? "").trim() || null;

  if (!id) {
    return { error: "Imagen no válida.", success: null };
  }

  const existing = await getPrisma().mediaAsset.findUnique({ where: { id } });
  if (!existing) {
    return { error: "La imagen no existe.", success: null };
  }

  await getPrisma().$transaction(async (tx) => {
    await tx.mediaAssetTranslation.upsert({
      where: { mediaAssetId_locale: { mediaAssetId: id, locale: "es-MX" } },
      create: { mediaAssetId: id, locale: "es-MX", altText: altEs },
      update: { altText: altEs },
    });
    await tx.mediaAssetTranslation.upsert({
      where: { mediaAssetId_locale: { mediaAssetId: id, locale: "en-US" } },
      create: { mediaAssetId: id, locale: "en-US", altText: altEn },
      update: { altText: altEn },
    });
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "MEDIA_UPDATED",
    resourceType: "MediaAsset",
    resourceId: id,
  });

  revalidateAdminMedia();
  return { error: null, success: "Información actualizada." };
}

export async function deleteMediaAction(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const admin = await requireAdmin("/admin/media");
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Imagen no válida.", success: null };
  }

  const asset = await getPrisma().mediaAsset.findUnique({
    where: { id },
    include: {
      productMedia: { select: { id: true } },
      heroShowcaseItems: {
        select: { id: true, homeHero: { select: { isActive: true } } },
      },
      universes: { select: { id: true } },
    },
  });

  if (!asset) {
    return { error: "La imagen no existe.", success: null };
  }

  const snapshot = {
    productMediaCount: asset.productMedia.length,
    heroShowcaseCount: asset.heroShowcaseItems.length,
    heroActive: asset.heroShowcaseItems.some((item) => item.homeHero.isActive),
    universeCount: asset.universes.length,
  };

  if (!canDeleteMediaAsset(snapshot)) {
    const usage = collectMediaUsage(snapshot)
      .map((item) => item.label)
      .join(", ");
    return {
      error: `Esta imagen está siendo utilizada y no puede eliminarse. En uso: ${usage}.`,
      success: null,
    };
  }

  const removed = await removePublicMediaObject({
    bucket: asset.bucket,
    objectPath: asset.objectPath,
  });

  if ("error" in removed) {
    return { error: "No se pudo eliminar el archivo.", success: null };
  }

  await getPrisma().mediaAsset.delete({ where: { id } });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "MEDIA_DELETED",
    resourceType: "MediaAsset",
    resourceId: id,
    metadata: { mimeType: asset.mimeType },
  });

  revalidateAdminMedia();
  return { error: null, success: "Imagen eliminada." };
}
