import {
  LEGAL_INITIAL_VERSION,
  LEGAL_PRIMARY_LOCALE,
  type LegalDocumentType,
} from "@/modules/legal/domain/types";

export type DefaultLegalDocument = {
  type: LegalDocumentType;
  locale: typeof LEGAL_PRIMARY_LOCALE;
  version: typeof LEGAL_INITIAL_VERSION;
  title: string;
  body: string;
};

const lawyerReview =
  "Este texto es un borrador de cumplimiento técnico alineado con el funcionamiento actual de DELIVERSO. Debe ser revisado por un asesor legal mexicano antes de considerarse versión jurídica definitiva.";

export const defaultPrivacyNotice = `# Aviso de Privacidad

${lawyerReview}

## Identidad del responsable

El responsable del tratamiento de los datos personales recabados a través de www.deliverso.com.mx es {{legalEntityName}}, que opera comercialmente como {{commercialName}}.

- Domicilio: {{legalAddress}}
- País: {{legalCountry}}
- RFC: {{rfc}}
- Teléfono: {{legalPhone}}
- Correo de contacto: {{contactEmail}}
- Correo para ejercer derechos ARCO: {{privacyEmail}}

Cuando alguno de estos datos aparece como pendiente de publicación, el responsable aún no ha completado la configuración legal en el panel administrativo. Eso no impide consultar este aviso; sí impide considerar completa la identificación del responsable.

## Datos personales que tratamos

Tratamos únicamente las categorías que el sistema utiliza hoy:

### Identificación y cuenta
- nombre o nombre para mostrar
- correo electrónico
- teléfono, si lo proporcionas
- fotografía de perfil (avatar), si la cargas
- estado de la cuenta (activa o bloqueada)
- identificadores técnicos de autenticación

### Entrega y recogida
- domicilio de entrega (calle, números, colonia, ciudad, estado, código postal, país, referencias)
- punto de recogida elegido y, en su caso, instrucciones
- fecha y ventana horaria solicitadas
- notas del pedido

### Transacciones
- productos, cantidades, configuración y precios
- importes en MXN (subtotal, entrega, promoción, total)
- número de pedido y estado
- método de cumplimiento (entrega o recogida)

### Cotizaciones
- descripción de la solicitud
- fecha de evento y número de personas, si los indicas
- imágenes de referencia que cargues
- mensajes intercambiados con el equipo

### Pagos y reembolsos
- identificadores de PaymentIntent y de reembolso del proveedor de pagos
- estado, importe y metadatos operativos seguros
- **{{commercialName}} no almacena el número completo de tarjeta, el CVC ni el PIN.** Esos datos los procesa Stripe.

### Comunicaciones y operación
- correos transaccionales (confirmación, estado del pedido, cotización, cancelación o reembolso)
- registros técnicos de envío en la bandeja de salida
- registros de auditoría administrativa (acción, recurso, administrador; no el cuerpo completo de documentos legales)

### Archivos
- avatares en almacenamiento privado
- imágenes de referencia de cotización en almacenamiento privado

No recabamos, en el estado actual del producto, datos de marketing, perfiles publicitarios, newsletters ni geolocalización continua.

## Finalidades necesarias

Tratamos tus datos para:

- crear y administrar tu cuenta
- operar el carrito, el checkout y los pedidos
- coordinar entrega o recogida
- atender cotizaciones de productos personalizados
- procesar pagos y reembolsos a través de Stripe
- brindar soporte
- enviar comunicaciones transaccionales relacionadas con tu solicitud, pedido o cuenta
- mantener la seguridad de la plataforma y prevenir abuso
- cumplir obligaciones legales y requerimientos de autoridad competentes cuando proceda

Estas finalidades son necesarias para prestar el servicio que solicitas.

## Finalidades opcionales

En este momento **no** utilizamos tus datos para mercadotecnia, publicidad, perfilado comercial ni boletines. No te pediremos un consentimiento de marketing mientras esas finalidades no existan.

## Limitación de uso y divulgación

No vendemos datos personales. Solo los comunicamos a quienes participan en la prestación del servicio, en la medida necesaria, o cuando una obligación legal lo exija.

## Proveedores tecnológicos

Para operar el sitio utilizamos proveedores que tratan datos por cuenta de {{commercialName}} como parte de la infraestructura:

- **Supabase**: autenticación, base de datos PostgreSQL y almacenamiento de archivos (avatares e imágenes de referencia).
- **Stripe**: procesamiento de pagos y reembolsos. Stripe recibe los datos necesarios para cobrar; {{commercialName}} conserva identificadores, estados e importes, no el PAN ni el CVC.
- **Resend**: envío de correos transaccionales.
- **Vercel**: alojamiento de la aplicación.

Describir estos proveedores no equivale, por sí mismo, a afirmar una transferencia internacional en sentido jurídico. La calificación de cada relación y, en su caso, de transferencias, debe revisarse con asesoría legal mexicana cuando la identidad del responsable esté completa.

Los enlaces a Facebook, Instagram o TikTok son hipervínculos. No cargamos píxeles ni herramientas de seguimiento de esas redes.

## Derechos ARCO

Puedes solicitar Acceso, Rectificación, Cancelación u Oposición respecto de tus datos personales, conforme a la legislación mexicana aplicable.

El procedimiento se describe en /privacidad/derechos-arco. La solicitud se recibe, se revisa y **la identidad se verifica de forma manual** antes de entregar, corregir o cancelar información. No hay descarga automática de un expediente por el solo hecho de escribir un correo.

## Revocación y limitación

Puedes solicitar que limitemos usos no necesarios. Mientras exista una relación contractual u obligación de conservación (por ejemplo, un pedido pagado), algunos datos deberán conservarse aunque se cierre o se solicite la cancelación de la cuenta.

## Conservación

No publicamos aquí plazos jurídicos inventados. En la operación actual:

- los pedidos, pagos, reembolsos y cotizaciones se conservan como historial operativo
- los avatares pueden sustituirse o eliminarse desde la cuenta
- no existe borrado automático de pedidos históricos
- no hay un flujo de eliminación de cuenta destructivo; una solicitud de ese tipo se atiende como solicitud de privacidad, con revisión manual

Los periodos definitivos de conservación deben definirse con revisión jurídica.

## Menores

{{commercialName}} está pensado para personas con capacidad para contratar. No definimos aquí una edad mínima ficticia. Si el negocio requiere una política específica sobre menores, deberá configurarse y revisarse legalmente.

## Medidas de seguridad

Aplicamos medidas razonables: comunicación HTTPS, control de acceso administrativo, almacenamiento privado de archivos y procesamiento de pagos mediante un proveedor especializado. **No prometemos que el sistema sea invulnerable.**

## Cambios a este aviso

Cuando publiquemos una versión nueva, este aviso mostrará la versión, la fecha de entrada en vigor y la última actualización. Las versiones anteriores quedan en archivo administrativo. Los pedidos ya creados conservan la versión que les aplicó; no se reescribe el historial.

## Contacto

Para ejercer ARCO o plantear dudas de privacidad: {{privacyEmail}}
Para contacto general: {{contactEmail}} · {{legalPhone}}
`;

