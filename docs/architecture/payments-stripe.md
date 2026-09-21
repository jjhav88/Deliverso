# Pagos Stripe (TEST)

Módulo 13. Cobro integrado con Payment Element. No se usa Stripe-hosted
Checkout como flujo principal.

## Moneda

El cobro es siempre **MXN**.

`PaymentIntent.amount = Order.grandTotalMinor`
`PaymentIntent.currency = mxn`

Frankfurter/ECB sigue siendo display only. Nunca alimenta el amount.

## Variables

```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

La secret key nunca lleva prefijo `NEXT_PUBLIC`.
En development se rechazan `sk_live_` / `pk_live_`.

LIVE no se activa con un switch Admin. Depende del entorno.

## PaymentIntent

Se crea **después** de commitear el Order.

Idempotency key:

`order:<orderId>:payment-intent:v1`

Un PaymentIntent activo por Order. Refresh o doble click reutilizan
el mismo intent.

Metadata mínima: `orderId`, `orderNumber`, `customerId` interno.
Sin dirección, teléfono, notas ni datos de tarjeta.

Método inicial: **card**. Sin OXXO, transferencias, MSI ni SetupIntent.

## Payment Element

Rutas:

- ES `/pago/[orderNumber]`
- EN `/en/payment/[orderNumber]`

`requireCustomer()` + ownership. Conocer el número no da acceso.
DELIVERSO nunca recibe número de tarjeta, CVC ni expiry.

## Webhook

`POST /api/stripe/webhook`

1. Leer `request.text()` (cuerpo raw).
2. Verificar `stripe-signature` con `STRIPE_WEBHOOK_SECRET`.
3. Firma inválida → 400.
4. `providerEventId` único. Duplicado → 200 sin reprocesar.

Eventos:

- `payment_intent.succeeded` → Order `PAID` si amount/currency coinciden
- `payment_intent.payment_failed` → `FAILED`, el pedido puede reintentarse
- `payment_intent.processing` → no es pagado
- `payment_intent.canceled` → pedido cancelado, carrito `ACTIVE` si no hubo pago

`SUCCEEDED` no se degrada por eventos viejos.
Un mismatch de amount/currency no marca `PAID`.

El redirect de `confirmPayment()` no marca el pedido como pagado.

## Stripe CLI (local)

```
stripe listen --forward-to http://localhost:3010/api/stripe/webhook
```

Usar el `whsec_...` temporal. No hardcodearlo.

Tarjetas: únicamente las oficiales de Stripe TEST MODE.

## Producción (más adelante)

- Términos y aviso de privacidad definitivos (release gate).
- Webhook secret propio de PROD.
- Claves LIVE solo en el deployment, nunca en development.
- Emails de confirmación: M14, a partir de `PAYMENT_SUCCEEDED`.
