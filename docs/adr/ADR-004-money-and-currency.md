# ADR-004 — Dinero y moneda

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

DELIVERSO venderá productos con precios maestros en México y deberá mostrar esos precios en otras monedas. Los errores clásicos en este terreno son usar flotantes como fuente de verdad, calcular totales en el navegador y aplicar tasas de cambio obsoletas o inventadas.

## Decisión

### Moneda base

`MXN` es la moneda base del negocio. Los precios maestros se expresarán en MXN.

### Unidades menores

Los importes persistidos se representan como enteros en unidades menores. `$450.00 MXN` se modela como `45000`. No se usa `450.00` como representación persistente.

La utilidad `formatMoney` formatea para pantalla con `Intl.NumberFormat`, respetando locale y currency. El flotante, si aparece, es un detalle transitorio del formateo, nunca la fuente de verdad.

### Monedas de visualización

Monedas iniciales: `MXN`, `USD`, `EUR`, `CAD`, `GBP`. Añadir otra moneda se hace principalmente en `src/config/currency.ts`.

La moneda de visualización (*display currency*) y la moneda de cobro (*payment / presentment currency*) son conceptos distintos. Stripe decidirá más adelante qué monedas pueden cobrarse. El sistema podrá:

- mostrar y cobrar en la moneda seleccionada cuando esté soportada;
- o mostrar una conversión informativa y cobrar en MXN.

### Tipos de cambio

No se conecta todavía un proveedor. Existe el puerto `ExchangeRateProvider` para que una implementación futura reciba moneda base, moneda destino y devuelva tasa, timestamp y proveedor.

Reglas que se implementarán más adelante:

- tasas reales, obtenidas en el servidor;
- caché con expiración;
- uso controlado de la última tasa válida si el proveedor falla;
- nunca una tasa indefinidamente obsoleta;
- registro de proveedor, tasa y fecha/hora;
- congelación de la tasa en el pedido;
- un pedido histórico no cambia porque cambie el mercado;
- el precio mostrado puede variar antes del checkout;
- el servidor recalcula importes antes de crear el pago;
- el frontend no es autoridad sobre precio, descuento, tasa, total, impuesto ni entrega.

No hay valores simulados de tipo de cambio ni una API falsa.

### Autoridad del servidor

El navegador no es autoridad sobre la tasa ni sobre los importes definitivos. Las claves privadas no viajan en variables `NEXT_PUBLIC_*`.

## Consecuencias

- Los módulos futuros de catálogo, carrito y checkout pueden importar tipos y formateo sin reinventar dinero.
- La conversión y el cobro pueden divergir sin romper la UI.
- El proveedor de divisas se podrá sustituir sin tocar el dominio.
