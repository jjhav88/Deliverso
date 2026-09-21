import "server-only";
import { canDeleteMediaAsset, collectMediaUsage } from "@/modules/media/usage";
import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";

export type AdminMediaItem = {
  id: string;
  publicUrl: string;
  originalFilename: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: Date;
  altEs: string;
  altEn: string;
  inUse: boolean;
  usageLabel: string | null;
};

export async function listAdminMedia(): Promise<AdminMediaItem[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  const assets = await getPrisma().mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      translations: true,
      productMedia: { select: { id: true } },
      heroShowcaseItems: {
        select: { id: true, homeHero: { select: { isActive: true } } },
      },
      universes: { select: { id: true } },
    },
  });

  return assets.map((asset) => {
    const usage = collectMediaUsage({
      productMediaCount: asset.productMedia.length,
      heroShowcaseCount: asset.heroShowcaseItems.length,
      heroActive: asset.heroShowcaseItems.some((item) => item.homeHero.isActive),
      universeCount: asset.universes.length,
    });
    const deletable = canDeleteMediaAsset({
      productMediaCount: asset.productMedia.length,
      heroShowcaseCount: asset.heroShowcaseItems.length,
      heroActive: false,
      universeCount: asset.universes.length,
    });

    return {
      id: asset.id,
      publicUrl: mediaAssetPublicUrl(asset),
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
      sizeBytes: asset.sizeBytes,
      createdAt: asset.createdAt,
      altEs: asset.translations.find((item) => item.locale === "es-MX")?.altText ?? "",
      altEn: asset.translations.find((item) => item.locale === "en-US")?.altText ?? "",
      inUse: !deletable,
        usageLabel: usage.map((item) => item.label).join(" · ") || null,
    };
  });
}

export async function countAdminMedia(): Promise<number> {
  if (!hasRuntimeDatabaseUrl()) {
    return 0;
  }

  return getPrisma().mediaAsset.count();
}
