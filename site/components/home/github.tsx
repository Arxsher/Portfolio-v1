"use client";

// Home: Five · Code. A year of GitHub contributions (data/contributions.json)
// laid out like a zellige panel (DESIGN.md → GitHub graph):
//
//   544                     ┌ paper board ─────────────────────────────────┐
//   contributions in 2026   │   JAN    FEB    MAR   …                 OCT   │
//   ─────────────────────   │ M ◆ · ◆ ◆ ✦ · ◆ …                            │
//   Active days   166/287   │ W · ◆ ◆ · ◆ ◆ ◆ …                            │
//   Longest streak 13 days  │ F ◆ ◆ · ✦ · ◆ …                              │
//   Busiest day  Oct 8 · 54 │ Updated Oct 14, 2026 · @Arxsher ↗  Quiet ◆◆◆✦ Busy
//   Busiest month May · 78  └──────────────────────────────────────────────┘
//
// One glazed diamond per day (one column per week, Sunday on top), deeper
// cobalt for busier days and a terracotta star on the busiest. Every number
// on the left is computed from the same file.
//
// Pointing at a day rings it and shows an ink chip. The lattice is one tab
// stop: once focused, a cursor walks the days with the arrow keys (and
// h j k l while single-key shortcuts are on), Home / End go to the ends,
// and a polite live region reads each day out. A visually hidden table
// gives the same year month by month.
//
// On phones the board keeps its cell size and scrolls sideways, starting at
// the latest weeks (the scroller is RTL and its content LTR, so it opens at
// the right end without any script).

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from "react";
import contributionsJson from "@/data/contributions.json";
import { Arrow } from "@/components/ornament";
import { Section } from "@/components/section";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber } from "@/lib/format";
import { useSingleKeyShortcuts } from "@/lib/shortcuts";
import { starPoints } from "@/lib/zellige";

export type ContributionDay = { date: string; count: number; level: number };

export type Contributions = {
  username: string;
  year: number;
  total: number;
  updatedAt?: string;
  days: ContributionDay[];
};

/* ---------------------------------------------------------------------- */
/* geometry (SVG user units; the SVG scales with the board)                */
/* ---------------------------------------------------------------------- */

const STEP = 14; // one day
const LEFT = 26; // room for the weekday letters
const TOP = 22; // room for the month labels
const HEIGHT = TOP + 7 * STEP + 2;
/** The lattice never draws a day larger than this many px per unit. */
const MAX_SCALE = 1.4;
/** Tooltips this many weeks from a visible edge hug that edge. */
const EDGE_WEEKS = 6;
/** Rows 0–1 (Sun, Mon) show their tooltip below the day, the rest above. */
const BELOW_ROWS = 2;

/** Half-diagonal of each level's diamond; level 4 is a star. */
const DIAMOND = [3.2, 4.95, 5.5, 6.05] as const;
const STAR_RADIUS = 6.6;
const FILL = ["fill-graph-0", "fill-graph-1", "fill-graph-2", "fill-graph-3", "fill-graph-4"] as const;

