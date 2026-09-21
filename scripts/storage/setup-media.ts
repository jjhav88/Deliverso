import { config as loadEnv } from "dotenv";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_BYTES,
  PUBLIC_MEDIA_BUCKET,
} from "../../src/modules/media/constants";

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
  if (buckets.some((bucket) => bucket.name === PUBLIC_MEDIA_BUCKET)) {
    console.log(`Bucket listo: ${PUBLIC_MEDIA_BUCKET}`);
    return;
  }

  const created = await storageFetch(url, secret, "/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: PUBLIC_MEDIA_BUCKET,
      name: PUBLIC_MEDIA_BUCKET,
      public: true,
      file_size_limit: MAX_MEDIA_BYTES,
      allowed_mime_types: [...ALLOWED_MEDIA_MIME_TYPES],
    }),
  });

  if (!created.ok) {
    throw new Error(`No se pudo crear el bucket (${created.status}).`);
  }

  console.log(`Bucket creado: ${PUBLIC_MEDIA_BUCKET}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Storage setup failed.";
  console.error(redact(message));
  process.exitCode = 1;
});
