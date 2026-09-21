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

export async function createStorageBucket(input: {
  name: string;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
  isPublic: boolean;
}): Promise<{ error: StorageError } | { ok: true }> {
  const response = await storageFetch("/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.name,
      name: input.name,
      public: input.isPublic,
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

export async function createPublicMediaBucket(input: {
  name: string;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}): Promise<{ error: StorageError } | { ok: true }> {
  return createStorageBucket({ ...input, isPublic: true });
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

export async function uploadPrivateObject(input: {
  bucket: string;
  objectPath: string;
  body: Buffer;
  contentType: string;
}): Promise<{ error: StorageError } | { ok: true }> {
  const response = await storageFetch(`/object/${input.bucket}/${input.objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": input.contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(input.body),
  });

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

export async function removeStorageObject(input: {
  bucket: string;
  objectPath: string;
}): Promise<{ error: StorageError } | { ok: true }> {
  return removePublicMediaObject(input);
}

export async function listStorageObjects(input: {
  bucket: string;
  prefix: string;
}): Promise<{ names: string[] } | { error: StorageError }> {
  const response = await storageFetch(`/object/list/${input.bucket}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prefix: input.prefix,
      limit: 100,
    }),
  });

  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: (await response.text()) || "No se pudieron listar objetos.",
      },
    };
  }

  const rows = (await response.json()) as Array<{ name?: string }>;
  return {
    names: rows
      .map((row) => row.name)
      .filter((name): name is string => Boolean(name)),
  };
}

export async function createSignedObjectUrl(input: {
  bucket: string;
  objectPath: string;
  expiresIn: number;
}): Promise<{ url: string } | { error: StorageError }> {
  const response = await storageFetch(`/object/sign/${input.bucket}/${input.objectPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: input.expiresIn }),
  });

  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: (await response.text()) || "No se pudo firmar el archivo.",
      },
    };
  }

  const payload = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signed = payload.signedURL ?? payload.signedUrl;
  if (!signed) {
    return { error: { status: 500, message: "Signed URL vacía." } };
  }

  const url = signed.startsWith("http")
    ? signed
    : `${getSupabaseUrl().replace(/\/+$/, "")}/storage/v1${signed.startsWith("/") ? signed : `/${signed}`}`;
  return { url };
}