export const defaultTerms = `# Términos y Condiciones

${lawyerReview}

## Identificación del proveedor

Estos términos regulan el uso de www.deliverso.com.mx, operado comercialmente como {{commercialName}} por {{legalEntityName}}, con domicilio en {{legalAddress}}, {{legalCountry}}, RFC {{rfc}}. Contacto: {{contactEmail}} / {{legalPhone}}.

## Objeto

{{commercialName}} ofrece pastelería y productos relacionados a través de un catálogo en línea, con pedido, pago, entrega o recogida, y un flujo de cotización para creaciones personalizadas.

## Uso del sitio

Debes usar el sitio de forma lícita, sin interferir con su operación ni suplantar a terceros. Podemos suspender cuentas que incumplan estas reglas o pongan en riesgo a otros usuarios o a la operación.

## Cuentas

Puedes crear una cuenta de cliente con correo y contraseña. La autenticación la provee Supabase. Eres responsable de la confidencialidad de tus credenciales. Podemos bloquear una cuenta por razones de seguridad o abuso.

Crear una cuenta **no** equivale, por sí sola, a celebrar una compraventa. La compraventa se perfecciona según el flujo de pedido y pago descrito más adelante.

## Catálogo y disponibilidad

Los productos pueden ser de catálogo fijo, configurables o de cotización (CUSTOM_QUOTE). La disponibilidad, opciones y precios mostrados pueden cambiar. Un producto publicado puede agotarse, archivarse o dejar de ofrecerse.

## Productos configurables

Algunos productos permiten elegir opciones (por ejemplo, tamaño o extra). El precio mostrado refleja la configuración elegida antes de pagar. Esa configuración queda registrada en el pedido.

## Cotizaciones (CUSTOM_QUOTE)

Una solicitud de cotización **no constituye una compraventa**. Es una petición para que el equipo prepare una oferta.

La operación se perfecciona cuando aceptas una oferta vigente, se crea el pedido (Order) y se realiza el pago conforme al flujo implementado. Hasta entonces no hay obligación de producir ni de cobrar el total cotizado, salvo lo que expresamente indique la oferta aceptada.

Las promociones de catálogo **no aplican** a productos de cotización en la versión actual.

## Promociones

Pueden existir promociones por código o automáticas, con vigencia, elegibilidad y límites propios. En la versión actual:

- solo puede aplicarse **una** promoción por carrito, checkout o pedido (sin acumulación)
- no aplican a CUSTOM_QUOTE
- el beneficio se consume al crear el pedido, según las reglas publicadas en el checkout

Las promociones no generan derechos adquiridos fuera de su vigencia y condiciones.

## Precios y moneda

Los precios de cobro están en **pesos mexicanos (MXN)**. Otras monedas, si se muestran, son solo referencia de visualización y no cambian el cargo.

Antes de pagar verás subtotal, descuento (si aplica), costo de entrega o recogida y total.

## Pagos

El pago se procesa a través de Stripe. {{commercialName}} no almacena datos completos de tarjeta. El cargo se realiza en MXN. Un pedido puede quedar pendiente de pago y expirar si no se completa en el plazo operativo vigente.

## Confirmación del pedido

Al confirmar y pagar (o al quedar el pedido registrado como pagado) recibirás comunicación transaccional y podrás consultar en tu cuenta el número de pedido, productos, cantidades, precios, método de cumplimiento, total y estado.

## Preparación, entrega y recogida

Los plazos, zonas, costos y puntos de recogida se describen en la política de Entregas y recogidas y en la configuración vigente al momento del checkout. No prometemos cobertura nacional. Solo se ofrecen las zonas y puntos activos configurados.

## Cancelaciones y reembolsos

Las reglas de cancelación antes de pago, solicitud de cancelación de un pedido pagado, aprobación administrativa y reembolsos (totales o parciales) se describen en Cancelaciones y reembolsos. Esas reglas no sustituyen derechos irrenunciables del consumidor.

## Propiedad intelectual

Marca, logotipos, fotografías, textos y diseño del sitio pertenecen a {{commercialName}} o a quien corresponda. No está permitido copiarlos para explotación comercial sin autorización.

Las imágenes de referencia que subas en una cotización se usan solo para atender esa solicitud. No subas información personal innecesaria ni contenidos de terceros sin derecho a compartirlos.

## Obligaciones del usuario

Proporcionar datos veraces, recoger o recibir el pedido en las condiciones acordadas, y no usar el sitio para fines ilícitos.

## Derechos del consumidor

Nada en estos términos pretende excluir o limitar derechos que la legislación mexicana aplicable reconozca como irrenunciables. Las políticas comerciales de {{commercialName}} se interpretan de conformidad con esa legislación.

## Modificaciones

Podemos publicar versiones nuevas de estos términos. La versión aplicable a un pedido es la que estaba publicada y fue aceptada al crearlo. Los pedidos anteriores conservan su referencia de versión.

## Contacto

{{contactEmail}} · {{legalPhone}} · {{legalAddress}}
`;

