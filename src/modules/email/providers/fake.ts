import type { EmailProvider, EmailProviderResult, SendEmailInput } from "@/modules/email/domain/types";

export class FakeEmailProvider implements EmailProvider {
  readonly sent: SendEmailInput[] = [];
  failNext: EmailProviderResult | null = null;

  async send(input: SendEmailInput): Promise<EmailProviderResult> {
    if (this.failNext) {
      const result = this.failNext;
      this.failNext = null;
      return result;
    }
    this.sent.push(input);
    return { ok: true, messageId: `fake_${this.sent.length}` };
  }
}
