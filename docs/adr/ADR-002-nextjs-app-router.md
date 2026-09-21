# ADR-002 — Next.js App Router

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

DELIVERSO es una aplicación de comercio electrónico con requisitos de SEO, internacionalización, renderizado en servidor, rutas públicas y, más adelante, operaciones autenticadas y APIs de servidor. Había que elegir entre un SPA de React servido por Vite y Next.js con App Router.

## Decisión

Usar **Next.js 16 con App Router** como framework full-stack. No se usa Vite.

## Por qué no React SPA + Vite

Un SPA clásico entrega un único bundle al navegador y resuelve routing, datos y SEO en cliente o mediante capas adicionales. Para una tienda premium eso implica:

- peor punto de partida para SEO internacional (hreflang, metadata, sitemap, canonical);
- más trabajo para renderizar contenido indexable;
- una API y un frontend separados desde el día uno, aunque el equipo sea el mismo;
- Server Components, mutaciones de servidor y routing localizado tendrían que reconstruirse alrededor de Vite.

Next.js App Router cubre de forma nativa:

- Server Components por defecto;
- metadata localizada;
- routing por segmentos, compatible con `next-intl`;
- Route Handlers y lógica de servidor en el mismo sistema;
- build y despliegue de producción sin un segundo framework.

Vite sigue siendo excelente para SPAs y herramientas internas. No es el mejor encaje para un storefront público, localizado y con autoridad de servidor sobre precios y pagos.

## Consecuencias

- `src/app` se limita a routing y composición.
- El servidor es la autoridad para dinero, autenticación y pagos futuros.
- El stack se mantiene en un solo runtime (Next.js + TypeScript + pnpm).
- El Design System y las features se añaden sobre esta base, no sobre un cliente desacoplado.
