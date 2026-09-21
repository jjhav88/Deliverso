# E2E foundation

Playwright **no** estaba en el repo. Se evalúa introducirlo cuando exista URL de staging (`*.vercel.app`) y un `NEXT_PUBLIC_APP_URL` estable.

Motivo de no instalarlo en M15A:

- añade browsers y tiempo de CI
- no hay deployment de staging todavía
- `pnpm test` (Vitest) es el gate actual

Smoke futuros (sin iframe de Stripe):

- storefront `/` carga
- login `/cuenta/iniciar-sesion` y `/admin/login` cargan
- `/productos` carga
- carrito exige flujo de cookie/sesión
- admin login page visible

Stripe Payment Element se deja fuera del primer paquete E2E.