export const defaultDeliveryPolicy = `# Entregas y recogidas

${lawyerReview}

## Alcance

{{commercialName}} ofrece dos métodos, cuando están disponibles en el checkout:

- **Entrega (DELIVERY)** a un domicilio dentro de una zona activa
- **Recogida (PICKUP)** en un punto configurado

No prometemos cobertura nacional ni entrega a cualquier código postal de México. Solo aplican las zonas, códigos postales y puntos de recogida **activos** en el sistema al momento de tu pedido.

## Zonas y costos de entrega

Cada zona puede tener:

- un costo de entrega en MXN
- un pedido mínimo, si está configurado
- códigos postales asociados

Si tu código postal no está en una zona activa, el checkout no permitirá entrega. El costo y el mínimo vigentes se muestran antes de pagar.

La lista concreta de zonas y puntos puede cambiar. Consulta el checkout o pregunta en {{contactEmail}}.

## Fechas y ventanas

La fecha y el horario se eligen entre las opciones que el sistema habilita (calendario operativo, horizonte de preparación y fechas no disponibles). No puedes reservar una fecha que el checkout no ofrezca.

La zona horaria operativa es America/Mexico_City.

## Recepción

Debes proporcionar un domicilio completo y, de ser útil, una referencia. La persona que recibe debe estar disponible en la ventana indicada. Incidencias de acceso, ausencia o datos incompletos pueden impedir completar la entrega; en ese caso contáctanos para coordinar, sin que ello implique un nuevo servicio gratuito automático.

## Recogida

La recogida se realiza en el punto que elijas entre los activos. Verás nombre, dirección e instrucciones (si existen) en el checkout y en el pedido. Debes presentarte en la ventana acordada y acreditar el pedido cuando se te solicite.

## Pedidos personalizados

Las cotizaciones aceptadas siguen el método de cumplimiento de la oferta (entrega o recogida) y las condiciones mostradas al aceptar. Una cotización no reserva por sí sola una ruta de entrega nacional.

## Incidencias

Para retrasos, cambios o problemas de recepción o recogida, escribe a {{contactEmail}} o llama a {{legalPhone}}. Las cancelaciones y reembolsos se rigen por su propia política.

## Relación con el pedido

El pedido conserva una captura de la zona o del punto de recogida elegidos. Un cambio posterior de catálogo de zonas no altera esa captura histórica.
`;

