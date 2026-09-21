# ADR-010 — Display currency

- Estado: Aceptada
- Fecha: 2026-09-16

## Contexto

DELIVERSO persiste precios maestros en MXN y ofrece un selector de
USD, EUR, CAD y GBP. Convertir en el producto, inventar tasas o tratar
la visualización como moneda de cobro rompería integridad comercial.

## Decisión

1. **MXN master.** `ProductVariant` sigue en MXN. No hay `priceUsd`.
2. **Frankfurter v2 / ECB.** `GET /v2/rates?base=MXN&quotes=USD,EUR,CAD,GBP&providers=ecb`.
   Las tasas son de referencia diaria, no real-time trading.
3. **Snapshots.** `ExchangeRateSnapshot` con `Decimal(30,15)`,
   `sourceDate` y `fetchedAt` separados.
4. **Display ≠ payment.** La cookie `deliverso_currency` solo cambia
   la UI. Stripe decidirá la moneda de cobro más adelante.
5. **Math con decimal.js** y `ROUND_HALF_UP`. El float de JSON se
   captura como string y la autoridad posterior es Decimal.
6. **Fallback honesto.** Sin tasa usable se muestra MXN, nunca 1:1.

## Consecuencias

- El catálogo, Home Featured y el detalle comparten un `RateSet`.
- JSON-LD permanece en MXN para SEO estable.
- Un Order futuro deberá congelar la tasa usada; no se modela ahora.
