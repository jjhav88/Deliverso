# ADR-009 — Content and media

## Status

Accepted

## Context

DELIVERSO necesita un CMS del Home, biblioteca de fotos y datos públicos de contacto sin catálogo todavía.

## Decision

1. **Supabase Storage** para archivos. La infra Auth/DB ya es Supabase. Un bucket público dedicado evita copiar a `public/`.
2. **MediaAsset** separado del blob. El path en Storage no es el contrato del storefront; bucket + objectPath sí.
3. **Copy tipado** (`HomePageTranslation`) en vez de un JSON CMS. Validación Zod, evolución por migration, i18n por locale.
4. **SiteSettings + SocialLink** normalizados. Las redes cambian; no eternizar `facebookUrl` en una fila plana.

## Consequences

- Uploads y deletes son server-only y pasan por `requireAdmin()`.
- El storefront puede funcionar sin filas CMS (fallback i18n / config temporal).
- Productos destacados y Universos reales esperan el módulo de catálogo.