export const defaultRefundPolicy = `# Cancelaciones y reembolsos

${lawyerReview}

## Principio

Esta política describe el funcionamiento **actual** de {{commercialName}}. No elimina derechos que la legislación mexicana aplicable reconozca al consumidor.

**No garantizamos un reembolso inmediato** ni un plazo bancario exacto. Cuando Stripe confirma un reembolso, el tiempo en que se refleja en tu tarjeta o cuenta depende de tu banco o emisor.

## Cancelación antes del pago

Un pedido pendiente de pago puede cancelarse sin reembolso, porque aún no hay un cargo exitoso. Ese pedido no continúa a producción.

## Pedido pagado: solicitud de cancelación

Si el pedido ya está pagado, puedes solicitar cancelación **solo mientras el cumplimiento esté en estados iniciales** (pendiente o confirmado, según el sistema). Si el pedido ya está en producción o en un estado posterior, la solicitud en línea puede no estar disponible; en ese caso contáctanos.

La solicitud **no ejecuta un reembolso automático**. El equipo administrativo la revisa.

## Revisión y decisión

Un administrador puede:

- aprobar la solicitud y, en su caso, iniciar un reembolso
- rechazarla, con el motivo que corresponda a la operación

Hasta que haya una decisión, el pedido permanece en el estado de cumplimiento que tenga.

## Reembolsos

Los reembolsos los inicia el administrador, no el cliente desde un botón de devolución inmediata.

Pueden ser:

- **totales**, por el monto cobrado pendiente de reembolsar
- **parciales**, por un importe menor; un reembolso parcial no cancela por sí solo el pedido

El procesamiento lo realiza **Stripe**. {{commercialName}} registra el identificador, el importe, el estado y el historial. Conservamos el total original del pedido; el monto reembolsado se muestra aparte.

## Tiempos

Cuando el proveedor confirma el reembolso, actualizamos el estado en tu pedido y, en su caso, enviamos un correo transaccional. La acreditación en tu medio de pago **no es instantánea** y no está bajo el control exclusivo de {{commercialName}}.

## Promociones

Un reembolso no reactiva automáticamente un código o promoción ya consumida en ese pedido.

## Cotizaciones convertidas

Si el pedido nació de una cotización aceptada, cancelar o reembolsar ese pedido no reabre la cotización.

## Contacto

{{contactEmail}} · {{legalPhone}} · privacidad: {{privacyEmail}}
`;

