"use client";

// The lab index (/lab/): filter tabs with counts, a search box and a
// grid / list switch above the pieces.
//
//   [All 9 | Components 4 | Objects 2 | Generative 3]      [⌕ Search 9 pieces] [▦ ☰]
//
// Grid: the live tiles in a masonry of four columns (three on tablets, two
// on phones). List: an index of huge numbered titles with the category and
// tech on the right; with a mouse, a small live preview of the piece
// follows the cursor over the rows.
//
// The category is mirrored in the URL (?c=objects) so a filtered view can
// be shared; the chosen view is remembered per browser.

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Close, Search } from "@/components/icons";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";
import { Spring, clamp, useFinePointer, useFrame, useReducedMotion } from "./hooks";
import { GridView, ListView } from "./lab-icons";
import { LabTile } from "./lab-tile";
import { LoadPiece } from "./load-piece";
import { Masonry } from "./masonry";
import { categories, matchesSearch, pieceNumber, pieces, type CategoryFilter } from "./registry";
import { CATEGORY_SINGULAR, type PieceMeta } from "./types";

type View = "grid" | "list";

const VIEW_KEY = "arsher:lab:view";

const isCategory = (value: string | null): value is CategoryFilter =>
  Boolean(value && categories.some((category) => category.id === value));

export function LabIndex() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("grid");
  const [animate, setAnimate] = useState(false);
  const animateTimer = useRef(0);
  const panelId = useId();
  const tabsId = useId();

  // Restore ?c= and the remembered view once mounted (the static HTML is
  // always "all" in a grid, so hydration matches).
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("c");
    if (isCategory(fromUrl)) setFilter(fromUrl);
    try {
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {}
  }, []);

  useEffect(() => () => window.clearTimeout(animateTimer.current), []);

  // Tiles glide to their new places while the set changes, never on resize.
  const glide = () => {
    setAnimate(true);
    window.clearTimeout(animateTimer.current);
    animateTimer.current = window.setTimeout(() => setAnimate(false), 600);
  };

  const changeFilter = (next: CategoryFilter) => {
    if (next === filter) return;
    glide();
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("c");
    else url.searchParams.set("c", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const changeQuery = (next: string) => {
    glide();
    setQuery(next);
  };

  const changeView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };

  const shown = pieces.filter(
    (piece) => (filter === "all" || piece.category === filter) && matchesSearch(piece, query),
  );
  const activeTab = `${tabsId}-${filter}`;

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <FilterTabs idBase={tabsId} panelId={panelId} value={filter} onChange={changeFilter} />
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 max-sm:basis-full">
          <SearchBox value={query} onChange={changeQuery} count={pieces.length} />
          <ViewSwitch value={view} onChange={changeView} />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {query ? `${shown.length} ${shown.length === 1 ? "piece" : "pieces"} found` : ""}
      </p>

      <div id={panelId} role="tabpanel" aria-labelledby={activeTab} className="mt-5">
        {shown.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-[24px] bg-tile text-center">
            <p className="text-[14px] text-tertiary">
              Nothing in the lab matches “{query.trim()}”{filter !== "all" ? " in this category" : ""}.
            </p>
            <button type="button" onClick={() => changeQuery("")} className="btn btn-soft h-8 bg-well">
              Clear search
            </button>
          </div>
        ) : view === "grid" ? (
          <Masonry
            max={4}
            gap={{ 2: 8, 3: 12, 4: 12 }}
            rows={[]}
            animate={animate}
            label="Lab pieces"
            items={shown.map((piece) => ({
              key: piece.slug,
              aspect: piece.tile.aspect,
              children: (
                <div className="size-full animate-fade-in">
                  <LabTile piece={piece} size="large" />
                </div>
              ),
            }))}
          />
        ) : (
          <PieceList items={shown} />
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* filter tabs                                                             */
/* ---------------------------------------------------------------------- */

function FilterTabs({
  idBase,
  panelId,
  value,
  onChange,
}: {
  idBase: string;
  panelId: string;
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [ready, setReady] = useState(false);
  const selected = Math.max(
    0,
    categories.findIndex((category) => category.id === value),
  );

  const measure = useCallback(() => {
    const tab = refs.current[selected];
    if (!tab) return;
    setBox((prev) =>
      prev && prev.left === tab.offsetLeft && prev.width === tab.offsetWidth
        ? prev
        : { left: tab.offsetLeft, width: tab.offsetWidth },
    );
  }, [selected]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const list = refs.current[0]?.parentElement;
    if (!list) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(list);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [measure]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = categories.length;
    const moves: Record<string, number> = {
      ArrowRight: (selected + 1) % count,
      ArrowLeft: (selected - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(categories[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      onKeyDown={onKeyDown}
      className="no-scrollbar relative flex h-9 max-w-full shrink-0 items-center overflow-x-auto rounded-[12px] bg-well p-[3px]"
    >
      {box ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-[3px] bottom-[3px] start-0 rounded-[9px] bg-float shadow-lift",
            ready && "transition-[translate,width] duration-300 ease-out motion-reduce:transition-none",
          )}
          style={{ width: box.width, translate: `${box.left}px 0` }}
        />
      ) : null}
      {categories.map((category, index) => {
        const active = index === selected;
        return (
          <button
            key={category.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`${idBase}-${category.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(category.id)}
            className={cn(
              "relative flex h-[30px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] whitespace-nowrap outline-none transition-[color] duration-150 ease-out focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
              active ? "text-primary" : "text-secondary hover:text-primary",
              !box && active && "bg-float shadow-lift",
            )}
          >
            {category.label}
            <span className="text-[12px] text-tertiary tabular-nums">{category.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* search and view                                                         */
/* ---------------------------------------------------------------------- */

function SearchBox({ value, onChange, count }: { value: string; onChange: (value: string) => void; count: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label className="relative flex h-9 min-w-0 flex-1 items-center sm:w-[220px] sm:flex-none">
      <span className="sr-only">Search the lab</span>
      <Search size={14} className="pointer-events-none absolute start-3 text-tertiary" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            event.stopPropagation();
            onChange("");
          }
        }}
        placeholder={`Search ${count} pieces`}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className="h-full w-full min-w-0 rounded-[12px] bg-well ps-8.5 pe-8 text-[16px] text-primary outline-none transition-[background-color] duration-150 ease-out placeholder:text-tertiary hover:bg-well-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-[13px] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute end-1.5 flex size-6 cursor-pointer items-center justify-center rounded-[8px] text-tertiary outline-none transition-colors duration-150 hover:bg-well-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Close size={12} />
        </button>
      ) : null}
    </label>
  );
}

function ViewSwitch({ value, onChange }: { value: View; onChange: (value: View) => void }) {
  const options: Array<{ id: View; label: string; icon: ReactNode }> = [
    { id: "grid", label: "Grid view", icon: <GridView size={15} /> },
    { id: "list", label: "List view", icon: <ListView size={15} /> },
  ];
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div
      role="radiogroup"
      aria-label="View"
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const next = value === "grid" ? "list" : "grid";
        onChange(next);
        refs.current[next === "grid" ? 0 : 1]?.focus();
      }}
      className="flex h-9 shrink-0 items-center rounded-[12px] bg-well p-[3px]"
    >
      {options.map((option, index) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-[30px] w-[34px] cursor-pointer items-center justify-center rounded-[9px] outline-none transition-[background-color,color,box-shadow] duration-200 ease-out focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
              active ? "bg-float text-primary shadow-lift" : "text-secondary hover:text-primary",
            )}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* list view                                                               */
/* ---------------------------------------------------------------------- */

const PREVIEW_WIDTH = 232;

/** Huge numbered rows, like a directory index; a live preview follows the mouse. */
function PieceList({ items }: { items: readonly PieceMeta[] }) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<PieceMeta | null>(null);
  const [shown, setShown] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, vx: 0, t: 0, fresh: true });
  const [motion] = useState(() => ({
    x: new Spring(0, { stiffness: 280, damping: 30 }),
    y: new Spring(0, { stiffness: 280, damping: 30 }),
    tilt: new Spring(0, { stiffness: 200, damping: 18 }),
  }));

  const place = (dt: number) => {
    const preview = previewRef.current;
    if (!preview) return false;
    const { x, y } = pointer.current;
    const width = preview.offsetWidth;
    const height = preview.offsetHeight;
    // To the right of the cursor, or to its left near the window's edge.
    const right = x + 28 + width < window.innerWidth - 16;
    const tx = right ? x + 28 : x - 28 - width;
    const ty = clamp(y - height / 2, 16, Math.max(16, window.innerHeight - height - 16));
    if (pointer.current.fresh || reduced) {
      motion.x.set(tx);
      motion.y.set(ty);
      motion.tilt.set(0);
      pointer.current.fresh = false;
    } else {
      motion.x.to(tx);
      motion.y.to(ty);
      motion.tilt.to(clamp(pointer.current.vx * 0.006, -7, 7));
      pointer.current.vx *= Math.exp(-dt * 10);
    }
    motion.x.step(dt);
    motion.y.step(dt);
    motion.tilt.step(dt);
    preview.style.translate = `${motion.x.value}px ${motion.y.value}px`;
    preview.style.rotate = `${motion.tilt.value}deg`;
    return !(motion.x.settled && motion.y.settled && motion.tilt.settled);
  };

  const wake = useFrame(fine && shown, (dt) => place(dt));

  // Put the preview at the cursor before it first paints.
  useLayoutEffect(() => {
    if (shown) place(0);
  }, [hovered, shown]);

  const onPointerMove = (event: ReactPointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const now = performance.now();
    const p = pointer.current;
    const dt = Math.max(1, now - p.t) / 1000;
    if (p.t && dt < 0.2) p.vx = p.vx * 0.6 + ((event.clientX - p.x) / dt) * 0.4;
    p.x = event.clientX;
    p.y = event.clientY;
    p.t = now;
    wake();
  };

  return (
    <div className="relative">
      <ol
        className="border-t border-border [&:has(a:hover)>li>a:not(:hover)]:opacity-45"
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          setShown(false);
          pointer.current.fresh = true;
        }}
      >
        {items.map((piece) => (
          <li key={piece.slug}>
            <Link
              href={`/lab/${piece.slug}/`}
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                setHovered(piece);
                setShown(true);
              }}
              className="group flex items-end gap-3 border-b border-border py-4 outline-none transition-[opacity] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:gap-6 sm:py-5"
            >
              <span aria-hidden="true" className="w-6 shrink-0 pb-[0.45em] font-mono text-[12px] text-tertiary tabular-nums sm:w-8">
                {pad(pieceNumber(piece.slug))}
              </span>
              <span className="min-w-0 flex-1 truncate text-[34px]/[1.1] font-medium tracking-[-0.035em] text-primary sm:text-[48px]/[1.08] lg:text-[56px]/[1.06]">
                {piece.title}
              </span>
              <span className="hidden shrink-0 flex-col items-end pb-[0.5em] text-end font-mono text-[12px] leading-[1.6] text-tertiary sm:flex">
                <span className="text-secondary">{CATEGORY_SINGULAR[piece.category]}</span>
                <span className="max-w-[300px] truncate">{piece.uses.join(" · ")}</span>
              </span>
              <span className="shrink-0 pb-[0.5em] font-mono text-[11px] text-tertiary sm:hidden">
                {CATEGORY_SINGULAR[piece.category]}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {fine && hovered ? (
        <div
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-30 will-change-transform"
          style={{ width: PREVIEW_WIDTH }}
        >
          <div
            className={cn(
              "relative animate-pop-in overflow-hidden rounded-[20px] bg-tile shadow-float transition-[opacity,scale,filter] duration-200 ease-out",
              shown ? "scale-100 opacity-100 blur-none" : "scale-90 opacity-0 blur-[4px]",
            )}
            style={{ aspectRatio: hovered.tile.aspect }}
          >
            <LoadPiece key={hovered.slug} slug={hovered.slug} mode="tile" active={shown} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
