# Arquitectura DELIVERSO

## Objetivo del sistema

DELIVERSO es una aplicación web de comercio electrónico para una marca premium de pastelería. El nombre combina *delicioso* y *universo*: productos gastronómicos profesionales con experiencias y temáticas capaces de representar distintos universos para el cliente.

El sistema debe poder crecer hacia catálogo, productos configurables y personalizados, universos, carrito, cotizaciones, pedidos, pagos, entregas, promociones, contenido, administración, clientes y comunicaciones, sin que esa expansión obligue a fragmentar el producto en microservicios.

Este documento describe la fundación del Módulo 01. Las funcionalidades de negocio aún no están implementadas.

## Monolito modular

DELIVERSO se construye como un **monolito modular** orientado por dominios.

Un único despliegue Next.js concentra routing, UI, lógica de servidor y adaptadores. El interior se organiza por módulos de negocio para preservar límites claros y permitir extraer un módulo más adelante solo si aparece una razón operativa real.

## Separación de responsabilidades

| Área | Responsabilidad |
| --- | --- |
| `src/app` | Routing, layouts y composición de páginas |
| `src/modules` | Lógica de dominio futura, aislada por bounded context |
| `src/components` | Componentes de UI, layout y marca reutilizables |
| `src/design-system` | Tokens, tipografía y motion |
| `src/i18n` | Routing y request config de internacionalización |
| `src/config` | Configuración tipada de sitio, locales y monedas |
| `src/lib` | Utilidades puras compartidas (dinero, preferencias) |
| `src/server` | Código de servidor e integraciones encapsuladas |
| `src/types` | Tipos públicos reexportados |
| `src/styles` | CSS global y tokens visuales |

## Reglas de dependencia

1. `src/app` puede componer módulos y componentes. No debe contener reglas de negocio.
2. Los módulos no deben importar detalles de frameworks de UI innecesarios ni SDKs externos.
3. Las integraciones externas viven detrás de puertos en `src/server` (adaptadores).
4. El dominio no importa Stripe, un proveedor de divisas, un SDK de correo ni una base de datos concreta.
5. La configuración central (`src/config`) es la fuente de locales, monedas y valores no secretos del sitio.
6. Ningún componente hardcodea el dominio público. La URL sale de `NEXT_PUBLIC_APP_URL`.
7. Server Components son el comportamiento predeterminado. `"use client"` solo cuando hay interacción real de cliente.

## Módulos previstos

Carpetas creadas, sin lógica ficticia:

- `catalog`
- `business-lines`
- `universes`
- `customization`
- `cart`
- `checkout`
- `orders`
- `quotations`
- `payments`
- `delivery`
- `customers`
- `promotions`
- `auth`
- `cms`
- `audit`

## Estrategia de escalabilidad

La escala inicial se resuelve con un solo proceso Next.js, App Router y límites de módulo estrictos.

Si un dominio crece hasta exigir equipo, ciclo de release o perfil de carga independiente, puede extraerse sin reescribir el resto del sistema, porque las dependencias ya apuntan a contratos y no a implementaciones concretas.

No se introducen microservicios, buses ni paquetes internos prematuros.

## Internacionalización

- Idioma predeterminado: `es-MX`, sin prefijo de URL.
- Idioma secundario inicial: `en-US`, con prefijo `/en`.
- Añadir un idioma implica principalmente `src/config/i18n.ts`, un archivo en `messages/` y el prefijo correspondiente.
- Los textos de interfaz se resuelven por claves de traducción. No se duplican cadenas por idioma dentro de los componentes.
- El SEO internacional (canonical, alternates, hreflang, sitemap localizado) queda preparado a nivel de routing; la estrategia completa se implementará más adelante.
- `next-intl` emite ya `Link` headers de hreflang a través del proxy/middleware.

## Estrategia monetaria

- Moneda base del negocio: `MXN`.
- Monedas de visualización iniciales: `MXN`, `USD`, `EUR`, `CAD`, `GBP`.
- Añadir una moneda debe requerir, sobre todo, cambios de configuración (`src/config/currency.ts`), no de componentes de producto.
- Los importes de negocio se representan en **unidades menores enteras**. `$450.00 MXN` se modela como `45000`.
- El formateo visible usa `Intl.NumberFormat` con locale y currency. Nunca `"$" + price`.

## Precios maestros

Los precios maestros estarán expresados en MXN. Cualquier conversión de visualización se calcula desde esa base. Este módulo no persiste precios ni conecta una base de datos.

