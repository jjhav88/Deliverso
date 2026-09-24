import "server-only";
import { queueTransactionalEmail } from "@/modules/email/queue";
import {
  cancellationApprovedEventKey,
  cancellationRejectedEventKey,
  cancellationRequestedEventKey,
  orderCanceledEventKey,
  refundFailedEventKey,
  refundSucceededEventKey,
} from "@/modules/email/domain/event-keys";
import type { EmailTemplateType } from "@/modules/email/domain/types";

type EmailWriter = Parameters<typeof queueTransactionalEmail>[1];

type OrderEmailTarget = {
  id: string;
  customerEmail: string;
  customerName: string | null;
  locale: string | null;
};

async function queueOrderEmail(
  input: {
    template: EmailTemplateType;
    eventKey: string;
    order: OrderEmailTarget;
    referenceType?: string;
    referenceId?: string;
  },
  writer?: EmailWriter,
) {
  await queueTransactionalEmail(
    {
      template: input.template,
      eventKey: input.eventKey,
      recipientEmail: input.order.customerEmail,
      recipientName: input.order.customerName,
      locale: input.order.locale || "es-MX",
      referenceType: input.referenceType ?? "Order",
      referenceId: input.referenceId ?? input.order.id,
    },
    writer,
  );
}

export async function queueCancellationRequestedEmail(
  order: OrderEmailTarget,
  requestId: string,
  writer?: EmailWriter,
) {
  await queueOrderEmail(
    {
      template: "CANCELLATION_REQUESTED",
      eventKey: cancellationRequestedEventKey(requestId),
      order,
      referenceType: "Order",
      referenceId: order.id,
    },
    writer,
  );
}

export async function queueCancellationApprovedEmail(
  order: OrderEmailTarget,
  requestId: string,
  writer?: EmailWriter,
) {
  await queueOrderEmail(
    {
      template: "CANCELLATION_APPROVED",
      eventKey: cancellationApprovedEventKey(requestId),
      order,
    },
    writer,
  );
}

export async function queueCancellationRejectedEmail(
  order: OrderEmailTarget,
  requestId: string,
  writer?: EmailWriter,
) {
  await queueOrderEmail(
    {
      template: "CANCELLATION_REJECTED",
      eventKey: cancellationRejectedEventKey(requestId),
      order,
    },
    writer,
  );
}

export async function queueOrderCanceledEmail(order: OrderEmailTarget, writer?: EmailWriter) {
  await queueOrderEmail(
    {
      template: "ORDER_CANCELED",
      eventKey: orderCanceledEventKey(order.id),
      order,
    },
    writer,
  );
}

export async function queueRefundSucceededEmail(
  order: OrderEmailTarget,
  refundId: string,
  writer?: EmailWriter,
) {
  await queueOrderEmail(
    {
      template: "REFUND_SUCCEEDED",
      eventKey: refundSucceededEventKey(refundId),
      order,
      referenceType: "Refund",
      referenceId: refundId,
    },
    writer,
  );
}

export async function queueRefundFailedEmail(
  order: OrderEmailTarget,
  refundId: string,
  writer?: EmailWriter,
) {
  await queueOrderEmail(
    {
      template: "REFUND_FAILED",
      eventKey: refundFailedEventKey(refundId),
      order,
      referenceType: "Refund",
      referenceId: refundId,
    },
    writer,
  );
}
