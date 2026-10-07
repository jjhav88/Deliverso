export type CookieDuration = "session" | `${number} days` | `${number} years`;

export type CookieInventoryEntry = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: "essential";
  storage: "cookie" | "localStorage" | "sessionStorage";
};

export const cookieInventory: readonly CookieInventoryEntry[] = [
  {
    name: "deliverso_cart",
    provider: "DELIVERSO",
    purpose: "Identificar el carrito de la sesión para conservar productos entre visitas.",
    duration: "30 days",
    type: "essential",
    storage: "cookie",
  },
  {
    name: "deliverso_currency",
    provider: "DELIVERSO",
    purpose: "Recordar la moneda de visualización. El cobro se realiza en MXN.",
    duration: "1 year",
    type: "essential",
    storage: "cookie",
  },
  {
    name: "NEXT_LOCALE",
    provider: "DELIVERSO (next-intl)",
    purpose: "Recordar el idioma de la interfaz (es-MX o en-US).",
    duration: "1 year",
    type: "essential",
    storage: "cookie",
  },
  {
    name: "sb-*-auth-token",
    provider: "Supabase Auth",
    purpose: "Mantener la sesión autenticada del cliente o del administrador.",
    duration: "Según la sesión de autenticación",
    type: "essential",
    storage: "cookie",
  },
];

export const cookiePlatformNotes = [
  "No se encontró uso de localStorage ni sessionStorage en el código del storefront.",
  "Stripe procesa el pago en su propia infraestructura. DELIVERSO no instala cookies de Stripe en deliverso.com.mx; al redirigir al flujo de pago, Stripe puede usar cookies en su dominio.",
  "Vercel hospeda la aplicación y puede emitir cookies técnicas de plataforma en entornos de preview. En el storefront de producción no hay cookies de analítica o publicidad.",
  "Los enlaces a Facebook, Instagram y TikTok son hipervínculos. No se cargan píxeles ni SDKs de redes sociales.",
] as const;

export const cookieConsentDecision = {
  cmpRequired: false,
  bannerRequired: false,
  reason:
    "El inventario actual solo incluye cookies estrictamente necesarias para carrito, preferencias de idioma/moneda y autenticación. No hay Google Analytics, publicidad ni trackers no esenciales.",
} as const;
