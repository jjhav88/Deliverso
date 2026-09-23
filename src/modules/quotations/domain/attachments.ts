export const QUOTE_ATTACHMENT_BUCKET = "deliverso-quote-attachments";
export const MAX_QUOTE_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_QUOTE_ATTACHMENTS = 5;
export const QUOTE_ATTACHMENT_SIGNED_SECONDS = 120;
export const ALLOWED_QUOTE_ATTACHMENT_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedQuoteAttachmentMime = (typeof ALLOWED_QUOTE_ATTACHMENT_MIMES)[number];

const MAGIC: Array<{ mime: AllowedQuoteAttachmentMime; test: (bytes: Uint8Array) => boolean }> = [
  {
    mime: "image/jpeg",
    test: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    mime: "image/png",
    test: (bytes) =>
      bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
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

export function detectQuoteAttachmentMime(bytes: Uint8Array): AllowedQuoteAttachmentMime | null {
  return MAGIC.find((entry) => entry.test(bytes))?.mime ?? null;
}

export function extensionForQuoteMime(mime: AllowedQuoteAttachmentMime): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function buildQuoteAttachmentPath(input: {
  customerId: string;
  quotationId: string;
  fileId: string;
  mime: AllowedQuoteAttachmentMime;
}): string {
  return `customers/${input.customerId}/${input.quotationId}/${input.fileId}.${extensionForQuoteMime(input.mime)}`;
}

export function isOwnedQuoteAttachmentPath(input: {
  customerId: string;
  quotationId: string;
  storagePath: string;
}): boolean {
  return input.storagePath.startsWith(`customers/${input.customerId}/${input.quotationId}/`);
}

export function validateQuoteAttachment(input: {
  sizeBytes: number;
  declaredMime?: string | null;
  bytes: Uint8Array;
  currentCount: number;
}): { ok: true; mime: AllowedQuoteAttachmentMime } | { ok: false; reason: "too_large" | "mime" | "too_many" | "empty" } {
  if (input.currentCount >= MAX_QUOTE_ATTACHMENTS) {
    return { ok: false, reason: "too_many" };
  }
  if (input.sizeBytes <= 0 || input.bytes.length === 0) {
    return { ok: false, reason: "empty" };
  }
  if (input.sizeBytes > MAX_QUOTE_ATTACHMENT_BYTES) {
    return { ok: false, reason: "too_large" };
  }
  const mime = detectQuoteAttachmentMime(input.bytes);
  if (!mime) {
    return { ok: false, reason: "mime" };
  }
  if (input.declaredMime && input.declaredMime !== mime && input.declaredMime !== "image/jpg") {
    return { ok: false, reason: "mime" };
  }
  return { ok: true, mime };
}
