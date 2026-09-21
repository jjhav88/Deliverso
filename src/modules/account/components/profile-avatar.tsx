import { User } from "lucide-react";
import { profileAvatarInitial } from "@/modules/account/domain/presentation";
import { cn } from "@/lib/cn";

type ProfileAvatarProps = {
  src?: string | null;
  displayName?: string | null;
  alt: string;
  className?: string;
};

export function ProfileAvatar({ src, displayName, alt, className }: ProfileAvatarProps) {
  const initial = profileAvatarInitial(displayName);
  return (
    <span
      className={cn(
        "inline-flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-foreground",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : initial ? (
        <span aria-hidden="true" className="type-label">
          {initial}
        </span>
      ) : (
        <User aria-hidden="true" className="size-4" />
      )}
    </span>
  );
}
