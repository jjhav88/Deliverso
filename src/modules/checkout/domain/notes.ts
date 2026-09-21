import { checkoutNotesMaxLength } from "@/config/fulfillment";

export function sanitizeCheckoutNotes(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, checkoutNotesMaxLength);
}
