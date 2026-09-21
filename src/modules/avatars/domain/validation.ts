import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_BYTES,
  type AllowedAvatarMimeType,
} from "@/modules/avatars/domain/constants";

const MAGIC: Array<{ mime: AllowedAvatarMimeType; test: (bytes: Uint8Array) => boolean }> = [
  {
    mime: "image/jpeg",
    test: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    mime: "image/png",
    test: (bytes) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47,
  },
  {
    mime: "image/webp",
    test: (bytes) =>
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
];

export type AvatarValidationError = "missing" | "empty" | "too_large" | "mime";

export type AvatarValidationResult =
  | { ok: true; mimeType: AllowedAvatarMimeType; sizeBytes: number }
  | { ok: false; code: AvatarValidationError };

export function detectAvatarMimeType(bytes: Uint8Array): AllowedAvatarMimeType | null {
  return MAGIC.find((entry) => entry.test(bytes))?.mime ?? null;
}

export function validateAvatarFile(input: {
  sizeBytes: number;
  declaredMime?: string | null;
  bytes: Uint8Array;
}): AvatarValidationResult {
  if (input.sizeBytes <= 0 || input.bytes.length === 0) {
    return { ok: false, code: input.sizeBytes === 0 ? "empty" : "missing" };
  }
  if (input.sizeBytes > MAX_AVATAR_BYTES) {
    return { ok: false, code: "too_large" };
  }
  const detected = detectAvatarMimeType(input.bytes);
  if (!detected) {
    return { ok: false, code: "mime" };
  }
  if (input.declaredMime && input.declaredMime !== detected) {
    const declaredAllowed = (ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(
      input.declaredMime,
    );
    if (!declaredAllowed || input.declaredMime !== detected) {
      return { ok: false, code: "mime" };
    }
  }
  return { ok: true, mimeType: detected, sizeBytes: input.sizeBytes };
}
