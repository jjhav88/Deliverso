# ADR-006 — Storefront shell

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

DELIVERSO necesitaba un marco público reutilizable (header, footer, idioma, moneda) sin catálogo. El Home definitivo se implementó después sobre el mismo shell.

## Decisión

- Un `StorefrontShell` de servidor envuelve todas las rutas `[locale]`.
- Header y Footer son Server Components. El Header no es un Client Component completo.
- Islas cliente mínimas: navegación activa (`usePathname`), selector de idioma, selector de moneda, menú `<dialog>`.
- Las traducciones se resuelven en servidor y se pasan como props a esas islas. `NextIntlClientProvider` sigue con `messages={{}}`.
- La navegación se define una sola vez en `src/config/navigation.ts`. Los pathnames localizados los aplica `next-intl`.
- El locale viaja en la URL. La moneda se persiste en cookie, validada, sin Redux/Zustand.

## Consecuencias

- El cambio ES/EN conserva la ruta equivalente mediante pathnames.
- Leer la cookie en el shell puede dynamizar el render del storefront; es aceptable antes del catálogo.
- El carrito es solo un enlace; no hay estado ni contador ficticio.
