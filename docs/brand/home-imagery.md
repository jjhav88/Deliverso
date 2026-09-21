# Imagen para el Home de DELIVERSO

El Hero de referencia es una composición centrada (producto | marca | producto),
no una sola imagen panorámica ni un abanico geométrico.

Hasta que existan fotografías locales, los laterales usan slots premium
preparados para sustituirse. No se descargó stock ni se usan URLs remotas.

## Hero (producto izquierdo / derecho)

- **Composición desktop:** producto a la izquierda, marca al centro, producto a la derecha.
- **Mobile:** marca centrada arriba; productos visibles debajo.
- **Cantidad visible típica:** 2 fotografías laterales. Un tercer placement (`center`) es apoyo opcional cuando Admin asigne `imageSrc`.
- **Ratio:** 3:4, recorte de mesa.
- **Master por frame:** ~1200×1600. Peso < 350 KB WebP cada una.
- **Protagonista:** pastel o postre a escala de mesa, fondo controlado.
- **Alt:** descriptivo del producto cuando exista. Vacío si el frame es decorativo.

Hero Showcase y Featured Products siguen siendo selecciones independientes.

Campo previsto: `HomeHeroShowcaseItem` (`productId?`, `mediaAssetId?`, orden, visibilidad, enlace). La application muestra como máximo 3. La UI actual coloca `left`/`right` como flancos y `center` solo si hay fotografía.

## Productos destacados

- **Cantidad inicial:** 3 (máximo 4).
- **Ratio:** 3:4, coherente con `ProductCard`.
- **Master:** ~1200×1600.
- **Fondo controlado:** cream, piedra o madera clara.
- **Estilo:** fotografía gastronómica real.

Cuando existan archivos, pasar `imageSrc` y un `imageAlt` descriptivo. Hasta entonces las cards usan placeholders de estudio.

## Universos

- Imágenes conceptuales **opcionales**.
- Genéricas: celebración, fantasía, elegancia, personalizado.
- **No usar** IP de terceros.

## Qué no pedir todavía

- Sets de 8K.
- Renders 3D de planetas.
- Bancos de stock con licencia dudosa.
- Collages de marca ajena.