## Monedas de visualización

La moneda de visualización (*display currency*) es la que el usuario elige para ver importes convertidos. No implica automáticamente que el cobro se realice en esa moneda.

## Tipos de cambio

El tipo de cambio de **visualización** se obtiene en el servidor vía `ExchangeRateProvider` (Frankfurter v2 / ECB). Ver [Tipos de cambio](./exchange-rates.md).

El contrato `ExchangeRateProvider` en `src/server/exchange-rates` permite reemplazar el proveedor sin acoplar el catálogo a una API concreta.

Una cotización debe poder expresar:

- moneda base;
- moneda destino;
- tasa;
- timestamp de obtención;
- proveedor/fuente.

No hay tasas ficticias ni API simulada en este módulo.

### Reglas futuras (documentadas, no implementadas)

1. Los precios maestros estarán expresados en MXN.
2. Las conversiones de visualización se calcularán desde una tasa obtenida del servidor.
3. El navegador no será autoridad sobre la tasa de cambio.
4. Las tasas deberán tener caché con tiempo de expiración.
5. Si el proveedor externo falla, el sistema podrá usar de manera controlada la última tasa válida durante un período definido.
6. Nunca se utilizará silenciosamente una tasa indefinidamente obsoleta.
7. Debe registrarse proveedor, tasa y fecha/hora de obtención.
8. Cuando exista un pedido, la tasa utilizada deberá quedar congelada en ese pedido.
9. Un pedido antiguo nunca debe cambiar de valor solamente porque posteriormente cambie el mercado.
10. El precio mostrado al usuario puede variar antes del checkout si varía el tipo de cambio.
11. Durante checkout, el servidor deberá recalcular y confirmar los importes antes de crear el pago.
12. El frontend nunca será fuente de verdad sobre precio, descuento, tasa de cambio, total, impuesto ni costo de entrega.

## Display currency vs payment currency

Existen dos conceptos distintos:

- **Display currency**: moneda en la que se muestran importes convertidos.
- **Payment / presentment currency**: moneda en la que realmente se cobra.

Más adelante Stripe determinará qué monedas pueden usarse en checkout. La arquitectura admite dos caminos:

- **A.** Mostrar y cobrar en la moneda seleccionada cuando esté soportada como moneda de pago.
- **B.** Mostrar una conversión informativa y cobrar en MXN cuando la moneda no pueda utilizarse para el cobro.

## Seguridad de cálculos monetarios

- Nunca confiar en valores monetarios enviados por el cliente.
- Nunca confiar en precios calculados únicamente en el navegador.
- Nunca exponer secretos mediante variables `NEXT_PUBLIC_*`.
- Las claves privadas solamente estarán disponibles del lado servidor.
- Los pagos futuros deberán verificarse mediante servidor y webhooks.
- Los tipos de cambio se obtendrán del servidor.
- Las cantidades definitivas se recalcularán en backend.
- Las APIs externas estarán encapsuladas detrás de adaptadores.

## StorefrontShell

El storefront público se envuelve en `StorefrontShell`:

- SkipLink hacia `#main-content`
- Header sticky (logo, navegación, idioma, moneda, cuenta, carrito, menú mobile)
- `<main id="main-content">`
- Footer con slogan oficial y la misma fuente de navegación

La navegación pública vive en `src/config/navigation.ts` (hrefs). Los labels salen de i18n. Los pathnames localizados (`/productos` ↔ `/products`, etc.) están en `next-intl`.

`/design-system` no aparece en la navegación y sigue `noindex`.

## Persistencia (Módulo 05)

PostgreSQL (Supabase administrado) + Prisma ORM 7. El client es
server-only (`src/server/db`). Schema en `prisma/schema.prisma`.

Documentos:

- [Modelo de datos](./data-model.md)
- [Flujo de base de datos](./database-workflow.md)
- [CMS del Home](./home-cms.md)
- [Admin de catálogo](./catalog-admin.md)
- [Catálogo público](./catalog-public.md)
- [Tipos de cambio](./exchange-rates.md)
- [Carrito](./cart.md)
- [Cuentas de cliente](./customer-accounts.md)
- [Checkout](./checkout.md)
- [Fulfillment](./fulfillment.md)
- [Pedidos](./orders.md)
- [Pagos Stripe](./payments-stripe.md)
- [Configuración de producto](./product-configuration.md)
- [ADR-007](../adr/ADR-007-data-persistence.md)
- [ADR-010](../adr/ADR-010-display-currency.md)
- [ADR-011](../adr/ADR-011-cart-and-product-configuration.md)
- [ADR-012](../adr/ADR-012-customer-authentication.md)
- [ADR-013](../adr/ADR-013-checkout-and-fulfillment.md)
- [ADR-014](../adr/ADR-014-orders-and-stripe.md)
- [Emails transaccionales](./transactional-email.md)
- [ADR-015](../adr/ADR-015-transactional-email-outbox.md)

