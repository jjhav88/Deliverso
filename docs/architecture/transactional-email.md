# Emails transaccionales

DELIVERSO todavía **no** tiene dominio propio. DEV funciona sin
`pedidos@deliverso.com.mx`.

## Flujo

```
Evento de negocio → EmailOutbox → dispatcher → EmailProvider → Resend
```

Webhook Stripe, registro de cliente y transiciones de Admin **no**
llaman a Resend. Solo escriben negocio + outbox y hacen COMMIT.

## Modos

| Mode | Outbox | Provider |
| --- | --- | --- |
| `disabled` | se crea | no se contacta |
| `sandbox` | guarda email real | envía a `EMAIL_SANDBOX_RECIPIENT` |
| `enabled` | guarda email real | envía al destinatario real |

`EMAIL_MODE=enabled` se rechaza si `NODE_ENV !== production`.

## Remitente

`EMAIL_FROM_ADDRESS` es 100% configurable. En DEV usar la dirección
que Resend permita para la cuenta de prueba.

Cuando exista el dominio:

```
EMAIL_FROM_ADDRESS=pedidos@deliverso.com.mx
EMAIL_REPLY_TO=contacto@deliverso.com.mx
EMAIL_MODE=enabled
```

sin cambiar templates ni business logic.

## Event keys

```
customer:<id>:welcome:v1
order:<id>:paid:v1
order:<id>:fulfillment:CONFIRMED:v1
```

Constraint unique. No backfill automático.

## Dispatcher

- `pnpm email:dispatch`
- `POST /api/internal/email-dispatch` con `Authorization: Bearer <INTERNAL_CRON_SECRET>`
- Lote de 20
- `FOR UPDATE SKIP LOCKED`
- Timeout de proveedor 10s
- Reintentos: ahora, +5m, +30m, +2h, +12h, luego DEAD

## Scripts DEV

```
pnpm email:test
pnpm email:enqueue-paid DEL-260920-WTSWU2
pnpm email:dispatch
```

Prohibidos en production. No crean Order de muestra. No cambian
estado de pedido.

## Logo

En DEV se usa wordmark textual **DELIVERSO**. No incrustar `localhost`.
Producción usará un logo HTTPS.

## Producción (M15A)

No hay loops ni timers dentro de Next.js.

```
scheduler/cron (cada 5 min)
→ GET|POST /api/internal/email-dispatch
Authorization: Bearer <INTERNAL_CRON_SECRET|CRON_SECRET>
```

Maintenance (cada 30 min) incluye `recoverStaleEmailOutbox()`:

PROCESSING con `processingStartedAt` (o `updatedAt`) más antiguo de 10 minutos vuelve a PENDING.

Si Resend aceptó y la app murió antes de SENT, el reintento usa `eventKey` como idempotency key del provider. No se tocan filas SENT.

## Release gate (futuro enabled)

- dominio comprado y verificado en Resend
- SPF / DKIM
- DMARC recomendado
- `EMAIL_FROM_ADDRESS` corporativo
- `EMAIL_REPLY_TO` real

**DOMAIN VERIFICATION PENDING FOR PRODUCTION.**
