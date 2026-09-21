import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/prisma";
import type { QueueTransactionalEmailInput } from "@/modules/email/domain/types";

type EmailWriter = {
  emailOutbox: {
    create: (args: {
      data: {
        eventKey: string;
        template: QueueTransactionalEmailInput["template"];
        recipientEmail: string;
        recipientName?: string | null;
        locale: string;
        referenceType?: string | null;
        referenceId?: string | null;
        status: "PENDING";
        nextAttemptAt: Date;
      };
    }) => Promise<unknown>;
  };
};

export async function queueTransactionalEmail(
  input: QueueTransactionalEmailInput,
  writer: EmailWriter = getPrisma(),
): Promise<{ queued: boolean; reason?: "duplicate" }> {
  try {
    await writer.emailOutbox.create({
      data: {
        eventKey: input.eventKey,
        template: input.template,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName ?? null,
        locale: input.locale,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        status: "PENDING",
        nextAttemptAt: new Date(),
      },
    });
    return { queued: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { queued: false, reason: "duplicate" };
    }
    throw error;
  }
}
