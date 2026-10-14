"use client";

// GitHub contributions: the "github / 544 this year" section of the home page.
//
// One card: the profile link and the year's total, then the calendar (one
// column per week, Sunday on top) drawn as an SVG that scales with the card,
// the first and last month under it and a five-step legend.
//
// Pointing at a day ringed it, dims the rest of the year and shows a small
// tooltip. The calendar is a single tab stop; once focused, the arrow keys
// walk the days (left/right = a week, up/down = a day) and a polite live
// region reads each one out.
//
// On narrow screens the calendar keeps a minimum cell size and scrolls
// sideways instead, starting at the most recent week (the scroller is RTL,
// its content LTR, so no script is needed to start at the right end).
//
// Data: data/contributions.json  { username, year, total, days: [{ date, count, level 0-4 }] }

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import contributionsJson from "@/data/contributions.json";
import { ArrowUpRight, GitHub } from "@/components/icons";
import { Section } from "@/components/section";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export type ContributionDay = { date: string; count: number; level: number };

export type Contributions = {
  username: string;
  year: number;
  total: number;
  updatedAt?: string;
  days: ContributionDay[];
};

/* ---------------------------------------------------------------------- */
/* geometry (SVG user units; the SVG scales to the card width)            */
/* ---------------------------------------------------------------------- */

const CELL = 12;
const GAP = 4;
const STEP = CELL + GAP;
const RADIUS = 3.5;
const HEIGHT = 7 * STEP - GAP; // 108
/** The calendar shows at most the last 40 weeks, so a day is always the
 *  same size (11.09px in the 588px desktop card). */
const WEEKS = 40;
const FULL_WIDTH = WEEKS * STEP - GAP; // 636
/** On phones cells never shrink below 80% (9.6px); the calendar scrolls
 *  instead. From `sm` up it always fits the card. */
const MIN_SCALE = 0.8;
/** Tooltips this many weeks from a visible edge hug that edge instead of centring. */
const EDGE_WEEKS = 8;
/** Rows 0–1 (Sun, Mon) show their tooltip below the day, the rest above. */
const BELOW_ROWS = 2;

/** Opacity of the foreground colour per level, 0 (none) … 4 (most). */
const LEVEL_OPACITY = [0.07, 0.22, 0.42, 0.68, 1] as const;
/** Legend swatches: the same five strengths as tokens (written out for Tailwind). */
const LEVEL_SWATCH = ["bg-graph-0", "bg-graph-1", "bg-graph-2", "bg-graph-3", "bg-graph-4"] as const;

/* ---------------------------------------------------------------------- */
/* data                                                                    */
/* ---------------------------------------------------------------------- */

const DAY_MS = 86_400_000;

