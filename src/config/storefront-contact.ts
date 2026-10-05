/**
 * Social profile ids used by the storefront footer.
 * Public URLs come from Admin Settings, never from placeholders.
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

/** Only profiles with a real URL are public. */
export function getVisibleStorefrontSocial(
  profiles: readonly StorefrontSocialProfile[] = storefrontSocial,
): StorefrontSocialProfile[] {
  return profiles.filter((profile) => Boolean(profile.href));
}
