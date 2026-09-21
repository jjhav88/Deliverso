import "server-only";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/server/supabase/env";

type StorageError = {
  status: number;
  message: string;
};

async function storageFetch(path: string, init: RequestInit = {}) {
  const url = `${getSupabaseUrl().replace(/\/+$/, "")}/storage/v1${path}`;
  const key = getSupabaseServiceRoleKey();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("apikey", key);

  const response = await fetch(url, { ...init, headers });
  return response;
}

export async function listStorageBuckets(): Promise<
  { name: string }[] | { error: StorageError }
> {
  const response = await storageFetch("/bucket");
  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: (await response.text()) || "No se pudieron listar buckets.",
      },
    };
  }

  return (await response.json()) as { name: string }[];
}

export async function createPublicMediaBucket(input: {
  name: string;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}): Promise<{ error: StorageError } | { ok: true }> {
  const response = await storageFetch("/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.name,
      name: input.name,
      public: true,
      file_size_limit: input.fileSizeLimit,
      allowed_mime_types: input.allowedMimeTypes,
    }),
  });

  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: (await response.text()) || "No se pudo crear el bucket.",
      },
    };
  }

  return { ok: true };
}

export async function uploadPublicMediaObject(input: {
  bucket: string;
  objectPath: string;
  body: Buffer;
  contentType: string;
}): Promise<{ error: StorageError } | { ok: true }> {
  const response = await storageFetch(
    `/object/${input.bucket}/${input.objectPath}`,
    {
      method: "POST",
      headers: {
        "Content-Type": input.contentType,
        "x-upsert": "false",
      },
      body: new Uint8Array(input.body),
    },
  );

  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: (await response.text()) || "No se pudo subir el archivo.",
      },
    };
  }

  return { ok: true };
}

export async function removePublicMediaObject(input: {
  bucket: string;
  objectPath: string;
}): Promise<{ error: StorageError } | { ok: true }> {
  const response = await storageFetch(`/object/${input.bucket}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [input.objectPath] }),
  });

  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: (await response.text()) || "No se pudo eliminar el archivo.",
      },
    };
  }

  return { ok: true };
}
