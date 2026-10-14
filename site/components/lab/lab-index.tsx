"use client";

// The lab index (/lab/): arched filter tabs standing on a ground line, a
// search pill and an Arcade / List switch, then the pieces.
//
//    ╭───╮ ╭──────────╮ ╭───────╮ ╭──────────╮
//    │All⁹│ │Components⁴│ │Objects²│ │Generative³│     (⌕ Find a piece)  [⌂ Arcade | ≡ List]
//   ─┴───┴─┴──────────┴─┴───────┴─┴──────────┴───────────────────────────────────────────
//
// Arcade: the niches (components/lab/lab-tile.tsx) in rows of five, live.
// List: the big-type index (numeral, name, summary, kind); with a mouse, a
// small arched window with the piece in it follows the cursor over the rows.
//
// The category is mirrored in the URL (?c=objects) so a filtered view can be
// shared; the chosen view is remembered per browser. Enter in the search
// opens the first match. Posters come from the server page (lab-art.tsx).

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
import { ArchFrame } from "@/components/ornament";
import { cn } from "@/lib/cn";
import { pad } from "@/lib/format";
import { Spring, clamp, useFinePointer, useFrame, useReducedMotion } from "./hooks";
import { ArcadeView, ListView } from "./lab-icons";
import { LabNiche } from "./lab-tile";
import { LoadPiece } from "./load-piece";
import { Arcade } from "./masonry";
import { categories, matchesSearch, pieceNumber, pieces, type CategoryFilter } from "./registry";
import { CATEGORY_SINGULAR, type PieceMeta } from "./types";

type View = "arcade" | "list";

/** A piece's poster, drawn on the server: the picture and the colour behind it. */
export type PiecePoster = { poster: ReactNode; ground: string };

const VIEW_KEY = "arsher:lab:view";

const isCategory = (value: string | null): value is CategoryFilter =>
  Boolean(value && categories.some((category) => category.id === value));

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const countWords = (n: number) => NUMBER_WORDS[n] ?? String(n);

