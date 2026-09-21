import { BrandLogo } from "@/components/brand/brand-logo";
import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/modules/admin/components/admin-login-form";
import { getOptionalAdmin } from "@/modules/auth/authorization/require-admin";
import { getSafeAdminPath } from "@/modules/auth/authorization/safe-redirect";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import "@/modules/admin/admin.css";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  await connection();
  const admin = await getOptionalAdmin();
  if (admin) {
    redirect("/admin");
  }

  const params = await searchParams;
  const nextPath = getSafeAdminPath(params.next);

  return (
    <main className="relative isolate min-h-dvh bg-[var(--admin-background)] px-4 py-16">
      <div className="admin-login-atmosphere" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
        <BrandLogo mark="icon" className="h-auto w-36" />
        <h1 className="mt-5 font-display text-4xl tracking-[0.12em] text-foreground">
          DELIVERSO
        </h1>
        <p className="mt-2 type-body-sm text-muted-foreground">
          Acceso administrativo
        </p>
        <Card className="mt-8 w-full bg-[var(--admin-surface)]">
          <AdminLoginForm nextPath={nextPath} />
        </Card>
      </div>
    </main>
  );
}
