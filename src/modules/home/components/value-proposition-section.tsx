import { Palette, Sparkles, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import type {
  ValuePropositionContent,
  ValuePropositionItem,
} from "@/modules/home/types/home-content";
import "@/modules/home/home.css";

const valueIcons: Record<ValuePropositionItem["id"], LucideIcon> = {
  creativity: Sparkles,
  design: Palette,
  flavor: UtensilsCrossed,
};

type ValuePropositionSectionProps = {
  content: ValuePropositionContent;
};

export function ValuePropositionSection({
  content,
}: ValuePropositionSectionProps) {
  return (
    <Section className="home-section-wash">
      <Container>
        <h2 className="type-h2 max-w-xl text-pretty">{content.heading}</h2>
        <ul className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
          {content.items.map((item, index) => {
            const Icon = valueIcons[item.id];

            return (
              <li key={item.id} className="max-w-sm">
                <p className="type-label tracking-[0.18em] text-secondary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <Icon
                  aria-hidden="true"
                  className="mt-5 h-4 w-4 text-foreground"
                  strokeWidth={1.4}
                />
                <h3 className="type-h3 mt-4">{item.title}</h3>
                <p className="type-body-sm mt-3 text-muted-foreground">
                  {item.description}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
