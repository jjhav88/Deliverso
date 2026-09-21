# Stripe LIVE gate

No activar nada de esta lista en M15A.

Checklist futura:

- [ ] Cuenta Stripe activada / business verification
- [ ] Live keys (`sk_live_` / `pk_live_`) solo en production
- [ ] Webhook LIVE + `STRIPE_WEBHOOK_SECRET` live
- [ ] Dominio HTTPS
- [ ] Legal gates cerrados
- [ ] E2E de pago en TEST completo
- [ ] Email enabled (ver email-live-gate)
- [ ] Reconciliation job habilitado vía cron
- [ ] Mismatch TEST/LIVE detectado (livemode vs keys)

El código ya rechaza claves LIVE fuera de `NODE_ENV=production`.