export const defaultCookiePolicy = `# Política de cookies

${lawyerReview}

## Qué usamos

{{commercialName}} utiliza cookies y tecnologías similares **estrictamente necesarias** para:

- identificar el carrito
- recordar idioma y moneda de visualización
- mantener la sesión de autenticación

No utilizamos Google Analytics, publicidad, píxeles de remarketing ni redes sociales embebidas con seguimiento.

## Consentimiento

No mostramos un banner genérico de cookies porque, en el alcance técnico actual, no hay cookies no esenciales que requieran un consentimiento separado. Si en el futuro se instalan analítica o publicidad, se bloquearán hasta obtener un consentimiento granular, con opción de rechazar tan fácil como aceptar.

## Inventario

La tabla publicada en esta página es el inventario real del código. No incluye cookies hipotéticas.

## Almacenamiento local

El storefront no utiliza localStorage ni sessionStorage en el código actual.

## Terceros

- **Supabase Auth** establece cookies de sesión en nuestro dominio para autenticarte.
- **Stripe** puede usar cookies en su propio dominio cuando pagas. No instalamos cookies de Stripe en deliverso.com.mx.
- **Vercel** hospeda el sitio; en previews puede haber cookies técnicas de plataforma.

## Enlaces a redes

Facebook, Instagram y TikTok, si aparecen, son enlaces externos. No activan rastreo por el solo hecho de mostrarse.

## Contacto

{{privacyEmail}} · {{contactEmail}}
`;

export const defaultLegalDocuments: readonly DefaultLegalDocument[] = [
  {
    type: "PRIVACY_NOTICE",
    locale: LEGAL_PRIMARY_LOCALE,
    version: LEGAL_INITIAL_VERSION,
    title: "Aviso de Privacidad",
    body: defaultPrivacyNotice,
  },
  {
    type: "TERMS",
    locale: LEGAL_PRIMARY_LOCALE,
    version: LEGAL_INITIAL_VERSION,
    title: "Términos y Condiciones",
    body: defaultTerms,
  },
  {
    type: "DELIVERY_POLICY",
    locale: LEGAL_PRIMARY_LOCALE,
    version: LEGAL_INITIAL_VERSION,
    title: "Entregas y recogidas",
    body: defaultDeliveryPolicy,
  },
  {
    type: "REFUND_POLICY",
    locale: LEGAL_PRIMARY_LOCALE,
    version: LEGAL_INITIAL_VERSION,
    title: "Cancelaciones y reembolsos",
    body: defaultRefundPolicy,
  },
  {
    type: "COOKIE_POLICY",
    locale: LEGAL_PRIMARY_LOCALE,
    version: LEGAL_INITIAL_VERSION,
    title: "Cookies",
    body: defaultCookiePolicy,
  },
];
