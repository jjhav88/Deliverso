import { BrandLogo } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { HeroShowcase } from "@/modules/home/components/hero-showcase";
import type { HomeHeroContent } from "@/modules/home/types/home-content";
import "@/modules/home/home.css";

type HeroSectionProps = {
  content: HomeHeroContent;
};

export function HeroSection({ content }: HeroSectionProps) {
  const isDark = content.tone === "dark";

  return (
    <section
      className={cn(
        "home-hero relative isolate overflow-x-hidden",
        isDark ? "text-surface-dark-foreground" : "text-foreground",
      )}
    >
      <div className="home-hero-atmosphere" aria-hidden="true" />
      <div className="home-hero-watermark" aria-hidden="true">
        <BrandLogo mark="icon" alt="" className="h-auto w-full" />
      </div>

      <Container width="wide" className="home-hero-shell">
        <HeroShowcase items={content.showcase} />

        <div className="home-hero-brand home-hero-enter">
          <BrandLogo
            mark="icon"
            className="home-hero-mark"
            priority
          />

          {content.eyebrow ? (
            <p className="type-label tracking-[0.18em] text-secondary">
              {content.eyebrow}
            </p>
          ) : null}

          <h1 className="home-hero-title">{content.title}</h1>

          <p className="home-hero-tagline">{content.tagline}</p>

          {content.headline ? (
            <p
              className={cn(
                "home-hero-supporting",
                isDark
                  ? "text-surface-dark-foreground/78"
                  : "text-muted-foreground",
              )}
            >
              {content.headline}
            </p>
          ) : null}

          {content.description ? (
            <p
              className={cn(
                "home-hero-supporting",
                isDark
                  ? "text-surface-dark-foreground/78"
                  : "text-muted-foreground",
              )}
            >
              {content.description}
            </p>
          ) : null}

          <Link
            href={content.primaryAction.href}
            className="home-discover-cta home-hero-enter-delay"
          >
            {content.primaryAction.label}
          </Link>
        </div>
      </Container>
    </section>
  );
}