export function LabIndex({ posters = {} }: { posters?: Readonly<Record<string, PiecePoster>> }) {
  const router = useRouter();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("arcade");
  const [animate, setAnimate] = useState(false);
  const animateTimer = useRef(0);
  const panelId = useId();
  const tabsId = useId();

  // Restore ?c= and the remembered view once mounted (the static HTML is
  // always "all" in the arcade, so hydration matches).
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("c");
    if (isCategory(fromUrl)) setFilter(fromUrl);
    try {
      if (localStorage.getItem(VIEW_KEY) === "list") setView("list");
    } catch {}
  }, []);

  useEffect(() => () => window.clearTimeout(animateTimer.current), []);

  // Niches rise into place while the set changes, never on first paint.
  const settle = () => {
    setAnimate(true);
    window.clearTimeout(animateTimer.current);
    animateTimer.current = window.setTimeout(() => setAnimate(false), 900);
  };

  const changeFilter = (next: CategoryFilter) => {
    if (next === filter) return;
    settle();
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("c");
    else url.searchParams.set("c", next);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const changeQuery = (next: string) => {
    settle();
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
  const filtered = Boolean(query.trim()) || filter !== "all";

  return (
    <>
      <div className="relative md:flex md:items-end md:justify-between md:gap-6">
        <div className="border-b border-line-firm md:border-0">
          <FilterTabs idBase={tabsId} panelId={panelId} value={filter} onChange={changeFilter} />
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0 md:mb-2.5">
          <SearchBox
            value={query}
            onChange={changeQuery}
            onSubmit={() => {
              if (query.trim() && shown[0]) router.push(`/lab/${shown[0].slug}/`);
            }}
          />
          <ViewSwitch value={view} onChange={changeView} />
        </div>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-px bg-line-firm md:block" />
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered ? `${shown.length} ${shown.length === 1 ? "piece" : "pieces"} shown` : ""}
      </p>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={activeTab}
        className={view === "arcade" ? "mt-[clamp(40px,5vw,64px)]" : "mt-[clamp(28px,4vw,44px)]"}
      >
        {shown.length === 0 ? (
          <EmptyState query={query.trim()} inCategory={filter !== "all"} onClear={() => changeQuery("")} />
        ) : view === "arcade" ? (
          <Arcade
            label="Lab pieces"
            animate={animate}
            items={shown.map((piece) => ({
              key: piece.slug,
              children: (
                <LabNiche piece={piece} poster={posters[piece.slug]?.poster} ground={posters[piece.slug]?.ground} />
              ),
            }))}
          />
        ) : (
          <PieceList items={shown} posters={posters} />
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* empty                                                                   */
/* ---------------------------------------------------------------------- */

function EmptyState({ query, inCategory, onClear }: { query: string; inCategory: boolean; onClear: () => void }) {
  return (
    <div className="paper mx-auto max-w-[560px] px-7 py-10 text-center sm:px-10 sm:py-12">
      <p className="serif-italic text-title-2 text-balance text-primary">
        Nothing in the lab answers to “{query}”{inCategory ? " here" : ""}.
      </p>
      <p className="mx-auto mt-3 max-w-[40ch] text-copy text-pretty text-body">
        Try a material or a technique (glass, sound, WebGL), or clear the search to see all {countWords(pieces.length)}{" "}
        pieces.
      </p>
      <button type="button" onClick={onClear} className="btn btn-soft mt-6">
        Clear the search
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* filter tabs: arched doorways on a ground line                           */
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
  const selected = Math.max(
    0,
    categories.findIndex((category) => category.id === value),
  );

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
    // The tabs sit on the ground line; the extra 6px below them (pulled back
    // with the negative margin) leaves room for the focus ring inside the
    // scroller on narrow screens.
    <div
      role="tablist"
      aria-label="Filter by kind"
      onKeyDown={onKeyDown}
      className="no-scrollbar -mb-1.5 flex items-end gap-1 overflow-x-auto px-1 pt-1.5 pb-1.5 max-md:-mx-1 sm:gap-1.5 md:overflow-visible md:px-0"
    >
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
              "relative flex h-11 shrink-0 cursor-pointer items-center rounded-[50%_50%_0_0/18px_18px_0_0] border border-b-0 ps-4 pe-3.5 text-[14px] font-[550] whitespace-nowrap outline-none transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus) max-sm:px-3 max-sm:text-[13px] max-[23.75rem]:px-2.5",
              active
                ? "border-ink bg-ink text-on-ink"
                : "border-line-firm bg-paper/40 text-body hover:border-[color-mix(in_oklab,var(--foreground)_45%,transparent)] hover:bg-paper hover:text-primary",
            )}
          >
            <span className="translate-y-[2px]">{category.label}</span>
            <span
              className={cn(
                "ms-1 -translate-y-[0.4em] text-[10.5px] font-semibold tabular-nums max-sm:sr-only",
                active ? "text-on-ink/70" : "text-terra",
              )}
            >
              <span className="sr-only">, </span>
              {category.count}
              <span className="sr-only"> {category.count === 1 ? "piece" : "pieces"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* search and view                                                         */
/* ---------------------------------------------------------------------- */

function SearchBox({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label className="relative flex min-w-0 flex-1 items-center md:w-[248px] md:flex-none">
      <span className="sr-only">Search the lab</span>
      <Search size={15} className="pointer-events-none absolute start-4 text-muted" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          } else if (event.key === "Escape" && value) {
            event.preventDefault();
            event.stopPropagation();
            onChange("");
          }
        }}
        placeholder="Find a piece"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
        className="field h-11 rounded-pill py-0 ps-10 pe-10 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear the search"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute end-2 grid size-7 cursor-pointer place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-wash hover:text-primary focus-ring"
        >
          <Close size={12} />
        </button>
      ) : null}
    </label>
  );
}

