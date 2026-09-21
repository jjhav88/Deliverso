# ADR-015: Email transaccional con outbox y Resend

## Estado

Aceptada. Módulo 14.

## Contexto

El storefront ya tiene CustomerAccount, Order inmutable y webhook Stripe
como autoridad de pago. Hace falta comunicación transaccional sin
acoplar Resend al webhook ni al Admin, y sin dominio propio todavía.

## Decisión

1. **Outbox.** Los procesos de negocio solo encolan `EmailOutbox`.
   El envío ocurre después, en un dispatcher.
2. **Abstracción `EmailProvider`.** Resend es el proveedor inicial.
   La lógica de negocio no importa Resend.
3. **Sandbox por defecto.** `EMAIL_MODE=sandbox` conserva el destinatario
   real en DB y envía a `EMAIL_SANDBOX_RECIPIENT`.
4. **Idempotencia.** `eventKey` único + idempotencia de Stripe webhook.
   Un `payment_intent.succeeded` duplicado produce un solo `ORDER_PAID`.
5. **Reintentos acotados.** 5 intentos, luego `DEAD`. Un fallo de email
   no revierte Order, pago ni fulfillment.
6. **Concurrency.** Claim atómico con `FOR UPDATE SKIP LOCKED`.
7. **Dominio futuro.** Cuando exista `deliverso.com.mx`, solo cambian
   env/DNS/Resend. No se reescribe la arquitectura.

## Consecuencias

- DOMAIN VERIFICATION PENDING FOR PRODUCTION.
- `EMAIL_MODE=enabled` está prohibido fuera de production.
- Supabase Auth sigue enviando confirmación y reset.
- No hay backfill de pedidos o clientes existentes.
