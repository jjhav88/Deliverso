# Fulfillment

Disponibilidad operativa de DELIVERSO. No hay motor de capacidad
(hornos, stock, pedidos por hora).

## Timezone

`businessTimezone = America/Mexico_City` en `src/config/fulfillment.ts`.
No se usa el timezone implícito del servidor.

País de entrega inicial: `SUPPORTED_DELIVERY_COUNTRIES = ["MX"]`.
La display currency no implica envío internacional.

## Lead time

`MAX(Product.minimumLeadTimeMinutes)` entre items válidos del cart.
No se suman. Ejemplo: 4 h + 48 h → earliest = 48 h.

## Zonas

`DeliveryZone` + `DeliveryPostalCode`.
El browser envía CP; el servidor resuelve zona ACTIVE y
`deliveryFeeMinor`. Nunca se acepta un fee del cliente.

Pedido mínimo: `minimumOrderMinor` vs subtotal **MXN**.

Admin: `/admin/settings` → Entrega y recogida.
Códigos: uno a uno o lista (coma / salto de línea), normalizados,
sin duplicados, 5 dígitos MX.

## Recogida

`PickupLocation` ACTIVE. Preferir desactivar, no borrar.

## Invariantes

- DELIVERY: `deliveryZoneId` required, `pickupLocationId` null.
- PICKUP: `pickupLocationId` required, `deliveryZoneId` null.
- PICKUP fee = 0.

## Horarios

`FulfillmentWeeklySchedule` (método + día ISO 1–7) y
`FulfillmentTimeWindow` (`HH:mm` local de negocio).
`endTime > startTime`. Sin overlap el mismo día/método.

Horizonte: 30 días. Solo se muestran fechas/slots calculados.
Al guardar se revalida server-side.

## Blackouts

`FulfillmentBlackoutDate`. `fulfillmentMethod` null bloquea ambos.

## Admin

Estado Configurado / Pendiente según zonas o pickups activos
**y** al menos una franja activa.

Auditoría: `DELIVERY_ZONE_*`, `PICKUP_LOCATION_*`,
`FULFILLMENT_SCHEDULE_UPDATED`, `BLACKOUT_DATE_*`.
Sin PII de checkout en `AdminAuditLog`.
