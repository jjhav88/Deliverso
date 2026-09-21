# ADR-001 — Monolito modular

- Estado: Aceptada
- Fecha: 2026-09-14

## Contexto

DELIVERSO debe nacer como un producto coherente de comercio electrónico y crecer hacia catálogo, personalización, pedidos, pagos, entregas, CMS y administración. Existe la tentación temprana de partir el sistema en microservicios para “preparar la escala”.

En esta etapa el equipo, el dominio y el tráfico aún no justifican una red de servicios independientes. Lo que sí se necesita es una estructura interna que no se convierta en un monolito caótico.

## Decisión

Construir DELIVERSO como un **monolito modular** sobre Next.js:

- un único sistema desplegable;
- módulos de dominio en `src/modules`;
- integraciones externas detrás de adaptadores;
- sin microservicios, APIs internas ni paquetes de dominio prematuros.

## Por qué no microservicios

Los microservicios introducen latencia de red, contratos versionados, observabilidad distribuida, consistencia eventual y coste operativo desde el primer día. Esos costes solo se compensan cuando hay límites de equipo, de carga o de ciclo de vida realmente independientes.

DELIVERSO todavía comparte un solo producto, un solo modelo comercial y una sola interfaz. Fragmentarlo ahora duplicaría trabajo sin aportar aislamiento útil.

El monolito modular conserva la opción de extraer un módulo más adelante, porque las dependencias se dirigen a contratos y no a implementaciones concretas.

## Consecuencias

- Desarrollo, pruebas y despliegue más simples.
- Fronteras de dominio explícitas desde el inicio.
- Posibilidad futura de extraer un módulo sin reescribir el resto.
- Disciplina de imports y de adaptadores como mecanismo de escala, no la red.
