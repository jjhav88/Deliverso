# ADR-005 — Design System

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

El Módulo 01 dejó esqueletos de tokens, tipografía y motion. Antes de construir Home, catálogo o administración hace falta un lenguaje visual propio, accesible y repetible. Instalar shadcn tal cual habría importado una estética de dashboard.

## Decisión

Construir primitives propias sobre tokens CSS y Tailwind v4, sin shadcn.

- Los hex de marca viven en tokens, no en componentes.
- La UI se compone de primitives (`Button`, `Input`, `Card`…) sin lógica de negocio.
- Gold, Lilac y Pink se usan con parsimonia para no teatralizar el cosmos.
- Tipografía: Cormorant Garamond + Manrope, cargadas con `next/font`.
- Accesibilidad como restricción de diseño, no como capa posterior.
- Escalabilidad visual: añadir un componente significa usar tokens existentes, no inventar color ni radio.

## Consecuencias

- Identidad DELIVERSO reconocible desde las primitives.
- Home y catálogo futuros pueden componer sin rediseñar fundamentos.
- Superficies oscuras existen como contexto, no como theme switcher.
- Lucide cubre iconografía funcional; la decoración cósmica es SVG mínimo.
