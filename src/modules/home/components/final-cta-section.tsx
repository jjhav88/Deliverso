import { OrbitDecoration } from "@/components/brand/orbit-decoration";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { FinalCtaContent } from "@/modules/home/types/home-content";
import "@/modules/home/home.css";

type FinalCtaSectionProps = {
  content: FinalCtaContent;
};

export function FinalCtaSection({ content }: FinalCtaSectionProps) {
  return (
    <Section surface="dark" className="relative overflow-hidden">
      <OrbitDecoration className="pointer-events-none absolute -right-10 bottom-[-1.5rem] h-28 w-52 opacity-40" />
      <Container>
        <div className="relative max-w-2xl py-4">
          {content.heading ? (
            <h2 className="type-display-l text-pretty text-surface-dark-foreground">
              {content.heading}
            </h2>
          ) : null}
          {content.body ? (
            <p className="type-body-lg mt-6 max-w-xl text-pretty text-surface-dark-foreground/78">
              {content.body}
            </p>
          ) : null}
          <Link
            href={content.ctaHref}
            className={cn(
              "home-primary-cta mt-9 inline-flex min-h-12 items-center justify-center rounded-md px-6",
              "bg-surface text-base font-medium tracking-wide text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-dark)]",
            )}
          >
            {content.ctaLabel}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
