# Autenticación administrativa

El panel vive en `/admin` y no comparte i18n ni `StorefrontShell` con el storefront.

## Supabase Auth

Las credenciales (email + password) las guarda **Supabase Auth**.
DELIVERSO no almacena `password`, `passwordHash` ni `salt`.

No hay signup público ni `/admin/register`.
Los administradores se crean fuera de la app (Dashboard de Supabase)
y se autorizan con un `AdminAccount` en PostgreSQL.

## AdminAccount ↔ Auth

```
Supabase Auth User
        │ auth.users.id
        │ (authUserId, sin FK Prisma)
        ↓
   AdminAccount
```

Prisma no toca el schema `auth`. `authUserId` es un UUID lógico.

## Roles y status

- `SUPER_ADMIN` y `ADMIN` entran al panel en este módulo.
- `requireRole()` queda listo para restringir después.
- `DISABLED` bloquea el acceso aunque el usuario Auth siga existiendo.

`AdminAccount` es la autoridad de rol. No hay auto-promoción por dominio de correo ni por “primer login”.

## requireAdmin

1. `supabase.auth.getUser()` (verificación real, no solo cookie).
2. Busca `AdminAccount` por `authUserId`.
3. Exige `status === ACTIVE`.
4. Si falla: cierra sesión administrativa y redirige a `/admin/login`.
5. `?next=` solo acepta rutas internas bajo `/admin`.

## Sesiones

`@supabase/ssr` + cookies. El `proxy.ts` existente refresca la sesión en `/admin`
sin pasar esas rutas por next-intl.

Páginas Admin: `force-dynamic`, `robots: noindex, nofollow`.

## Login y logout

Login: Server Action → `signInWithPassword` → `getUser` → `AdminAccount` ACTIVE
→ `lastLoginAt` → `ADMIN_LOGIN` → redirect.

Si Auth existe pero no hay cuenta o está `DISABLED`: `signOut` y error genérico.

Logout: `ADMIN_LOGOUT` cuando sea posible → `signOut` → `/admin/login`.

## Convivencia con CustomerAccount

El mismo usuario Auth puede tener `AdminAccount` y `CustomerAccount`.
`/admin/login` no crea customer. `requireAdmin()` no otorga carrito.
`requireCustomer()` no otorga panel. `signOut` cierra la sesión Auth
compartida en ese browser.

## Bootstrap del primer SUPER_ADMIN

1. Crear el usuario en Supabase Authentication (Dashboard).
2. Copiar su UUID.
3. Ejecutar:

```
pnpm admin:grant -- --auth-user-id <uuid> --email <correo> --role SUPER_ADMIN
```

El script no crea contraseñas ni imprime secretos.
Usa Prisma por CLI (`DIRECT_URL` o `DATABASE_URL`), no el cliente Next con `server-only`.
Si recreas el usuario Auth, vuelve a ejecutar grant: reasocia el `AdminAccount` existente por email al nuevo `authUserId`.
