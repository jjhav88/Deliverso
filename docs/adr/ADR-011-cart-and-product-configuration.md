# ADR-011 — Cart server-side y configuración

- Estado: Aceptada
- Fecha: 2026-09-16

## Contexto

El selector de moneda y el catálogo ya existen. El siguiente paso
comercial es configurar productos y persistir un carrito sin checkout.

## Decisión

1. **Cart en PostgreSQL**, no localStorage ni store de cliente.
2. **Cookie con token crudo**, DB con hash SHA-256. El id del cart
   no autoriza.
3. **El browser no manda precios.** Solo productId, variantId,
   optionIds y quantity.
4. **Repricing en cada lectura.** No congelar importe hasta Order.
5. **MXN master.** DisplayMoney es solo visualización FX.

## Consecuencias

- Reload y cambio ES/EN conservan el mismo cart.
- Un item inválido se marca, no desaparece.
- Checkout/Stripe quedan fuera de este módulo.
