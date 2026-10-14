"use client";

// The /guestbook/ page body: the page heading (with the real count once it
// is known) and the book itself, open at a spread of two facing ruled pages,
// newest signatures first:
//
//   ┌ page 1 ─────────────┬ page 2 ─────────────┐
//   │ 83 │ note           │ 79 │ note           │
//   │    │ ~~sig~~  NAME  │    │ ~~sig~~  NAME  │
//   │    …                │    …                │
//   │       PAGE 1        │       PAGE 2        │
//   └─────────────────────┴─────────────────────┘
//   PAGES 1–2 OF 11                ← Newer   Older →
//
// Phones stack the two pages. Turning keeps focus on the button that was
// pressed (or its twin when it runs out), brings the top of the book back
// into view and reads the new page numbers out. No signatures, no
// guestbook, or an error: the blank first page and a line about why.

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/section";
import { cn } from "@/lib/cn";
import type { GuestbookEntry } from "@/lib/guestbook";
import { BlankPage } from "./blank-page";
import { GUESTBOOK_LEDE } from "./copy";
import { BookPage } from "./book-page";
import { useGuestbook } from "./data";
import { Entry, EntrySkeleton } from "./entry-card";
import { SignButton } from "./sign-button";

const ALL = 1000;
/** Signatures per page; a spread shows two pages. */
export const PER_PAGE = 4;


function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export function GuestbookBook() {
  const { status, entries, count, enabled } = useGuestbook(ALL);
  const signed = entries.length > 0;
  const total = count ?? (signed ? entries.length : null);

  return (
    <div className="group/sign">
      <PageHeader
        kicker="Guestbook"
        title="Sign the"
        turn="book"
        count={enabled && signed && total !== null ? total : undefined}
        lede={
          <>
            <p>{GUESTBOOK_LEDE}</p>
            <div className="mt-7">
              <SignButton />
            </div>
          </>
        }
      />
      {status === "loading" ? (
        <Spread
          left={<SkeletonPage folio="Page 1" />}
          right={<SkeletonPage folio="Page 2" />}
          busy
        />
      ) : signed ? (
        <Pages entries={entries} total={total ?? entries.length} />
      ) : (
        <Spread
          left={<BlankPage folio="Page 1" side="left" className="min-h-[440px]" />}
          right={<WhyBlank status={status} enabled={enabled} />}
        />
      )}
    </div>
  );
}

function Spread({ left, right, busy = false }: { left: ReactNode; right?: ReactNode; busy?: boolean }) {
  return (
    <div
      aria-busy={busy || undefined}
      className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 md:gap-0"
    >
      {left}
      {right}
    </div>
  );
}

function SkeletonPage({ folio }: { folio: string }) {
  const side = folio === "Page 1" ? "left" : "right";
  return (
    <BookPage folio={folio} side={side} className={cn("min-h-[440px]", side === "right" && "max-md:hidden")}>
      <ul aria-hidden="true">
        <EntrySkeleton wide />
        <EntrySkeleton />
        <EntrySkeleton wide />
      </ul>
    </BookPage>
  );
}

function WhyBlank({ status, enabled }: { status: string; enabled: boolean }) {
  const [heading, body] =
    status === "error"
      ? ["The book is out of reach.", "Couldn’t load the guestbook right now. Try again in a little while."]
      : !enabled
        ? ["The first page is still blank.", "The book isn’t open for signing yet. When it is, every note will be kept on these pages, newest first."]
        : ["The first page is still blank.", "Nobody has signed yet, so the first line is yours."];
  return (
    <BookPage folio="Page 2" side="right" className="min-h-[440px]">
      <div className="flex flex-1 flex-col justify-center pb-10">
        <p className="serif-italic text-title-2 text-balance text-primary">{heading}</p>
        <p className="mt-3 max-w-[40ch] text-[16.5px] leading-[1.6] text-pretty text-body">{body}</p>
      </div>
    </BookPage>
  );
}

function Pages({ entries, total }: { entries: GuestbookEntry[]; total: number }) {
  const pages = chunk(entries, PER_PAGE);
  const spreads = Math.max(1, Math.ceil(pages.length / 2));
  const [spread, setSpread] = useState(0);
  const current = Math.min(spread, spreads - 1);
  const first = current * 2;
  const left = pages[first] ?? [];
  const right = pages[first + 1];
  const bookRef = useRef<HTMLDivElement>(null);
  const newerRef = useRef<HTMLButtonElement>(null);
  const olderRef = useRef<HTMLButtonElement>(null);
  const turned = useRef<"newer" | "older" | null>(null);

  const label =
    right !== undefined
      ? `Pages ${first + 1}–${first + 2} of ${pages.length}`
      : `Page ${first + 1} of ${pages.length}`;

  function turn(direction: "newer" | "older") {
    turned.current = direction;
    setSpread(Math.max(0, Math.min(spreads - 1, current + (direction === "older" ? 1 : -1))));
  }

  // After a turn: keep focus on a live button and bring the book's top into view.
  useEffect(() => {
    const direction = turned.current;
    if (!direction) return;
    turned.current = null;
    const atEnd = direction === "older" ? current >= spreads - 1 : current <= 0;
    if (atEnd) (direction === "older" ? newerRef : olderRef).current?.focus({ preventScroll: true });
    const top = bookRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      bookRef.current?.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" });
    }
  }, [current, spreads]);

  const number = (page: number, index: number) => total - (page * PER_PAGE + index);

  return (
    <div ref={bookRef} className="scroll-mt-[calc(var(--bar)+24px)]">
      <h2 className="sr-only">Signatures, newest first</h2>
      <div key={current} className="grid animate-fade-in grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 md:gap-0">
        <BookPage folio={`Page ${first + 1}`} side="left" className="min-h-[440px]">
          <ol aria-label={`Page ${first + 1}`}>
            {left.map((entry, index) => (
              <Entry key={entry.id} entry={entry} number={number(first, index)} />
            ))}
          </ol>
        </BookPage>
        {right ? (
          <BookPage folio={`Page ${first + 2}`} side="right" className="min-h-[440px]">
            <ol aria-label={`Page ${first + 2}`}>
              {right.map((entry, index) => (
                <Entry key={entry.id} entry={entry} number={number(first + 1, index)} />
              ))}
            </ol>
          </BookPage>
        ) : (
          // The facing page of the last spread is still blank.
          <BookPage side="right" className="min-h-[440px] max-md:hidden" />
        )}
      </div>

      {spreads > 1 ? (
        <nav aria-label="Turn the pages" className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="caps text-muted tabular-nums" aria-live="polite">
            {label}
          </p>
          <div className="flex gap-2">
            <button
              ref={newerRef}
              type="button"
              onClick={() => turn("newer")}
              disabled={current === 0}
              className="btn btn-soft btn-sm"
            >
              <span aria-hidden="true">←</span> Newer
            </button>
            <button
              ref={olderRef}
              type="button"
              onClick={() => turn("older")}
              disabled={current >= spreads - 1}
              className="btn btn-soft btn-sm"
            >
              Older <span aria-hidden="true">→</span>
            </button>
          </div>
        </nav>
      ) : (
        <p className="caps mt-6 text-muted">{label}</p>
      )}
    </div>
  );
}
