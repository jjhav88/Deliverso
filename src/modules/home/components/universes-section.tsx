import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Link } from "@/i18n/navigation";
import type { UniversesContent } from "@/modules/home/types/home-content";
import "@/modules/home/home.css";

type UniversesSectionProps = {
  content: UniversesContent;
};

export function UniversesSection({ content }: UniversesSectionProps) {
  return (
    <Section className="home-section-wash">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start lg:gap-20">
          <div className="max-w-md">
            <p className="type-label tracking-[0.2em] text-secondary">
              {content.eyebrow}
            </p>
            <h2 className="type-display-l mt-3 text-pretty">{content.heading}</h2>
            <p className="type-body mt-5 text-pretty text-muted-foreground">
              {content.body}
            </p>
            <Link
              href={content.ctaHref}
              className="home-text-cta mt-8 text-foreground"
            >
              {content.ctaLabel}
            </Link>
          </div>

          <ol className="grid gap-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-14">
            {content.items.map((item, index) => (
              <li key={item.id} className="border-t border-border pt-5">
                <p className="font-display text-2xl font-medium text-secondary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="type-label mt-4 inline-block tracking-[0.16em]"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <h3 className="type-label mt-4 tracking-[0.16em]">{item.title}</h3>
                )}
                <p className="type-body-sm mt-3 max-w-xs text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
