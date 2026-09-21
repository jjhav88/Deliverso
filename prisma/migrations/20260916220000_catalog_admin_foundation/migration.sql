-- AlterTable
ALTER TABLE "Universe" ADD COLUMN "featuredMediaAssetId" UUID;

-- CreateTable
CREATE TABLE "HomeFeaturedUniverse" (
    "id" UUID NOT NULL,
    "universeId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMPTZ,
    "endsAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "HomeFeaturedUniverse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Universe_featuredMediaAssetId_idx" ON "Universe"("featuredMediaAssetId");

-- CreateIndex
CREATE INDEX "HomeFeaturedUniverse_isActive_sortOrder_idx" ON "HomeFeaturedUniverse"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "Universe" ADD CONSTRAINT "Universe_featuredMediaAssetId_fkey" FOREIGN KEY ("featuredMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeFeaturedUniverse" ADD CONSTRAINT "HomeFeaturedUniverse_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
