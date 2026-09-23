import "server-only";
import { randomUUID } from "node:crypto";
import {
  ALLOWED_QUOTE_ATTACHMENT_MIMES,
  MAX_QUOTE_ATTACHMENT_BYTES,
  QUOTE_ATTACHMENT_BUCKET,
  QUOTE_ATTACHMENT_SIGNED_SECONDS,
  buildQuoteAttachmentPath,
  isOwnedQuoteAttachmentPath,
  validateQuoteAttachment,
} from "@/modules/quotations/domain/attachments";
import {
  createSignedObjectUrl,
  createStorageBucket,
  listStorageBuckets,
  uploadPrivateObject,
} from "@/server/supabase/storage";

async function ensureQuoteBucket() {
  const listed = await listStorageBuckets();
  if ("error" in listed) {
    return { ok: false as const };
  }
  if (listed.some((bucket) => bucket.name === QUOTE_ATTACHMENT_BUCKET)) {
    return { ok: true as const };
  }
  const created = await createStorageBucket({
    name: QUOTE_ATTACHMENT_BUCKET,
    fileSizeLimit: MAX_QUOTE_ATTACHMENT_BYTES,
    allowedMimeTypes: [...ALLOWED_QUOTE_ATTACHMENT_MIMES],
    isPublic: false,
  });
  return "error" in created ? { ok: false as const } : { ok: true as const };
}

export async function uploadQuoteAttachment(input: {
  customerId: string;
  quotationId: string;
  file: File;
  currentCount: number;
}) {
  const ready = await ensureQuoteBucket();
  if (!ready.ok) {
    return { ok: false as const, reason: "storage" as const };
  }
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const validated = validateQuoteAttachment({
    sizeBytes: input.file.size,
    declaredMime: input.file.type,
    bytes,
    currentCount: input.currentCount,
  });
  if (!validated.ok) {
    return { ok: false as const, reason: validated.reason };
  }
  const storagePath = buildQuoteAttachmentPath({
    customerId: input.customerId,
    quotationId: input.quotationId,
    fileId: randomUUID(),
    mime: validated.mime,
  });
  if (!isOwnedQuoteAttachmentPath({ customerId: input.customerId, quotationId: input.quotationId, storagePath })) {
    return { ok: false as const, reason: "mime" as const };
  }
  const uploaded = await uploadPrivateObject({
    bucket: QUOTE_ATTACHMENT_BUCKET,
    objectPath: storagePath,
    body: bytes,
    contentType: validated.mime,
  });
  if ("error" in uploaded) {
    return { ok: false as const, reason: "storage" as const };
  }
  return {
    ok: true as const,
    storagePath,
    mimeType: validated.mime,
    sizeBytes: input.file.size,
    fileName: input.file.name.slice(0, 180),
  };
}

export async function signQuoteAttachmentUrl(storagePath: string): Promise<string | null> {
  const signed = await createSignedObjectUrl({
    bucket: QUOTE_ATTACHMENT_BUCKET,
    objectPath: storagePath,
    expiresIn: QUOTE_ATTACHMENT_SIGNED_SECONDS,
  });
  return "error" in signed ? null : signed.url;
}
