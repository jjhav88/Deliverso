# Design System DELIVERSO

Fundación visual del Módulo 02. La página interna `/design-system` (y `/en/design-system`) permite revisar cada primitive.

## Paleta

| Marca | Hex | Rol |
| --- | --- | --- |
| Cream | `#FFF6E9` | Fondo |
| Navy | `#234166` | Texto, primary, estructura |
| Purple | `#44294E` | Secondary, profundidad |
| Gold | `#DDA333` | Accent limitado |
| Lilac | `#A38CBF` | Acento complementario |
| Pink | `#EE92A6` | Acento gastronómico |

Gold, Lilac y Pink no se usan como texto pequeño sobre Cream cuando el contraste falla. Gold no es color de cuerpo.

Estados funcionales documentados:

- Destructive `#7A3344`
- Success `#3F6B58`
- Warning `#8A5B12`

## Jerarquía de color

La pantalla permanece tranquila: Cream + Navy. Purple en momentos premium. Gold en microdetalles. Lilac y Pink, puntuales.

## Tipografía

- **Cormorant Garamond** (`next/font`): Display XL, Display L, H1, H2.
- **Manrope** (`next/font`): H3, H4, body, labels, captions, botones, formularios, precios.

Escala con `clamp()` en displays y headings mayores. Clases: `.type-display-xl` … `.type-caption`.

## Spacing

Escala de 4 px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120.

- Gutter mobile 16, tablet 24, desktop 32.
- Ancho de contenido 72rem, narrow 42rem, wide 88rem.
- `Container` aplica max-width, centrado y gutters.

## Radios

`sm` 4, `md` 8, `lg` 12, `xl` 16, `full` píldora. Cards en `xl`. Evitar burbujas.

## Sombras

Navy tintado, nunca negro duro. Elevación real por borde, superficie y espacio.

## Botones

Variantes: primary, secondary, outline, ghost, destructive, accent. Tamaños sm/md/lg. Focus visible, disabled con opacidad y saturación, loading con `aria-busy`. Estilos compartidos vía `buttonClassName` para enlaces.

## Formularios

Input, Textarea y Select nativo. Label visible, helper, error con `role="alert"`, `aria-invalid`. El placeholder no sustituye al label.

## Cards

Primitive composable (`Card` … `CardFooter`) y dos patrones visuales:

- `ProductCard`: fotografía dominante (placeholder, `media` o `next/image` vía `imageSrc`), badge opcional, **precio opcional** con `formatMoney` cuando hay `price` + `locale`, CTA como botón o enlace (`ctaHref`). Variante `editorial` (imagen + título + microcopy, casi sin caja) para el Home. Sin catálogo.
- `FeaturedCard`: bloque destacado de dos columnas. El Home público usa `ProductCard` `editorial` para la franja de destacados.

`BrandLogo` admite `alt` opcional. En el Hero el isotipo es decorativo (`alt=""`) porque el H1 ya anuncia DELIVERSO. El wrapper y el PNG se renderizan con `opacity: 1`, `filter: none`, `mix-blend-mode: normal` y fondo transparente.

## Accesibilidad

Objetivo WCAG 2.2 AA. Focus visible, targets táctiles ≥ 40–44 px, semántica de landmarks en la página interna, contraste revisado para texto. Gold queda como acento.

## Motion

`--duration-fast|normal|slow` y `--easing-standard|emphasized`. CSS only. `prefers-reduced-motion` reduce transiciones y animaciones de forma global.

## Cosmos

Acentos SVG (`OrbitDecoration`, `StarAccent`) con `aria-hidden`. Nunca protagonistas.