/** "2026-05-04" → whole days since 1970-01-01 (UTC), or null. */
function toDayNumber(iso: string | undefined): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!match) return null;
  return Math.round(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const fromDay = (day: number) => new Date(day * DAY_MS);

type Cell = { day: number; count: number; level: number; col: number; row: number };

type Calendar = {
  cells: Cell[];
  columns: number;
  width: number;
  /** First and last month shown under the grid ("Jan", "Oct"). */
  months: string[];
  /** "Jan 1 to Oct 14" */
  range: string;
};

function levelOf(day: ContributionDay | undefined, count: number): number {
  const level = day?.level;
  if (typeof level === "number" && Number.isInteger(level) && level >= 0 && level <= 4) return level;
  return count > 0 ? 1 : 0;
}

/**
 * Lays the year out week by week (Sunday on top), ending on the last day in
 * the data (or on `updatedAt` when there is no data yet).
 *
 * The window is the last WEEKS weeks, starting on a Sunday, so the first
 * column is full and only the last one (the current week) is partial. Early
 * in the year, when fewer weeks have passed, it starts with the week of
 * Jan 1 instead (days before Jan 1 are not drawn) and has fewer columns;
 * the graph then keeps the same day size and leaves the rest of the card
 * empty rather than stretching a few weeks across it.
 */
function buildCalendar({ year, days, updatedAt }: Contributions): Calendar {
  const start = Math.round(Date.UTC(year, 0, 1) / DAY_MS);
  const yearEnd = Math.round(Date.UTC(year, 11, 31) / DAY_MS);

  const byDay = new Map<number, ContributionDay>();
  let last: number | null = null;
  for (const entry of days ?? []) {
    const day = toDayNumber(entry.date);
    if (day === null || day < start || day > yearEnd) continue;
    byDay.set(day, entry);
    if (last === null || day > last) last = day;
  }

  const firstWeek = start - fromDay(start).getUTCDay(); // the Sunday on or before Jan 1
  const fallback = toDayNumber(updatedAt);
  // No data and no date: draw the year's first WEEKS weeks, empty.
  const blank = Math.min(yearEnd, firstWeek + WEEKS * 7 - 1);
  let end = last ?? (fallback !== null && fallback >= start && fallback <= yearEnd ? fallback : blank);
  if (end < start) end = start;

  const lastWeek = end - fromDay(end).getUTCDay(); // the Sunday on or before the last day
  const gridStart = Math.max(lastWeek - (WEEKS - 1) * 7, firstWeek);
  const first = Math.max(gridStart, start); // the first day drawn
  const cells: Cell[] = [];
  for (let day = first; day <= end; day++) {
    const entry = byDay.get(day);
    const count = Math.max(0, Math.trunc(entry?.count ?? 0)) || 0;
    const offset = day - gridStart;
    cells.push({ day, count, level: levelOf(entry, count), col: Math.floor(offset / 7), row: offset % 7 });
  }

  const columns = (lastWeek - gridStart) / 7 + 1;
  const firstMonth = monthLabel.format(fromDay(first));
  const lastMonth = monthLabel.format(fromDay(end));
  return {
    cells,
    columns,
    width: columns * STEP - GAP,
    months: firstMonth === lastMonth ? [firstMonth] : [firstMonth, lastMonth],
    range: `${dayLabel.format(fromDay(first))} to ${dayLabel.format(fromDay(end))}`,
  };
}

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

/** "3 contributions on Jun 4" (used for the live region). */
function describe(cell: Cell): string {
  const count = cell.count === 0 ? "No" : formatNumber(cell.count);
  return `${count} ${plural(cell.count, "contribution")} on ${dayLabel.format(fromDay(cell.day))}`;
}

/* ---------------------------------------------------------------------- */
/* section                                                                 */
/* ---------------------------------------------------------------------- */

export function GitHubGraph({
  data = contributionsJson as Contributions,
  id = "github",
}: {
  data?: Contributions;
  /** Section anchor (#github by default). */
  id?: string;
}) {
  const { username, year } = data;
  const total = Math.max(0, data.total || 0);
  const profile = `https://github.com/${username}`;
  const calendar = useMemo(() => buildCalendar(data), [data]);

  return (
    <Section
      id={id}
      label="GitHub"
      count={`${formatNumber(total)} this year`}
      action={{ label: `@${username}`, href: profile, external: true }}
    >
      <div className="flex flex-col rounded-panel bg-tile p-5">
        <div className="flex items-center gap-3 text-[13px]">
          <a
            href={profile}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-w-0 items-center gap-1.5 rounded-[6px] font-medium text-primary focus-ring"
          >
            <GitHub size={14} />
            <span className="truncate">{username}</span>
            <ArrowUpRight size={12} className="text-tertiary transition-colors duration-150 group-hover:text-primary" />
            <span className="sr-only">(GitHub profile, opens in a new tab)</span>
          </a>
          <span className="ms-auto shrink-0 text-tertiary tabular-nums">
            {formatNumber(total)} {plural(total, "contribution")} in {year}
          </span>
        </div>

        <ContributionCalendar
          calendar={calendar}
          summary={
            total === 0
              ? `No GitHub contributions yet in ${year}.`
              : `GitHub contributions by day, ${calendar.range}, ${year}. Use the arrow keys to read each day.`
          }
        />

        <div aria-hidden="true" className="mt-2 flex justify-end text-[11px]/[1.6] text-tertiary">
          <span className="flex items-center gap-1.5">
            Less
            {LEVEL_SWATCH.map((swatch) => (
              <span key={swatch} className={cn("size-2.5 rounded-[3px]", swatch)} />
            ))}
            More
          </span>
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------------- */
/* calendar                                                                */
/* ---------------------------------------------------------------------- */

type Align = "start" | "center" | "end";
type Active = { index: number; align: Align; below: boolean; byKey: boolean };

/** Arrow keys move a week (left/right) or a day (up/down). */
const KEY_STEPS = new Map([
  ["ArrowLeft", -7],
  ["ArrowRight", 7],
  ["ArrowUp", -1],
  ["ArrowDown", 1],
]);

function ContributionCalendar({ calendar, summary }: { calendar: Calendar; summary: string }) {
  const { cells, columns, width, months } = calendar;
  const minWidth = Math.round(width * MIN_SCALE);
  // Fewer than WEEKS weeks so far: keep the day size and leave the rest of
  // the row empty (marginRight: auto pins it left inside the RTL scroller).
  const fit: CSSProperties | undefined =
    columns < WEEKS ? { width: `${(width / FULL_WIDTH) * 100}%`, marginRight: "auto" } : undefined;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Active | null>(null);
  const cell = active ? cells[active.index] : undefined;

  // Where the tooltip sits: centred under/over the day, or hugging the
  // nearer edge of what is visible (the scroller may be showing only part
  // of the year on a phone).
  function place(index: number, byKey: boolean): Active {
    const { col, row } = cells[index];
    let align: Align = col < EDGE_WEEKS ? "start" : col >= WEEKS - EDGE_WEEKS ? "end" : "center";
    const graph = graphRef.current?.getBoundingClientRect();
    const scroller = scrollerRef.current?.getBoundingClientRect();
    if (graph && scroller && graph.width > 0) {
      const scale = graph.width / width;
      const x = graph.left + (col * STEP + CELL / 2) * scale;
      const edge = EDGE_WEEKS * STEP * scale;
      const left = Math.max(graph.left, scroller.left + 20);
      // The visible edge (a partial year leaves empty card to its right).
      const right = scroller.right - 20;
      align = x - left < edge ? "start" : right - x < edge ? "end" : "center";
    }
    return { index, align, below: row < BELOW_ROWS, byKey };
  }

  const show = (index: number, byKey = false) => {
    if (active && active.index === index && active.byKey === byKey) return;
    setActive(place(index, byKey));
  };
  const clear = () => setActive(null);

  function onPointerOver(event: PointerEvent<HTMLDivElement>) {
    // Only the day squares carry data-i; the gaps keep the current day so
    // the tooltip glides from one day to the next instead of blinking.
    const index = (event.target as Element).getAttribute?.("data-i");
    if (index !== null && index !== undefined) show(Number(index));
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>) {
    // A tap leaves on release; keep that tooltip until focus moves away.
    if (event.pointerType !== "touch") clear();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (cells.length === 0) return;
    const lastIndex = cells.length - 1;
    const step = KEY_STEPS.get(event.key);
    if (step !== undefined) {
      event.preventDefault();
      // The first press steps from the latest day. Past either end the day
      // stays put (a pointer day becomes the keyboard day and is read out).
      const from = active ? active.index : lastIndex;
      const next = from + step;
      show(next >= 0 && next <= lastIndex ? next : from, true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      show(event.key === "Home" ? 0 : lastIndex, true);
    } else if (event.key === "Escape" && active) {
      event.preventDefault();
      clear();
    }
  }

  // Keyboard moves keep the day in view when the calendar scrolls.
  useEffect(() => {
    if (!active?.byKey) return;
    const scroller = scrollerRef.current;
    const square = graphRef.current?.querySelector(`[data-i="${active.index}"]`);
    if (!scroller || !square) return;
    const box = square.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    const pad = 24;
    const delta =
      box.left < view.left + pad ? box.left - view.left - pad : box.right > view.right - pad ? box.right - view.right + pad : 0;
    if (delta !== 0) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scroller.scrollBy({ left: delta, behavior: smooth ? "smooth" : "auto" });
    }
  }, [active]);

  const mask = "linear-gradient(to right, transparent, #000 20px, #000 calc(100% - 20px), transparent)";

  return (
    <>
      {/* -mx-5/px-5: the edge fade sits in the card padding. mt-2 + pt-2
          keeps the 16px gap under the header while leaving room above the
          grid for the focus ring and tooltips, which the scroller clips. */}
      <div
        ref={scrollerRef}
        dir="rtl"
        className="no-scrollbar -mx-5 mt-2 overflow-x-auto overflow-y-hidden overscroll-x-contain px-5 pt-2"
        style={{ maskImage: mask, WebkitMaskImage: mask, "--graph-min": `${minWidth}px` } as CSSProperties}
      >
        <div
          ref={graphRef}
          dir="ltr"
          // An application region, not an image: screen readers then hand
          // the arrow keys to it, so the day-by-day reading works.
          role="application"
          aria-roledescription="contribution calendar"
          aria-label={summary}
          tabIndex={0}
          className="relative rounded-[6px] [container-type:size] max-sm:min-w-(--graph-min) focus-ring-far"
          style={{ aspectRatio: `${width} / ${HEIGHT}`, ...fit }}
          onPointerOver={onPointerOver}
          onPointerLeave={onPointerLeave}
          onPointerCancel={clear}
          onKeyDown={onKeyDown}
          onBlur={clear}
        >
          <svg
            viewBox={`0 0 ${width} ${HEIGHT}`}
            className="group/graph block size-full overflow-visible text-primary"
            data-dim={active ? "" : undefined}
            aria-hidden="true"
            focusable="false"
          >
            {cells.map((day, index) => (
              <rect
                key={day.day}
                data-i={index}
                x={day.col * STEP}
                y={day.row * STEP}
                width={CELL}
                height={CELL}
                rx={RADIUS}
                fill="currentColor"
                style={{ "--o": LEVEL_OPACITY[day.level] } as CSSProperties}
                className={cn(
                  "transition-opacity duration-150",
                  index === active?.index
                    ? "opacity-[max(var(--o),0.5)]"
                    : "opacity-(--o) group-data-[dim]/graph:opacity-[calc(var(--o)*0.55)]",
                )}
              />
            ))}
            {cell ? (
              <rect
                x={cell.col * STEP - 2}
                y={cell.row * STEP - 2}
                width={CELL + 4}
                height={CELL + 4}
                rx={5}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="pointer-events-none"
              />
            ) : null}
          </svg>
          {cell && active ? <Tooltip cell={cell} active={active} width={width} /> : null}
        </div>
        <div
          dir="ltr"
          aria-hidden="true"
          className="mt-3 flex justify-between text-[11px] text-tertiary max-sm:min-w-(--graph-min)"
          style={fit}
        >
          {months.map((month, index) => (
            <span key={index}>{month}</span>
          ))}
        </div>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {cell && active?.byKey ? describe(cell) : ""}
      </span>
    </>
  );
}

function Tooltip({ cell, active, width }: { cell: Cell; active: Active; width: number }) {
  // Positions are fractions of the calendar box (container query units), so
  // the tooltip follows the SVG as it scales.
  const cx = ((cell.col * STEP + CELL / 2) / width) * 100;
  const top = ((cell.row * STEP) / HEIGHT) * 100;
  const bottom = ((cell.row * STEP + CELL) / HEIGHT) * 100;
  const x =
    active.align === "start"
      ? `calc(${cx}cqw - 12px)`
      : active.align === "end"
        ? `calc(-100% + ${cx}cqw + 12px)`
        : `calc(-50% + ${cx}cqw)`;
  const y = active.below ? `calc(${bottom}cqh + 6px)` : `calc(-100% + ${top}cqh - 6px)`;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-10 rounded-[8px] bg-float px-2 py-1 text-[12px] whitespace-nowrap text-primary shadow-float transition-[translate] duration-150 ease-out will-change-[translate] motion-reduce:transition-none"
      style={{ translate: `${x} ${y}` }}
    >
      <span className="font-medium tabular-nums">{cell.count === 0 ? "No" : formatNumber(cell.count)}</span>{" "}
      <span className="text-secondary">
        {plural(cell.count, "contribution")} on {dayLabel.format(fromDay(cell.day))}
      </span>
    </span>
  );
}
