import "server-only";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { isAppLocale } from "@/config/i18n";
import { getPathname } from "@/i18n/navigation";
import type { AuthenticatedCustomer } from "@/modules/customer-auth/action-state";
import { buildCustomerAccountCreateInput } from "@/modules/customer-auth/domain/account";
import { getSafeCustomerPath } from "@/modules/customer-auth/domain/safe-path";
import { CustomerAuthError } from "@/modules/customer-auth/domain/errors";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { welcomeEventKey } from "@/modules/email/domain/event-keys";
import { queueTransactionalEmail } from "@/modules/email/queue";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { isTransientDatabaseError, publicDatabaseError } from "@/server/db/errors";
import { getPrisma } from "@/server/db/prisma";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";
import { getVerifiedAuthUser } from "@/server/supabase/session";

function mapCustomer(row: {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  status: "ACTIVE" | "BLOCKED";
}): AuthenticatedCustomer {
  return {
    id: row.id,
    authUserId: row.authUserId,
    email: row.email,
    displayName: row.displayName,
    phone: row.phone,
    status: row.status,
  };
}

function customerLoginUrl(locale: string, next: string, blocked = false): string {
  const safeLocale = isAppLocale(locale) ? locale : "es-MX";
  const path = getPathname({ locale: safeLocale, href: "/cuenta/iniciar-sesion" });
  if (blocked) {
    return `${path}?reason=blocked`;
  }
  return `${path}?next=${encodeURIComponent(getSafeCustomerPath(next))}`;
}

export async function findCustomerByAuthUserId(
  authUserId: string,
): Promise<AuthenticatedCustomer | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  try {
    const account = await getPrisma().customerAccount.findUnique({
      where: { authUserId },
    });
    return account ? mapCustomer(account) : null;
  } catch (error) {
    if (isTransientDatabaseError(error)) {
      console.error("DATABASE_UNAVAILABLE", {
        source: "findCustomerByAuthUserId",
        ...publicDatabaseError(error),
      });
      throw new CustomerAuthError("DATABASE_UNAVAILABLE");
    }
    throw error;
  }
}

export async function getOptionalCustomer(): Promise<AuthenticatedCustomer | null> {
  if (!hasSupabaseAuthConfig() || !hasRuntimeDatabaseUrl()) {
    return null;
  }

  const user = await getVerifiedAuthUser();
  if (!user) {
    return null;
  }

  return findCustomerByAuthUserId(user.id);
}

export async function ensureCustomerAccount(input: {
  authUserId: string;
  email: string;
  termsAcceptedAt?: Date | null;
  privacyAcceptedAt?: Date | null;
  locale?: string;
}): Promise<AuthenticatedCustomer | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  const mapped = buildCustomerAccountCreateInput(input);
  const prisma = getPrisma();
  const existing = await prisma.customerAccount.findUnique({
    where: { authUserId: mapped.authUserId },
  });

  if (existing) {
    const data: { email?: string } = {};
    if (existing.email !== mapped.email) {
      data.email = mapped.email;
    }
    if (Object.keys(data).length > 0) {
      const updated = await prisma.customerAccount.update({
        where: { id: existing.id },
        data,
      });
      return mapCustomer(updated);
    }
    return mapCustomer(existing);
  }

  const locale = input.locale && isAppLocale(input.locale) ? input.locale : "es-MX";
  return prisma.$transaction(async (tx) => {
    const created = await tx.customerAccount.create({
      data: mapped,
    });
    await queueTransactionalEmail(
      {
        template: "CUSTOMER_WELCOME",
        eventKey: welcomeEventKey(created.id),
        recipientEmail: created.email,
        recipientName: created.displayName,
        locale,
        referenceType: "CustomerAccount",
        referenceId: created.id,
      },
      tx,
    );
    return mapCustomer(created);
  });
}

export async function requireCustomer(
  next = "/cuenta",
): Promise<AuthenticatedCustomer> {
  const locale = await getLocale();
  const login = customerLoginUrl(locale, next);

  if (!hasSupabaseAuthConfig() || !hasRuntimeDatabaseUrl()) {
    redirect(login);
  }

  const user = await getVerifiedAuthUser();
  if (!user || !user.emailConfirmed || !user.email) {
    redirect(login);
  }

  let customer: AuthenticatedCustomer | null;
  try {
    customer = await ensureCustomerAccount({
      authUserId: user.id,
      email: user.email,
      locale: isAppLocale(locale) ? locale : "es-MX",
    });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      throw error;
    }
    if (isTransientDatabaseError(error)) {
      console.error("DATABASE_UNAVAILABLE", {
        source: "requireCustomer",
        ...publicDatabaseError(error),
      });
      throw new CustomerAuthError("DATABASE_UNAVAILABLE");
    }
    throw error;
  }

  if (!customer) {
    redirect(login);
  }

  if (!canCustomerShop(customer.status)) {
    redirect(customerLoginUrl(locale, next, true));
  }

  return customer;
}

export async function getCustomerAccountOverview(customerId: string) {
  return getPrisma().customerAccount.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}
