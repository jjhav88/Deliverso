import { Resend } from "resend";
import type { EmailProvider, EmailProviderResult, SendEmailInput } from "@/modules/email/domain/types";
import { sanitizeEmailErrorMessage } from "@/modules/email/domain/retry";

const providerTimeoutMs = 10_000;

export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(input: SendEmailInput): Promise<EmailProviderResult> {
    const client = new Resend(this.apiKey);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), providerTimeoutMs);

    try {
      const result = await client.emails.send(
        {
          from: this.from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          replyTo: input.replyTo,
        },
        {
          idempotencyKey: input.idempotencyKey,
        },
      );

      if (result.error) {
        return {
          ok: false,
          code: result.error.name ?? "RESEND_ERROR",
          message: sanitizeEmailErrorMessage(result.error.message),
          permanent: /invalid/i.test(result.error.message ?? ""),
        };
      }

      return { ok: true, messageId: result.data?.id ?? null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email provider failed.";
      return {
        ok: false,
        code: error instanceof Error && error.name === "AbortError" ? "TIMEOUT" : "RESEND_EXCEPTION",
        message: sanitizeEmailErrorMessage(message),
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
