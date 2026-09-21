export const AVATAR_BUCKET = "deliverso-avatars";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];

export const AVATAR_SIGNED_URL_SECONDS = 60 * 60;

export const AVATAR_EXTENSIONS: Record<AllowedAvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