const diamond = (cx: number, cy: number, r: number) => `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;

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

const fromDay = (day: number) => new Date(day * DAY_MS);
const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });

type Cell = { day: number; count: number; level: number; col: number; row: number };

type Month = { label: string; name: string; col: number; total: number; active: number; busiest: Cell | null };

type Year = {
  cells: Cell[];
  columns: number;
  width: number;
  months: Month[];
  total: number;
  active: number;
  streak: number;
  busiest: Cell | null;
  busiestMonth: Month | null;
};

function levelOf(level: unknown, count: number): number {
  if (typeof level === "number" && Number.isInteger(level) && level >= 0 && level <= 4) return level;
  return count > 0 ? 1 : 0;
}

/**
 * Lays the year out week by week (Sunday on top) from Jan 1 to the last day
 * in the data (or `updatedAt`, or the first week when there is nothing yet),
 * and works out the numbers shown beside it.
 */
function buildYear({ year, days, updatedAt, total }: Contributions): Year {
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
  const fallback = toDayNumber(updatedAt);
  let end = last ?? (fallback !== null && fallback >= start && fallback <= yearEnd ? fallback : start + 6);
  if (end < start) end = start;

  const offset = fromDay(start).getUTCDay();
  const cells: Cell[] = [];
  const months: Month[] = [];
  let sum = 0;
  let active = 0;
  let run = 0;
  let streak = 0;
  let busiest: Cell | null = null;
  for (let day = start; day <= end; day++) {
    const entry = byDay.get(day);
    const count = Math.max(0, Math.trunc(Number(entry?.count) || 0));
    const slot = day - start + offset;
    const cell: Cell = { day, count, level: levelOf(entry?.level, count), col: Math.floor(slot / 7), row: slot % 7 };
    cells.push(cell);

    const date = fromDay(day);
    if (date.getUTCDate() === 1) {
      months.push({ label: monthShort.format(date), name: monthLong.format(date), col: cell.col, total: 0, active: 0, busiest: null });
    }
    const month = months[months.length - 1];
    sum += count;
    month.total += count;
    if (count > 0) {
      active++;
      month.active++;
      run++;
      streak = Math.max(streak, run);
    } else {
      run = 0;
    }
    if (count > 0 && (!busiest || count > busiest.count)) busiest = cell;
    if (count > 0 && (!month.busiest || count > month.busiest.count)) month.busiest = cell;
  }

  const columns = cells.length ? cells[cells.length - 1].col + 1 : 1;
  const busiestMonth = months.reduce<Month | null>((best, m) => (m.total > 0 && (!best || m.total > best.total) ? m : best), null);
  return {
    cells,
    columns,
    width: LEFT + columns * STEP + 4,
    months,
    // The file's total is GitHub's own figure; fall back to the sum of the days.
    total: Math.max(0, Math.trunc(Number(total)) || sum),
    active,
    streak,
    busiest,
    busiestMonth,
  };
}

const plural = (n: number, word: string) => `${formatNumber(n)} ${n === 1 ? word : `${word}s`}`;

/** "Oct 8, 54 contributions" (the live region and the tooltip). */
function describe(cell: Cell): string {
  return `${dayLabel.format(fromDay(cell.day))}, ${cell.count === 0 ? "no contributions" : plural(cell.count, "contribution")}`;
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
  const { username } = data;
  const year = useMemo(() => buildYear(data), [data]);
  const profile = `https://github.com/${username}`;
  const updated = data.updatedAt ? formatDate(data.updatedAt, "short") : null;

  return (
    <Section
      id={id}
      label="Code"
      numeral="Five"
      title="A year in"
      turn="commits"
      note="My contributions on GitHub this year, one diamond a day. The busiest days get a star."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-[clamp(28px,5vw,72px)] gap-y-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start">
        <Totals year={year} label={data.year} />

        <div
          className={cn(
            "paper relative p-[clamp(16px,2.4vw,28px)]",
            // the lattice's focus ring is drawn around the whole board
            "has-[[data-lattice]:focus-visible]:outline-2 has-[[data-lattice]:focus-visible]:outline-offset-4 has-[[data-lattice]:focus-visible]:outline-cobalt",
          )}
        >
          <Lattice year={year} calendarYear={data.year} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 text-[13px] text-muted">
            <span className="flex flex-wrap items-center gap-x-1.5">
              {updated ? <span>Updated {updated} ·</span> : null}
              <a
                href={profile}
                target="_blank"
                rel="noopener noreferrer"
                className="link-arrow focus-ring rounded-[4px] text-[13px]!"
              >
                @{username}
                <Arrow external />
                <span className="sr-only">on GitHub (opens in a new tab)</span>
              </a>
            </span>
            <Legend />
          </div>
        </div>
      </div>
      <MonthTable year={year} calendarYear={data.year} />
    </Section>
  );
}

function Totals({ year, label }: { year: Year; label: number }) {
  const { total, active, streak, busiest, busiestMonth, cells } = year;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end lg:block">
      <div>
        <p className="font-display text-[clamp(88px,11vw,148px)] leading-[0.82] font-[340] tracking-[-0.05em] text-primary [font-variant-numeric:lining-nums_tabular-nums]">
          {formatNumber(total)}
        </p>
        <p className="mt-3.5 serif-italic text-[21px] leading-[1.3] text-primary">
          {total === 1 ? "contribution" : "contributions"} in {label}
        </p>
      </div>
      <dl className="border-t border-line-firm text-[14.5px] lg:mt-6">
        <Stat term="Active days" value={`${formatNumber(active)} of ${formatNumber(cells.length)}`} />
        <Stat term="Longest streak" value={plural(streak, "day")} />
        {busiest ? <Stat term="Busiest day" value={`${dayLabel.format(fromDay(busiest.day))} · ${formatNumber(busiest.count)}`} /> : null}
        {busiestMonth ? <Stat term="Busiest month" value={`${busiestMonth.label} · ${formatNumber(busiestMonth.total)}`} /> : null}
      </dl>
    </div>
  );
}

function Stat({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2.5">
      <dt className="text-muted">{term}</dt>
      <dd className="text-end font-[550] text-primary tabular-nums">{value}</dd>
    </div>
  );
}

