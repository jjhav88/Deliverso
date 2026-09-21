import { MEDIA_OBJECT_PREFIX } from "@/modules/media/constants";
import type { AllowedMediaMimeType } from "@/modules/media/constants";

const EXTENSION_BY_MIME: Record<AllowedMediaMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildMediaObjectPath(input: {
  now?: Date;
  id: string;
  mimeType: AllowedMediaMimeType;
}): string {
  if (!UUID_PATTERN.test(input.id)) {
    throw new Error("Media object id must be a UUID.");
  }

  const now = input.now ?? new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = EXTENSION_BY_MIME[input.mimeType];

  return `${MEDIA_OBJECT_PREFIX}/${year}/${month}/${input.id}.${extension}`;
}

export function isSafeMediaObjectPath(objectPath: string): boolean {
  if (!objectPath || objectPath.includes("..") || objectPath.includes("\\")) {
    return false;
  }

  return new RegExp(
    `^${MEDIA_OBJECT_PREFIX}/\\d{4}/\\d{2}/${UUID_PATTERN.source.slice(1, -1)}\\.(jpg|png|webp|avif)$`,
    "i",
  ).test(objectPath);
}
