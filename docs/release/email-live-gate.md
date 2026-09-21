# Email LIVE gate

No poner `EMAIL_MODE=enabled` todavía.

Checklist futura:

- [ ] Dominio verificado en Resend
- [ ] SPF / DKIM / DMARC
- [ ] FROM corporativo (`pedidos@…`)
- [ ] Reply-To real
- [ ] QA sandbox completa (M14/M14B)
- [ ] `EMAIL_MODE=enabled` **solo** en production
- [ ] Cron de dispatch (cada 5 min) + recovery stale
- [ ] Sin unsubscribe (son transaccionales)

`enabled` fuera de production provoca fail-fast.
