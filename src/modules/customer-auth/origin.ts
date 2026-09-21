import { headers } from "next/headers";
import { getPublicAppUrl } from "@/config/site";

export async function resolveAppOrigin(): Promise<string> {
  const configured = getPublicAppUrl();
  if (configured) {
    return configured;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is required to resolve the application origin.");
  }

  return "http://localhost:3010";
}
