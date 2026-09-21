export const heroTones = ["AUTO", "LIGHT", "DARK"] as const;

export type HeroTone = (typeof heroTones)[number];

export function isHeroTone(value: string): value is HeroTone {
  return (heroTones as readonly string[]).includes(value);
}
