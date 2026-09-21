import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../../src/generated/prisma/client";
import { parseGrantAdminInput } from "../../src/modules/auth/bootstrap/grant-admin-input";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

function readArg(name: string): string | undefined {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function getCliDatabaseUrl(): string {
  const url =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

  if (!url) {
    throw new Error("DIRECT_URL or DATABASE_URL is required for admin:grant.");
  }

  return url;
}

function redact(message: string): string {
  return message.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://[redacted]");
}

async function main() {
  const parsed = parseGrantAdminInput({
    authUserId: readArg("auth-user-id"),
    email: readArg("email"),
    role: readArg("role"),
    displayName: readArg("display-name"),
  });

  if (!parsed.ok) {
    for (const error of parsed.errors) {
      console.error(`${error.field}: ${error.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const adapter = new PrismaPg({ connectionString: getCliDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  const accountData = {
    authUserId: parsed.value.authUserId,
    email: parsed.value.email,
    role: parsed.value.role,
    displayName: parsed.value.displayName,
    status: "ACTIVE" as const,
  };

  try {
    const existing = await prisma.adminAccount.findFirst({
      where: {
        OR: [
          { authUserId: parsed.value.authUserId },
          { email: parsed.value.email },
        ],
      },
      select: { id: true },
    });

    const account = existing
      ? await prisma.adminAccount.update({
          where: { id: existing.id },
          data: accountData,
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        })
      : await prisma.adminAccount.create({
          data: accountData,
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        });

    console.log(
      `AdminAccount listo: ${account.role} ${account.status} (${account.email}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Grant failed.";
  console.error(redact(message));
  process.exitCode = 1;
});
