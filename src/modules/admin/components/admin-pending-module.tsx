import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type AdminPendingModuleProps = {
  title: string;
  body: string;
  areas?: readonly string[];
};

export function AdminPendingModule({
  title,
  body,
  areas,
}: AdminPendingModuleProps) {
  return (
    <Card className="max-w-2xl bg-[var(--admin-surface)]">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-3 max-w-xl">{body}</CardDescription>
      {areas && areas.length > 0 ? (
        <ul className="mt-6 list-disc space-y-2 pl-5 type-body-sm text-muted-foreground">
          {areas.map((area) => (
            <li key={area}>{area}</li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
