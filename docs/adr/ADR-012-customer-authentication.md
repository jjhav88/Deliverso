# ADR-012: autenticación de cliente

## Estado

Aceptada. Módulo 11B.

El ADR de Checkout, si se escribe, será el siguiente número (ADR-013).
ADR-012 no se reserva para checkout.

## Contexto

El catálogo público puede navegarse sin cuenta. El carrito anónimo de M11
no es suficiente para comprar: hace falta identidad de cliente antes de
Checkout.

## Decisión

1. **Cuenta obligatoria antes del carrito.** Agregar al carrito exige
   `CustomerAccount` `ACTIVE`. La navegación (home, productos, universos,
   detalle, precios) permanece libre.
2. **Mismo Supabase Auth** que el Admin. No se instala otro proveedor.
   Passwords y verificación de email viven solo en Auth.
3. **Perfiles de aplicación separados.** `AdminAccount` y
   `CustomerAccount` cuelgan del mismo `auth.users.id` sin mezclar
   autorizaciones. `requireAdmin()` y `requireCustomer()` son independientes.
   El login admin no crea customer; el login público no otorga admin.
4. **Email verificado.** El registro público usa confirmación. El perfil
   Prisma se crea con `ensureCustomerAccount()` tras `getUser()` confirmado,
   no con datos crudos del browser ni service role en el formulario.
5. **Carrito del customer.** `Cart.customerId` es la autoridad primaria.
   La cookie sigue como correlación. Carts anónimos históricos pueden
   claim/merge de forma segura. Carts nuevos siempre pertenecen a un customer.

## Consecuencias

- Checkout futuro (M12) usará `requireCustomer()`, no guest checkout.
- Order futuro (M13) llevará `customerId` obligatorio más snapshots.
- Un Auth user puede ser admin y customer a la vez.
- `signOut` del cliente cierra la sesión Auth compartida (también el Admin
  si es el mismo usuario en el mismo browser).
- Emails transaccionales de marca (welcome, pedido) quedan para un módulo
  de correo posterior. Ahora solo Auth envía confirmación y recovery.
