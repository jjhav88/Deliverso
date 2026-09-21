import Image from "next/image";
import { brandConfig } from "@/config/brand";
import { cn } from "@/lib/cn";

const logoAssets = {
  light: {
    src: "/brand/logos/deliverso-logo-color.png",
    width: 447,
    height: 559,
  },
  dark: {
    src: "/brand/logos/deliverso-logo-monochrome.png",
    width: 590,
    height: 423,
  },
  icon: {
    src: "/brand/logos/deliverso-logo-icon-color.png",
    width: 660,
    height: 378,
  },
} as const;

const logoRenderStyle = {
  opacity: 1,
  filter: "none",
  mixBlendMode: "normal",
  background: "transparent",
} as const;

type BrandLogoProps = {
  surface?: "light" | "dark";
  mark?: "wordmark" | "icon";
  className?: string;
  priority?: boolean;
  alt?: string;
};

export function BrandLogo({
  surface = "light",
  mark = "wordmark",
  className,
  priority = false,
  alt = brandConfig.name,
}: BrandLogoProps) {
  const asset =
    mark === "icon"
      ? logoAssets.icon
      : surface === "dark"
        ? logoAssets.dark
        : logoAssets.light;

  return (
    <span className="inline-flex bg-transparent" style={logoRenderStyle}>
      <Image
        src={asset.src}
        alt={alt}
        width={asset.width}
        height={asset.height}
        priority={priority}
        unoptimized
        style={logoRenderStyle}
        className={cn("object-contain", className)}
      />
    </span>
  );
}
