"use client";

// The /guestbook page body: the "Sign it" button and every signature in a
// two-column masonry (one column on phones), loaded in the browser.

import { openCommand } from "@/lib/command";
import { useGuestbook } from "./data";
import { EntryCard, EntryCardSkeleton } from "./entry-card";

const ALL = 1000;
// Skeleton heights alternate so the loading wall reads like a masonry.
const SKELETONS = 6;

export function SignItButton() {
  return (
    <button
      type="button"
      onClick={() => openCommand("guestbook")}
      className="inline-flex h-9 cursor-pointer items-center rounded-[12px] bg-btn px-4 text-[14px] font-medium text-btn-fg outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.96]"
    >
      Sign it
    </button>
  );
}

export function GuestbookWall() {
  const { status, entries, enabled } = useGuestbook(ALL);

  if (status === "loading") {
    return (
      <ul aria-busy="true" aria-label="Loading signatures" className="mt-12 gap-3 min-[580px]:columns-2">
        {Array.from({ length: SKELETONS }, (_, index) => (
          <EntryCardSkeleton key={index} variant="full" lines={index % 3 === 1 ? 2 : 1} />
        ))}
      </ul>
    );
  }

  if (entries.length === 0) {
    const [title, body] =
      status === "error"
        ? ["Couldn't load the guestbook", "Something went wrong on the way here. Try again in a little while."]
        : !enabled
          ? ["Not open yet", "The guestbook isn't connected yet. Signatures will show up here once it is."]
          : ["No signatures yet", "Leave the first note and it will sit right here."];
    return (
      <div className="mt-12 flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border-strong px-6 py-10 text-center">
        <p className="text-[15px] font-medium text-primary">{title}</p>
        <p className="mt-1.5 max-w-[42ch] text-[14px] leading-[1.5] text-pretty text-tertiary">{body}</p>
      </div>
    );
  }

  return (
    <ul className="mt-12 gap-3 min-[580px]:columns-2">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} variant="full" className="animate-fade-in" />
      ))}
    </ul>
  );
}
