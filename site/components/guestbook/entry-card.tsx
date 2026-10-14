// One signature, written on a ruled page (components/guestbook/book-page.tsx):
// the note in italic Fraunces on the 40px lines, then the drawn signature
// in cobalt ink sitting on the next rule, with the name in small caps and
// the date beside it. Its number in the book (counted from the first
// signature) sits in the margin.
//
//   12 │ What a lovely little corner of the web.
//      │ ~~signature~~                         AMINA · 3 Oct 2026
//
// Every block is a multiple of LINE, so the text stays on the rules.

import type { GuestbookEntry } from "@/lib/guestbook";
import { cn } from "@/lib/cn";
import { Signature } from "./signature";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "13 Oct 2026". */
export function formatEntryDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

export function Entry({
  entry,
  number,
  className,
}: {
  entry: GuestbookEntry;
  /** Its place in the book, counted from the first signature (shown in the margin). */
  number?: number;
  className?: string;
}) {
  const date = formatEntryDate(entry.created_at);
  return (
    <li className={cn("relative mb-10 last:mb-0", className)}>
      {number !== undefined ? (
        <span
          aria-hidden="true"
          className="numeral absolute end-[calc(100%+24px)] top-0 text-[13px] leading-10 md:end-[calc(100%+30px)] md:text-[14px]"
        >
          {number}
        </span>
      ) : null}
      <p className="serif-italic text-[18px] leading-10 break-words text-primary">{entry.message}</p>
      <div className="flex h-20 items-end gap-4 pb-[9px]">
        <Signature
          path={entry.signature}
          name={entry.name}
          className="h-14 w-auto max-w-[min(200px,55%)] min-w-0 text-cobalt"
        />
        <p className="ms-auto min-w-0 pb-0.5 text-end leading-none">
          <span className="caps block truncate text-primary">{entry.name}</span>
          {date ? (
            <time dateTime={entry.created_at} className="mt-1.5 block text-caption leading-none text-muted tabular-nums">
              {date}
            </time>
          ) : null}
        </p>
      </div>
    </li>
  );
}

/** Loading placeholder with the footprint of a one-line entry. */
export function EntrySkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <li aria-hidden="true" className="mb-10 last:mb-0">
      <div className="flex h-10 items-end pb-3">
        <div className={cn("skeleton h-3.5 rounded-[4px]", wide ? "w-11/12" : "w-3/4")} />
      </div>
      <div className="flex h-20 items-end justify-between gap-4 pb-3">
        <div className="skeleton h-9 w-[132px] rounded-[6px]" />
        <div className="skeleton h-3 w-20 rounded-[4px]" />
      </div>
    </li>
  );
}
