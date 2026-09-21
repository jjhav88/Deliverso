import { randomInt } from "node:crypto";

const PREFIX = "DEL";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function formatOrderNumber(now: Date, suffix: string): string {
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${PREFIX}-${year}${month}${day}-${suffix}`;
}

export function generateOrderNumberSuffix(length = 6): string {
  let suffix = "";
  for (let index = 0; index < length; index += 1) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return suffix;
}

export function generateOrderNumber(now = new Date()): string {
  return formatOrderNumber(now, generateOrderNumberSuffix());
}

export function isOrderNumberFormat(value: string): boolean {
  return /^DEL-\d{6}-[A-Z2-9]{6}$/.test(value);
}
