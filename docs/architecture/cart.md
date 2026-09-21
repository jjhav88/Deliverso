# Carrito autenticado

El carrito vive en PostgreSQL. `localStorage` no es autoridad.

Tras M11B, un `CustomerAccount` ACTIVE es la autoridad primaria.
La cookie sola no basta para comprar.

## Token

La cookie `deliverso_cart` guarda un token aleatorio de 32 bytes
(base64url). La base solo almacena `SHA-256(token)`.

- HttpOnly, SameSite=Lax, Path=/
- Secure en producción
- maxAge 30 días

`Cart.id` nunca se usa como autorización.

## Ownership

- `add` / `update` / `remove` / `clear` exigen
  `cart.customerId === currentCustomer.id`.
- Sin login: Server Action responde `AUTH_REQUIRED` y no crea cart.
- `BLOCKED`: `CUSTOMER_BLOCKED`.
- Carts nuevos siempre setean `customerId`.
- `customerId` nullable solo para anónimos históricos de DEV.
  Tras limpiarlos puede hacerse required. No resetear DEV.

Un ACTIVE principal por customer (índice parcial SQL
`Cart_customerId_active_unique`). No `unique(customerId, status)`.

Legacy: cookie + cart ACTIVE `customerId = null` → claim.
Si ya hay ACTIVE del customer → merge por `configurationKey`, qty máx. 99.

Cross-device: se recupera el ACTIVE por `customerId` y se reasocia la cookie.

Logout no borra el cart.

## Ciclo de vida

- Lectura (`getCurrentCart`) no crea carrito y exige customer ACTIVE.
- Escribir (add) puede crear cart + cookie **solo** con customer ACTIVE.
- `expiresAt = now + 30 días`, renovado en actividad.
- Si expiró: `ABANDONED`. El siguiente write crea uno nuevo.
- Cleanup de abandonados: deuda futura. No hay cron en este módulo.

## Precio

`priceConfiguredProduct()` es la única autoridad.

Master: MXN minor units. Display FX es visual.
No se persiste unitPrice en CartItem.

Si Admin cambia precio, el siguiente render recalcula.
El precio no se congela hasta Order.

## Configuración

`configurationKey = sha256(variantId + optionIds ordenados)`.
Misma config → merge de quantity. Distinta → otra línea.

## Items inválidos

ARCHIVED/DRAFT, variant inactiva u option inactiva:
se muestran, no entran al subtotal, el usuario puede eliminarlas.

## Futuro

Checkout exige `requireCustomer()`. `CHECKED_OUT` se usará entonces.
No implementado. Order llevará `customerId` obligatorio.

El carrito vive en PostgreSQL. `localStorage` no es autoridad.

## Token

La cookie `deliverso_cart` guarda un token aleatorio de 32 bytes
(base64url). La base solo almacena `SHA-256(token)`.

- HttpOnly, SameSite=Lax, Path=/
- Secure en producción
- maxAge 30 días

`Cart.id` nunca se usa como autorización.

## Ciclo de vida

- Lectura (`getCurrentCart`) no crea carrito.
- Escribir (add) puede crear cart + cookie.
- `expiresAt = now + 30 días`, renovado en actividad.
- Si expiró: `ABANDONED`. El siguiente write crea uno nuevo.
- Cleanup de abandonados: deuda futura. No hay cron en este módulo.

## Precio

`priceConfiguredProduct()` es la única autoridad.

Master: MXN minor units. Display FX es visual.
No se persiste unitPrice en CartItem.

Si Admin cambia precio, el siguiente render recalcula.
El precio no se congela hasta Order.

## Configuración

`configurationKey = sha256(variantId + optionIds ordenados)`.
Misma config → merge de quantity. Distinta → otra línea.

## Items inválidos

ARCHIVED/DRAFT, variant inactiva u option inactiva:
se muestran, no entran al subtotal, el usuario puede eliminarlas.

## Futuro

Anonymous cart → login → claim/merge.
CHECKED_OUT se usará en checkout. No implementado.
