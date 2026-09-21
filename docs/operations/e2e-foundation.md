# E2E foundation

Playwright está instalado como `devDependency`. No forma parte de `pnpm test` ni de `pnpm build`.

## Comandos

```
pnpm test
pnpm test:e2e
```

`PLAYWRIGHT_BASE_URL` apunta al origen bajo prueba.

- Local (default): `http://localhost:3010`
- Staging: `https://deliverso-staging.vercel.app`

El comando local no arranca Next ni Vercel. Hay que tener la app en `:3010` o exportar otra URL.

Si `pnpm exec playwright install chromium` no puede bajar el browser (red/timeout), usar Chrome del sistema:

```
PLAYWRIGHT_CHANNEL=chrome
PLAYWRIGHT_BASE_URL=https://deliverso-staging.vercel.app
pnpm test:e2e
```

## Smoke cubierto

- `/` carga
- `/productos` carga
- `/cuenta/iniciar-sesion` carga
- `/cuenta` redirige si no hay sesión
- `/admin/login` carga
- `/carrito` carga
- `GET /api/health` → 200
- `GET /api/readiness` → 200
- `GET /favicon.ico` → 200

Stripe Payment Element queda fuera de la suite.

## Login opcional

Si existen `E2E_CUSTOMER_EMAIL` y `E2E_CUSTOMER_PASSWORD` en el entorno local, `tests/e2e/auth.optional.spec.ts` inicia sesión. Si faltan, el caso se omite. No guardar contraseñas en el repo.
