# CMS del Home, Media y Settings

El módulo 07 conecta Admin con el storefront. No hay JSON genérico: el copy vive en campos tipados.

## HomePage

Singleton `id = 11111111-1111-4111-8111-111111111111`.

Las lecturas públicas **no crean** filas. Admin `save` hace `upsert`.

`HomePageTranslation` (`es-MX`, `en-US`) guarda copy editable. No guarda `DELIVERSO` ni el slogan oficial.

Prioridad en storefront:

1. translation configurada
2. fallback i18n

Semántica de copy:

- `null` = no configurado → fallback i18n
- `""` = el administrador lo dejó vacío a propósito → no renderizar
- cualquier texto = usar ese texto

Un campo en blanco que **nunca** se había guardado sigue en `null` (fallback). Si el admin escribe y después borra, se persiste `""`.

`heroHeadline` se muestra como mensaje promocional adicional (no sustituye `DELIVERSO` ni el slogan).

## HomeHero

Se reutiliza `HomeHero` + `HomeHeroShowcaseItem`.

`sortOrder`:

- 0 = izquierda
- 1 = derecha principal
- 2 = derecha secundaria (abanico)

La UI solo edita 3 slots. El renderer aplica:

- 0 imágenes → placeholders editoriales
- 1 → foto grande a la derecha
- 2 → izquierda + derecha
- 3 → una izquierda + dos superpuestas a la derecha

No hay foto debajo del CTA. El copy central vive en su propia columna.

`productId` puede ser null. `mediaAssetId` apunta a la biblioteca.

### Object position (futuro)

Los frames usan `object-contain` para no recortar logotipos incrustados en la foto.

Un Admin futuro podría exponer `object-position`:

- center
- top
- bottom
- left
- right

No está implementado en este módulo.

La visibilidad de secciones se guarda en `HomePage`. Featured Products y
Universos del Home usan `HomeFeaturedProduct` / `HomeFeaturedUniverse`
cuando hay selección real; si no, el demo actual. Ver
[catalog-admin.md](./catalog-admin.md).

## SiteSettings

Singleton `id = 22222222-2222-4222-8222-222222222222`.

`SocialLink` por plataforma (`FACEBOOK`, `INSTAGRAM`, `TIKTOK`), unique.

Si no hay fila de settings, el Footer usa la config temporal. Tras el primer save, campos vacíos o redes inactivas **no se renderizan**.

## Flujo Admin

`requireAdmin()` en cada Server Action.

Tras guardar: `revalidatePath("/", "layout")` y `/en`.
