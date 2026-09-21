# Catálogo público (Módulo 09)

El storefront lee PostgreSQL/Prisma. No hay mocks comerciales.
Solo `Product.status = PUBLISHED`. `DRAFT` y `ARCHIVED` responden 404
en detalle, igual que un slug inexistente.

## Queries

`src/modules/catalog/public/queries.ts`

- `getPublishedProducts`
- `getPublishedProductBySlug`
- `getPublishedProductsByUniverse`
- `getActiveCategories`
- `getActiveUniverses`
- `getActiveUniverseBySlug`
- `getRelatedProducts`
- `getSitemapCatalogEntries`

La UI no llama Prisma. `ProductCard` recibe DTOs.

## Locales

- `es-MX` exige traducción española.
- `en-US` exige traducción inglesa.
- Si falta `en-US`, el producto **no** aparece en `/en/products`
  ni tiene página inglesa. No se mezcla español en `/en`.

## Precios

Fuente: variante default activa, `currencyCode` MXN.
`Money { amountMinor, currency }` queda listo para el Módulo 10.

Hasta entonces no hay FX. Si el selector está en USD/EUR/CAD/GBP,
el importe sigue siendo MXN y se etiqueta como MXN.
No hay tasa mock.

- STANDARD: precio.
- CONFIGURABLE: “Desde …”.
- CUSTOM_QUOTE: “Solicitar cotización” / “Precio bajo cotización”.
  En orden por precio, CUSTOM_QUOTE va al final.

## Slugs

El slug público vive en `ProductTranslation`. Cambiar un slug deja
el anterior en 404. No hay `SlugHistory` todavía (riesgo SEO).

El selector de idioma conserva el slug actual de la URL. Si ES y EN
usan slugs distintos, el salto de idioma puede 404 hasta que exista
un mapeo de slugs alternos.

## Home

Featured Products / Universes solo si Admin configuró filas reales
y el locale tiene traducción. Sin configuración, la sección se oculta.
Los demos de `src/modules/home/demo/` quedan para Design System / tests.

## Cache

Páginas de catálogo `force-dynamic`. Tras publish/update/archive,
`revalidateStorefront()` invalida Home, `/productos`, `/universos`
y equivalentes EN.

## Fuera de este módulo

Carrito, checkout, Stripe, opciones configurables, reviews, favoritos
y FX en tiempo real.
