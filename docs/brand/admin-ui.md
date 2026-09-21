# Interfaz Admin DELIVERSO

El panel no dibuja un dispositivo alrededor. Es una aplicación de escritorio
administrativa, coherente con la marca y distinta del storefront.

## Estructura

```
TOPBAR
────────────────────────────────
SIDEBAR NAVY │  CANVAS CREAM
             │  título + cards
```

- Sidebar: 264px aprox., fondo `--deliverso-navy`, logo para superficie oscura.
- Canvas: cream y superficies claras.
- Selección activa: Gold sutil + indicador lateral.
- Purple / Pink / Lilac solo como acento.

## Tipografía

Manrope para UI, formularios y navegación.
Cormorant aparece mínimamente en el login (nombre de marca).

## Responsive

Desktop: sidebar persistente.
Tablet/móvil: topbar compacto, botón 44×44, navegación en `<dialog>` accesible
(Escape, foco, `aria-expanded`), cards a una columna.

## Login

Fondo cream, logo, tarjeta de correo/contraseña, botón «Iniciar sesión».
Sin sidebar, sin carrito, sin selector de moneda.

## Coherencia

Mismos tokens de marca que el storefront. No es un SaaS gris genérico.
No reutiliza `StorefrontShell`, `ProductCard` ni la navegación pública.
