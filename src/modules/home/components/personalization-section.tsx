import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type { PersonalizationContent } from "@/modules/home/types/home-content";
import "@/modules/home/home.css";

type PersonalizationSectionProps = {
  content: PersonalizationContent;
};

export function PersonalizationSection({ content }: PersonalizationSectionProps) {
  return (
    <Section className="home-section-wash">
      <Container>
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-end md:gap-16">
          <h2 className="type-display-l max-w-xl text-pretty">{content.heading}</h2>
          <p className="type-body-lg max-w-md text-pretty text-muted-foreground">
            {content.body}
          </p>
        </div>

        <ol className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
          {content.steps.map((step, index) => (
            <li key={step.id} className="relative">
              {index < content.steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-16 top-4 hidden h-px w-[calc(100%-2rem)] bg-border md:block"
                />
              ) : null}
              <p className="relative font-display text-3xl font-medium text-secondary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="type-h3 mt-6">{step.title}</h3>
              <p className="type-body-sm mt-3 max-w-xs text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
