# Migrations

Development: `pnpm db:migrate:dev`  
Production: `pnpm db:migrate:deploy`

Migrations in this repo:

1. `20260915140000_init_core_catalog`
2. `20260915140100_admin_foundation`
3. `20260916180000_home_cms_and_site_settings`

Apply with `pnpm db:migrate:deploy` (or `pnpm db:migrate:dev` in DEV).
If Prisma proposes RESET, stop. Do not accept it automatically.

Never run `migrate dev` against production. Never use the production
database as a shadow database. There is no `db:reset` convenience script.
