export const brandColors = {
  cream: "#FFF6E9",
  navy: "#234166",
  purple: "#44294E",
  gold: "#DDA333",
  lilac: "#A38CBF",
  pink: "#EE92A6",
} as const;

export const semanticColors = {
  background: brandColors.cream,
  foreground: brandColors.navy,
  surface: brandColors.cream,
  primary: brandColors.navy,
  primaryForeground: brandColors.cream,
  secondary: brandColors.purple,
  secondaryForeground: brandColors.cream,
  accent: brandColors.gold,
  accentForeground: brandColors.navy,
  complementary: {
    lilac: brandColors.lilac,
    pink: brandColors.pink,
  },
  functional: {
    destructive: "#7A3344",
    success: "#3F6B58",
    warning: "#8A5B12",
  },
} as const;

export const spacingScale = [
  4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120,
] as const;

export const layoutTokens = {
  contentMax: "72rem",
  contentMaxNarrow: "42rem",
  contentMaxWide: "88rem",
  pageGutter: {
    mobile: "1rem",
    tablet: "1.5rem",
    desktop: "2rem",
  },
} as const;

export const radiusTokens = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;
