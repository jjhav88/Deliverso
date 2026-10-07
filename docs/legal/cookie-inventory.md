# Inventario de cookies (M21)

Fuente: código (`src/server/cart/cookie.ts`, `src/config/currency.ts`, next-intl, `@supabase/ssr`). No se listan cookies hipotéticas.

## Tabla

| Nombre | Proveedor | Finalidad | Duración | Tipo |
| --- | --- | --- | --- | --- |
| `deliverso_cart` | DELIVERSO | Identificar el carrito | 30 días | Esencial |
| `deliverso_currency` | DELIVERSO | Moneda de visualización (el cobro es MXN) | 1 año | Esencial |
| `NEXT_LOCALE` | DELIVERSO / next-intl | Idioma de interfaz | Según next-intl (típicamente persistente) | Esencial |
| `sb-*-auth-token` (y chunks) | Supabase Auth | Sesión autenticada | Según la sesión | Esencial |

## Otras tecnologías

- **localStorage / sessionStorage:** no hay uso en `src`.
- **Stripe:** el pago ocurre en infraestructura de Stripe. DELIVERSO no instala cookies de Stripe en `deliverso.com.mx`. Stripe puede usar cookies en su dominio al pagar.
- **Vercel:** hosting. En previews puede haber cookies técnicas de plataforma. No hay cookies de analítica en el storefront de producción.
- **Redes sociales:** solo hipervínculos. Sin píxeles ni SDK.

## Banner / CMP

**no CMP required by current technical scope.**

No hay Google Analytics, advertising trackers ni cookies no esenciales. Por eso M21 **no** añade un banner genérico de consentimiento.

Si en el futuro se instala analítica o publicidad:

1. bloquear antes del consentimiento
2. preferencias granulares
3. rechazar tan fácil como aceptar
4. registrar la elección

Analytics queda fuera de M21 a propósito.
