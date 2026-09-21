"use client";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  decreaseLabel: string;
  increaseLabel: string;
  inputLabel: string;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  decreaseLabel,
  increaseLabel,
  inputLabel,
}: QuantitySelectorProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label={decreaseLabel}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        aria-label={inputLabel}
        value={value}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (!Number.isInteger(next)) {
            return;
          }
          onChange(Math.min(max, Math.max(min, next)));
        }}
        className="min-h-11 w-16 rounded-md border border-border-strong bg-transparent text-center tabular-nums"
      />
      <button
        type="button"
        aria-label={increaseLabel}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
