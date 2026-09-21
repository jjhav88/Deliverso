import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type DashboardCardProps = {
  href: string;
  title: string;
  description: string;
  status: string;
};

export function DashboardCard({
  href,
  title,
  description,
  status,
}: DashboardCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full bg-[var(--admin-surface)] transition-shadow hover:shadow-md">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <p className="mt-5 type-caption uppercase tracking-[0.14em] text-secondary">
          {status}
        </p>
      </Card>
    </Link>
  );
}
