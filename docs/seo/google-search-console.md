# Google Search Console — DELIVERSO

Cursor no puede verificar la propiedad ni solicitar indexación. Julio debe completar estos pasos con su cuenta de Google.

`site:deliverso.com.mx` **no** es un contador exacto de páginas indexadas. Search Console es la fuente principal.

## 1. Crear propiedad

1. Abrir [Google Search Console](https://search.google.com/search-console).
2. Crear una propiedad **de dominio**: `deliverso.com.mx`.
3. Preferir Domain property para cubrir `http`/`https` y `www`/`non-www`.
4. Verificar por DNS (registro TXT que indique Google). No usar un archivo HTML en el repo salvo que el DNS no sea viable.

## 2. Enviar sitemap

Tras verificar:

`https://www.deliverso.com.mx/sitemap.xml`

## 3. Inspeccionar URLs

Usar la herramienta de inspección en:

- `https://www.deliverso.com.mx/`
- `https://www.deliverso.com.mx/productos`
- una ficha de producto publicada
- `https://www.deliverso.com.mx/universos`
- una ficha de universo publicada
- `https://www.deliverso.com.mx/nosotros`
- `https://www.deliverso.com.mx/contacto`

Comprobar:

- indexabilidad
- canonical seleccionado por Google
- rastreo

## 4. Solicitar indexación

Solicitar indexación de las URLs clave anteriores si Search Console lo permite.

## 5. Staging

Confirmar que `https://deliverso-staging.vercel.app` **no** aparece como indexable. Debe tener `noindex`.

## 6. Rich Results

Probar en [Rich Results Test](https://search.google.com/test/rich-results):

- Home → Organization / WebSite
- Producto → Product
- Producto / universo → BreadcrumbList

Validar también el JSON-LD (sintaxis) en [Schema Markup Validator](https://validator.schema.org/).

Warnings legítimos (p. ej. Offer sin `availability` porque no hay autoridad de stock) se documentan; no se inventan campos para silenciarlos.

## 7. Búsqueda de marca

Tras indexación, buscar `DELIVERSO` y `site:deliverso.com.mx` de forma manual. Interpretar `site:` como muestra, no como inventario.

## 8. Google Business Profile

No se implementa en código. Solo tiene sentido si DELIVERSO opera un local físico o área de servicio pública verificable. Hoy el schema es `Organization`, no `LocalBusiness`.
