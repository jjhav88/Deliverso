# Staging acceptance — M15B.3

Staging: https://deliverso-staging.vercel.app

Fecha de revisión: 2026-09-21

## Resumen

**PASS con pendientes explícitos.** Infraestructura, storefront ES, auth gates, carrito/checkout (código + HTTP), pagos (código + evidencia previa), outbox y quality gates están estables. No se abrieron familias nuevas. No LIVE. No `EMAIL_MODE=enabled`. No dominio.

Pendiente conocido (no bug):

- **AUTOMATIC EMAIL DISPATCH** — Vercel Hobby no ejecuta cada 5 min. Target de producción: scheduler → `POST /api/internal/email-dispatch`.

## Checklist

| Área | Estado | Notas |
| --- | --- | --- |
| Infrastructure | **PASS** | Vercel READY. `GET /api/health` 200 `{status:ok}`. `GET /api/readiness` 200 READY. |
| Auth | **PASS** | Login/registro/forgot/reset 200. `/cuenta` y `/checkout` redirigen a login. `/admin` y `/admin/profile` redirigen a `/admin/login`. Arquitectura Supabase Auth sin cambios. |
| Catalog | **PASS** | Home, `/productos`, detalle `cheesecake-de-durazno`, `/universos` 200. Locale `/en` 200. `/en/products` vacío porque los productos publicados no tienen traducción `en-US` (contenido, no regresión de código). |
| Profile | **PASS** | Customer/Admin profile + avatar en código. Bucket `deliverso-avatars` existe, **private**, 2 MB, JPEG/PNG/WEBP. Paths `customers/<id>/…`. Service role no está en cliente. |
| Cart | **PASS** | `/carrito` 200. Header usa `ShoppingCart` + `aria-label`. Pending: gap + primary/secondary + stack mobile. Confirming: “Estamos confirmando tu pago”, sin segundo cobro. |
| Checkout | **PASS** | Requiere sesión. Fecha y horario son `<select>` etiquetados. Labels humanos ES/EN. Al cambiar fecha se limpia horario. Review ya no muestra ISO. Server sigue rechazando combinación inválida. |
| Stripe | **PASS** | Flujo TEST ya validado en staging (PI succeeded → webhook HTTPS → Order PAID → cart CHECKED_OUT). Decline/3DS: no se reejecutó iframe en esta suite (frágil a propósito). Código no monta Payment Element si el PI es terminal. |
| Orders | **PASS** | Historial owner-only. Admin list/detail y transiciones de fulfillment en código; cada transición encola un EmailOutbox. |
| Email Outbox | **PASS** | Dispatch real 2026-09-21: 3 PENDING → SENT (`CUSTOMER_WELCOME`, `ORDER_PAID` ×2), 0 failed. Scheduler automático sigue pendiente (Hobby). |
| Admin | **PASS** | Login, profile (email/rol readonly), topbar logout. Rutas protegidas redirigen. |
| Responsive | **PASS** | Header/cart/checkout/payment usan stack mobile (`flex-col` + `sm:flex-row`) y targets 11. Verificado en código + HTML público. |
| Accessibility | **PASS** | Labels en inputs/selects, focus rings, cart `aria-label`, logout como `button`, avatar `alt`/aria del menú, errores `role=alert`. |
| Runtime logs | **PASS** | No hay 500 en las rutas públicas sondeadas. `/favicon.ico` local → 200 con el icono DELIVERSO. Staging queda 200 tras este deploy. Error boundaries usan `reset` y no exponen Prisma/secrets. |

## Operación interna

```
POST /api/internal/email-dispatch
POST /api/internal/maintenance
Authorization: Bearer <INTERNAL_CRON_SECRET>
```

Validado en staging:

- sin Bearer → **401**
- con secret local → **401** (el secret de Vercel no es el de `.env.local`; no se copió ni se guardó)

Dispatch real se ejecutó con `pnpm email:dispatch` contra la misma base (DEV/operación), no contra el Bearer de Vercel.

No hay loops. No hay secret en repo ni en cliente.

## Playwright

- `pnpm test` = Vitest (sin E2E)
- `pnpm test:e2e` = Playwright
- `PLAYWRIGHT_BASE_URL` default `http://localhost:3010`
- Staging: `PLAYWRIGHT_BASE_URL=https://deliverso-staging.vercel.app`
- Login opcional: `E2E_CUSTOMER_EMAIL` / `E2E_CUSTOMER_PASSWORD`

## Fixes en este módulo

- Favicon App Router (`src/app/icon.png`) y `public/favicon.ico` con el icono DELIVERSO existente
- Error boundaries: `reset` de Next, sin stacks
- Review de checkout: fecha humana, no ISO
- Avatar `alt` en header/perfil
- Fundación Playwright + smoke
- `docs/release/staging-acceptance.md`
