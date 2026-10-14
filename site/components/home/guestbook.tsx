"use client";

// Home: Six · Guestbook. The book lies open at its latest page:
//
//   ┌ ruled page ───────────────┐
//   │  │ newest note            │    The first page is still blank.
//   │  │ ~~signature~~   NAME   │    Like the book by the door of a riad …
//   │  │ …                      │    [✦ Sign the guestbook]  Read the book →
//   └───────────────────────────┘
//
// With signatures, the page shows the two newest (in the order they were
// signed into the book) and the count rides on the title. Without any (or
// while the guestbook isn't connected) it is the blank first page, never
// made-up entries. Entries load in the browser; the static HTML holds the
// loading page (or the blank one when there is no guestbook at all).

import Link from "next/link";
import { BlankPage } from "@/components/guestbook/blank-page";
import { BookPage } from "@/components/guestbook/book-page";
import { useGuestbook } from "@/components/guestbook/data";
import { Entry, EntrySkeleton } from "@/components/guestbook/entry-card";
import { SignButton } from "@/components/guestbook/sign-button";
import { Arrow } from "@/components/ornament";
import { Section } from "@/components/section";

const SHOWN = 2;
const HOW = "write a line, then draw your name with a mouse, a finger or a pen.";

export function Guestbook() {
  const { status, entries, count, enabled } = useGuestbook(SHOWN);
  const loading = status === "loading";
  const signed = entries.length > 0;
  const total = count ?? (signed ? entries.length : null);

  const [heading, body] = loading
    ? ["The book is open.", `Like the book by the door of a riad: ${HOW}`]
    : status === "error" && !signed
      ? ["The book is out of reach.", "Couldn’t load the guestbook right now. Try again in a little while."]
      : !enabled
        ? ["The first page is still blank.", `The book isn’t open for signing yet. When it is, ${HOW}`]
        : signed
          ? [
              total !== null ? `${total} ${total === 1 ? "name" : "names"} in the book so far.` : "The book is open.",
              `Add yours on the next free line: ${HOW}`,
            ]
          : ["The first page is still blank.", `Like the book by the door of a riad: ${HOW} The first line is yours.`];

  return (
    <Section
      id="guestbook"
      label="guestbook"
      numeral="Six"
      title="Sign the"
      turn="book"
      count={enabled && signed && total !== null ? total : undefined}
    >
      <div className="group/sign grid grid-cols-[minmax(0,1fr)] items-center gap-x-[clamp(28px,5vw,72px)] gap-y-9 md:grid-cols-2">
        {loading ? (
          <BookPage folio="Latest page" className="min-h-[360px]">
            <ul aria-busy="true" aria-label="Loading the latest signatures">
              <EntrySkeleton wide />
              <EntrySkeleton />
            </ul>
          </BookPage>
        ) : signed ? (
          <BookPage folio="Latest page" className="min-h-[360px]">
            <ol aria-label="The latest signatures" className="animate-fade-in">
              {entries.map((entry, index) => (
                <Entry key={entry.id} entry={entry} number={total !== null ? total - index : undefined} />
              ))}
            </ol>
          </BookPage>
        ) : (
          <BlankPage folio="Page 1" className="min-h-[360px]" />
        )}

        <div>
          <h3 className="serif-italic text-title-2 text-balance text-primary">{heading}</h3>
          <p className="mt-3.5 max-w-[42ch] text-[16.5px] leading-[1.6] text-pretty text-body">{body}</p>
          <div className="mt-[26px] flex flex-wrap items-center gap-x-7 gap-y-4">
            <SignButton />
            {signed ? (
              <Link href="/guestbook/" className="link-arrow focus-ring rounded-[4px]">
                Read the book
                <Arrow />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}
