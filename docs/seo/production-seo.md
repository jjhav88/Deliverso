# SEO de producción — DELIVERSO

Canonical de autoridad: `https://www.deliverso.com.mx`

ES sin prefijo. EN en `/en`. `x-default` apunta a la versión ES.

## Arquitectura

Next.js Metadata API (`generateMetadata`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`). No hay un CMS SEO paralelo. Helpers en `src/modules/seo/`.

`NEXT_PUBLIC_APP_URL` (aliases `NEXT_PUBLIC_SITE_URL` / `SITE_URL`) debe ser `https://www.deliverso.com.mx` en producción.

## Política de indexación

| Entorno | Index |
| --- | --- |
| `VERCEL_ENV=production` + origin www | `index,follow` en páginas públicas |
| Staging, preview, localhost | `noindex,nofollow` + `X-Robots-Tag` |

No se trata todo `*.vercel.app` como noindex: el deployment de producción de Vercel también usa ese hostname interno.

## Canonical

Cada página indexable emite canonical absoluto www. Cada idioma tiene canonical propio. Open Graph `url` replica el canonical.

## hreflang

Páginas equivalentes: `es-MX`, `en-US`, `x-default` → ES. Inglés thin (nombre sin descripción útil) no entra a sitemap ni a `alternates`.

La autoridad de hreflang es la Metadata API (HTML). El middleware de next-intl no emite `Link` `hreflang` (`alternateLinks: false`): no puede saber si un Product/Universe dinámico tiene traducción EN real, y anunciaría 404. Home, catálogo, universos, nosotros y contacto siguen anunciando ES+EN+x-default en HTML y sitemap.

## robots.txt

Producción: `Allow: /`, `Disallow` de rutas privadas y `/api/`, sitemap `https://www.deliverso.com.mx/sitemap.xml`.

Staging: `Disallow: /` **y** noindex real (meta + header). No se usa robots.txt como único mecanismo.

## sitemap.xml

Solo entorno indexable. Incluye home, productos, universos, nosotros, contacto y equivalentes EN de UI; productos `PUBLISHED` y universos activos con traducción útil. `lastModified` = `updatedAt` real. Sin `priority`/`changefreq` inventados.

## Rutas privadas

Admin, cuenta, auth, carrito, checkout, pago, pedidos, cotizaciones de cliente, design-system, términos/aviso placeholder: `noindex,nofollow`. Fuera del sitemap. Header `X-Robots-Tag` en esas rutas.

La ficha pública de un producto `CUSTOM_QUOTE` sí puede indexarse si el contenido es útil. Las páginas `/cotizaciones/*` del cliente no.

## Filtros y paginación

`?q=`, categoría, universo, tipo: `noindex`. Paginación sin filtros: indexable con canonical propio (`?page=n`), no a la página 1.

## Metadata

Plantilla `%s | DELIVERSO`. Home usa title absoluto para no duplicar marca. Descriptions únicas por home, catálogo, universos, nosotros y contacto.

## JSON-LD (server)

- Home: `Organization` + `WebSite` (sin `SearchAction`, sin `LocalBusiness`, sin reseñas).
- Producto: `Product` + `Offer` solo STANDARD/CONFIGURABLE con precio real MXN. Sin `availability` inventada. `CUSTOM_QUOTE` sin Offer.
- BreadcrumbList alineado al breadcrumb visible.

## Trailing slash

Next.js por defecto sin slash final. Una sola forma.

## Slugs

El slug de un producto `PUBLISHED` no se edita desde Admin (UI read-only + rechazo en la server action). Un `DRAFT` sí puede cambiar el slug, incluida la reactivación desde archivo. Un `ARCHIVED` que ya tuvo `publishedAt` queda bloqueado.

No hay tabla de historial de slugs ni registry de redirects (deuda futura: SEO slug history / redirect registry). Un cambio de slug publicado requiere una migración SEO puntual con redirect 308 en `src/modules/seo/permanent-redirects.ts` y un script one-off, no el formulario.

Redirect vigente M20B:

- `/productos/cheescake-de-zarzamora` → `/productos/cheesecake-de-zarzamora` (308)

No existe ficha EN de ese producto; no se inventó `/en/products/...`.

## Dominios y HTTP

Autoridad: `https://www.deliverso.com.mx`.

| URL | Resultado observado (M20B) |
| --- | --- |
| `https://www.deliverso.com.mx` | 200, Next.js, `Server: Vercel` |
| `https://deliverso.com.mx` | 308 → `https://www.deliverso.com.mx/` (`Server: Vercel`) |
| `http://deliverso.com.mx` | 403 antes de Next.js (sin `Server: Vercel`, sin `X-Matched-Path`) |
| `http://www.deliverso.com.mx` | 403 igual |

DNS A de apex y www: `216.150.16.65` / `216.150.16.193` (anycast Vercel). NS: `dnsr001.mcm.net.mx`. El 403 HTTP llega a IPs de Vercel pero no a la app Next; no se añade middleware HTTP→HTTPS en Next.

Acción humana (Julio / Vercel Dashboard → Settings → Domains):

1. Confirmar `www.deliverso.com.mx` como dominio de producción.
2. Confirmar `deliverso.com.mx` como redirect permanente a www, preservando path.
3. Revisar Firewall / Deployment Protection: HTTP no debe bloquearse.
4. Si el 403 en puerto 80 continúa, abrir ticket a Vercel. Next.js no puede corregirlo.

## Producto retirado

- Nunca volverá: 404.
- Cambió slug: redirect 301 solo cuando exista mapa histórico.
- Temporalmente no vendible pero útil: puede permanecer publicado con estado comercial real.

## Tabla de política

### PUBLIC INDEX

- `/`
- `/productos`
- producto publicado con copy útil
- `/universos`
- universo publicado con copy útil
- `/nosotros`
- `/contacto`

### CONDITIONAL

- Contenido EN solo si la traducción es completa y útil.

### NOINDEX

- account / auth
- cart / checkout / payment / orders
- quotes de cliente
- admin / internal / design-system
- términos y aviso mientras sean placeholder
- preview / staging / localhost
- combinaciones de filtros de catálogo

## Overrides futuros (V2)

## Validación

```bash
pnpm seo:audit
pnpm seo:audit https://www.deliverso.com.mx
```

Rich Results y Search Console son checklist humano; ver `docs/seo/google-search-console.md`.
