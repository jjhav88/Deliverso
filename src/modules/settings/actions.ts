"use server";

import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { SITE_SETTINGS_ID } from "@/modules/content/singletons";
import { siteSettingsSaveSchema } from "@/modules/settings/validation";
import { normalizeWhatsappNumber } from "@/modules/settings/whatsapp";
import { revalidateAdminSettings } from "@/server/cache/revalidate-storefront";
import { getPrisma } from "@/server/db/prisma";
import type { SocialPlatform } from "@/generated/prisma/enums";

export type SettingsSaveState = {
  error: string | null;
  success: string | null;
};

function booleanFromForm(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

export async function saveSiteSettingsAction(
  _prev: SettingsSaveState,
  formData: FormData,
): Promise<SettingsSaveState> {
  const admin = await requireAdmin("/admin/settings");
  const parsed = siteSettingsSaveSchema.safeParse({
    contactEmail: formData.get("contactEmail"),
    whatsapp: formData.get("whatsapp"),
    physicalAddress: formData.get("physicalAddress"),
    facebookUrl: formData.get("facebookUrl"),
    facebookActive: booleanFromForm(formData.get("facebookActive")),
    instagramUrl: formData.get("instagramUrl"),
    instagramActive: booleanFromForm(formData.get("instagramActive")),
    tiktokUrl: formData.get("tiktokUrl"),
    tiktokActive: booleanFromForm(formData.get("tiktokActive")),
  });

  if (!parsed.success) {
    return { error: "Revisa el correo, WhatsApp o las URLs sociales.", success: null };
  }

  const whatsapp = parsed.data.whatsapp
    ? normalizeWhatsappNumber(parsed.data.whatsapp)
    : null;

  const socials: Array<{
    platform: SocialPlatform;
    url: string;
    isActive: boolean;
    sortOrder: number;
  }> = [
    {
      platform: "FACEBOOK",
      url: parsed.data.facebookUrl ?? "",
      isActive: parsed.data.facebookActive && Boolean(parsed.data.facebookUrl),
      sortOrder: 0,
    },
    {
      platform: "INSTAGRAM",
      url: parsed.data.instagramUrl ?? "",
      isActive: parsed.data.instagramActive && Boolean(parsed.data.instagramUrl),
      sortOrder: 1,
    },
    {
      platform: "TIKTOK",
      url: parsed.data.tiktokUrl ?? "",
      isActive: parsed.data.tiktokActive && Boolean(parsed.data.tiktokUrl),
      sortOrder: 2,
    },
  ];

  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        contactEmail: parsed.data.contactEmail ?? null,
        whatsapp,
        physicalAddress: parsed.data.physicalAddress ?? null,
      },
      update: {
        contactEmail: parsed.data.contactEmail ?? null,
        whatsapp,
        physicalAddress: parsed.data.physicalAddress ?? null,
      },
    });

    for (const social of socials) {
      if (!social.url) {
        await tx.socialLink.deleteMany({ where: { platform: social.platform } });
        continue;
      }

      await tx.socialLink.upsert({
        where: { platform: social.platform },
        create: social,
        update: {
          url: social.url,
          isActive: social.isActive,
          sortOrder: social.sortOrder,
        },
      });
    }
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "SITE_SETTINGS_UPDATED",
    resourceType: "SiteSettings",
    resourceId: SITE_SETTINGS_ID,
  });

  revalidateAdminSettings();
  return { error: null, success: "Configuración guardada." };
}
