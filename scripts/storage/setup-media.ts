import { config as loadEnv } from "dotenv";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_BYTES,
  PUBLIC_MEDIA_BUCKET,
} from "../../src/modules/media/constants";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_BUCKET,
  MAX_AVATAR_BYTES,
} from "../../src/modules/avatars/domain/constants";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function redact(message: string): string {
  return message.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://[redacted]");
}

async function storageFetch(
  url: string,
  key: string,
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("apikey", key);
  return fetch(`${url.replace(/\/+$/, "")}/storage/v1${path}`, {
    ...init,
    headers,
  });
}

async function ensureBucket(
  url: string,
  secret: string,
  buckets: { name: string }[],
  input: {
    name: string;
    isPublic: boolean;
    fileSizeLimit: number;
    allowedMimeTypes: string[];
  },
) {
  if (buckets.some((bucket) => bucket.name === input.name)) {
    console.log(`Bucket listo: ${input.name}`);
    return;
  }

  const created = await storageFetch(url, secret, "/bucket", {
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

  if (!created.ok) {
    throw new Error(`No se pudo crear el bucket ${input.name} (${created.status}).`);
  }

  console.log(`Bucket creado: ${input.name}`);
}

async function main() {
  const url = read("NEXT_PUBLIC_SUPABASE_URL") || read("SUPABASE_URL");
  const secret = read("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !secret) {
    console.error("Supabase URL or service role is not configured.");
    process.exitCode = 1;
    return;
  }

  const listed = await storageFetch(url, secret, "/bucket");
  if (!listed.ok) {
    throw new Error(`No se pudieron listar buckets (${listed.status}).`);
  }

  const buckets = (await listed.json()) as { name: string }[];
  await ensureBucket(url, secret, buckets, {
    name: PUBLIC_MEDIA_BUCKET,
    isPublic: true,
    fileSizeLimit: MAX_MEDIA_BYTES,
    allowedMimeTypes: [...ALLOWED_MEDIA_MIME_TYPES],
  });
  await ensureBucket(url, secret, buckets, {
    name: AVATAR_BUCKET,
    isPublic: false,
    fileSizeLimit: MAX_AVATAR_BYTES,
    allowedMimeTypes: [...ALLOWED_AVATAR_MIME_TYPES],
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Storage setup failed.";
  console.error(redact(message));
  process.exitCode = 1;
});
