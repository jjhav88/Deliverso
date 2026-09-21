# ADR-016: Production readiness técnico

## Estado

Aceptada. Módulo 15A.

## Contexto

M14/M14B dejaron outbox + Stripe TEST validados. Falta endurecer operación sin activar LIVE, dominio ni email enabled.

## Decisión

1. **Maintenance jobs** en `src/modules/maintenance`, orquestados por `runMaintenanceJobs()`. Idempotentes.
2. **Reconciliation** consulta Stripe y reusa `processStripePaymentIntentEvent`. El webhook sigue siendo primario.
3. **Cron** preparado en `vercel.json` (5 min email, 30 min maintenance). Auth: `INTERNAL_CRON_SECRET` o `CRON_SECRET`, timing-safe. GET+POST para Vercel Cron. No se ejecuta solo en local.
4. **Stale email:** `processingStartedAt`; PROCESSING > 10 min vuelve a PENDING. Idempotencia Resend = `eventKey`.
5. **Seguridad:** CSP explícita (Stripe + Supabase, `frame-ancestors 'none'`), cookies Secure en production, health/readiness sin secretos, env validation centralizada, logger estructurado sin PII.

## Consecuencias

- Staging puede usar `*.vercel.app` y TEST/sandbox.
- LIVE, dominio y `EMAIL_MODE=enabled` siguen bloqueados por gates documentados.
- Rate limiting productivo queda como proveedor externo opcional.