La Home **no** está conectada a Prisma. Sin `DATABASE_URL` el storefront
sigue funcionando con datos demo.

El panel `/admin` es independiente del locale. Autenticación: Supabase Auth +
`AdminAccount`. El storefront usa el **mismo** Auth con `CustomerAccount`.
Ver [admin-auth](./admin-auth.md), [customer-accounts](./customer-accounts.md),
[ADR-008](../adr/ADR-008-admin-authentication.md) y
[ADR-012](../adr/ADR-012-customer-authentication.md).

Checkout futuro exige `requireCustomer()`. No hay guest checkout.

## Home público

La portada vive en `src/modules/home/`. `src/app/[locale]/page.tsx` solo compone secciones.

El copy institucional (hero, intro, universos, personalización, propuesta de valor, CTA) está en i18n (`home`). El slogan oficial sigue en `brand.officialTagline`.

Los datos que cambiarán con frecuencia —showcase del Hero, productos destacados, orden, visibilidad— se consumen como props/estructura tipada. Hoy salen de `src/modules/home/demo/` (TEMPORARY HOME DEMO DATA). No son catálogo ni CMS.

El Hero visual es una composición centrada: producto | marca | producto. Consume un showcase de hasta 3 placements (`selectHeroShowcaseItems`); la UI usa izquierda y derecha como flancos. Hero Showcase y Featured Products son ubicaciones independientes.

## Administración futura del Home (no implementada)

Cuando exista Admin/CMS, el Home deberá recibir:

**Hero**
- estado activo;
- tono visual si hace falta;
- copy promocional opcional (el slogan institucional permanece en i18n);
- **HomeHeroShowcaseItem × N** (la UI muestra un máximo de 3; la persistencia no debe imponer exactamente 3).

Cada `HomeHeroShowcaseItem` se relacionará con `Product` y, de forma opcional, con `MediaAsset` para:

- A) usar la imagen principal del producto (`ProductMedia`);
- B) usar una imagen editorial específica del Hero.

Admin podrá: seleccionar producto, seleccionar/sustituir imagen, ordenar, activar/desactivar y definir el enlace al producto.

No duplicar `productName`, `productPrice` ni `productDescription` en el item del Hero.

**Destacados**
- selección de productos del catálogo (independiente del Hero);
- orden;
- visibilidad / activar-desactivar;
- imagen;
- título;
- copy promocional eventual.

**Secciones**
- activación o desactivación futura, si se decide.

**Footer / contacto público**
Valores temporales centralizados en `src/config/storefront-contact.ts`:

- Facebook, Instagram, TikTok (`href` opcional hasta que existan perfiles reales);
- correo;
- WhatsApp;
- dirección.

El Admin futuro editará esos campos. No duplicarlos en componentes.

No hay CRUD, tablas ni endpoints en este módulo. No se modela cada frase del Home como registro CMS.

## Preferencias de idioma y moneda

Valores predeterminados: `es-MX` y `MXN`.

Idioma:

- la URL es la fuente de verdad (`localePrefix: as-needed`);
- no hay redirección por `Accept-Language`, IP ni `navigator.language`;
- el selector resuelve la ruta equivalente en `/locale-switch` (server-side) para no reutilizar un slug de otro idioma.

Moneda:

- preferencia visual persistida en la cookie `deliverso_currency`;
- `SameSite=Lax`, `path=/`, `max-age` de un año;
- el valor se valida contra `supportedCurrencies`;
- un valor inválido (`ABC`, `BTC`, etc.) se ignora y se usa `MXN`;
- la cookie no es autoridad de precio, tasa ni checkout;
- no hay geolocalización ni tasas ficticias;
- tras guardar, `router.refresh()` deja lista la re-renderización futura de precios.

Orden de resolución previsto:

1. preferencia explícita guardada;
2. configuración del usuario autenticado;
3. contexto / localización;
4. valor predeterminado.

## Calidad

TypeScript se ejecuta en `strict` mode. No se usa `any`, `@ts-ignore` ni desactivación de lint para ocultar errores.
