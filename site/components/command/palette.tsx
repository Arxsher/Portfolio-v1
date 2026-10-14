"use client";

// The Index itself: the head, the pill search field (a combobox) and the
// grouped list (a listbox) under it, with a keycap legend at the foot.
//
// The field keeps focus and points at the active row with
// aria-activedescendant. ↑ ↓ (or Ctrl-N / Ctrl-P) walk the rows, Home and
// End jump to the ends, Enter takes the active row. Letters the search
// matched are underlined in cobalt; the counter says how many of the
// Index's entries are showing. The active row gets a sand band and its
// star bullet fills and turns 45°.

import { useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { Search as SearchIcon } from "@/components/icons";
import { Star } from "@/components/ornament";
import { cn } from "@/lib/cn";
import type { Entry, Search } from "./items";
import { SheetHead } from "./panels/panel";

export const optionId = (listId: string, entry: Entry) => `${listId}-${entry.id.replace(/[^\w-]/g, "_")}`;

/** The label with the matched letters underlined. */
function Marked({ text, hits }: { text: string; hits: number[] }) {
  if (!hits.length) return <>{text}</>;
  const set = new Set(hits);
  const parts: Array<{ text: string; hit: boolean }> = [];
  for (let index = 0; index < text.length; index += 1) {
    const hit = set.has(index);
    const last = parts[parts.length - 1];
    if (last && last.hit === hit) last.text += text[index];
    else parts.push({ text: text[index], hit });
  }
  return (
    <>
      {parts.map((part, index) =>
        part.hit ? (
          <span
            key={index}
            className="text-cobalt underline decoration-cobalt decoration-[1.5px] underline-offset-[3px]"
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function IndexView({
  titleId,
  listId,
  inputRef,
  search,
  query,
  active,
  onQuery,
  onActive,
  onRun,
  onClose,
}: {
  titleId: string;
  listId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  search: Search;
  query: string;
  active: number;
  onQuery: (query: string) => void;
  onActive: (index: number) => void;
  onRun: (entry: Entry) => void;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  /** The active row moved under the pointer: it is in view already, do not scroll. */
  const byPointer = useRef(false);
  const { groups, flat, total } = search;
  const current = flat[Math.min(active, flat.length - 1)];

  // Keep the active row in view (the first row brings its group heading along).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (byPointer.current) {
      byPointer.current = false;
      return;
    }
    if (active === 0) {
      list.scrollTop = 0;
      return;
    }
    list.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, search]);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const count = flat.length;
    const ctrl = event.ctrlKey && !event.metaKey && !event.altKey;
    const key = event.key;
    const down = key === "ArrowDown" || (ctrl && (key === "n" || key === "N"));
    const up = key === "ArrowUp" || (ctrl && (key === "p" || key === "P"));
    if (down || up) {
      event.preventDefault();
      if (count) onActive((active + (down ? 1 : -1) + count) % count);
      return;
    }
    if ((key === "Home" || key === "End") && !event.shiftKey && count) {
      event.preventDefault();
      onActive(key === "Home" ? 0 : count - 1);
      return;
    }
    if ((key === "PageDown" || key === "PageUp") && count) {
      event.preventDefault();
      onActive(Math.min(count - 1, Math.max(0, active + (key === "PageDown" ? 6 : -6))));
      return;
    }
    if (key === "Enter") {
      event.preventDefault();
      if (current) onRun(current.entry);
    }
  }

  let index = -1;

  return (
    <>
      <SheetHead titleId={titleId} title="Index" size="index" onClose={onClose} closeOnTouchOnly />

      <div className="shrink-0 px-3.5 pt-3.5 pb-1.5 sm:px-[18px]">
        <div
          className={cn(
            "flex h-12 items-center gap-2.5 rounded-pill border border-line-firm bg-background ps-4 pe-2.5 text-muted",
            "transition-[border-color,box-shadow] duration-200 ease-out hover:border-[color-mix(in_oklab,var(--foreground)_45%,transparent)]",
            "focus-within:border-cobalt focus-within:ring-[3px] focus-within:ring-cobalt/25 focus-within:hover:border-cobalt",
          )}
        >
          <SearchIcon size={16} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-labelledby={titleId}
            aria-describedby={`${listId}-help`}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={current ? optionId(listId, current.entry) : undefined}
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Find a page, a project, a piece…"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={onKeyDown}
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-primary outline-none placeholder:text-muted"
          />
          {query.trim() ? (
            <span aria-hidden="true" className="shrink-0 text-caption text-muted tabular-nums">
              {flat.length} / {total}
            </span>
          ) : null}
          <span aria-hidden="true" className="keys-hint hidden shrink-0 sm:inline-flex">
            <kbd className="kbd">esc</kbd>
          </span>
        </div>
        <p id={`${listId}-help`} className="sr-only">
          Type to search. Up and down arrows move, Enter opens.
        </p>
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Index"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-3 sm:px-2.5"
      >
        {flat.length === 0 ? (
          <p className="px-3 py-9 text-center text-[15px] text-muted">
            Nothing by that name. Try “lab”, “call” or a project’s name.
          </p>
        ) : (
          groups.map((group) => {
            const groupId = `${listId}-group-${group.group.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <div key={group.group} role="group" aria-labelledby={groupId}>
                <div id={groupId} role="presentation" aria-hidden="true" className="kicker px-3 pt-3.5 pb-1.5 text-[11px]">
                  {group.group}
                </div>
                {group.results.map(({ entry, hits }) => {
                  index += 1;
                  const at = index;
                  const selected = at === active;
                  return (
                    <div
                      key={entry.id}
                      id={optionId(listId, entry)}
                      role="option"
                      aria-selected={selected}
                      data-index={at}
                      onPointerMove={() => {
                        if (at === active) return;
                        byPointer.current = true;
                        onActive(at);
                      }}
                      onClick={() => onRun(entry)}
                      className="group flex min-h-[42px] cursor-pointer items-center gap-3 rounded-[6px] px-3 py-1.5 text-[15px] leading-[1.3] text-primary select-none aria-selected:bg-band"
                    >
                      <Star
                        size={11}
                        variant={selected ? "solid" : "outline"}
                        className={cn(
                          "transition-[rotate,color] duration-[400ms] ease-out motion-reduce:transition-none",
                          selected ? "rotate-45 text-terra-fill" : "text-line-firm",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate py-[3px]">
                        <Marked text={entry.label} hits={hits} />
                      </span>
                      {entry.hint ? (
                        <span className="max-w-[52%] shrink-0 truncate text-[13px] text-muted max-sm:max-w-[44%]">
                          {entry.hint}
                        </span>
                      ) : null}
                      {entry.keycap ? (
                        <kbd aria-hidden="true" className="kbd keys-hint">
                          {entry.keycap}
                        </kbd>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div
        aria-hidden="true"
        className="keys-hint flex shrink-0 items-center justify-between gap-3 border-t border-line px-[18px] py-2.5 text-[12.5px] text-muted max-sm:hidden"
      >
        <span className="inline-flex items-center gap-1.5">
          <kbd className="kbd">↑</kbd>
          <kbd className="kbd">↓</kbd>
          move
        </span>
        <span className="inline-flex items-center gap-1.5">
          <kbd className="kbd">↵</kbd>
          open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <kbd className="kbd">esc</kbd>
          close
        </span>
      </div>
    </>
  );
}
