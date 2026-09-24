# ADR-019: Cancelaciones y reembolsos

## Estado

Aceptada. Módulo 18.

## Contexto

Había cancelación de `PENDING_PAYMENT` y una cancelación admin de pedidos pagados **sin** reembolso. Hacía falta un flujo financiero real en Stripe TEST, con historial, idempotencia y sin mezclar PaymentIntent status con refunds.

## Decisión

1. **Refunds solo autorizados por Admin.** El cliente solicita cancelación; no inicia refund automático.
2. **Historial financiero propio.** `Refund` + `RefundEvent`. `PaymentStatus` sigue siendo el estado del PaymentIntent (nunca `FAILED` para representar un reembolso). El display usa `getOrderFinancialStatus()`.
3. **No restaurar promociones V1.** `CONSUMED` permanece. El reembolso usa el snapshot `grandTotalMinor`.
4. **Reembolsos parciales.** Pueden existir varios mientras la suma reservada + succeeded ≤ pagado. Un partial no cancela el Order.
5. **DB antes del provider.** Se crea `Refund PENDING`, se hace commit, luego Stripe. PENDING/PROCESSING reservan monto.
6. **Webhook + reconciliation.** El endpoint existente procesa `refund.*`. `reconcilePendingRefunds()` corre en el maintenance actual.
7. **Quotation histórica.** Cancelar/reembolsar un Order de cotización no reabre la Quotation; permanece `CONVERTED`.
8. **Permiso conceptual `REFUND_ORDER`.** Ambos roles admin actuales pueden reembolsar. Sin sistema RBAC nuevo.

## Consecuencias

- `Order.refundedAmountMinor` es snapshot de succeeded; los totales originales no se reescriben.
- Un refund fallido deja el Order en su estado previo; Admin reintenta con un registro nuevo.
- EMAIL_MODE no se habilita. Stripe LIVE no entra.
