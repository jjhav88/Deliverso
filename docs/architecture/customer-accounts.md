# Cuentas de cliente

Módulo 11B. La navegación pública sigue libre. Agregar al carrito
requiere una cuenta de **cliente** confirmada.

## Supabase Auth

El mismo proyecto Auth del Admin es la autoridad de:

- email
- password
- verificación de correo
- sesión

No hay Auth.js, Clerk, Firebase ni passwords en Prisma.

Configuración manual en el dashboard de Supabase (no se cambia desde código):

1. Authentication → Providers → Email: **Confirm email = enabled**.
2. Redirect URLs: `https://<app>/auth/confirm` y el origen local
   (`http://localhost:3010/auth/confirm` en DEV).
3. Site URL del proyecto Auth alineada con `NEXT_PUBLIC_APP_URL`.

Los únicos correos de este módulo los envía Supabase Auth:

- confirmación de registro
- recuperación de contraseña

Un módulo posterior (Resend/MailerSend) cubrirá WELCOME, ORDER_CREATED,
PAYMENT_CONFIRMED, ORDER_READY, etc. **No** se envía welcome branded ahora.

## Perfiles de aplicación

```
Supabase Auth User
        │
        ├── AdminAccount     requireAdmin()
        └── CustomerAccount  requireCustomer()
```

Un usuario Auth puede tener uno, otro o ambos. El login en `/admin/login`
**no** crea `CustomerAccount`. El login público sí llama
`ensureCustomerAccount()` tras identidad verificada.

Una sesión Auth sola no otorga ninguna autorización.

## CustomerAccount

Perfil operativo. Campos:

- `authUserId` (UUID Auth, unique)
- `email` (copia normalizada; Auth es la autoridad)
- `displayName?`, `phone?`
- `status` `ACTIVE` | `BLOCKED`
- `lastLoginAt?`
- `termsAcceptedAt?`, `privacyAcceptedAt?`

No se guardan password, hash, salt ni tokens.

`ensureCustomerAccount()` corre server-side con `getUser()` verificado.
`getOptionalCustomer()` no crea perfiles durante la navegación pública.

`BLOCKED` impide `/cuenta`, carrito y compras aunque Auth siga vivo.

Consentimiento de marketing: **no** se infiere de términos. No hay
`marketingOptIn=true` por defecto.

## Rutas

| ES | EN |
| --- | --- |
| `/cuenta` | `/en/account` |
| `/cuenta/iniciar-sesion` | `/en/account/login` |
| `/cuenta/registro` | `/en/account/register` |
| `/cuenta/recuperar-contrasena` | `/en/account/forgot-password` |
| `/cuenta/restablecer-contrasena` | `/en/account/reset-password` |

Callback técnico: `/auth/confirm` (sin locale, PKCE). Después redirige
a `?next=` validado (`getSafeCustomerPath`: solo paths internos).

Páginas de cuenta: `noindex, nofollow`. No entran al sitemap.

## Carrito

Tras este módulo, `CustomerAccount` es la autoridad primaria del carrito.

- Cookie `deliverso_cart` sigue como correlación y defensa adicional.
- La cookie **sola** no basta para comprar.
- `addToCart` llama `resolveWritableCart()` → `requireCustomer` de facto
  (`AUTH_REQUIRED` / `CUSTOMER_BLOCKED`) **antes** de crear el cart.
- Carts nuevos siempre tienen `customerId`.
- `customerId` es nullable solo para carts anónimos históricos de DEV.
  Después de limpiarlos, puede hacerse required. No resetear DEV.

Un carrito `ACTIVE` principal por customer. Índice parcial SQL:

```sql
CREATE UNIQUE INDEX "Cart_customerId_active_unique" ON "Cart"("customerId")
WHERE "status" = 'ACTIVE' AND "customerId" IS NOT NULL;
```

No usar `unique(customerId, status)`: impediría históricos
`CHECKED_OUT` / `ABANDONED`.

### Claim / merge legado

Si la cookie apunta a un cart `ACTIVE` con `customerId = null`, el primer
login lo reclama. Si el customer ya tiene cart ACTIVE, se fusionan líneas
por `configurationKey` (qty máx. 99) y el anónimo pasa a `ABANDONED`.

Un cookie cart de **otro** customer se ignora. Cross-device: el ACTIVE
se recupera por `customerId` y se reasocia/rota la cookie.

Logout: `signOut` Auth. **No** borra el cart en DB.

## Checkout / Order futuros

- M12: Checkout **no** será guest. `requireCustomer()` será obligatorio.
- M13: `Order.customerId` obligatorio, más snapshots de email/nombre/teléfono.

No hay Checkout, Order ni Stripe en este módulo.

## Admin clientes

`/admin/customers` lista email, displayName, status, registro, último acceso.
Detalle: perfil, estado, carrito activo, pedidos como empty state honesto.

`ADMIN` y `SUPER_ADMIN` pueden `ACTIVE ↔ BLOCKED` (temporal; `requireRole`
está listo para restringir a `SUPER_ADMIN` después). Auditoría:
`CUSTOMER_BLOCKED` / `CUSTOMER_REACTIVATED`. No se audita cada login cliente.

## Borrado

Logout no hace hard-delete. `Cart.customerId` es `onDelete: Restrict`.
GDPR/eliminación será un proceso explícito posterior.
