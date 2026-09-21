# ADR-007 — Persistencia de datos

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

DELIVERSO necesita un core de catálogo, media y Home persistente antes de
conectar el storefront, el Admin o los pagos. El riesgo es acoplar la UI a
un ORM, persistir dinero en flotantes, o filtrar secretos de base al
navegador.

## Decisión

### PostgreSQL

El sistema de registro es PostgreSQL. Relacional, UUID, `timestamptz`,
constraints e índices encajan con catálogo multilingual y dinero entero.

### Supabase

Supabase se usa en este módulo **solo** como PostgreSQL administrado.
No se instala `@supabase/supabase-js`. No hay Storage ni Auth todavía.

### Prisma ORM 7

Prisma 7 estable (`prisma`, `@prisma/client`, `@prisma/adapter-pg` alineados).
No se usa Prisma 8 RC. El acceso runtime es:

Browser → Next.js Server → Prisma + adapter `pg` → PostgreSQL (Supabase)

### Server-only

El client vive en `src/server/db/prisma.ts`, marcado con `server-only`.
La UI, Client Components y tipos de presentación no importan Prisma.
La cadena es UI → application/domain → repository → Prisma.

### Conexiones

- `DATABASE_URL`: runtime, preferiblemente pooled (serverless).
- `DIRECT_URL`: CLI y migrations (conexión directa).
- `SHADOW_DATABASE_URL`: opcional, solo para `migrate dev`.
  Nunca la base de producción.

Prisma 7 eliminó `datasource.directUrl` del config. El CLI recibe
`DIRECT_URL` (con fallback a `DATABASE_URL`) en `prisma.config.ts`.
El client de aplicación lee únicamente `DATABASE_URL` vía
`src/server/db/env.ts`.

### UUID

Las entidades principales usan UUID. Los slugs localizados serán el
mecanismo público de URL.

### Unidades menores

Los precios maestros se guardan en enteros `priceMinor` (MXN).
No se persisten conversiones USD/EUR. `null` es “sin precio”; `0` no lo es.

### Tablas Translation

Los nombres visibles no viven solo en español. Cada agregado traducible
tiene `*Translation` con `locale` string. Añadir un idioma no exige
migración de enum.

### Abstracción de media

`MediaAsset` guarda `bucket` + `objectPath`. Está preparado para Supabase
Storage posterior. No se crean buckets ni signed URLs en este módulo.

### Hero Showcase como placement

El Hero ya no es una sola imagen. `HomeHeroShowcaseItem` es un placement
visual (producto y/o media), independiente de `HomeFeaturedProduct`.
La DB no fuerza exactamente 3 filas; la application limita el abanico.

## Consecuencias

- El storefront actual funciona sin `DATABASE_URL`.
- La primera migration remota queda pendiente hasta existir Supabase DEV.
- El Módulo 06 podrá leer el core sin reabrir el modelo de dinero, i18n
  o media, siempre que respete el límite UI ↔ Prisma.
