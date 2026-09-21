# Flujo de base de datos

## Roles de URL

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Prisma Client en runtime (pooled). |
| `DIRECT_URL` | Prisma CLI y migrations (directa). |
| `SHADOW_DATABASE_URL` | Opcional. Shadow DB de `migrate dev`. |

Nunca versionar `.env`, `.env.local` ni `.env.*.local`.
Nunca crear `NEXT_PUBLIC_DATABASE_URL` ni
`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

## Desarrollo

1. Copiar `.env.example` a `.env.local` con credenciales DEV reales.
2. Revisar el SQL generado.
3. Aplicar con `pnpm db:migrate:dev`.
4. Si Prisma propone **RESET**: detenerse. No aceptar en automático.
5. Regenerar el client con `pnpm db:generate` si el CLI no lo hizo.

La primera migration prevista se llama `init_core_catalog`.

## Producción

1. Backup de la base **antes** de migrar.
2. Revisar el SQL de las migrations pendientes.
3. Aplicar solo `pnpm db:migrate:deploy`.
4. Nunca `migrate dev` en producción.
5. `db push` no es la estrategia de release.

No existe el script `db:reset`. Un reset no debe ser un comando cómodo.

## Shadow database

`prisma migrate dev` necesita una shadow DB para diff.
Si Supabase/pooler no permite crearla implícitamente, usar
`SHADOW_DATABASE_URL` apuntando a una base **vacía y dedicada**.

Nunca usar producción como shadow.

## Scripts

| Script | Comando |
| --- | --- |
| `pnpm db:format` | `prisma format` |
| `pnpm db:validate` | `prisma validate` |
| `pnpm db:generate` | `prisma generate` |
| `pnpm db:migrate:dev` | `prisma migrate dev` |
| `pnpm db:migrate:deploy` | `prisma migrate deploy` |
| `pnpm db:studio` | `prisma studio` |

`format` / `validate` / `generate` no exigen credenciales.
`migrate` y `studio` sí.

## Client generado

Salida: `src/generated/prisma` (gitignored).
No editar código generado. Tras clonar el repo: `pnpm db:generate`.

## Smoke test

Si existe `DATABASE_URL` DEV, comprobar conectividad con `SELECT 1`
mediante Prisma (`smokeDatabase`). No insertar datos comerciales.

## Home

Mientras no exista wiring, la Home usa demo data. Un fallo o ausencia
de base no debe tumbar el storefront público.
