// One page of the guestbook (DESIGN.md → Guestbook): raised paper ruled
// every 40px, with a terracotta margin line. Everything written on it is
// set on that 40px grid so text sits on the rules like ink:
//
//   ┌──┬───────────────────────────────────────────┐
//   │  │                                           │  one blank line
//   │12│ What a lovely little corner of the web.   │  message, 40px lines
//   │  │ ~~signature~~              AMINA · 3 OCT  │  two lines: signature on the rule
//   │  │                                           │
//   │  │                 PAGE 1                    │  folio
//   └──┴───────────────────────────────────────────┘
//
// On a spread the left page loses its inner corners and the right page its
// outer ones, with a soft shadow along the spine between them.

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Height of one ruled line, in px. Every block on a page is a multiple of it. */
export const LINE = 40;

export type PageSide = "left" | "right" | "single";

export function BookPage({
  children,
  folio,
  side = "single",
  signTarget = false,
  className,
}: {
  children?: ReactNode;
  /** "Page 1", set in the last line. */
  folio?: ReactNode;
  side?: PageSide;
  /** Hovering this page previews signing (see blank-page.tsx). */
  signTarget?: boolean;
  className?: string;
}) {
  return (
    <div
      data-sign={signTarget ? "" : undefined}
      className={cn(
        "paper relative flex flex-col overflow-hidden",
        side === "left" && "md:rounded-e-none",
        side === "right" && "md:rounded-s-none",
        className,
      )}
      style={{
        // The rules sit 10px above the bottom of each 40px line, just under
        // the baseline of 18px text set on that line.
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0 ${LINE - 1}px, var(--line) ${LINE - 1}px ${LINE}px)`,
        backgroundPosition: "0 -10px",
      }}
    >
      {/* the margin line */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-9 w-px bg-terra-fill/55 md:start-14"
      />
      {/* the spine */}
      {side !== "single" ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 hidden w-8 from-[rgb(var(--shadow-rgb)/0.07)] to-transparent md:block",
            side === "left" ? "end-0 bg-linear-to-l" : "start-0 bg-linear-to-r",
          )}
        />
      ) : null}
      <div className="relative flex flex-1 flex-col ps-[52px] pe-5 pt-10 md:ps-[76px] md:pe-8">{children}</div>
      {folio ? (
        <p className="caps relative flex h-10 items-end justify-center pb-[11px] text-muted md:ps-[76px] md:pe-8">
          {folio}
        </p>
      ) : null}
    </div>
  );
}
