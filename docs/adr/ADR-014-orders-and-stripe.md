# ADR-014: Order inmutable y Stripe Payment Element

## Estado

Aceptada. Módulo 13.

ADR-013 permanece para el checkout modificable.

## Contexto

M12 termina en `CheckoutDraft READY_FOR_PAYMENT`. Hace falta un
compromiso comercial histórico y un cobro real en TEST, sin perder
la experiencia visual de DELIVERSO.

## Decisión

1. **Order es la frontera.** El draft se convierte; el Order no se
   reedita. Snapshots de producto, opción, cliente, dirección,
   fulfillment y FX.
2. **Pago siempre MXN.** Display FX (ECB/Frankfurter) es informativo
   y se congela si se mostró. Stripe cobra `grandTotalMinor` MXN.
3. **PaymentIntent + Payment Element.** Checkout propio de DELIVERSO.
   No Stripe-hosted Checkout como implementación principal.
4. **Webhook es autoridad de PAID.** `confirmPayment()` y el return
   URL no transicionan el pedido.
5. **Idempotencia.** `checkoutDraftId` único, idempotency key de
   Stripe, `providerEventId` único.
6. **Card only.** OXXO, transferencias, MSI y saved cards requieren
   estados y UX que este módulo no abre.
7. **TEST only.** LIVE depende de env/deployment, no de Admin.

## Consecuencias

- M14 puede reaccionar a `OrderEvent PAYMENT_SUCCEEDED` para emails.
- Reembolsos, inventario y facturación fiscal quedan fuera.
- Un Order pendiente congela el carrito hasta pagar, cancelar o expirar.
