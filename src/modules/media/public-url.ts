import { PUBLIC_MEDIA_BUCKET } from "@/modules/media/constants";

export function getMediaPublicUrl(input: {
  supabaseUrl: string;
  bucket: string;
  objectPath: string;
}): string {
  const base = input.supabaseUrl.replace(/\/+$/, "");
  const path = input.objectPath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${input.bucket}/${path}`;
}

export function isPublicMediaBucket(bucket: string): boolean {
  return bucket === PUBLIC_MEDIA_BUCKET;
}
