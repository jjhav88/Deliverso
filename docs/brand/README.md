# Marca DELIVERSO

## Identidad

DELIVERSO combina pastelería profesional con universos temáticos. La identidad debe evolucionar hacia un registro premium, gastronómico, mágico, sofisticado y contemporáneo. Se evita un aspecto excesivamente infantil.

## Color

| Token | Hex | Uso inicial |
| --- | --- | --- |
| Cream | `#FFF6E9` | Background |
| Navy | `#234166` | Foreground y primary |
| Purple | `#44294E` | Secondary |
| Gold | `#DDA333` | Accent |
| Lilac | `#A38CBF` | Acento complementario |
| Pink | `#EE92A6` | Acento complementario |

Los tokens CSS viven en `src/styles/tokens.css`. Los equivalentes TypeScript viven en `src/design-system/tokens`.

Lilac y Pink no se usan de forma simultánea ni decorativa en este módulo.

## Logos

Los archivos vigentes son PNG con fondo transparente. Se copiaron a nombres canónicos sin redibujar ni comprimir:

| Archivo original | Destino |
| --- | --- |
| `logo1.png` | `public/brand/logos/deliverso-logo-icon-color.png` |
| `logo_2_blanco_y_negro.png` | `public/brand/logos/deliverso-logo-monochrome.png` |
| `logo_color.png` | `public/brand/logos/deliverso-logo-color.png` |

- `deliverso-logo-icon-color.png`: isotipo a color (batidor / órbita), 660×378.
- `deliverso-logo-monochrome.png`: isotipo y wordmark en blanco, 590×423. Superficies oscuras.
- `deliverso-logo-color.png`: isotipo y wordmark a color, 447×559. Superficies cream.

`BrandLogo` elige el archivo según `surface` y `mark`. Ya no hay recorte para ocultar un fondo JPEG.

## Tipografía y motion

- Display / editorial: **Cormorant Garamond**
- UI / cuerpo: **Manrope**

Cargadas con `next/font/google` en el layout raíz. Motion discreto en CSS, con respeto a `prefers-reduced-motion`.

Documentación extendida:

- [Design System](./design-system.md)
- [Lenguaje visual](./visual-language.md)
- [Tono de voz](./voice.md)
- [Imagen del Home](./home-imagery.md)
