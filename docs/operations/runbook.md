# Runbook operacional

No ejecutar jobs automáticamente en local. No LIVE. No `EMAIL_MODE=enabled` todavía.

## App down

1. `GET /api/health` — si no responde, el proceso Next no está arriba.
2. Revisar logs del host (Vercel/local). No hay secretos en health.

## DB unavailable

1. `GET /api/readiness` → 503 si `SELECT 1` falla.
2. Header/badges degradan (cliente/carrito vacíos). Auth crítica falla cerrada, no como logout.
3. Códigos transitorios: `08006`, timeout, reset, pool. Ver `src/server/db/errors.ts`.

## Webhook failure

1. Stripe Dashboard → eventos. El webhook es la autoridad.
2. Logs: `eventId`, `eventType`, `paymentIntentId`, `result`. Sin payload completo.
3. Si el evento se perdió: el job `reconcilePendingPayments` reusa `processStripePaymentIntentEvent`.

## Email backlog

```
POST /api/internal/email-dispatch
Authorization: Bearer <INTERNAL_CRON_SECRET|CRON_SECRET>
```

O `pnpm email:dispatch` en DEV.

PROCESSING huérfano (>10 min) vuelve a PENDING vía maintenance.

Si el provider aceptó y la app murió antes de SENT: el reintento usa `eventKey` como idempotency key de Resend.

## Payment reconciliation

Corre dentro de `POST /api/internal/maintenance`. Solo `PENDING_PAYMENT` con PI conocido y antigüedad ≥ 5 min. Valida amount, currency, paymentIntentId, metadata `orderId`/`orderNumber`. No sustituye al webhook.

## Maintenance

```
POST /api/internal/maintenance
Authorization: Bearer <secret>
```

Jobs: recover stale email, reconcile payments, expire pending orders, expire checkout drafts, abandon carts.

Vercel Cron (futuro, no activado como deployment):

- email-dispatch cada 5 minutos
- maintenance cada 30 minutos

## Rate limiting (futuro, opcional)

No hay limiter in-memory (inútil en serverless). Si hace falta: Upstash/Redis u WAF del host. Endpoints sensibles: login, register, forgot password, checkout, create payment, `/api/internal/*`, webhook (firma Stripe).