function Legend() {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1.5">
      Quiet
      <svg width="92" height="14" viewBox="0 0 92 14" className="block">
        {DIAMOND.map((r, level) => (
          <polygon key={level} points={diamond(7 + level * 17, 7, r)} className={FILL[level]} />
        ))}
        <polygon points={starPoints(7 + 4 * 17, 7, STAR_RADIUS)} className={FILL[4]} />
      </svg>
      Busy
    </span>
  );
}

/** The same year in words and numbers, month by month, for screen readers. */
function MonthTable({ year, calendarYear }: { year: Year; calendarYear: number }) {
  return (
    <table className="sr-only">
      <caption>GitHub contributions in {calendarYear}, by month</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col">Contributions</th>
          <th scope="col">Active days</th>
          <th scope="col">Busiest day</th>
        </tr>
      </thead>
      <tbody>
        {year.months.map((month) => (
          <tr key={month.name}>
            <th scope="row">{month.name}</th>
            <td>{formatNumber(month.total)}</td>
            <td>{formatNumber(month.active)}</td>
            <td>{month.busiest ? describe(month.busiest) : "None"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------------------------------------------------------------------- */
/* the lattice                                                             */
/* ---------------------------------------------------------------------- */

type Align = "start" | "center" | "end";
type Active = { index: number; align: Align; below: boolean; byKey: boolean };

/** Arrow keys move a week (left / right) or a day (up / down). */
const ARROWS = new Map([
  ["ArrowLeft", -7],
  ["ArrowRight", 7],
  ["ArrowUp", -1],
  ["ArrowDown", 1],
]);
/** The same moves on h j k l (vim), while single-key shortcuts are on. */
const VIM = new Map([
  ["h", -7],
  ["l", 7],
  ["k", -1],
  ["j", 1],
]);

const WEEKDAYS = [
  { label: "M", row: 1 },
  { label: "W", row: 3 },
  { label: "F", row: 5 },
] as const;

function Lattice({ year, calendarYear }: { year: Year; calendarYear: number }) {
  const { cells, width, months, total } = year;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const latticeRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Active | null>(null);
  const vim = useSingleKeyShortcuts();
  const cell = active ? cells[active.index] : undefined;

  // Where the tooltip sits: centred on the day, or hugging the nearer edge
  // of what is visible (on a phone the board shows part of the year).
  function place(index: number, byKey: boolean): Active {
    const { col, row } = cells[index];
    const x = LEFT + col * STEP + STEP / 2;
    let align: Align = x - LEFT < EDGE_WEEKS * STEP ? "start" : width - x < EDGE_WEEKS * STEP ? "end" : "center";
    const box = latticeRef.current?.getBoundingClientRect();
    const view = scrollerRef.current?.getBoundingClientRect();
    if (box && view && box.width > 0) {
      const scale = box.width / width;
      const px = box.left + x * scale;
      const edge = EDGE_WEEKS * STEP * scale;
      align = px - Math.max(box.left, view.left) < edge ? "start" : Math.min(box.right, view.right) - px < edge ? "end" : "center";
    }
    return { index, align, below: row < BELOW_ROWS, byKey };
  }

  const show = (index: number, byKey = false) => {
    if (active && active.index === index && active.byKey === byKey) return;
    setActive(place(index, byKey));
  };
  const clear = () => setActive(null);

  function onPointerOver(event: PointerEvent<HTMLDivElement>) {
    // Only the days carry data-i; the gaps keep the current day, so the
    // chip glides from day to day instead of blinking.
    const index = (event.target as Element).getAttribute?.("data-i");
    if (index !== null && index !== undefined) show(Number(index));
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>) {
    // A tap "leaves" on release; keep that chip until focus moves on.
    if (event.pointerType !== "touch") clear();
  }

  function onFocus(event: FocusEvent<HTMLDivElement>) {
    // Arriving by keyboard puts the cursor on the latest day straight away.
    if (!active && cells.length && event.currentTarget.matches(":focus-visible")) show(cells.length - 1, true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (cells.length === 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    const lastIndex = cells.length - 1;
    const step = ARROWS.get(event.key) ?? (vim ? VIM.get(event.key) : undefined);
    if (step !== undefined) {
      event.preventDefault();
      const from = active ? active.index : lastIndex;
      const next = from + step;
      // Past either end the cursor stays put (and is read out again).
      show(next >= 0 && next <= lastIndex ? next : from, true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      show(event.key === "Home" ? 0 : lastIndex, true);
    } else if (event.key === "Escape" && active) {
      event.preventDefault();
      clear();
    }
  }

  // Keyboard moves keep the cursor in view when the board scrolls.
  useEffect(() => {
    if (!active?.byKey) return;
    const scroller = scrollerRef.current;
    const square = latticeRef.current?.querySelector(`[data-i="${active.index}"]`);
    if (!scroller || !square) return;
    const box = square.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    const pad = 36;
    const delta =
      box.left < view.left + pad ? box.left - view.left - pad : box.right > view.right - pad ? box.right - view.right + pad : 0;
    if (delta !== 0) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scroller.scrollBy({ left: delta, behavior: smooth ? "smooth" : "auto" });
    }
  }, [active]);

  const summary =
    total === 0
      ? `No GitHub contributions yet in ${calendarYear}.`
      : `GitHub contributions by day in ${calendarYear}. Arrow keys move a day or a week, Home and End go to the first and last day.`;

  return (
    <>
      <div
        ref={scrollerRef}
        dir="rtl"
        className="no-scrollbar -mx-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 max-md:[mask-image:linear-gradient(90deg,transparent,#000_28px)]"
      >
        <div
          ref={latticeRef}
          dir="ltr"
          data-lattice=""
          // An application region, not an image: screen readers hand it the
          // arrow keys, so the day-by-day reading works.
          role="application"
          aria-roledescription="contribution calendar"
          aria-label={summary}
          tabIndex={0}
          className="relative mr-auto outline-none"
          style={{ minWidth: width, maxWidth: width * MAX_SCALE }}
          onPointerOver={onPointerOver}
          onPointerLeave={onPointerLeave}
          onPointerCancel={clear}
          onFocus={onFocus}
          onBlur={clear}
          onKeyDown={onKeyDown}
        >
          <svg
            viewBox={`0 0 ${width} ${HEIGHT}`}
            className="block h-auto w-full overflow-visible"
            aria-hidden="true"
            focusable="false"
          >
            {months.map((month) => (
              <text
                key={month.name}
                x={LEFT + month.col * STEP}
                y={11}
                className="fill-muted font-sans text-[11px] font-semibold tracking-[0.1em] uppercase"
              >
                {month.label}
              </text>
            ))}
            {WEEKDAYS.map(({ label, row }) => (
              <text
                key={label}
                x={0}
                y={TOP + row * STEP + STEP / 2 + 4}
                className="fill-muted font-sans text-[11px] font-semibold"
              >
                {label}
              </text>
            ))}
            {cells.map((day, index) => {
              const cx = LEFT + day.col * STEP + STEP / 2;
              const cy = TOP + day.row * STEP + STEP / 2;
              const points = day.level >= 4 ? starPoints(cx, cy, STAR_RADIUS) : diamond(cx, cy, DIAMOND[day.level]);
              return <polygon key={day.day} data-i={index} points={points} className={FILL[Math.min(4, day.level)]} />;
            })}
            {cell ? (
              <polygon
                points={diamond(LEFT + cell.col * STEP + STEP / 2, TOP + cell.row * STEP + STEP / 2, 9)}
                fill="none"
                strokeWidth={1.4}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="pointer-events-none stroke-ink"
              />
            ) : null}
          </svg>
          {cell && active ? <Tip cell={cell} active={active} width={width} /> : null}
        </div>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {cell && active?.byKey ? describe(cell) : ""}
      </span>
    </>
  );
}

function Tip({ cell, active, width }: { cell: Cell; active: Active; width: number }) {
  // Positions are shares of the lattice box, so the chip follows the SVG as it scales.
  const cx = ((LEFT + cell.col * STEP + STEP / 2) / width) * 100;
  const top = ((TOP + cell.row * STEP) / HEIGHT) * 100;
  const bottom = ((TOP + (cell.row + 1) * STEP) / HEIGHT) * 100;
  const x = active.align === "start" ? "-14px" : active.align === "end" ? "calc(-100% + 14px)" : "-50%";
  const style: CSSProperties = active.below
    ? { left: `${cx}%`, top: `${bottom}%`, translate: `${x} 8px` }
    : { left: `${cx}%`, top: `${top}%`, translate: `${x} calc(-100% - 8px)` };
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute z-10 rounded-[6px] bg-ink px-2.5 py-1.5 text-[12.5px] leading-none font-[550] whitespace-nowrap text-on-ink shadow-sheet tabular-nums"
      style={style}
    >
      {cell.count === 0 ? "No" : formatNumber(cell.count)} {cell.count === 1 ? "contribution" : "contributions"}
      <span className="opacity-70"> · {dayLabel.format(fromDay(cell.day))}</span>
    </span>
  );
}
