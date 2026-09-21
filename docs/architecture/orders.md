# Pedidos inmutables

Módulo 13. Un `CheckoutDraft` `READY_FOR_PAYMENT` se convierte en un
`Order` histórico. El pedido es el compromiso comercial, no el carrito
ni el draft.

## Autoridad

`createOrderFromCheckoutDraft()` vive en servidor. Recalcula precios,
zona, slot y mínimos. No acepta totales enviados por el navegador.

Si algo cambió, el draft vuelve a `IN_PROGRESS` y no se crea Order.

`checkoutDraftId` es único: un draft produce como máximo un pedido.

## Snapshots

`Order`, `OrderItem`, `OrderItemOption` y `OrderAddress` congelan:

- nombres y precios de producto/opción;
- contacto del cliente;
- dirección o punto de recogida;
- zona y fee vigentes al crear;
- franja horaria;
- FX de display si no era MXN.

Las relaciones a Product/Option/Zone son trazabilidad (`SetNull` o
`Restrict`). La historia no depende del catálogo vivo.

## Estados

- Pedido: `PENDING_PAYMENT | PAID | CANCELLED | EXPIRED`
- Pago: separado (`PaymentStatus`)
- Fulfillment: operacional e independiente

Al pagar: fulfillment queda `PENDING`. Admin avanza con una state
machine. Cancelar un pedido pagado no reembolsa.

## Carrito

Al crear Order: `ACTIVE → PENDING_PAYMENT` (congelado).
Al pagar: `CHECKED_OUT`. La siguiente compra crea un carrito nuevo.
Si el cliente cancela o el pedido expira sin pago: el carrito vuelve
`ACTIVE`.

## Número de pedido

Formato `DEL-YYMMDD-XXXXXX`. Es identificador legible, no autorización.
La autorización sigue siendo `customerId`.

## Lo que no hace este módulo

Emails, cupones, facturación fiscal, inventario, reembolsos, OXXO,
transferencias, Stripe LIVE.
