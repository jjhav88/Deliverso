"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { deliversoStripeAppearance } from "@/modules/payments/appearance";
import {
  canSubmitPaymentElement,
  createPaymentSubmitGuard,
  nextReadyStateAfterPaymentError,
  paymentButtonLabel,
  paymentDeclineMessage,
  safeStripeElementErrorLog,
} from "@/modules/payments/domain/element-ready";

type PaymentFormProps = {
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
  paymentIntentStatus: string;
  amountLabel: string;
  secureLabel: string;
  payLabel: string;
  processingLabel: string;
  loadingFormLabel: string;
  loadingPayLabel: string;
  loadErrorLabel: string;
  declineLabel: string;
};

export function StripePaymentForm(props: PaymentFormProps) {
  const stripePromise = useMemo(() => loadStripe(props.publishableKey), [props.publishableKey]);
  const elementsOptions = useMemo(
    () => ({
      clientSecret: props.clientSecret,
      appearance: deliversoStripeAppearance,
      locale: "auto" as const,
    }),
    [props.clientSecret],
  );

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentInner
        returnUrl={props.returnUrl}
        paymentIntentStatus={props.paymentIntentStatus}
        amountLabel={props.amountLabel}
        secureLabel={props.secureLabel}
        payLabel={props.payLabel}
        processingLabel={props.processingLabel}
        loadingFormLabel={props.loadingFormLabel}
        loadingPayLabel={props.loadingPayLabel}
        loadErrorLabel={props.loadErrorLabel}
        declineLabel={props.declineLabel}
      />
    </Elements>
  );
}

function PaymentInner(props: {
  returnUrl: string;
  paymentIntentStatus: string;
  amountLabel: string;
  secureLabel: string;
  payLabel: string;
  processingLabel: string;
  loadingFormLabel: string;
  loadingPayLabel: string;
  loadErrorLabel: string;
  declineLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const submitGuard = useRef(createPaymentSubmitGuard());
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const paymentElementOptions = useMemo(
    () => ({
      layout: "tabs" as const,
      wallets: { applePay: "never" as const, googlePay: "never" as const, link: "never" as const },
    }),
    [],
  );
  const canSubmit = canSubmitPaymentElement({
    stripeReady: Boolean(stripe),
    elementsReady: Boolean(elements),
    paymentElementReady,
    submitting,
    paymentIntentStatus: props.paymentIntentStatus,
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || !paymentElementReady) {
      return;
    }
    if (
      !canSubmitPaymentElement({
        stripeReady: true,
        elementsReady: true,
        paymentElementReady,
        submitting,
        paymentIntentStatus: props.paymentIntentStatus,
      })
    ) {
      return;
    }
    if (!submitGuard.current.tryStart()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: props.returnUrl },
      });
      if (result.error) {
        setPaymentElementReady(nextReadyStateAfterPaymentError(true));
        setError(
          paymentDeclineMessage({
            stripeMessage: result.error.message,
            fallback: props.declineLabel,
          }),
        );
      }
    } catch {
      setPaymentElementReady(nextReadyStateAfterPaymentError(true));
      setError(props.declineLabel);
    } finally {
      submitGuard.current.finish();
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <p className="type-body-sm text-muted-foreground">{props.secureLabel}</p>
      {!paymentElementReady && !error ? (
        <p role="status" className="type-body-sm text-muted-foreground">
          {props.loadingFormLabel}
        </p>
      ) : null}
      <PaymentElement
        options={paymentElementOptions}
        onLoaderStart={() => {
          setPaymentElementReady(false);
        }}
        onReady={() => {
          setPaymentElementReady(true);
        }}
        onLoadError={(event) => {
          console.error("Payment Element loaderror", safeStripeElementErrorLog(event.error));
          setPaymentElementReady(false);
          setError(props.loadErrorLabel);
        }}
      />
      {error ? (
        <p role="alert" className="type-caption text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={!canSubmit} loading={submitting}>
        {paymentButtonLabel({
          paymentElementReady,
          submitting,
          payLabel: props.payLabel,
          loadingLabel: props.loadingPayLabel,
          processingLabel: props.processingLabel,
        })}
      </Button>
      <p className="type-caption text-muted-foreground">{props.amountLabel}</p>
    </form>
  );
}
