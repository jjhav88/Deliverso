import "server-only";
import type { SocialPlatform } from "@/generated/prisma/enums";
import { SITE_SETTINGS_ID } from "@/modules/content/singletons";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { whatsappHref } from "@/modules/settings/whatsapp";

export type PublicSocialLink = {
  platform: SocialPlatform;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

export type PublicSiteSettings = {
  configured: boolean;
  contactEmail: string | null;
  whatsapp: string | null;
  whatsappHref: string | null;
  physicalAddress: string | null;
  social: PublicSocialLink[];
};

export async function getPublicSiteSettings(): Promise<PublicSiteSettings | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const prisma = getPrisma();
  const settings = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });

  if (!settings) {
    return null;
  }

  const social = await prisma.socialLink.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return {
    configured: true,
    contactEmail: settings.contactEmail,
    whatsapp: settings.whatsapp,
    whatsappHref: settings.whatsapp ? whatsappHref(settings.whatsapp) : null,
    physicalAddress: settings.physicalAddress,
    social,
  };
}

export async function getSettingsAdminState(): Promise<PublicSiteSettings> {
  const settings = await getPublicSiteSettings();
  if (settings) {
    return settings;
  }

  return {
    configured: false,
    contactEmail: null,
    whatsapp: null,
    whatsappHref: null,
    physicalAddress: null,
    social: [],
  };
}
