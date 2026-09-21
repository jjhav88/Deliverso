# Admin de catálogo (Módulo 08)

Herramientas internas para BusinessLine, Category, Universe y Product.
El catálogo público vive en [catalog-public.md](./catalog-public.md).

## Publicación

Estados: `DRAFT`, `PUBLISHED`, `ARCHIVED`.

Archivar oculta el producto sin borrarlo. **Eliminar** sí borra el registro
y sus relaciones (traducciones, variante, categorías, universos, featured).
No borra `MediaAsset`: las fotos siguen en la biblioteca.

Para publicar se exige:

- traducción `es-MX` con name y slug;
- BusinessLine;
- ProductType;
- imagen principal (`ProductMedia` PRIMARY);
- precio en la variante default si el tipo no es `CUSTOM_QUOTE`.

La traducción `en-US` **no** es obligatoria. El storefront inglés omite
el producto hasta que exista esa traducción. No hay fallback silencioso
a español en `/en`.

`publishedAt` se escribe la primera vez. Ediciones posteriores no lo
reemplazan. Archivar pone `ARCHIVED` + `archivedAt`. Reactivar vuelve a
`DRAFT` (nunca a PUBLICADO en el mismo paso).

## Precio

El Admin pide un decimal MXN (`450.00`). Server-side
`moneyInputToMinor()` lo convierte a `priceMinor` entero (`45000`).
`CUSTOM_QUOTE` puede persistir `null`. `0` es un precio real, no cotización.

Todo producto STANDARD/CONFIGURABLE creado desde Admin tiene una
`ProductVariant` default (`isDefault`, `currencyCode = MXN`).

## Media

Quitar una imagen borra `ProductMedia`, no `MediaAsset`.
Universe usa `featuredMediaAssetId` nullable con `onDelete: SetNull`.

## Home

`HomeFeaturedProduct` (máx. 3, solo PUBLISHED) y `HomeFeaturedUniverse`
(máx. 4, solo ACTIVE) no duplican nombre, precio ni imagen. Si no hay
configuración, el Home oculta esas secciones. No hay productos demo.

Precios destacados solo se muestran en MXN. No hay conversión FX en este
módulo. `CUSTOM_QUOTE` muestra “Solicitar cotización”, nunca `$0`.

## Auditoría

`PRODUCT_CREATED/UPDATED/PUBLISHED/ARCHIVED/DELETED`,
`UNIVERSE_*`, `CATEGORY_*`, `BUSINESS_LINE_*`. Metadata: ids, status y
cambios generales. Sin dumps de descripciones.
