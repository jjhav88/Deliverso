# ADR-020: Centro operativo de fulfillment

## Estado

Aceptada. Módulo 19.

## Contexto

Admin Orders ya consulta y transiciona `FulfillmentStatus`, pero no ofrece una agenda diaria de cocina/entrega. Hacía falta una capa operativa sin duplicar pedidos ni inventar otra state machine.

## Decisión

1. **Order sigue siendo autoridad.** El centro operativo solo consulta y ejecuta transiciones sobre Order/Fulfillment existentes.
2. **Sin segundo fulfillment engine.** Se extrae `transitionFulfillmentStatus()` y `getAllowedFulfillmentTransitions()` a partir de la máquina ya usada en Admin Orders.
3. **Agenda, no calendario complejo.** Vistas Hoy / Mañana / 7 días / Atrasados / Todos. Sin drag-and-drop ni dependencia de calendario.
4. **Sin GPS ni route optimization.** “En camino” es un estado manual. El cliente ve `OrderProgress`, no un mapa.
5. **State machine compartida.** Operations y `/admin/orders/[id]` usan el mismo servicio, OrderEvent `FULFILLMENT_STATUS_CHANGED`, audit `ORDER_FULFILLMENT_STATUS_CHANGED` y emails de fulfillment existentes.
6. **Payment guard vigente.** Producción solo con `PAID` + `SUCCEEDED`. Partial refund no cancela fulfillment.

## Consecuencias

- Métricas y listados derivan de counts/queries Prisma, no de una copia del pedido.
- Timezone comercial `America/Mexico_City` para “hoy” y atrasados.
- Índice compuesto `(status, requestedDate)` para las consultas de agenda.
- EMAIL_MODE y Stripe LIVE no cambian.
