import type { StorefrontSocialId } from "@/config/storefront-contact";

type SocialMarkProps = {
  network: StorefrontSocialId;
  className?: string;
};

export function SocialMark({ network, className }: SocialMarkProps) {
  switch (network) {
    case "facebook":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-2.1C12.4 3 11 4.5 11 6.6v1.9H9v2.6h2V21h3.5v-9.9h2.4l.6-2.6h-3Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="17.1" cy="6.9" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M14.2 4c.5 2.2 1.9 3.7 4.1 4v2.5c-1.4 0-2.7-.4-3.9-1.1v5.8c0 3.2-2.5 5.6-5.7 5.6S3 18.4 3 15.2c0-3.1 2.4-5.5 5.5-5.6v2.7c-1.6.1-2.8 1.4-2.8 2.9 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9V4h2.7Z" />
        </svg>
      );
  }
}
