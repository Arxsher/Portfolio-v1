// The guestbook's count as a ledger number: Fraunces numerals in
// terracotta ("0083"), each digit a strip of 0–9 that rolls to its value.
// Digits further left start a beat later, so a change ripples across.

import { cn } from "@/lib/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const CELL_EM = 1.2; // height of one digit, in em
const STAGGER = 45; // ms between neighbouring digits

export function Odometer({
  value,
  digits = 4,
  className,
}: {
  /** null while unknown: the digits rest on zero, faded. */
  value: number | null;
  /** Minimum number of digits; more appear if the number needs them. */
  digits?: number;
  className?: string;
}) {
  const known = value !== null && Number.isFinite(value);
  const safe = known ? Math.max(0, Math.floor(value)) : 0;
  const text = String(safe).padStart(digits, "0");
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex align-baseline font-display text-[22px] leading-none text-terra [font-variant-numeric:lining-nums_tabular-nums]",
        "border-b border-line-firm",
        className,
      )}
    >
      {text.split("").map((digit, index) => {
        const fromRight = text.length - 1 - index;
        return (
          <span
            // Keyed from the right so the ones digit keeps its strip when the
            // number grows a digit.
            key={fromRight}
            aria-hidden="true"
            className="relative inline-block overflow-hidden"
            style={{ height: `${CELL_EM}em`, width: "0.62em" }}
          >
            <span
              className={cn(
                "absolute inset-x-0 top-0 block transition-[translate,opacity] duration-[520ms] ease-swap motion-reduce:transition-none",
                !known && "opacity-40",
              )}
              style={{ translate: `0 ${-Number(digit) * CELL_EM}em`, transitionDelay: `${fromRight * STAGGER}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="flex items-center justify-center" style={{ height: `${CELL_EM}em` }}>
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
