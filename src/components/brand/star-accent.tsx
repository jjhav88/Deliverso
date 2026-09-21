import { cn } from "@/lib/cn";

type StarAccentProps = {
  className?: string;
};

export function StarAccent({ className }: StarAccentProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cn("pointer-events-none text-accent", className)}
    >
      <path
        fill="currentColor"
        d="M8 0.8L9.1 6.1L14.8 8L9.1 9.9L8 15.2L6.9 9.9L1.2 8L6.9 6.1L8 0.8Z"
      />
    </svg>
  );
}
