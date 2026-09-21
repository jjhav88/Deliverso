import { createHash } from "node:crypto";

export function buildConfigurationKey(
  variantId: string,
  optionIds: readonly string[],
): string {
  const uniqueSorted = [...new Set(optionIds)].sort();
  return createHash("sha256")
    .update(`${variantId}:${uniqueSorted.join(",")}`, "utf8")
    .digest("hex");
}
