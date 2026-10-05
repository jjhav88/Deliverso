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

Admin puede editar slugs. No hay tabla de redirects históricos (requiere migration). Cambiar un slug publicado rompe la URL anterior.

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
