# Backups y migraciones

## Backups (Supabase)

- Backups automáticos del plan de Supabase (PITR si el plan lo incluye).
- RPO conceptual: hasta el último backup/PITR disponible del plan.
- RTO conceptual: restaurar proyecto o clone + apuntar `DATABASE_URL`/`DIRECT_URL`.
- No borrar datos como “limpieza”. Carts se marcan `ABANDONED`; drafts `EXPIRED`.

## Restore (concepto)

1. Identificar backup/PITR.
2. Restaurar a un proyecto o instancia nueva.
3. Rotar `DATABASE_URL` / `DIRECT_URL`.
4. Smoke: `/api/health`, `/api/readiness`, login admin, un pedido TEST.

## Release de schema

1. Backup / confirmar PITR.
2. `pnpm db:migrate:deploy` (nunca `migrate dev` en prod).
3. Deploy de la app que entiende el schema nuevo.
4. Smoke test.
5. Rollback: revertir deploy de app; schema forward-only salvo plan explícito. No editar migrations históricas.

M15A añade `EmailOutbox.processingStartedAt` (nullable). Compatible con filas existentes.
