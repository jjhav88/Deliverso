# ADR-003 — Internacionalización

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

DELIVERSO nace en México y debe poder atender audiencias en otros idiomas. El español es el idioma de la marca. El inglés es el primer idioma adicional. Más adelante podrán aparecer francés, portugués u otros.

La URL pública no debe exigir un prefijo para el idioma predeterminado, y el dominio no debe hardcodearse en componentes.

## Decisión

- Biblioteca: `next-intl`, compatible con App Router.
- Locale predeterminado: `es-MX`.
- Locales soportados inicialmente: `es-MX`, `en-US`.
- Estrategia de prefijo: `as-needed`.
  - Español: `/`
  - Inglés: `/en`
- Configuración central en `src/config/i18n.ts`.
- Mensajes en `messages/es-MX.json` y `messages/en-US.json`.
- Detección automática por `Accept-Language` desactivada en este módulo, para que `/` muestre siempre español de forma predecible.

## Rutas

El segmento interno `[locale]` recibe el identificador BCP 47 (`es-MX`, `en-US`). El prefijo visible de inglés es `/en`, no `/en-US`. Añadir `/fr` o `/pt` consistirá en registrar el locale, su prefijo y su archivo de mensajes.

La URL canónica del sitio se leerá de `NEXT_PUBLIC_APP_URL`. Nunca se escribe `deliverso.mx` en componentes.

## Traducciones

Ningún texto visible relevante de interfaz se duplica por idioma dentro de un componente. Los componentes consumen claves. Este módulo solo traduce la página provisional y la metadata mínima.

## SEO internacional futuro

La arquitectura queda alineada con:

- canonical;
- alternates;
- hreflang (el middleware de `next-intl` ya emite `Link` headers);
- sitemap localizado;
- metadata localizada.

La estrategia SEO completa no forma parte de este módulo.

## Consecuencias

- Español es el idioma por defecto, sin prefijo.
- Inglés es alcanzable en `/en`.
- Añadir idiomas es un cambio de configuración, no de páginas.
- Un selector visual de idioma se pospone a un módulo posterior.
