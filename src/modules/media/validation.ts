import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_BYTES,
  type AllowedMediaMimeType,
} from "@/modules/media/constants";

const MAGIC_SIGNATURES: Array<{
  mime: AllowedMediaMimeType;
  test: (bytes: Uint8Array) => boolean;
}> = [
  {
    mime: "image/jpeg",
    test: (bytes) =>
      bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
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
  {
    mime: "image/avif",
    test: (bytes) => {
      if (bytes.length < 12) return false;
      const brand = String.fromCharCode(...bytes.slice(4, 8));
      if (brand !== "ftyp") return false;
      const rest = String.fromCharCode(...bytes.slice(8, Math.min(bytes.length, 24)));
      return rest.includes("avif") || rest.includes("avis");
    },
  },
];

export type MediaValidationErrorCode =
  | "missing"
  | "empty"
  | "too_large"
  | "mime"
  | "signature";

export type MediaValidationResult =
  | {
      ok: true;
      mimeType: AllowedMediaMimeType;
      sizeBytes: number;
    }
  | {
      ok: false;
      code: MediaValidationErrorCode;
    };

export function isAllowedMediaMimeType(value: string): value is AllowedMediaMimeType {
  return (ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(value);
}

export function detectMediaMimeType(bytes: Uint8Array): AllowedMediaMimeType | null {
  return MAGIC_SIGNATURES.find((entry) => entry.test(bytes))?.mime ?? null;
}

export function validateMediaFile(input: {
  sizeBytes: number;
  declaredMime?: string | null;
  bytes: Uint8Array;
}): MediaValidationResult {
  if (input.sizeBytes <= 0 || input.bytes.length === 0) {
    return { ok: false, code: "empty" };
  }

  if (input.sizeBytes > MAX_MEDIA_BYTES) {
    return { ok: false, code: "too_large" };
  }

  const detected = detectMediaMimeType(input.bytes);
  if (!detected) {
    return { ok: false, code: "signature" };
  }

  if (input.declaredMime && input.declaredMime !== detected) {
    if (
      !(detected === "image/jpeg" && input.declaredMime === "image/jpg") &&
      input.declaredMime !== detected
    ) {
      return { ok: false, code: "mime" };
    }
  }

  return {
    ok: true,
    mimeType: detected,
    sizeBytes: input.sizeBytes,
  };
}

export function mediaValidationMessage(code: MediaValidationErrorCode): string {
  switch (code) {
    case "missing":
      return "Selecciona una imagen.";
    case "empty":
      return "El archivo está vacío.";
    case "too_large":
      return "La imagen no puede superar 10 MB.";
    case "mime":
    case "signature":
      return "Solo se aceptan JPEG, PNG, WebP o AVIF.";
    default:
      return "El archivo no es válido.";
  }
}
