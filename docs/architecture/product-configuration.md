# Configuración de producto

Aplica a `ProductType.CONFIGURABLE`.

## Grupos

`ProductOptionGroup`:

- `selectionType`: SINGLE | MULTIPLE
- `isRequired`, `minSelections`, `maxSelections`
- SINGLE exige `maxSelections = 1`
- required exige `minSelections >= 1`

## Opciones

`ProductOption.priceDeltaMinor` ≥ 0 en esta versión.
El Admin captura "50.00" y persiste `5000`.

## Público

Solo `group.isActive` y `option.isActive` de un producto PUBLISHED.
SINGLE = radio. MULTIPLE = checkbox.
No hay selección por defecto: el usuario elige.

El preview del cliente es UX. Add to Cart valida y recalcula en servidor.

## Validación al agregar

Producto publicado, type permitido, variant activa,
options del producto, activas, required, min/max, sin IDs ajenos
ni duplicados. CUSTOM_QUOTE no entra al carrito.
