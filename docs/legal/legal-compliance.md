# Cumplimiento legal y de privacidad (M21)

Estado técnico de DELIVERSO. Los textos públicos son **borradores de cumplimiento** alineados al software. La versión jurídica definitiva debe ser revisada por un **asesor legal mexicano** antes de considerarse operación LIVE en sentido legal.

No se publicaron razón social, RFC, domicilio, teléfono legal ni correos de privacidad inventados.

## Estado actual

- Páginas públicas: Aviso de Privacidad, Términos (`/terminos`, alias 308 `/terminos-y-condiciones`), Entregas y recogidas, Cancelaciones y reembolsos, Cookies, Derechos ARCO.
- ES-MX es la versión jurídica primaria. EN muestra el texto ES con aviso de que no es equivalente jurídico (`noindex, follow`).
- Páginas legales: públicas, enlazadas en el footer, `noindex, follow`, fuera del sitemap.
- Checkout y aceptación de cotización exigen checkbox de Términos (no preseleccionado) y validación en servidor.
- El pedido guarda `termsVersion`, `deliveryPolicyVersion`, `refundPolicyVersion`. Pedidos anteriores quedan en `null`.
- `LegalAcceptance` registra tipo y versión. No guarda IP ni fingerprint.
- Solicitudes ARCO: recibida → revisión → verificación manual → resolución. Sin descarga ni borrado automático.
- No hay banner de cookies: el inventario actual es solo esencial. No hay Google Analytics ni publicidad.

## Configuración legal requerida

En Admin → Configuración, sección Identidad legal:

- nombre / razón social del responsable
- RFC (si aplica)
- domicilio legal
- teléfono
- correo de contacto (ya existía)
- correo de privacidad / ARCO

Si falta alguno, Admin muestra **Configuración legal incompleta**. El storefront no se bloquea.

## Versionado

`LegalDocument`: DRAFT / PUBLISHED / ARCHIVED. Solo PUBLISHED se muestra al público. Editar un publicado exige un borrador nuevo. Admin: `/admin/legal`.

Auditoría: `LEGAL_DOCUMENT_PUBLISHED`, `LEGAL_DOCUMENT_ARCHIVED` (sin duplicar el cuerpo).

## ARCO

Público: `/privacidad/derechos-arco`. Admin: `/admin/legal/privacy-requests`.

No existe eliminación destructiva de cuenta ni de pedidos históricos.

## Cookies

Ver `docs/legal/cookie-inventory.md`. Decisión: **no CMP required by current technical scope**.

## Terceros

Ver mapa de datos. Supabase, Stripe, Resend y Vercel operan la infraestructura. No se afirma automáticamente que sean “transferencias” en sentido jurídico.

## Facturación

No hay CFDI ni facturación fiscal en el alcance actual. Pendiente de negocio.

## Revisión jurídica pendiente

- identidad del responsable
- plazos de conservación
- política de menores / capacidad contractual
- calificación de encargados y transferencias
- redacción definitiva de todos los documentos
- zonas/puntos de fulfillment reales (los textos remiten a la configuración vigente, no inventan cobertura nacional)
