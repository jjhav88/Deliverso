# ADR-017: Motor de promociones

## Estado

Aceptada. Módulo 16.

## Contexto

El Admin tenía “Promociones — Pronto”. Hace falta un motor auditable, calculado en servidor, sin cupones Stripe ni órdenes de $0.

## Decisión

1. **MXN authority.** Descuentos en minor units MXN. FX solo presentación. El browser nunca es autoridad.
2. **Una promoción V1.** Código explícito gana a automática. Automáticas se eligen por descuento real, no se suman.
3. **Reservation model.** `PromotionReservation` reserva el cupo al crear Order pendiente, consume en succeeded idempotente y libera en expire/cancel/maintenance. Lock de fila + conteo CONSUMED + RESERVED vigentes.
4. **Snapshot.** El pedido guarda label, código, tipo, descuento y subtotal elegible. Editar la promoción no reescribe historia.
5. **No zero-value order.** Si el total post-descuento es `<= 0`, error tipado. No clamp silencioso. Porcentaje máximo 90%.
6. **No Stripe coupons.** Stripe recibe únicamente el `grandTotalMinor` final en `mxn`.

## Consecuencias

- Checkout revalida siempre. Si el código deja de aplicar, se muestra copy genérica al cliente y se actualiza el total.
- Pause/archive no invalidan reservas de pedidos pendientes.
- CUSTOM_QUOTE, gift cards, loyalty y stacking quedan fuera de V1.
