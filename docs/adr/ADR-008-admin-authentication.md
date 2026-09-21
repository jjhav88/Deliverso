# ADR-008 — Autenticación administrativa

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

DELIVERSO necesita un panel `/admin` real sin abrir un signup público, sin
guardar passwords en Prisma y sin romper el storefront i18n.

## Decisión

### Supabase Auth

La infraestructura Postgres ya es Supabase. Auth profesional (hashing, refresh,
rate limit) queda en el proveedor. No se usa NextAuth, Clerk ni JWT propio.

### Passwords fuera de Prisma

`AdminAccount` solo guarda identidad de aplicación (`authUserId`, email, role,
status). Las credenciales viven en `auth.users`, fuera del schema DELIVERSO.

### Roles en la DB de DELIVERSO

El rol no se lee de metadata de cliente ni de claims manipulables.
`AdminAccount.role` es la autoridad. `SUPER_ADMIN` y `ADMIN` entran ahora;
los guards finos llegan después.

### Sin signup público

Crear administradores es un acto privado (Dashboard + `pnpm admin:grant`).
No existe `/admin/register` ni auto-promoción.

### Admin fuera de i18n

`/admin` es una ruta estática hermana de `[locale]`. El proxy único excluye
Admin del middleware de next-intl y solo refresca la sesión de Supabase.
El panel habla español. El storefront conserva `es-MX` / `en-US`.

## Consecuencias

- El storefront no muestra Header/Footer/moneda dentro de Admin.
- Sin `DATABASE_URL` o claves Auth, `requireAdmin` redirige a login y el
  build público no se rompe.
- El CMS del Home (Módulo 07) reutilizará el mismo shell y `requireAdmin`.
