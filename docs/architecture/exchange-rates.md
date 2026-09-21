# Tipos de cambio de visualización

MXN es la moneda maestra. `ProductVariant.priceMinor` nunca se convierte
en la base. El selector de moneda solo afecta **display currency**.

## Display vs payment

`DISPLAY CURRENCY != PAYMENT CURRENCY`.

Este módulo convierte únicamente lo que el usuario ve. Stripe decidirá
más adelante la moneda de cobro. `DisplayMoney` no debe reutilizarse
como importe de PaymentIntent.

Cuando exista Order, deberá guardar snapshot de importe base, moneda,
tasa, proveedor y fecha. Ese modelo no se crea aquí.

## Proveedor

Puerto: `ExchangeRateProvider` / `BatchExchangeRateProvider`.

Implementación: `FrankfurterExchangeRateProvider`.

- API: `https://api.frankfurter.dev/v2/rates?base=MXN&quotes=USD,EUR,CAD,GBP&providers=ecb`
- Fuente: ECB
- Provider persistido: `FRANKFURTER_ECB`
- Sin API key

Las tasas son de **referencia diaria**, no live FX ni tasa bancaria
ni tasa de Stripe.

## Cache

- Fresh TTL: 12 horas (`fetchedAt`)
- Si el proveedor falla: último snapshot hasta 96 horas (`stale = true`)
- Más de 96 horas o sin snapshot: mostrar MXN + aviso
- Nunca `rate || 1` excepto MXN → MXN
- Una sola `RateSet` por request (`cache()`)

## Conversión

`decimal.js`, `ROUND_HALF_UP`.

1. `amountMinor` MXN → major
2. multiplicar por `Decimal(rate)`
3. redondear a minor units de la quote (`getCurrencyMinorUnit`)

Fines de semana: la `sourceDate` del viernes es esperada.

## Admin

`/admin/settings` muestra el estado en solo lectura y puede refrescar.
No hay edición manual de tasas.
