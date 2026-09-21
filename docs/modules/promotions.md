# Promociones (M16)

Motor de descuentos calculado **solo en servidor**. MXN es la autoridad monetaria. FX es solo presentación.

## Cálculo

1. Resolver items con precios autoritativos del servidor (base + opciones configuradas).
2. Si hay código seleccionado y es elegible, aplicar esa promoción.
3. Si no, evaluar AUTOMATIC activas y elegir una.
4. `grandTotalMinor = subtotal + delivery − promotionDiscount`. Nunca negativo.
5. Si el total quedaría `<= 0`, error de dominio `ZERO_VALUE`. No se recorta en silencio.

Porcentaje: `eligibleSubtotalMinor × percentageBps ÷ 10000` con `Decimal.ROUND_HALF_UP`. Máximo V1: 90% (9000 bps).

Importe fijo: `min(fixedAmountMinor, eligibleSubtotalMinor)`, tope opcional, y `minSubtotalMinor > fixedAmountMinor` para activar.

Envío gratis: solo `fulfillment = DELIVERY`. En carrito sin método, queda elegible con descuento 0 y el hint de entrega.

## Alcance

Una promoción tiene un solo `scopeType`. Varios targets del mismo tipo: OR (al menos uno).

- `ORDER`: subtotal completo.
- `PRODUCT`: línea configurada (base + opciones) si el producto coincide.
- `CATEGORY` / `UNIVERSE` / `BUSINESS_LINE`: relaciones actuales de `Product` (`ProductCategory`, `ProductUniverse`, `businessLineId`). No hay jerarquías nuevas.

`CUSTOM_QUOTE` no entra al carrito; no participa.

V1 no reparte el descuento entre `OrderItem`. El pedido guarda subtotal elegible + descuento total.

## Selección

V1: una sola promoción por Cart / Checkout / Order. Sin stacking.

- Código explícito válido tiene prioridad y no se combina con automática.
- Varias AUTOMATIC: mayor `totalDiscountMinor` → mayor `priority` → `startsAt` más reciente → `promotionId`.

## Límites y reservas

Al crear Order `PENDING_PAYMENT` se crea `PromotionReservation` (`RESERVED`) en la misma transacción, con lock `FOR UPDATE` de la fila Promotion.

Cuentan contra el límite: `CONSUMED` + `RESERVED` no expiradas. `expiresAt` = expiración del pedido pendiente.

- Pago succeeded (misma lógica idempotente del webhook): `CONSUMED`.
- Pedido expirado/cancelado o maintenance: `RELEASED`.
- Fallo de PaymentIntent o `payment_failed`: la reserva sigue `RESERVED` mientras el pedido pueda reintentarse.
- Webhook duplicado: unique `orderId`; no hay segunda redención.

`Cart.selectedPromotionId` y `CheckoutDraft.selectedPromotionId` son intención, no autoridad monetaria. Checkout y `createOrderFromCheckoutDraft()` reevalúan siempre.

## Snapshots

Order guarda `promotionId` opcional + `promotionCodeSnapshot`, `promotionLabelSnapshot`, `promotionBenefitType`, `promotionDiscountMinor`, `promotionEligibleSubtotalMinor`. Editar la promoción no cambia pedidos históricos.

## Stripe

PaymentIntent `amount` = `Order.grandTotalMinor` post-descuento, currency `mxn`. Sin cupones Stripe.

## Admin

`/admin/promotions` CRUD. Fechas en America/Mexico_City, persistidas UTC. Archive en lugar de hard delete si hubo uso. Pause honra reservas existentes.
