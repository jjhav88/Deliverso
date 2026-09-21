export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at < 1 || at === trimmed.length - 1) {
    return "***";
  }
  return `${trimmed[0]}***@${trimmed.slice(at + 1)}`;
}
