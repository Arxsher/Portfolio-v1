"use client";

// Home page guestbook: the five newest signatures (three on phones) in a
// 3-column grid, closed by the dashed "Leave a note" card that opens the
// sign form in the command bar. Entries load in the browser; until then
// the cells hold skeletons of the same size. No entries, no fake ones:
// just the note card and a quiet line.

import { EntryCard, EntryCardSkeleton } from "@/components/guestbook/entry-card";
import { useGuestbook } from "@/components/guestbook/data";
import { Pen } from "@/components/icons";
import { Section } from "@/components/section";
import { cn } from "@/lib/cn";
import { openCommand } from "@/lib/command";

const SHOWN = 5;
// The 4th and 5th entries only show from sm up (2×2 grid on phones).
const cellVisibility = (index: number) => (index >= 3 ? "hidden sm:flex" : undefined);

export function Guestbook() {
  const { status, entries, count, enabled } = useGuestbook(SHOWN);
  const loading = status === "loading";

  const emptyLine =
    status === "error"
      ? "Couldn't load the guestbook right now."
      : !enabled
        ? "Signatures will show up here once the guestbook is live."
        : status === "ready" && entries.length === 0
          ? "No signatures yet. Yours could be the first."
          : null;

  return (
    <Section
      id="guestbook"
      label="guestbook"
      count={enabled && count !== null ? `${count} signed` : undefined}
      action={{ label: "Read them all", href: "/guestbook/" }}
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-busy={loading || undefined}>
        {loading
          ? Array.from({ length: SHOWN }, (_, index) => (
              <EntryCardSkeleton key={`skeleton-${index}`} className={cellVisibility(index)} />
            ))
          : entries.map((entry, index) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                className={cn("animate-fade-in", cellVisibility(index))}
              />
            ))}
        <li>
          <LeaveNoteCard />
        </li>
        {emptyLine ? (
          <li className="col-span-1 flex min-h-[148px] items-center px-3.5 text-[13px] leading-[1.5] text-tertiary text-pretty sm:col-span-2">
            {emptyLine}
          </li>
        ) : null}
      </ul>
    </Section>
  );
}

function LeaveNoteCard() {
  return (
    <button
      type="button"
      onClick={() => openCommand("guestbook")}
      className="group flex size-full min-h-[148px] cursor-pointer flex-col justify-between rounded-card border border-dashed border-line-firm p-3.5 text-start transition-[border-color,background-color] duration-200 ease-out hover:border-transparent hover:bg-tile focus-visible:border-transparent focus-visible:bg-tile focus-ring"
    >
      <span className="grid size-8 place-items-center rounded-[9px] bg-well text-secondary transition-[color] duration-200 group-hover:text-primary group-focus-visible:text-primary">
        <Pen />
      </span>
      <span className="text-[13px] leading-[1.5]">
        <span className="block text-primary">Leave a note</span>
        <span className="block text-tertiary">Signed by hand, kept here</span>
      </span>
    </button>
  );
}
