-- Profile avatars (M15B.1). Nullable; no backfill.
ALTER TABLE "AdminAccount" ADD COLUMN "avatarPath" TEXT;
ALTER TABLE "CustomerAccount" ADD COLUMN "avatarPath" TEXT;
