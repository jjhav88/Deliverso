import { Container } from "@/components/layout/container";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  body,
}: PlaceholderPageProps) {
  return (
    <Container className="py-20 md:py-28">
      <p className="type-label text-muted-foreground">{eyebrow}</p>
      <h1 className="type-h1 mt-4 text-foreground">{title}</h1>
      <p className="type-body mt-5 max-w-xl text-muted-foreground">{body}</p>
    </Container>
  );
}
