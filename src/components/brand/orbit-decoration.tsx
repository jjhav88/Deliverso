import { cn } from "@/lib/cn";

type OrbitDecorationProps = {
  className?: string;
};

export function OrbitDecoration({ className }: OrbitDecorationProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 120"
      className={cn("pointer-events-none text-deliverso-lilac", className)}
      fill="none"
    >
      <ellipse
        cx="100"
        cy="60"
        rx="78"
        ry="28"
        stroke="currentColor"
        strokeDasharray="3 8"
        strokeOpacity="0.55"
        transform="rotate(-18 100 60)"
      />
      <ellipse
        cx="100"
        cy="60"
        rx="58"
        ry="20"
        stroke="var(--deliverso-gold)"
        strokeOpacity="0.45"
        transform="rotate(12 100 60)"
      />
      <circle cx="168" cy="42" r="3.5" fill="var(--deliverso-pink)" fillOpacity="0.7" />
      <circle cx="38" cy="78" r="2.5" fill="var(--deliverso-gold)" fillOpacity="0.8" />
    </svg>
  );
}
