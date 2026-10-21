"use client";

// The /guestbook page body: the guest house at full size (every guest a lit
// window, see house/house.tsx), and under it the register, every note in
// one quiet list, newest first, so the whole book can be read without
// pointing at windows one by one. The register and the house are linked:
// hovering or focusing a row marks its window, and the window chip on each
// row scrolls the house to it and opens its note.

import { useRef, type RefObject } from "react";
import { useFinePointer } from "@/components/lab/hooks";
import { SectionHeader } from "@/components/section";
import { cn } from "@/lib/cn";
import { openCommand } from "@/lib/command";
import type { GuestbookEntry } from "@/lib/guestbook";
import { useGuestbook } from "./data";
import { formatEntryDate, windowNumber } from "./format";
import { GuestHouse, type GuestHouseHandle } from "./house/house";
import { HOUSE_CSS } from "./house/styles";
import { Signature } from "./signature";

const ALL = 1000;
/** Floors drawn before the break line takes over. */
const PAGE_FLOORS = 24;

export function SignItButton() {
  return (
    <button
      type="button"
      onClick={() => openCommand("guestbook")}
      className="inline-flex h-9 cursor-pointer items-center rounded-[12px] bg-ink px-4 text-[14px] font-medium text-on-ink transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] focus-ring"
    >
      Sign it
    </button>
  );
}

export function GuestbookWall() {
  const { status, entries, count, enabled } = useGuestbook(ALL);
  const house = useRef<GuestHouseHandle>(null);
  const fine = useFinePointer();
  const total = Math.max(count ?? 0, entries.length);

  const hint =
    status === "error"
      ? "Couldn't load the guestbook right now."
      : !enabled
        ? "Not open yet. Windows light up as people sign."
        : status === "ready" && total === 0
          ? "No one has signed yet. The first window is yours."
          : status === "ready"
            ? fine
              ? "Point at a window to read its note."
              : "Tap a window to read its note."
            : "Turning the lights on…";

  return (
    <>
      <GuestHouse
        ref={house}
        className="mt-12"
        size="page"
        entries={entries}
        count={count}
        status={status}
        enabled={enabled}
        maxFloors={PAGE_FLOORS}
        hint={hint}
      />
      <Register status={status} entries={entries} total={total} house={house} />
    </>
  );
}

function Register({
  status,
  entries,
  total,
  house,
}: {
  status: ReturnType<typeof useGuestbook>["status"];
  entries: GuestbookEntry[];
  total: number;
  house: RefObject<GuestHouseHandle | null>;
}) {
  if (status === "disabled" || status === "error") return null;
  const loading = status === "loading";
  if (!loading && entries.length === 0) return null;
  return (
    <section aria-labelledby="register-title" className="gh mt-16">
      <style href="guest-house" precedence="default">
        {HOUSE_CSS}
      </style>
      <SectionHeader id="register-title" label="every note" count={loading ? undefined : total} />
      <ol className="mt-3" aria-busy={loading || undefined}>
        {loading
          ? Array.from({ length: 4 }, (_, i) => <RowSkeleton key={i} wide={i % 2 === 0} />)
          : entries.map((entry, i) => (
              <Row key={entry.id} entry={entry} index={total - 1 - i} house={house} />
            ))}
      </ol>
    </section>
  );
}

function Row({ entry, index, house }: { entry: GuestbookEntry; index: number; house: RefObject<GuestHouseHandle | null> }) {
  const date = formatEntryDate(entry.created_at);
  const mark = (on: boolean) => house.current?.highlight(on ? entry.id : null);
  return (
    <li
      className="group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 border-t border-border py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
      onPointerEnter={(event) => event.pointerType !== "touch" && mark(true)}
      onPointerLeave={() => mark(false)}
    >
      <button
        type="button"
        onClick={() => house.current?.reveal(entry.id)}
        onFocus={() => mark(true)}
        onBlur={() => mark(false)}
        aria-label={`Show window ${windowNumber(index)} on the house`}
        className="mt-0.5 flex cursor-pointer items-center gap-2 rounded-[8px] py-0.5 pe-1 text-[13px] text-tertiary tabular-nums transition-colors duration-150 hover:text-primary focus-ring"
      >
        <span aria-hidden="true" className="gh-chip" />
        {windowNumber(index)}
      </button>
      <div className="min-w-0">
        <p className="text-[15px]/[1.5] text-pretty break-words text-primary">{entry.message}</p>
        <p className="mt-1 flex min-w-0 items-baseline gap-1.5 text-[13px] text-tertiary">
          <span className="min-w-0 truncate text-secondary">{entry.name}</span>
          {date ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={entry.created_at} className="shrink-0 tabular-nums">
                {date}
              </time>
            </>
          ) : null}
        </p>
        <Signature path={entry.signature} name={entry.name} strokeWidth={1.6} className="mt-2.5 h-8 w-full max-w-[140px] text-primary sm:hidden" />
      </div>
      <Signature
        path={entry.signature}
        name={entry.name}
        align="center"
        strokeWidth={1.6}
        className="hidden h-10 w-[132px] text-primary opacity-80 transition-opacity duration-200 group-hover:opacity-100 sm:block"
      />
    </li>
  );
}

function RowSkeleton({ wide }: { wide: boolean }) {
  return (
    <li aria-hidden="true" className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 border-t border-border py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="mt-1 h-3.5 w-10 rounded-[5px] bg-tile" />
      <div>
        <div className={cn("h-3.5 rounded-[6px] bg-tile", wide ? "w-4/5" : "w-1/2")} />
        <div className="mt-2.5 h-3 w-28 rounded-[6px] bg-tile" />
      </div>
      <div className="skeleton hidden h-10 w-[132px] rounded-[10px] bg-tile/70 sm:block" />
    </li>
  );
}
