/**
 * Temporary public contact and social placeholders.
 * Replace with Admin/CMS storefront settings when persistable.
 *
 * Do not scatter these values across components.
 */

export const storefrontSocialIds = [
  "facebook",
  "instagram",
  "tiktok",
] as const;

export type StorefrontSocialId = (typeof storefrontSocialIds)[number];

export type StorefrontSocialProfile = {
  id: StorefrontSocialId;
  href?: string;
};

export const storefrontSocial: readonly StorefrontSocialProfile[] = [
  { id: "facebook" },
  { id: "instagram" },
  { id: "tiktok" },
];

/**
 * Placeholder profiles stay visible until Admin assigns real URLs.
 * After at least one href exists, only linked networks render.
 */
export function getVisibleStorefrontSocial(
  profiles: readonly StorefrontSocialProfile[] = storefrontSocial,
): StorefrontSocialProfile[] {
  const linked = profiles.filter((profile) => Boolean(profile.href));
  return linked.length > 0 ? linked : [...profiles];
}

export const storefrontContact = {
  email: "contacto@deliverso.com",
  whatsappDisplay: "+52 55 0000 0000",
  whatsappHref: undefined as string | undefined,
  address: "Ciudad de México, México",
} as const;
