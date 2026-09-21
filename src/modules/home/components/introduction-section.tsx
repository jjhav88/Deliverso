import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type { HomeIntroductionContent } from "@/modules/home/types/home-content";
import "@/modules/home/home.css";

type IntroductionSectionProps = {
  content: HomeIntroductionContent;
};

export function IntroductionSection({ content }: IntroductionSectionProps) {
  return (
    <Section className="home-section-wash">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          {content.heading ? (
            <h2 className="type-display-l text-pretty">{content.heading}</h2>
          ) : null}
          {content.body ? (
            <p className="type-body-lg mx-auto mt-6 max-w-2xl text-pretty text-muted-foreground">
              {content.body}
            </p>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
