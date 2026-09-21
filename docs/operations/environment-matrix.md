# Environment matrix

Valores reales no se documentan aquí. Solo presencia y rol.

| Variable | Local | Preview/Staging | Production | Public/Server-only | Required | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| NEXT_PUBLIC_APP_URL | optional (`http://localhost:3010`) | required (`*.vercel.app`) | required (future domain) | Public | Production | No hardcode de dominio. HTTPS en producción. |
| DATABASE_URL | required | required | required | Server-only | All | Pooled Supabase. |
| DIRECT_URL | required for migrate | optional | required for migrate deploy | Server-only | Development | Nunca pooler. |
| SHADOW_DATABASE_URL | optional | — | never | Server-only | Optional | Solo `migrate dev`. |
| NEXT_PUBLIC_SUPABASE_URL | required | required | required | Public | All | Auth + Storage. |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | required | required | required | Public | All | Nunca service role. |
| SUPABASE_URL | optional | optional | optional | Server-only | Optional | Alias. |
| SUPABASE_SERVICE_ROLE_KEY | optional | optional | if media admin | Server-only | Optional | Nunca `NEXT_PUBLIC_`. |
| AUTH_SECRET | unused | unused | unused | Server-only | Optional | Reservado. Auth es Supabase. |
| STRIPE_SECRET_KEY | TEST | TEST | LIVE only after gate | Server-only | Optional | LIVE prohibido fuera de production. |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | TEST | TEST | LIVE after gate | Public | Optional | Debe coincidir el modo. |
| STRIPE_WEBHOOK_SECRET | TEST | TEST | LIVE after gate | Server-only | Optional | Raw body + firma. |
| RESEND_API_KEY | sandbox | sandbox | after email gate | Server-only | Optional | |
| EMAIL_MODE | `sandbox` / `disabled` | `sandbox` | `enabled` only after gate | Server-only | Optional | `enabled` fail-fast fuera de production. |
| EMAIL_FROM_ADDRESS | Resend test | Resend test | corporate after DNS | Server-only | If enabled | |
| EMAIL_REPLY_TO | optional | optional | real after gate | Server-only | Optional | |
| EMAIL_SANDBOX_RECIPIENT | required if sandbox | required if sandbox | n/a | Server-only | If sandbox | |
| INTERNAL_CRON_SECRET | for local curl | required | required | Server-only | If cron used | Bearer timing-safe. |
| CRON_SECRET | alias | Vercel Cron | Vercel Cron | Server-only | Optional | Aceptado junto a INTERNAL. |
| EXCHANGE_RATE_* | optional | optional | optional | Server-only | Optional | Display FX. Nunca autoridad de cobro. |

## Categorías

- **APP:** `NEXT_PUBLIC_APP_URL`
- **DATABASE:** `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`
- **SUPABASE:** URLs y keys
- **STRIPE:** secret / publishable / webhook
- **EMAIL:** Resend + modo
- **CRON:** `INTERNAL_CRON_SECRET`, `CRON_SECRET`
