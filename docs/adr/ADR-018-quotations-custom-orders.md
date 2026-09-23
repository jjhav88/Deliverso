# ADR-018: Cotizaciones y pedidos personalizados

## Estado

Aceptada. Módulo 17.

## Contexto

CUSTOM_QUOTE existía en catálogo pero estaba excluido del carrito. Hacía falta un flujo comercial completo sin mezclar promociones ni el checkout estándar.

## Decisión

1. **Sin carrito.** CUSTOM_QUOTE no usa Cart. La autoridad es Quotation y, al aceptar, Order.
2. **Ofertas versionadas.** `QuoteOffer` v1/v2/v3. No se edita una propuesta histórica. Solo una `activeOffer`.
3. **MXN minor units.** Subtotal > 0, delivery >= 0, total = suma. Sin $0. Sin floats.
4. **Sin promociones V1.** El precio ya es una propuesta negociada. No hay código en el pago de cotización.
5. **Conversión a Order.** Aceptar crea un único Order `PENDING_PAYMENT` con snapshots. Stripe TEST reusa PaymentIntent + webhook existentes.
6. **Adjuntos privados.** Bucket `deliverso-quote-attachments`, signed URLs, ownership por path.

## Consecuencias

- El fulfillment y el fee de entrega quedan fijados en la oferta. No se recalculan por código postal después de aceptar.
- Si la oferta es DELIVERY, el cliente debe completar `QuoteAddress` antes de aceptar.
- Admin dashboard/list cubre la notificación interna V1. Correo interno Admin queda pendiente.
- EMAIL_MODE no se habilita en este módulo. Stripe LIVE no entra.
