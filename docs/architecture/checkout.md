# Checkout autenticado

Módulo 12. Prepara la compra **antes** del pago.

No hay `Order`, `PaymentIntent` ni Stripe.

## Autoridad

Toda ruta y Server Action exige `requireCustomer()`.
Customer `ACTIVE`, email confirmado. No hay Guest Checkout.

`CheckoutDraft` pertenece a `CustomerAccount` + `Cart`.
Nunca se autoriza solo por UUID del draft.

## CheckoutDraft

Proceso modificable. Estados:

- `IN_PROGRESS`
- `READY_FOR_PAYMENT`
- `CONVERTED_TO_ORDER`
- `EXPIRED`

TTL 24 h. La actividad válida renueva `expiresAt`.
Un cart ACTIVE tiene como máximo un draft operativo
(índice parcial SQL). Cleanup de expirados: deuda futura, sin cron.

Prefill: `displayName`, `email`, `phone` del customer.
Editar contacto en checkout **no** escribe `CustomerAccount`.
`contactEmail` es read-only (email Auth).

`CheckoutAddress` es del draft. No hay address book.

## Pasos

1. Datos
2. Entrega / Recogida
3. Fecha y franja
4. Revisar → `READY_FOR_PAYMENT`

Persistencia en PostgreSQL. Sin localStorage.

`/checkout` y `/en/checkout`: `noindex`. Si el carrito está vacío
o inválido, redirect a `/carrito`.

## Totales

`buildCheckoutSummary` / `buildCheckoutTotals`:

- subtotal del cart (pricing M11, MXN)
- fee de zona o 0 en pickup
- **Total estimado**

Display FX (M10) es visual. No es autoridad de pago.

Cambio de precio Admin: el checkout recalcula. No hay freeze
hasta Order (M13).

## READY

`markCheckoutReady()` recalcula todo: customer, cart, contacto,
fulfillment, zona/pickup, mínimo, slot, lead time, pricing.

Si el cart cambia, el draft vuelve a `IN_PROGRESS`.
Si Admin desactiva zona, pickup u horario, el reload lo detecta.

Seleccionar un slot **no** lo reserva. Order M13 debe revalidarlo.

## Futuro

M13 congelará Order + snapshots y revalidará el slot.
M14 (u orden acordado) introducirá Stripe. Este módulo no instala
ningún SDK de pagos.
