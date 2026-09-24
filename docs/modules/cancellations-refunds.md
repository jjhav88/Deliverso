# Cancelaciones y reembolsos (M18)

Order y Payment son entidades distintas. Cancelar un pedido **no** implica que Stripe ya devolvió el dinero. El reembolso tiene estado propio.

## Solicitud del cliente

`canCustomerRequestCancellation(order)` es la política V1 central:

- Order `PAID` + Payment `SUCCEEDED`
- Fulfillment `PENDING` o `CONFIRMED`
- Sin request activa (`REQUESTED` o `APPROVED`)

Después de `IN_PRODUCTION`, `READY`, `OUT_FOR_DELIVERY` o `COMPLETED` el cliente no auto-solicita: se muestra contacto/soporte. Admin puede reembolsar como excepción.

El cliente **nunca** ejecuta un refund. Solo envía motivo + mensaje opcional. El copy no dice “pedido cancelado” hasta la aprobación/cancelación final.

Mientras `REQUESTED` puede retirar → `WITHDRAWN`. No después de `APPROVED`.

## Aprobación Admin

Aprobar una request pagada:

1. `CancellationRequest` → `APPROVED` (email `CANCELLATION_APPROVED`: el dinero aún no está de vuelta)
2. Crear `Refund` FULL `PENDING` (`cancelsOrder = true`)
3. Llamar Stripe **fuera** de la transacción DB
4. Webhook / respuesta → `SUCCEEDED`
5. `Order` → `CANCELLED`, request → `COMPLETED`

Rechazar: request `REJECTED`, Order sigue `PAID`, email `CANCELLATION_REJECTED`.

## Reembolsos

`getRefundableAmount(order)` =

`grandTotalMinor - SUCCEEDED - PENDING - PROCESSING`

Nunca negativo. Un `Refund PENDING` ya reserva dinero (no hay modelo extra). `FAILED` libera el monto para un nuevo intento (nuevo registro; no se reescribe la historia).

- FULL: `amountMinor = refundable` (> 0). Incluye delivery fee.
- PARTIAL: `0 < amount < = refundable`. No cancela el Order. Un pedido `COMPLETED` puede quedar `COMPLETED` con reembolso parcial.

Idempotencia Stripe: `refund:<refundId>:v1`.

Concurrencia: `SELECT … FOR UPDATE` del Order, cálculo del disponible dentro de la transacción.

## Stripe

Solo `sk_test_` / `pk_test_`. Server-side. El webhook existente (`/api/stripe/webhook`) procesa `refund.*` y `charge.refunded`. El webhook es autoridad final del provider. `reconcilePendingRefunds()` entra al maintenance actual (PENDING/PROCESSING con ≥ 5 min).

## Promociones

El reembolso usa `Order.grandTotalMinor` (dinero pagado). No se recalcula la promo. Una promoción `CONSUMED` **no** vuelve a estar disponible. Admin puede crear otra si corresponde. No se toca usage history.

## Cotizaciones

El mismo motor. Si se cancela un Order de cotización, `Quotation` permanece `CONVERTED` (histórico). No se reabre.

## Inventario

No hay autoridad de stock. No se restaura inventario.

## Permisos

`requireAdmin()`. `REFUND_ORDER` es conceptual: `ADMIN` y `SUPER_ADMIN` pueden reembolsar. No se construyó un RBAC nuevo.

## Emails

Outbox: `CANCELLATION_REQUESTED`, `CANCELLATION_APPROVED`, `CANCELLATION_REJECTED`, `ORDER_CANCELED`, `REFUND_SUCCEEDED`, `REFUND_FAILED`. No se dice que el dinero ya está devuelto hasta `REFUND_SUCCEEDED`.
