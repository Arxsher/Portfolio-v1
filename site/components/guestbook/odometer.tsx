// A mechanical-counter number: one small box per digit ("0083"), each box a
// strip of 0–9 that slides to the current digit. Digits further left start
// a beat later, so a change ripples across like a real odometer.

import { cn } from "@/lib/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const CELL = 24; // px, height of one digit
const STAGGER = 45; // ms between neighbouring digits

export function Odometer({
  value,
  digits = 4,
  className,
}: {
  /** null while unknown: the boxes rest on zero, dimmed. */
  value: number | null;
  /** Minimum number of boxes; more appear if the number needs them. */
  digits?: number;
  className?: string;
}) {
  const known = value !== null && Number.isFinite(value);
  const safe = known ? Math.max(0, Math.floor(value)) : 0;
  const text = String(safe).padStart(digits, "0");
  return (
    <span
      dir="ltr"
      className={cn("inline-flex gap-1 rounded-chip p-1 align-middle shadow-lift", className)}
    >
      {text.split("").map((digit, index) => {
        const fromRight = text.length - 1 - index;
        return (
          <span
            // Keyed from the right so the ones digit keeps its box when the
            // number grows a digit.
            key={fromRight}
            aria-hidden="true"
            className="relative inline-flex h-6 w-[18px] overflow-hidden rounded-md bg-float text-[14px] leading-none text-primary tabular-nums shadow-lift"
          >
            <span
              className={cn(
                "block w-full transition-[translate,opacity] duration-[460ms] ease-swap motion-reduce:transition-none",
                !known && "opacity-35",
              )}
              style={{ translate: `0 ${-Number(digit) * CELL}px`, transitionDelay: `${fromRight * STAGGER}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="flex h-6 items-center justify-center">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      <span className="sr-only">{known ? safe : "Counting"}</span>
    </span>
  );
}
