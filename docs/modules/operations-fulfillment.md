# Centro operativo de producción, entrega y recogida (M19)

Capa operativa sobre Orders existentes. Order sigue siendo la autoridad. No hay un segundo motor de fulfillment, GPS ni optimización de rutas.

## Propósito

Permitir que Admin vea en segundos qué hay que producir, entregar o recoger hoy, qué está atrasado y qué requiere programación.

Ruta: `/admin/operations` (sidebar **Operación**, título **Centro operativo**).

## Flujo operativo

Máquina real (`FulfillmentStatus`):

1. `PENDING` → `CONFIRMED` (Confirmar pedido)
2. `CONFIRMED` → `IN_PRODUCTION` (Iniciar producción)
3. `IN_PRODUCTION` → `READY` (Marcar como listo)
4. Entrega: `READY` → `OUT_FOR_DELIVERY` (Salir a entrega) → `COMPLETED` (Completar pedido)
5. Recogida: `READY` → `COMPLETED` (Marcar como recogido)

Tras el pago Stripe TEST, el webhook deja fulfillment en `PENDING`. No se saltan estados.

## Transiciones permitidas

`getAllowedFulfillmentTransitions(order)` y `evaluateFulfillmentTransition(order, next)` concentran las reglas. `/admin/operations` y `/admin/orders/[id]` llaman `transitionFulfillmentStatus()`.

## Payment guard

Solo `Order.status = PAID` y `PaymentStatus = SUCCEEDED`. No hay excepción inventada. `PENDING_PAYMENT` puede listarse aparte y no cuenta como producción confirmada.

## Delivery y pickup

- DELIVERY: snapshot de `OrderAddress` (no la Address actual del Customer).
- PICKUP: `pickupLocationName` / `pickupAddressSnapshot`. No se muestra la dirección del cliente como destino.
- No hay “Salir a entrega” en PICKUP.

## Atrasados

`isOrderOperationallyOverdue()` usa timezone `America/Mexico_City`:

- fecha/hora de fulfillment (`requestedDate` + `timeWindowEnd`) &lt; ahora
- no `COMPLETED` ni `CANCELLED`

Los pedidos sin ventana válida no se cuentan como atrasados: van a **Requiere programación**.

## Cotizaciones

Un Order convertido/pagado entra al mismo flujo. Badge **Personalizado** y enlace a la cotización origen si existe.

## Cancelaciones y reembolsos

- `CANCELLED` no admite transición operativa.
- Reembolso parcial: el fulfillment sigue operable; badge **Reembolso parcial**.
- Reembolso total que cancela el Order: fuera de operación.

## Emails

Reutiliza outbox:

- `ORDER_IN_PRODUCTION`
- `ORDER_READY`
- `ORDER_OUT_FOR_DELIVERY`
- `ORDER_COMPLETED`

`eventKey`: `order:{id}:fulfillment:{status}:v1`. Refresh no duplica. `EMAIL_MODE` no se habilita.

## Timezone

`getBusinessDayRange()` deriva hoy / mañana / próximos 7 días con `getZonedParts(..., America/Mexico_City)`. Las fechas de UI son `es-MX` (ejemplo: 5 oct 2026, 10:30 a.m.).

## Notas

Se reutiliza `customerNotes`. No hay `adminNotes` ni `productionNotes`. No se agregó un campo nuevo.

## Índices

Migration `operations_fulfillment_indexes`: `Order(status, requestedDate)` para métricas y agenda por día. No se añadieron columnas.
