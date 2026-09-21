export type StripePaymentIntentSnapshot = {
  id: string;
  clientSecret: string | null;
  status: string;
  amount: number;
  currency: string;
  livemode: boolean;
  metadata?: {
    orderId?: string;
    orderNumber?: string;
  };
};

export type CreatePaymentIntentInput = {
  amountMinor: number;
  currency: "mxn";
  metadata: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
  };
};

export type StripeGateway = {
  createPaymentIntent(
    input: CreatePaymentIntentInput,
    idempotencyKey: string,
  ): Promise<StripePaymentIntentSnapshot>;
  retrievePaymentIntent(id: string): Promise<StripePaymentIntentSnapshot>;
  cancelPaymentIntent(id: string): Promise<StripePaymentIntentSnapshot | null>;
  constructWebhookEvent(rawBody: string, signature: string): unknown;
};
