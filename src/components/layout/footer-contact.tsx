import { Mail, MapPin, Phone } from "lucide-react";
import { SocialMark } from "@/components/brand/social-mark";
import {
  getVisibleStorefrontSocial,
  storefrontContact,
  storefrontSocial,
  type StorefrontSocialId,
  type StorefrontSocialProfile,
} from "@/config/storefront-contact";
import { cn } from "@/lib/cn";
import type { PublicSiteSettings } from "@/modules/settings/queries";

type FooterColumnLabels = {
  social: string;
  contact: string;
  networks: Record<StorefrontSocialId, string>;
  email: string;
  whatsapp: string;
  address: string;
};

type FooterColumnProps = {
  labels: FooterColumnLabels;
  settings?: PublicSiteSettings | null;
};

const itemClassName = cn(
  "inline-flex min-h-6 items-center gap-2.5 type-body-sm",
  "text-surface-dark-foreground/75 transition-colors",
  "hover:text-surface-dark-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
);

const listClassName = "mt-3 flex flex-col gap-3";

const platformToId: Record<string, StorefrontSocialId> = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
};

export function resolveFooterSocial(
  settings?: PublicSiteSettings | null,
): StorefrontSocialProfile[] {
  if (!settings) {
    return getVisibleStorefrontSocial(storefrontSocial);
  }

  return settings.social
    .filter((item) => item.isActive && item.url)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((item) => {
      const id = platformToId[item.platform];
      return id ? [{ id, href: item.url }] : [];
    });
}

export function FooterSocial({ labels, settings }: FooterColumnProps) {
  const profiles = resolveFooterSocial(settings);

  if (profiles.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="type-label tracking-[0.18em] text-surface-dark-foreground">
        {labels.social}
      </p>
      <ul className={listClassName}>
        {profiles.map((profile) => {
          const label = labels.networks[profile.id];
          const content = (
            <>
              <SocialMark network={profile.id} className="h-3.5 w-3.5 shrink-0" />
              <span>{label}</span>
            </>
          );

          return (
            <li key={profile.id}>
              {profile.href ? (
                <a
                  href={profile.href}
                  aria-label={label}
                  className={itemClassName}
                  rel="noreferrer"
                  target="_blank"
                >
                  {content}
                </a>
              ) : (
                <p className={itemClassName}>{content}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FooterDetails({ labels, settings }: FooterColumnProps) {
  const email = settings ? settings.contactEmail : storefrontContact.email;
  const whatsappDisplay = settings
    ? settings.whatsapp
    : storefrontContact.whatsappDisplay;
  const whatsappHref = settings
    ? settings.whatsappHref
    : storefrontContact.whatsappHref;
  const address = settings ? settings.physicalAddress : storefrontContact.address;

  const items = [
    email ? (
      <li key="email">
        <a
          href={`mailto:${email}`}
          aria-label={`${labels.email}: ${email}`}
          className={itemClassName}
        >
          <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span>{email}</span>
        </a>
      </li>
    ) : null,
    whatsappDisplay ? (
      <li key="whatsapp">
        {whatsappHref ? (
          <a
            href={whatsappHref}
            aria-label={`${labels.whatsapp}: ${whatsappDisplay}`}
            className={itemClassName}
            rel="noreferrer"
            target="_blank"
          >
            <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            <span>{whatsappDisplay}</span>
          </a>
        ) : (
          <p
            className={itemClassName}
            aria-label={`${labels.whatsapp}: ${whatsappDisplay}`}
          >
            <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
            <span>{whatsappDisplay}</span>
          </p>
        )}
      </li>
    ) : null,
    address ? (
      <li key="address">
        <p className={itemClassName} aria-label={`${labels.address}: ${address}`}>
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span>{address}</span>
        </p>
      </li>
    ) : null,
  ].filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="type-label tracking-[0.18em] text-surface-dark-foreground">
        {labels.contact}
      </p>
      <ul className={listClassName}>{items}</ul>
    </div>
  );
}
