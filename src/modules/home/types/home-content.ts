import type { StaticAppPathname } from "@/config/navigation";
import type { ProductDetailHref, UniverseDetailHref } from "@/modules/catalog/public/href";

export type HomeAction = {
  label: string;
  href: StaticAppPathname;
};

export type HomeHeroTone = "light" | "dark";

export type HeroShowcasePosition = "left" | "right" | "rightSecondary";

export type HeroShowcaseItem = {
  id: string;
  imageSrc?: string;
  imageAlt: string;
  objectPosition?: string;
  productHref?: StaticAppPathname | ProductDetailHref;
  position: HeroShowcasePosition;
};

export type HomeHeroContent = {
  eyebrow?: string;
  title: string;
  tagline: string;
  headline?: string;
  description: string;
  backgroundImage?: string;
  tone?: HomeHeroTone;
  showcase: HeroShowcaseItem[];
  primaryAction: HomeAction;
  secondaryAction: HomeAction;
};

import type { MoneyAmount } from "@/lib/money";

export type FeaturedProductTone = "cocoa" | "fruit" | "gold";

export type FeaturedProductItem = {
  id: string;
  name: string;
  description: string;
  ctaLabel: string;
  href: StaticAppPathname | ProductDetailHref;
  imageSrc?: string;
  imageAlt?: string;
  tone?: FeaturedProductTone;
  price?: MoneyAmount;
};

export type FeaturedProductsContent = {
  eyebrow: string;
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaHref: StaticAppPathname;
  products: FeaturedProductItem[];
};

export type UniverseItem = {
  id: string;
  title: string;
  description: string;
  href?: UniverseDetailHref;
};

export type UniversesContent = {
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: StaticAppPathname;
  items: UniverseItem[];
};

export type PersonalizationStep = {
  id: string;
  title: string;
  description: string;
};

export type PersonalizationContent = {
  heading: string;
  body: string;
  steps: PersonalizationStep[];
};

export type ValuePropositionItem = {
  id: "creativity" | "design" | "flavor";
  title: string;
  description: string;
};

export type ValuePropositionContent = {
  heading: string;
  items: ValuePropositionItem[];
};

export type FinalCtaContent = {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: StaticAppPathname;
};

export type HomeIntroductionContent = {
  heading: string;
  body: string;
};

export type HomeSectionVisibility = {
  showIntroduction: boolean;
  showFeaturedProducts: boolean;
  showUniverses: boolean;
  showPersonalization: boolean;
  showValueProposition: boolean;
  showFinalCta: boolean;
};

export type HomePageContent = {
  hero: HomeHeroContent;
  intro: HomeIntroductionContent;
  featured: FeaturedProductsContent;
  universes: UniversesContent;
  personalization: PersonalizationContent;
  valueProposition: ValuePropositionContent;
  finalCta: FinalCtaContent;
  visibility: HomeSectionVisibility;
};
