-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TIKTOK');

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "originalFilename" TEXT;

-- CreateTable
CREATE TABLE "HomePage" (
    "id" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showIntroduction" BOOLEAN NOT NULL DEFAULT true,
    "showFeaturedProducts" BOOLEAN NOT NULL DEFAULT true,
    "showUniverses" BOOLEAN NOT NULL DEFAULT true,
    "showPersonalization" BOOLEAN NOT NULL DEFAULT true,
    "showValueProposition" BOOLEAN NOT NULL DEFAULT true,
    "showFinalCta" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "HomePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomePageTranslation" (
    "id" UUID NOT NULL,
    "homePageId" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "heroEyebrow" TEXT,
    "heroHeadline" TEXT,
    "heroDescription" TEXT,
    "introductionTitle" TEXT,
    "introductionBody" TEXT,
    "featuredEyebrow" TEXT,
    "featuredTitle" TEXT,
    "universesTitle" TEXT,
    "universesDescription" TEXT,
    "personalizationTitle" TEXT,
    "personalizationDescription" TEXT,
    "finalCtaTitle" TEXT,
    "finalCtaDescription" TEXT,

    CONSTRAINT "HomePageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" UUID NOT NULL,
    "contactEmail" TEXT,
    "whatsapp" TEXT,
    "physicalAddress" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" UUID NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomePageTranslation_homePageId_locale_key" ON "HomePageTranslation"("homePageId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_platform_key" ON "SocialLink"("platform");

-- CreateIndex
CREATE INDEX "SocialLink_isActive_sortOrder_idx" ON "SocialLink"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");

-- AddForeignKey
ALTER TABLE "HomePageTranslation" ADD CONSTRAINT "HomePageTranslation_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "HomePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
