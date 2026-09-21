"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";
import { getOwnedOrderPaymentStatus } from "@/modules/orders/actions";
import {
  CONFIRMATION_POLL_INTERVAL_MS,
  CONFIRMATION_POLL_TIMEOUT_MS,
  resolveConfirmationPhase,
  shouldPollConfirmation,
  shouldShowPaymentRetry,
  type ConfirmationPhase,
} from "@/modules/orders/domain/confirmation";

type ConfirmationLabels = {
  paidTitle: string;
  verifyingTitle: string;
  verifyingHint: string;
  thanks: string;
  syncing: string;
  delayed: string;
  delayedHint: string;
  delayedAccount: string;
  failed: string;
  order: string;
  total: string;
  status: string;
  method: string;
  date: string;
  slot: string;
  statusPaid: string;
  statusPending: string;
  delivery: string;
  pickup: string;
  viewOrder: string;
  keepExploring: string;
  viewOrders: string;
  retry: string;
};

type ConfirmationStatusProps = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  stripeIntentStatus: string | null;
  totalLabel: string;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  requestedDate: string;
  timeWindow: string;
  labels: ConfirmationLabels;
};

function statusLabel(orderStatus: string, labels: ConfirmationLabels): string {
  if (orderStatus === "PAID") {
    return labels.statusPaid;
  }
  return labels.statusPending;
}

function methodLabel(method: "DELIVERY" | "PICKUP", labels: ConfirmationLabels): string {
  return method === "PICKUP" ? labels.pickup : labels.delivery;
}

function titleForPhase(phase: ConfirmationPhase, labels: ConfirmationLabels): string {
  if (phase === "paid") {
    return labels.paidTitle;
  }
  if (phase === "failed") {
    return labels.failed;
  }
  if (phase === "delayed") {
    return labels.delayed;
  }
  if (phase === "syncing") {
    return labels.syncing;
  }
  return labels.verifyingTitle;
}

export function ConfirmationStatus(props: ConfirmationStatusProps) {
  const [orderStatus, setOrderStatus] = useState(props.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(props.paymentStatus);
  const [elapsedMs, setElapsedMs] = useState(0);

  const phase = resolveConfirmationPhase({
    orderStatus,
    paymentStatus,
    stripeIntentStatus: props.stripeIntentStatus,
    elapsedMs,
  });
  const showRetry = shouldShowPaymentRetry({
    phase,
    stripeIntentStatus: props.stripeIntentStatus,
  });

  useEffect(() => {
    const initialPhase = resolveConfirmationPhase({
      orderStatus: props.orderStatus,
      paymentStatus: props.paymentStatus,
      stripeIntentStatus: props.stripeIntentStatus,
      elapsedMs: 0,
    });
    if (!shouldPollConfirmation(initialPhase)) {
      return;
    }

    let cancelled = false;
    let intervalId = 0;
    const startedAt = Date.now();

    async function tick() {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= CONFIRMATION_POLL_TIMEOUT_MS) {
        if (!cancelled) {
          setElapsedMs(CONFIRMATION_POLL_TIMEOUT_MS);
        }
        window.clearInterval(intervalId);
        return;
      }

      const result = await getOwnedOrderPaymentStatus(props.orderNumber);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        return;
      }

      setOrderStatus(result.orderStatus);
      setPaymentStatus(result.paymentStatus);
      setElapsedMs(Date.now() - startedAt);

      const nextPhase = resolveConfirmationPhase({
        orderStatus: result.orderStatus,
        paymentStatus: result.paymentStatus,
        stripeIntentStatus: props.stripeIntentStatus,
        elapsedMs: Date.now() - startedAt,
      });
      if (!shouldPollConfirmation(nextPhase)) {
        window.clearInterval(intervalId);
      }
    }

    void tick();
    intervalId = window.setInterval(() => {
      void tick();
    }, CONFIRMATION_POLL_INTERVAL_MS);

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setElapsedMs(CONFIRMATION_POLL_TIMEOUT_MS);
      }
      window.clearInterval(intervalId);
    }, CONFIRMATION_POLL_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [props.orderNumber, props.orderStatus, props.paymentStatus, props.stripeIntentStatus]);

  return (
    <div>
      <h1 className="type-display-l">{titleForPhase(phase, props.labels)}</h1>
      <div role="status" aria-live="polite" className="mt-4 grid gap-3">
        {phase === "verifying" ? (
          <p className="type-body text-muted-foreground">{props.labels.verifyingHint}</p>
        ) : null}
        {phase === "syncing" ? (
          <p className="type-body text-muted-foreground">{props.labels.verifyingHint}</p>
        ) : null}
        {phase === "paid" ? <p className="type-body">{props.labels.thanks}</p> : null}
        {phase === "delayed" ? (
          <>
            <p className="type-body">{props.labels.delayedHint}</p>
            <p className="type-body text-muted-foreground">{props.labels.delayedAccount}</p>
          </>
        ) : null}
      </div>

      {phase === "paid" ? (
        <dl className="mt-8 grid gap-3 type-body">
          <div>
            <dt className="type-caption text-muted-foreground">{props.labels.order}</dt>
            <dd>{props.orderNumber}</dd>
          </div>
          <div>
            <dt className="type-caption text-muted-foreground">{props.labels.total}</dt>
            <dd className="tabular-nums">{props.totalLabel}</dd>
          </div>
          <div>
            <dt className="type-caption text-muted-foreground">{props.labels.status}</dt>
            <dd>{statusLabel(orderStatus, props.labels)}</dd>
          </div>
          <div>
            <dt className="type-caption text-muted-foreground">{props.labels.method}</dt>
            <dd>{methodLabel(props.fulfillmentMethod, props.labels)}</dd>
          </div>
          <div>
            <dt className="type-caption text-muted-foreground">{props.labels.date}</dt>
            <dd>{props.requestedDate}</dd>
          </div>
          <div>
            <dt className="type-caption text-muted-foreground">{props.labels.slot}</dt>
            <dd>{props.timeWindow}</dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {phase === "paid" ? (
          <>
            <Link
              href={{ pathname: "/cuenta/pedidos/[orderNumber]", params: { orderNumber: props.orderNumber } }}
              className={buttonClassName()}
            >
              {props.labels.viewOrder}
            </Link>
            <Link href="/productos" className={buttonClassName({ variant: "outline" })}>
              {props.labels.keepExploring}
            </Link>
          </>
        ) : null}
        {phase === "delayed" ? (
          <Link href="/cuenta" className={buttonClassName()}>
            {props.labels.viewOrders}
          </Link>
        ) : null}
        {showRetry ? (
          <Link
            href={{ pathname: "/pago/[orderNumber]", params: { orderNumber: props.orderNumber } }}
            className={buttonClassName()}
          >
            {props.labels.retry}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