function ViewSwitch({ value, onChange }: { value: View; onChange: (value: View) => void }) {
  const options: Array<{ id: View; label: string; icon: ReactNode }> = [
    { id: "arcade", label: "Arcade", icon: <ArcadeView size={15} /> },
    { id: "list", label: "List", icon: <ListView size={15} /> },
  ];
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div
      role="radiogroup"
      aria-label="Show the lab as"
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const next = value === "arcade" ? "list" : "arcade";
        onChange(next);
        refs.current[next === "arcade" ? 0 : 1]?.focus();
      }}
      className="flex h-11 shrink-0 items-center gap-0.5 rounded-pill border border-line-firm bg-paper/55 p-[3px]"
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
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-full cursor-pointer items-center gap-1.5 rounded-pill px-3 text-[13.5px] font-[550] outline-none transition-[background-color,color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus) sm:px-3.5",
              active ? "bg-ink text-on-ink" : "text-secondary hover:bg-wash hover:text-primary",
            )}
          >
            {option.icon}
            <span className="max-sm:sr-only" aria-hidden="true">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* list view                                                               */
/* ---------------------------------------------------------------------- */

const PREVIEW_WIDTH = 188;

/** The big-type index; with a mouse, an arched window with the live piece follows the cursor. */
function PieceList({
  items,
  posters,
}: {
  items: readonly PieceMeta[];
  posters: Readonly<Record<string, PiecePoster>>;
}) {
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
    const right = x + 32 + width < window.innerWidth - 16;
    const tx = right ? x + 32 : x - 32 - width;
    const ty = clamp(y - height / 2, 80, Math.max(80, window.innerHeight - height - 16));
    if (pointer.current.fresh || reduced) {
      motion.x.set(tx);
      motion.y.set(ty);
      motion.tilt.set(0);
      pointer.current.fresh = false;
    } else {
      motion.x.to(tx);
      motion.y.to(ty);
      motion.tilt.to(clamp(pointer.current.vx * 0.005, -6, 6));
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

  const art = hovered ? posters[hovered.slug] : undefined;

  return (
    <div className="relative">
      <ol
        aria-label="Lab pieces"
        className="rule-ink"
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          setShown(false);
          pointer.current.fresh = true;
        }}
      >
        {items.map((piece) => (
          <li key={piece.slug} className="border-b border-line">
            <Link
              href={`/lab/${piece.slug}/`}
              data-row=""
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                setHovered(piece);
                setShown(true);
              }}
              className="group row-rise grid grid-cols-[36px_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1.5 px-2 pt-[18px] pb-4 text-primary focus-ring md:grid-cols-[64px_minmax(0,1fr)_minmax(0,300px)_128px] md:gap-x-5"
            >
              <span aria-hidden="true" className="numeral text-[15px]">
                {pad(pieceNumber(piece.slug))}
              </span>
              <span className="min-w-0 font-display text-title-1 text-balance group-hover:turn group-focus-visible:turn">
                {piece.title}
              </span>
              <span className="col-start-2 row-start-2 text-[15px] leading-[1.5] text-pretty text-muted max-md:line-clamp-2 md:col-start-auto md:row-start-auto md:translate-y-[-0.2em]">
                {piece.summary}
              </span>
              <span className="col-start-3 row-start-1 caps text-end text-muted md:col-start-auto md:row-start-auto">
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
              "origin-center drop-shadow-[0_18px_22px_rgb(var(--shadow-rgb)/0.28)] transition-[opacity,scale] duration-300 ease-out motion-reduce:transition-none",
              shown ? "scale-100 opacity-100" : "scale-90 opacity-0",
            )}
          >
            <ArchFrame keystone={false} windowStyle={{ background: art?.ground ?? "var(--band)" }}>
              <LoadPiece key={hovered.slug} slug={hovered.slug} mode="tile" active={shown} poster={art?.poster ?? null} />
            </ArchFrame>
          </div>
        </div>
      ) : null}
    </div>
  );
}
