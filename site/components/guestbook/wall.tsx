"use client";

// The /guestbook page body: a big sky with every recent plane in it, then
// every note written out as plain text (the accessible, scannable version
// of the sky), newest first. Loaded in the browser.

import { openCommand } from "@/lib/command";
import { useGuestbook } from "./data";
import { formatPlaneDate } from "./planes/sky";
import { Signature } from "./signature";
import { PlaneGlyph, PlaneSkyBand, foldButtonClass } from "./sky";

const ALL = 1000;

export function FoldPlaneButton() {
  return (
    <button type="button" onClick={() => openCommand("guestbook")} className={foldButtonClass}>
      <PlaneGlyph size={15} />
      Fold a plane
    </button>
  );
}

export function PaperPlanesWall() {
  const { status, entries, count, enabled, retry } = useGuestbook(ALL);
  const total = count ?? entries.length;

  return (
    <>
      <PlaneSkyBand kind="page" entries={entries} status={status} onRetry={retry} className="mt-10" />

      {status === "loading" ? (
        <ol aria-busy="true" aria-label="Loading notes" className="mt-14 divide-y divide-border">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} aria-hidden="true" className="grid grid-cols-[84px_1fr] items-center gap-4 py-4 sm:grid-cols-[120px_1fr] sm:gap-6">
              <div className="skeleton h-9 rounded-[10px] bg-well/60" />
              <div>
                <div className="h-3 w-4/5 rounded-[6px] bg-well/60" />
                <div className="mt-3 h-2.5 w-28 rounded-[5px] bg-well/60" />
              </div>
            </li>
          ))}
        </ol>
      ) : entries.length ? (
        <section aria-labelledby="notes-title" className="mt-14">
          <div className="flex items-baseline gap-2 text-[13px]">
            <h2 id="notes-title" className="text-secondary">
              every note, unfolded
            </h2>
            {enabled ? (
              <span className="text-tertiary tabular-nums">
                <span aria-hidden="true" className="me-2 opacity-60">
                  /
                </span>
                {total}
              </span>
            ) : null}
          </div>
          <ol className="mt-3 divide-y divide-border">
            {entries.map((entry) => {
              const date = formatPlaneDate(entry.created_at);
              return (
                <li
                  key={entry.id}
                  className="grid animate-fade-in grid-cols-[84px_1fr] items-center gap-4 py-4 sm:grid-cols-[120px_1fr] sm:gap-6"
                >
                  <div className="flex h-12 items-center">
                    <Signature path={entry.signature} name={entry.name} className="max-h-12 w-full max-w-full text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px]/[1.5] break-words text-pretty text-primary">{entry.message}</p>
                    <p className="mt-1 text-[13px] text-tertiary">
                      <span className="text-secondary">{entry.name}</span>
                      {date ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <time dateTime={entry.created_at} className="tabular-nums">
                            {date}
                          </time>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </>
  );
}
