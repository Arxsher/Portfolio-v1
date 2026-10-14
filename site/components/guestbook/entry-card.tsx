// One guestbook signature as a card: the signature on top, then the note
// behind a small coloured quote mark, then who wrote it.
//
//   compact  home grid: 148px tall tiles, note clamped to two lines
//   full     /guestbook wall: roomier card with the full note and the date

import type { GuestbookEntry } from "@/lib/guestbook";
import { cn } from "@/lib/cn";
import { Signature } from "./signature";

// Written out in full so Tailwind generates them.
const QUOTE_COLORS = [
  "text-quote-purple",
  "text-quote-amber",
  "text-quote-red",
  "text-quote-blue",
  "text-quote-green",
] as const;

/** The same entry always gets the same quote colour. */
export function quoteColor(entry: Pick<GuestbookEntry, "id">): string {
  // FNV-1a over the id.
  let hash = 0x811c9dc5;
  for (let i = 0; i < entry.id.length; i++) {
    hash ^= entry.id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return QUOTE_COLORS[(hash >>> 0) % QUOTE_COLORS.length];
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "13 Oct 2026". */
export function formatEntryDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

/** A filled double quote mark drawn on an 18 grid. */
export function QuoteMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
      className={cn("me-0.5 inline-block shrink-0 align-[-0.25em]", className)}
    >
      {/* Two "6"-shaped marks: a round drop with a tail flicking up. */}
      <g fill="currentColor" stroke="currentColor" strokeWidth={0.9} strokeLinejoin="round">
        <circle cx="5.65" cy="8" r="1.45" />
        <path d="M4.2 8.1C4.2 6.4 5 5.2 6.65 4.6l.4.66C6.15 5.72 5.66 6.3 5.55 6.7Z" />
        <circle cx="10.45" cy="8" r="1.45" />
        <path d="M9 8.1c0-1.7.8-2.9 2.45-3.5l.4.66c-.9.46-1.39 1.04-1.5 1.44Z" />
      </g>
    </svg>
  );
}

export function EntryCard({
  entry,
  variant = "compact",
  className,
}: {
  entry: GuestbookEntry;
  variant?: "compact" | "full";
  className?: string;
}) {
  const color = quoteColor(entry);

  if (variant === "full") {
    const date = formatEntryDate(entry.created_at);
    return (
      <li className={cn("mb-3 break-inside-avoid rounded-panel bg-tile p-5", className)}>
        <Signature path={entry.signature} name={entry.name} className="h-11 w-full max-w-[160px] text-primary" />
        <p className="mt-4 text-[16px]/[1.5] break-words text-primary">
          <QuoteMark size={19} className={color} />
          {entry.message}
        </p>
        <p className="mt-3 flex items-baseline gap-3 text-[13px]">
          <span className="min-w-0 truncate text-secondary">{entry.name}</span>
          {date ? (
            <time dateTime={entry.created_at} className="ms-auto shrink-0 text-tertiary tabular-nums">
              {date}
            </time>
          ) : null}
        </p>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "flex min-h-[148px] flex-col justify-between gap-3 rounded-card bg-tile p-3.5",
        className,
      )}
    >
      <Signature path={entry.signature} name={entry.name} className="h-11 w-full max-w-[140px] text-primary" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-[13px]/[1.5] break-words text-primary">
          <QuoteMark size={16} className={color} />
          {entry.message}
        </p>
        <p className="mt-1 truncate text-[12px] text-tertiary">{entry.name}</p>
      </div>
    </li>
  );
}

/** Loading placeholder with the exact footprint of a card. */
export function EntryCardSkeleton({
  variant = "compact",
  lines = 1,
  className,
}: {
  variant?: "compact" | "full";
  /** Message lines to suggest (full variant). */
  lines?: 1 | 2;
  className?: string;
}) {
  if (variant === "full") {
    return (
      <li aria-hidden="true" className={cn("mb-3 break-inside-avoid rounded-panel bg-tile p-5", className)}>
        <div className="skeleton h-11 w-[120px] rounded-[10px] bg-well/60" />
        <div className="mt-[22px] h-3 w-4/5 rounded-[6px] bg-well/60" />
        {lines === 2 ? <div className="mt-3 h-3 w-1/2 rounded-[6px] bg-well/60" /> : null}
        <div className="mt-[18px] flex h-[21px] items-center justify-between">
          <div className="h-3 w-16 rounded-[6px] bg-well/60" />
          <div className="h-3 w-20 rounded-[6px] bg-well/60" />
        </div>
      </li>
    );
  }
  return (
    <li
      aria-hidden="true"
      className={cn("flex min-h-[148px] flex-col justify-between gap-3 rounded-card bg-tile p-3.5", className)}
    >
      <div className="skeleton h-11 w-[104px] rounded-[10px] bg-well/60" />
      <div>
        <div className="h-[13px] w-4/5 rounded-[6px] bg-well/60" />
        <div className="mt-2.5 h-[10px] w-12 rounded-[5px] bg-well/60" />
      </div>
    </li>
  );
}
