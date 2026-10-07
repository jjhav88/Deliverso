export const CHEESECAKE_ZARZAMORA_OLD_SLUG = "cheescake-de-zarzamora";
export const CHEESECAKE_ZARZAMORA_NEW_SLUG = "cheesecake-de-zarzamora";

export const permanentSeoRedirects = [
  {
    source: `/productos/${CHEESECAKE_ZARZAMORA_OLD_SLUG}`,
    destination: `/productos/${CHEESECAKE_ZARZAMORA_NEW_SLUG}`,
    permanent: true,
  },
  {
    source: "/terminos-y-condiciones",
    destination: "/terminos",
    permanent: true,
  },
  {
    source: "/en/terms-and-conditions",
    destination: "/en/terms",
    permanent: true,
  },
] as const;
