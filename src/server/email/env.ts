import "server-only";
import {
  canSendDevTestEmail,
  parseEmailMode,
  rejectEnabledEmailOutsideProduction,
} from "@/modules/email/domain/mode";
import type { EmailMode } from "@/modules/email/domain/types";
import { getPublicAppUrl } from "@/config/site";

export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigError";
  }
}

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export type EmailRuntimeConfig = {
  mode: EmailMode;
  fromName: string;
  fromAddress: string | undefined;
  replyTo: string | undefined;
  sandboxRecipient: string | undefined;
  hasApiKey: boolean;
  appUrl: string | undefined;
};

export function getEmailRuntimeConfig(): EmailRuntimeConfig {
  return {
    mode: parseEmailMode(readOptional("EMAIL_MODE")),
    fromName: readOptional("EMAIL_FROM_NAME") ?? "DELIVERSO",
    fromAddress: readOptional("EMAIL_FROM_ADDRESS"),
    replyTo: readOptional("EMAIL_REPLY_TO"),
    sandboxRecipient: readOptional("EMAIL_SANDBOX_RECIPIENT"),
    hasApiKey: Boolean(readOptional("RESEND_API_KEY")),
    appUrl: getPublicAppUrl(),
  };
}

export function assertEmailSendConfig(): EmailRuntimeConfig {
  const config = getEmailRuntimeConfig();
  if (rejectEnabledEmailOutsideProduction({ mode: config.mode, nodeEnv: process.env.NODE_ENV })) {
    throw new EmailConfigError(
      "EMAIL_MODE=enabled is not allowed outside production. Use sandbox or disabled.",
    );
  }
  if (config.mode === "sandbox" && !config.sandboxRecipient) {
    throw new EmailConfigError("EMAIL_SANDBOX_RECIPIENT is required when EMAIL_MODE=sandbox.");
  }
  if (config.mode === "enabled" && !config.fromAddress) {
    throw new EmailConfigError("EMAIL_FROM_ADDRESS is required when EMAIL_MODE=enabled.");
  }
  return config;
}

export function getResendApiKey(): string {
  const key = readOptional("RESEND_API_KEY");
  if (!key) {
    throw new EmailConfigError("RESEND_API_KEY is not configured.");
  }
  return key;
}

export function getInternalCronSecret(): string | undefined {
  return readOptional("INTERNAL_CRON_SECRET") ?? readOptional("CRON_SECRET");
}

export function isDevSandboxSendAllowed(): boolean {
  const config = getEmailRuntimeConfig();
  return canSendDevTestEmail({ mode: config.mode, nodeEnv: process.env.NODE_ENV });
}
