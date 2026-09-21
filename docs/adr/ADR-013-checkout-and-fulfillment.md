# ADR-013: checkout autenticado y fulfillment

## Estado

Aceptada. Módulo 12.

ADR-012 permanece en autenticación de cliente.

## Contexto

Tras M11B el carrito pertenece a un `CustomerAccount`.
Hace falta capturar contacto, entrega/recogida y disponibilidad
antes de congelar un pedido y cobrar.

## Decisión

1. **Checkout autenticado.** `requireCustomer()` en toda ruta y action.
   No hay Guest Checkout.
2. **`CheckoutDraft`, no Order.** El draft es modificable. Order será
   el compromiso congelado (M13).
3. **Zonas por código postal.** El servidor resuelve CP → zona ACTIVE →
   fee/mínimo. El browser no calcula costos.
4. **Lead time MAX + timezone México.** `America/Mexico_City` explícito.
5. **Agenda + blackouts.** Semana, franjas `HH:mm`, fechas bloqueadas.
   Sin reserva de capacidad. El slot se revalida al guardar y en READY.
6. **Sin Order ni Stripe.** Este módulo termina en `READY_FOR_PAYMENT`.

## Consecuencias

- M13 debe revalidar slot, precios y fulfillment al crear Order.
- M13/M14 introducirán PaymentIntent. El total estimado de M12 no es
  autoridad de cobro.
- Display FX sigue siendo informativo.
- No hay address book ni emails de pedido todavía.
