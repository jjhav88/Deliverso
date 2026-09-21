import "server-only";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_BUCKET,
  AVATAR_SIGNED_URL_SECONDS,
  MAX_AVATAR_BYTES,
} from "@/modules/avatars/domain/constants";
import { buildAvatarObjectPath } from "@/modules/avatars/domain/paths";
import { validateAvatarFile } from "@/modules/avatars/domain/validation";
import { avatarValidationMessage } from "@/modules/avatars/messages";
import { isOwnedAvatarPath } from "@/modules/account/domain/presentation";
import {
  createSignedObjectUrl,
  createStorageBucket,
  listStorageBuckets,
  listStorageObjects,
  removeStorageObject,
  uploadPrivateObject,
} from "@/server/supabase/storage";

type AvatarOwnerKind = "customers" | "admins";

export type AvatarMutationResult =
  | { ok: true; objectPath: string | null }
  | { ok: false; error: string };

async function ensureAvatarBucket(): Promise<{ ok: true } | { ok: false; error: string }> {
  const listed = await listStorageBuckets();
  if ("error" in listed) {
    return { ok: false, error: "No se pudo acceder al almacenamiento de fotos." };
  }
  if (listed.some((bucket) => bucket.name === AVATAR_BUCKET)) {
    return { ok: true };
  }
  const created = await createStorageBucket({
    name: AVATAR_BUCKET,
    fileSizeLimit: MAX_AVATAR_BYTES,
    allowedMimeTypes: [...ALLOWED_AVATAR_MIME_TYPES],
    isPublic: false,
  });
  if ("error" in created) {
    return { ok: false, error: "No se pudo preparar el almacenamiento de fotos." };
  }
  return { ok: true };
}

function ownerPrefix(kind: AvatarOwnerKind, ownerId: string): string {
  return `${kind}/${ownerId}/`;
}

async function removeOwnedObjects(input: {
  kind: AvatarOwnerKind;
  ownerId: string;
  keepPath?: string | null;
}): Promise<void> {
  const prefix = ownerPrefix(input.kind, input.ownerId);
  const listed = await listStorageObjects({ bucket: AVATAR_BUCKET, prefix });
  if ("error" in listed) {
    if (input.keepPath) {
      return;
    }
    const previous = input.keepPath;
    void previous;
    return;
  }

  const keepName = input.keepPath?.slice(prefix.length) ?? null;
  await Promise.all(
    listed.names
      .filter((name) => name && name !== keepName)
      .map((name) =>
        removeStorageObject({
          bucket: AVATAR_BUCKET,
          objectPath: `${prefix}${name}`,
        }),
      ),
  );
}

export async function signAvatarUrl(objectPath: string | null | undefined): Promise<string | null> {
  if (!objectPath) {
    return null;
  }
  try {
    const signed = await createSignedObjectUrl({
      bucket: AVATAR_BUCKET,
      objectPath,
      expiresIn: AVATAR_SIGNED_URL_SECONDS,
    });
    if ("error" in signed) {
      return null;
    }
    return signed.url;
  } catch {
    return null;
  }
}

export async function replaceOwnedAvatar(input: {
  kind: AvatarOwnerKind;
  ownerId: string;
  file: File;
}): Promise<AvatarMutationResult> {
  let bucketReady: { ok: true } | { ok: false; error: string };
  try {
    bucketReady = await ensureAvatarBucket();
  } catch {
    return { ok: false, error: "No se pudo acceder al almacenamiento de fotos." };
  }
  if (!bucketReady.ok) {
    return bucketReady;
  }

  const bytes = Buffer.from(await input.file.arrayBuffer());
  const validated = validateAvatarFile({
    sizeBytes: input.file.size,
    declaredMime: input.file.type,
    bytes,
  });
  if (!validated.ok) {
    return { ok: false, error: avatarValidationMessage(validated.code) };
  }

  const objectPath = buildAvatarObjectPath({
    kind: input.kind,
    ownerId: input.ownerId,
    mimeType: validated.mimeType,
  });
  if (!isOwnedAvatarPath({ kind: input.kind, ownerId: input.ownerId, objectPath })) {
    return { ok: false, error: "Ruta de foto inválida." };
  }

  try {
    const uploaded = await uploadPrivateObject({
      bucket: AVATAR_BUCKET,
      objectPath,
      body: bytes,
      contentType: validated.mimeType,
    });
    if ("error" in uploaded) {
      return { ok: false, error: "No se pudo guardar la foto." };
    }

    await removeOwnedObjects({
      kind: input.kind,
      ownerId: input.ownerId,
      keepPath: objectPath,
    });
  } catch {
    return { ok: false, error: "No se pudo guardar la foto." };
  }

  return { ok: true, objectPath };
}

export async function removeOwnedAvatar(input: {
  kind: AvatarOwnerKind;
  ownerId: string;
}): Promise<AvatarMutationResult> {
  try {
    await removeOwnedObjects({
      kind: input.kind,
      ownerId: input.ownerId,
    });
  } catch {
    return { ok: false, error: "No se pudo eliminar la foto." };
  }
  return { ok: true, objectPath: null };
}
