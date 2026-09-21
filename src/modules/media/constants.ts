export const PUBLIC_MEDIA_BUCKET = "deliverso-public-media";

export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

export const MEDIA_OBJECT_PREFIX = "media";
