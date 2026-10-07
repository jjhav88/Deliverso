# Mapa de datos personales (M21)

Solo tratamiento observado en el código y el esquema actuales. No se inventan finalidades.

Leyenda de visibilidad Customer: si el titular puede ver el dato en cuenta, pedido, cotización o perfil.

| Dato | Origen | Finalidad | Base funcional | Dónde se almacena | Tercero/proveedor | Retención actual | Customer-visible |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Email | Registro / Auth / checkout / cotización / ARCO | Cuenta, pedido, soporte, correos transaccionales, ARCO | Prestación del servicio | `CustomerAccount`, `Order`, `Quotation` snapshots, `EmailOutbox`, `PrivacyRequest`, Supabase Auth | Supabase Auth, Resend, Vercel (hosting) | Mientras exista cuenta/pedido/outbox. Sin política jurídica de borrado. | Sí (cuenta) |
| Contraseña | Registro / login | Autenticación | Prestación del servicio | Hash en Supabase Auth. DELIVERSO no guarda password. | Supabase Auth | Según Auth | No |
| Nombre / displayName | Perfil, checkout, cotización | Identificar al cliente y el pedido | Prestación del servicio | `CustomerAccount`, snapshots de Order/Quotation | — | Mientras exista registro | Sí |
| Teléfono | Perfil, checkout, cotización | Contacto operativo y fulfillment | Prestación del servicio | `CustomerAccount`, Order/Quotation snapshots | — | Mientras exista registro | Sí |
| Avatar | Perfil | Imagen de cuenta | Prestación del servicio (opcional) | Storage privado (path en `CustomerAccount` / `AdminAccount`) | Supabase Storage | Hasta que se reemplace o quite | Sí |
| Dirección de entrega | Checkout / cotización | Entregar el pedido | Prestación del servicio | `OrderAddress`, `QuoteAddress` | — | Historial del pedido/cotización. No hay directorio reutilizable de direcciones. | Sí (en el pedido) |
| Instrucciones / notas | Checkout, pickup, cotización | Fulfillment | Prestación del servicio | Order, PickupLocation, Quotation | — | Historial | Sí |
| Pedido (productos, importes MXN, estados) | Checkout / conversión de cotización | Comprar, producir, entregar, soporte, reembolsos | Prestación del servicio / obligaciones operativas | `Order`, `OrderItem`, eventos | Stripe (importes/ids de pago) | Historial. No hay hard-delete. | Sí |
| Método, zona, pickup, fecha, ventana | Checkout | Fulfillment | Prestación del servicio | Order snapshots + catálogo de zonas/puntos | — | Historial del pedido | Sí |
| Promoción aplicada | Carrito/checkout | Calcular total | Prestación del servicio | Snapshots en Order | — | Historial | Sí |
| Cotización y mensajes | Formulario autenticado | Preparar oferta | Prestación del servicio | `Quotation`, `QuoteMessage`, `QuoteOffer` | Resend (avisos) | Historial | Sí |
| Imágenes de referencia | Cotización | Entender la solicitud | Prestación del servicio | `QuoteAttachment` + Storage privado | Supabase Storage | Mientras exista la cotización | Sí (propias) |
| PaymentIntent ID, estado, importe | Stripe + app | Cobrar | Prestación del servicio | `Order`, `PaymentAttempt` | Stripe | Historial. **No se almacena PAN/CVC.** | Parcial (estado/importe) |
| Reembolsos | Admin + Stripe | Devolver fondos | Prestación / postventa | `Refund`, `RefundEvent` | Stripe | Historial | Sí (estado, no plazos bancarios) |
| EmailOutbox | Eventos transaccionales | Entregar correos de pedido/cuenta/cotización/cancelación | Prestación del servicio | `EmailOutbox` | Resend | Historial operativo | No |
| AdminAccount | Bootstrap / login admin | Operar el backoffice | Operación interna | `AdminAccount` | Supabase Auth | Mientras exista admin | No (interno) |
| AdminAuditLog | Acciones admin | Trazabilidad | Seguridad operativa | `AdminAuditLog` (acción, recurso, metadata; no cuerpo legal completo) | — | Historial | No |
| LegalAcceptance | Checkout / aceptación de cotización | Saber qué versión aceptó el cliente | Prestación / evidencia mínima | `LegalAcceptance` | — | Desde el deploy en adelante. Sin backfill. | No (interno) |
| PrivacyRequest | Formulario ARCO | Recibir y revisar derechos | Atención de derechos | `PrivacyRequest` | — | Hasta resolución administrativa | No (el titular no ve el expediente admin) |
| Cookie `deliverso_cart` | Storefront | Carrito | Esencial | Cookie httpOnly 30d | — | 30 días | N/A |
| Cookie `deliverso_currency` | Preferencia | Mostrar precios | Esencial / funcional | Cookie 1 año | — | 1 año | N/A |
| Cookie `NEXT_LOCALE` | next-intl | Idioma | Esencial / funcional | Cookie | — | Según next-intl | N/A |
| Cookies `sb-*-auth-token` | Supabase Auth | Sesión | Esencial | Cookie | Supabase | Sesión Auth | N/A |
| Logs técnicos de hosting | Vercel / app | Operar y depurar | Seguridad / operación | Infraestructura | Vercel | Según el proveedor | No |

## Qué no se trata (hoy)

- Marketing, newsletters, perfilado, publicidad
- Google Analytics u otros trackers
- PAN/CVC de tarjeta
- localStorage / sessionStorage en el storefront
- Eliminación automática de cuenta
- CFDI / facturación fiscal

## Conservación

No hay plazos jurídicos publicados. Pedidos y pagos se conservan como historial operativo. Una solicitud de cancelación de datos se atiende como ARCO con revisión manual; no borra pedidos pagados de forma automática.
