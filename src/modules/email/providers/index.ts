import "server-only";
import { assertEmailSendConfig, getResendApiKey } from "@/server/email/env";
import { FakeEmailProvider } from "@/modules/email/providers/fake";
import { ResendEmailProvider } from "@/modules/email/providers/resend";
import type { EmailProvider } from "@/modules/email/domain/types";

export function createEmailProvider(): EmailProvider {
  const config = assertEmailSendConfig();
  if (config.mode === "disabled") {
    return new FakeEmailProvider();
  }
  const fromAddress = config.fromAddress ?? "DELIVERSO <onboarding@resend.dev>";
  const from = fromAddress.includes("<") ? fromAddress : `${config.fromName} <${fromAddress}>`;
  return new ResendEmailProvider(getResendApiKey(), from);
}
