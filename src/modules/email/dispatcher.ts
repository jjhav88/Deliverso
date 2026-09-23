import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/prisma";
import { assertEmailSendConfig, getEmailRuntimeConfig } from "@/server/email/env";
import { getPublicAppUrl } from "@/config/site";
import {
  applySandboxSubject,
  canContactEmailProvider,
  resolveProviderRecipient,
} from "@/modules/email/domain/mode";
import {
  classifyProviderFailure,
  emailDispatchBatchSize,
  nextRetryAt,
  sanitizeEmailErrorMessage,
  statusAfterFailure,
} from "@/modules/email/domain/retry";
import type { EmailProvider, EmailTemplateType } from "@/modules/email/domain/types";
import { toOrderEmailView } from "@/modules/email/order-view";
import { createEmailProvider } from "@/modules/email/providers";
import { sampleOrderView, sampleQuoteView, sampleWelcomeView } from "@/modules/email/sample-data";
import { renderTransactionalEmail } from "@/modules/email/templates/render";
import { logInfo } from "@/server/logging/logger";

export type DispatchSummary = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
};

const orderInclude = {
  address: true,
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: { options: { orderBy: { sortOrder: "asc" as const } } },
  },
} as const;

export async function dispatchPendingEmails(input?: {
  provider?: EmailProvider;
}): Promise<DispatchSummary> {
  const runtime = getEmailRuntimeConfig();
  if (!canContactEmailProvider(runtime.mode)) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const config = assertEmailSendConfig();
  const provider = input?.provider ?? createEmailProvider();
  const prisma = getPrisma();
  const now = new Date();

  const claimed = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    UPDATE "EmailOutbox" AS o
    SET status = 'PROCESSING', "processingStartedAt" = ${now}, "updatedAt" = ${now}
    FROM (
      SELECT id
      FROM "EmailOutbox"
      WHERE status = 'PENDING'
         OR (status = 'FAILED' AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= ${now}))
      ORDER BY "createdAt" ASC
      LIMIT ${emailDispatchBatchSize}
      FOR UPDATE SKIP LOCKED
    ) AS c
    WHERE o.id = c.id
    RETURNING o.id
  `);

  let sent = 0;
  let failed = 0;

  for (const row of claimed) {
    const outbox = await prisma.emailOutbox.findUnique({ where: { id: row.id } });
    if (!outbox) {
      continue;
    }

    try {
      const rendered = await renderOutboxMessage(outbox.template, {
        locale: outbox.locale,
        recipientName: outbox.recipientName,
        referenceType: outbox.referenceType,
        referenceId: outbox.referenceId,
      });
      const result = await provider.send({
        to: resolveProviderRecipient({
          mode: config.mode,
          recipientEmail: outbox.recipientEmail,
          sandboxRecipient: config.sandboxRecipient,
        }),
        subject: applySandboxSubject(config.mode, rendered.subject),
        html: rendered.html,
        text: rendered.text,
        replyTo: config.replyTo,
        idempotencyKey: outbox.eventKey,
      });

      if (result.ok) {
        await prisma.emailOutbox.update({
          where: { id: outbox.id },
          data: {
            status: "SENT",
            provider: "RESEND",
            providerMessageId: result.messageId,
            sentAt: new Date(),
            processingStartedAt: null,
            lastErrorCode: null,
            lastErrorMessage: null,
          },
        });
        logInfo({
          event: "EMAIL_DISPATCH",
          outboxId: outbox.id,
          template: outbox.template,
          status: "SENT",
          providerMessageId: result.messageId ?? undefined,
        });
        sent += 1;
        continue;
      }

      await persistFailure(outbox.id, outbox.attemptCount, result.code, result.message, result.permanent);
      failed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email dispatch failed.";
      await persistFailure(outbox.id, outbox.attemptCount, "DISPATCH_ERROR", message, false);
      failed += 1;
    }
  }

  return { processed: claimed.length, sent, failed, skipped: 0 };
}

async function renderOutboxMessage(
  template: EmailTemplateType,
  input: {
    locale: string;
    recipientName: string | null;
    referenceType: string | null;
    referenceId: string | null;
  },
) {
  const publicUrl = getPublicAppUrl();
  if (input.referenceType === "Preview") {
    return renderTransactionalEmail({
      template,
      welcome: sampleWelcomeView(input.locale),
      order: sampleOrderView(input.locale),
      quote: sampleQuoteView(input.locale),
      publicUrl,
    });
  }

  if (template === "CUSTOMER_WELCOME") {
    return renderTransactionalEmail({
      template,
      welcome: { customerName: input.recipientName, locale: input.locale },
      publicUrl,
    });
  }

  if (input.referenceType === "Quotation" && input.referenceId) {
    const quote = await getPrisma().quotation.findUnique({
      where: { id: input.referenceId },
      include: { activeOffer: true },
    });
    if (!quote) {
      throw new Error("QUOTATION_SNAPSHOT_MISSING");
    }
    return renderTransactionalEmail({
      template,
      quote: {
        quoteNumber: quote.quoteNumber,
        productName: quote.productNameSnapshot,
        requestTitle: quote.requestTitle,
        requestDescription: quote.requestDescription,
        locale: quote.locale,
        quotedSubtotalMinor: quote.activeOffer?.subtotalMinor ?? quote.quotedSubtotalMinor,
        deliveryFeeMinor: quote.activeOffer?.deliveryFeeMinor ?? quote.deliveryFeeMinor,
        quotedTotalMinor: quote.activeOffer?.totalMinor ?? quote.quotedTotalMinor,
        validUntil: (quote.activeOffer?.validUntil ?? quote.validUntil)?.toISOString() ?? null,
      },
      publicUrl,
    });
  }

  if (input.referenceType !== "Order" || !input.referenceId) {
    throw new Error("ORDER_REFERENCE_REQUIRED");
  }

  const row = await getPrisma().order.findUnique({
    where: { id: input.referenceId },
    include: orderInclude,
  });
  if (!row) {
    throw new Error("ORDER_SNAPSHOT_MISSING");
  }

  return renderTransactionalEmail({
    template,
    order: toOrderEmailView(row),
    publicUrl,
  });
}

async function persistFailure(
  id: string,
  currentAttempts: number,
  code: string,
  message: string,
  permanent = false,
) {
  const attemptCount = currentAttempts + 1;
  const kind = permanent ? "permanent" : classifyProviderFailure(code, message);
  const status = statusAfterFailure(attemptCount, kind === "permanent");
  await getPrisma().emailOutbox.update({
    where: { id },
    data: {
      status,
      attemptCount,
      nextAttemptAt: status === "DEAD" ? null : nextRetryAt(attemptCount),
      processingStartedAt: null,
      lastErrorCode: code.slice(0, 80),
      lastErrorMessage: sanitizeEmailErrorMessage(message),
    },
  });
  logInfo({ event: "EMAIL_DISPATCH", outboxId: id, status });
}
