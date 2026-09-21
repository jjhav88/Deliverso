import type { EmailMode } from "@/modules/email/domain/types";
import { emailModes } from "@/modules/email/domain/types";

export function isEmailMode(value: string): value is EmailMode {
  return (emailModes as readonly string[]).includes(value);
}

export function parseEmailMode(value: string | undefined): EmailMode {
  const normalized = value?.trim().toLowerCase() ?? "sandbox";
  return isEmailMode(normalized) ? normalized : "sandbox";
}

export function rejectEnabledEmailOutsideProduction(input: {
  mode: EmailMode;
  nodeEnv: string | undefined;
}): boolean {
  return input.mode === "enabled" && input.nodeEnv !== "production";
}

export function resolveProviderRecipient(input: {
  mode: EmailMode;
  recipientEmail: string;
  sandboxRecipient: string | undefined;
}): string {
  if (input.mode === "sandbox") {
    if (!input.sandboxRecipient) {
      throw new Error("EMAIL_SANDBOX_RECIPIENT is required in sandbox mode.");
    }
    return input.sandboxRecipient;
  }
  return input.recipientEmail;
}

export function applySandboxSubject(mode: EmailMode, subject: string): string {
  if (mode === "sandbox" && !subject.startsWith("[SANDBOX]")) {
    return `[SANDBOX] ${subject}`;
  }
  return subject;
}

export function canContactEmailProvider(mode: EmailMode): boolean {
  return mode !== "disabled";
}

export function canSendDevTestEmail(input: {
  mode: EmailMode;
  nodeEnv: string | undefined;
}): boolean {
  return input.nodeEnv !== "production" && input.mode === "sandbox";
}
