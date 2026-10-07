# ADR-022: Cumplimiento legal y de privacidad

## Estado

Aceptada. Módulo 21.

## Contexto

DELIVERSO está en producción en `https://www.deliverso.com.mx` y trata cuentas, pedidos, cotizaciones, pagos (Stripe) y correos transaccionales. Hacía falta una capa legal mexicana sin inventar identidad del responsable ni un CMP de adorno.

## Decisión

1. **No fake legal data.** Razón social, RFC, domicilio, teléfono y correos legales quedan vacíos hasta que Julio los capture en Admin. Los textos interpolan “pendiente de publicación”.
2. **Documentos versionados.** `LegalDocument` con DRAFT / PUBLISHED / ARCHIVED. El público solo ve PUBLISHED. Cambiar un publicado crea una versión nueva.
3. **Aceptación explícita de Términos en la compra.** Checkbox obligatorio, no preseleccionado, validado en servidor en checkout y al aceptar una cotización.
4. **Aviso de Privacidad separado.** No se trata como contrato comercial. Registro y formularios enlazan el aviso; no hay checkbox contractual innecesario en el registro.
5. **LegalAcceptance mínimo.** Customer, tipo, versión, fecha. Sin IP ni fingerprint.
6. **Snapshot en Order.** Versiones de términos, entrega y reembolsos. Pedidos y clientes previos no se rellenan.
7. **Sin analytics todavía.** No Google Analytics, no píxeles, no email de marketing.
8. **Sin banner de cookies innecesario.** Inventario esencial → no CMP.
9. **ARCO manual.** `PrivacyRequest` se recibe y resuelve en Admin tras verificar identidad. Sin dump automático ni hard-delete de pedidos.
10. **ES-MX primario.** EN legal es informativo, `noindex`, no equivalente jurídico.
11. **SEO legal.** `noindex, follow`. Públicas, en footer, fuera del sitemap.

## Consecuencias

- Admin muestra advertencia de configuración incompleta hasta tener identidad real.
- Los textos son borradores técnicos; requieren abogado mexicano.
- Instalar GA u otra cookie no esencial obliga a CMP y bloqueo previo, en un módulo posterior.
