# Cotizaciones y pedidos personalizados (M17)

CUSTOM_QUOTE no entra al carrito. La autoridad comercial es **Quotation** y, tras aceptar, **Order**.

## Ciclo de vida

`SUBMITTED` → `IN_REVIEW` → `NEEDS_INFO` (opcional, el cliente responde y vuelve a `IN_REVIEW`) → `QUOTED` → `ACCEPTED` (crea Order `PENDING_PAYMENT`) → `CONVERTED` (webhook Stripe succeeded).

También: `DECLINED`, `EXPIRED`, `CANCELED`. Sin hard delete.

`eventDate` no es la fecha de fulfillment. `requestedFulfillmentDate` se mantiene aparte.

## Ofertas versionadas

`QuoteOffer` guarda `v1`, `v2`, … Nunca se edita una oferta previa: se crea una nueva, se marca `supersededAt` en la anterior y `Quotation.activeOfferId` apunta a la activa.

Aceptar siempre usa la oferta activa. El Order guarda `acceptedOfferId` + snapshots (`quotationNumberSnapshot`, descripción, `customOrder = true`, importes de esa versión).

## Conversión y pago

Aceptar no cobra. En transacción:

1. ownership + `QUOTED` + no expirada + total válido + dirección si `DELIVERY` + pickup si `PICKUP`
2. un solo Order (relación unique `quotationId` / `orderId`)
3. `OrderItem` qty 1, precio = `quotedSubtotalMinor`
4. `promotionDiscountMinor = 0`

Luego se reusa `createOrGetPaymentIntentForOrder()` y `/pago/[orderNumber]`. Metadata Stripe: `orderId`, `orderNumber`, `quotationId`, `quoteNumber`. Amount = `Order.grandTotalMinor` MXN.

`processStripePaymentIntentEvent()` marca Order `PAID` y Quotation `CONVERTED`. Duplicado: no segundo pedido. Fallo de pago: la cotización no vuelve a `QUOTED`.

V1: no promociones en Orders de cotización. El precio ya está negociado. El Payment Element no muestra código.

## Adjuntos

Bucket privado `deliverso-quote-attachments`. Paths `customers/<customerId>/<quotationId>/<uuid>.<ext>`. JPEG/PNG/WEBP, 5 MB, 5 archivos. MIME por magic bytes. Signed URL corta, nunca persistida. Customer solo ve las suyas; Admin ve todas.

## Mensajes

`QuoteMessage` inmutable. No es un chat completo. Admin pide info; el cliente responde.

`adminInternalNotes` nunca es customer-facing ni entra a emails.

## Emails (outbox)

`QUOTE_RECEIVED`, `QUOTE_NEEDS_INFO`, `QUOTE_OFFERED`, `QUOTE_ACCEPTED`, `QUOTE_DECLINED`, `QUOTE_EXPIRED`. Se encolan; no se envían en Server Actions. V1 no notifica por correo interno al Admin: el listado `/admin/quotations` es suficiente.

## Mantenimiento

`expireQuotations()`: `QUOTED` + `validUntil < now` → `EXPIRED`, idempotente.

## Seguridad

Customer: `Quotation.customerId === currentCustomer.id`. Admin: `requireAdmin()`. No rate limiter in-memory.
