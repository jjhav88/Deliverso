import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function formatQuoteNumber(now: Date, suffix: string): string {
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `COT-${year}${month}${day}-${suffix}`;
}

export function generateQuoteNumberSuffix(length = 6): string {
  let suffix = "";
  for (let index = 0; index < length; index += 1) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return suffix;
}

export function generateQuoteNumber(now = new Date()): string {
  return formatQuoteNumber(now, generateQuoteNumberSuffix());
}

export function isQuoteNumberFormat(value: string): boolean {
  return /^COT-\d{6}-[A-Z2-9]{6}$/.test(value);
}
