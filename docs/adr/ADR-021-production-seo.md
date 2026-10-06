# ADR-021: SEO de producción

## Estado

Aceptada. Módulo 20.

## Contexto

DELIVERSO ya está publicado en `https://www.deliverso.com.mx`. Hacía falta una base SEO profesional sin duplicar la Metadata API de Next.js, sin schema falso y sin indexar staging ni rutas privadas.

## Decisión

1. **Canonical www.** Autoridad `https://www.deliverso.com.mx`. Apex y HTTP los normaliza la plataforma (Vercel/DNS), no un redirect en la app que pueda crear bucles.
2. **ES default.** `es-MX` sin prefijo. EN en `/en`. `x-default` → ES.
3. **Staging nunca indexa.** `VERCEL_ENV !== production`, host staging, o origin distinto de www → `noindex,nofollow` y `X-Robots-Tag`. No bloquear todo `*.vercel.app`.
4. **Rutas privadas noindex.** Admin, cuenta, carrito, checkout, pago, pedidos, cotizaciones de cliente. Fuera del sitemap.
5. **Sitemap dinámico.** Solo URLs públicas, canónicas, publicadas y con copy útil. `lastModified` real. Sin `priority`/`changefreq` arbitrarios.
6. **Inglés incompleto.** Opción A: la URL existe, `noindex`, fuera de sitemap y hreflang hasta que haya descripción útil.
7. **JSON-LD server-rendered.** Organization + WebSite en Home. Product + Offer real para STANDARD/CONFIGURABLE. CUSTOM_QUOTE sin Offer. BreadcrumbList alineado a UI. Sin LocalBusiness, reseñas, GTIN, SKU, ratings o dirección inventada.
8. **Sin SearchAction** mientras no exista búsqueda pública adecuada.
9. **Sin tabla de historial de slugs.** Un producto `PUBLISHED` no cambia de slug desde Admin. Los redirects puntuales viven en `src/modules/seo/permanent-redirects.ts` (308). Un registry de historial se justifica aparte.
10. **Sin GA, cookie banner ni Stripe LIVE.** SEO es ortogonal.

## Consecuencias

- Staging mal configurado con `NEXT_PUBLIC_APP_URL` de producción ya no emite sitemap de producción ni `Allow: /`.
- Fichas EN thin dejan de competir como duplicados.
- Offer no declara `InStock` porque el sistema no tiene autoridad de inventario.
- Cambiar un slug publicado sigue siendo un riesgo SEO hasta que exista historial de redirects. M20B bloquea la edición libre y deja el registry de historial como deuda.
