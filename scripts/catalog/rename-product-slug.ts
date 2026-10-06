import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  CHEESECAKE_ZARZAMORA_NEW_SLUG,
  CHEESECAKE_ZARZAMORA_OLD_SLUG,
} from "../../src/modules/seo/permanent-redirects";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const PRODUCT_ID = "2e965ac4-ac68-4d05-b4f8-668bed8acffe";
const LOCALE = "es-MX";
const EXPECTED_OLD_NAME = "Cheescake de Zarzamora";
const CORRECT_NAME = "Cheesecake de Zarzamora";

function getCliDatabaseUrl(): string {
  const url =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
  if (!url) {
    throw new Error("DIRECT_URL or DATABASE_URL is required.");
  }
  return url;
}

function redact(message: string): string {
  return message.replace(/postgresql:\/\/[^\s]+/gi, "postgresql://[redacted]");
}

function shouldApply(): boolean {
  return process.argv.includes("--apply");
}

async function main() {
  const adapter = new PrismaPg({ connectionString: getCliDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    const matches = await prisma.productTranslation.findMany({
      where: { locale: LOCALE, slug: CHEESECAKE_ZARZAMORA_OLD_SLUG },
      include: {
        product: {
          select: {
            id: true,
            status: true,
            publishedAt: true,
            updatedAt: true,
            translations: {
              select: { locale: true, name: true, slug: true },
            },
          },
        },
      },
    });

    const newSlugHits = await prisma.productTranslation.findMany({
      where: { locale: LOCALE, slug: CHEESECAKE_ZARZAMORA_NEW_SLUG },
      select: { id: true, productId: true, locale: true, slug: true },
    });

    const summary = {
      apply: shouldApply(),
      matchCount: matches.length,
      productId: matches[0]?.product.id ?? null,
      status: matches[0]?.product.status ?? null,
      publishedAt: matches[0]?.product.publishedAt ?? null,
      translations: matches[0]?.product.translations ?? [],
      newSlugAlreadyExists: newSlugHits.length > 0,
    };

    if (matches.length !== 1) {
      console.error(
        JSON.stringify(
          { ok: false, reason: "EXPECTED_EXACTLY_ONE_OLD_SLUG", ...summary },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }

    const row = matches[0];
    if (!row || row.product.id !== PRODUCT_ID) {
      console.error(
        JSON.stringify(
          { ok: false, reason: "PRODUCT_ID_MISMATCH", ...summary },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }

    if (newSlugHits.length > 0) {
      console.error(
        JSON.stringify(
          { ok: false, reason: "NEW_SLUG_ALREADY_EXISTS", ...summary },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }

    if (!shouldApply()) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            dryRun: true,
            ...summary,
            next: "Re-run with --apply after the redirect is live in production.",
          },
          null,
          2,
        ),
      );
      return;
    }

    const nextName =
      row.name === EXPECTED_OLD_NAME || row.name === CORRECT_NAME
        ? CORRECT_NAME
        : row.name;

    const updated = await prisma.$transaction(async (tx) => {
      const translation = await tx.productTranslation.update({
        where: { id: row.id },
        data: {
          slug: CHEESECAKE_ZARZAMORA_NEW_SLUG,
          name: nextName,
        },
        select: {
          id: true,
          productId: true,
          locale: true,
          slug: true,
          name: true,
        },
      });

      const product = await tx.product.update({
        where: { id: PRODUCT_ID },
        data: { updatedAt: new Date() },
        select: { id: true, status: true, updatedAt: true },
      });

      return { translation, product };
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          applied: true,
          productId: updated.product.id,
          status: updated.product.status,
          locale: updated.translation.locale,
          oldSlug: CHEESECAKE_ZARZAMORA_OLD_SLUG,
          newSlug: updated.translation.slug,
          name: updated.translation.name,
          updatedAt: updated.product.updatedAt,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Rename failed.";
  console.error(redact(message));
  process.exitCode = 1;
});
