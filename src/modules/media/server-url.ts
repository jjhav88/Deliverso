import "server-only";
import { getSupabaseUrl } from "@/server/supabase/env";
import { getMediaPublicUrl } from "@/modules/media/public-url";

export function mediaAssetPublicUrl(asset: {
  bucket: string;
  objectPath: string;
}): string {
  return getMediaPublicUrl({
    supabaseUrl: getSupabaseUrl(),
    bucket: asset.bucket,
    objectPath: asset.objectPath,
  });
}
