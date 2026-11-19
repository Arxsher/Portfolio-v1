"use client";

// GitHub: the "github / 602 in the last year" section of the home page.
//
//   github / 602 in the last year .......................... @Arxsher ↗
//   ┌────────────────────────────────────────────┬──────────────────┐
//   │ Drag to turn · hover a building       ↺ ↻ │ 188 of 368       │
//   │                                            │ Active days      │
//   │      ◇ the last 12 months as a city ◇      │ 13 days …        │
//   │                                            │ 83 in Oct …      │
//   │                                            │ Open in the lab ›│
//   └────────────────────────────────────────────┴──────────────────┘
//
// (On phones the figures sit under the city, two by two.)
//
// The card is Commit city, the lab piece (components/lab/pieces/commit-city),
// in its card variant (card.tsx): every day of the last 12 months as a lot,
// laid out week by week from last October to this one, with a building
// whose height follows that day's count. It is live: drag to turn it, point
// at (or tap) a building for its date and count, and at rest it sways
// slowly. Under it, a row of figures worked out from the same days, and a
// link to the full piece in the lab (which shows the calendar year).
//
// Data: the last 12 months, counted like the GitHub profile ("602
// contributions in the last year"). The page is built with
// data/contributions-last.json (scripts/fetch-contributions.mjs writes it
// before every build), so the figures are real before any script runs; in
// the browser, useLiveContributions (lib/contributions.ts) swaps in GitHub's
// current numbers (cached for an hour per tab, the build's copy kept if the
// request fails). The header, the figures, the city and the summaries for
// screen readers all come from the same days.
//
// Motion: when fresher numbers land while the card is on screen, every
// figure counts from its old value to its new one (700 ms, ease-out) while
// the city's changed buildings grow into place; nothing in the layout moves
// (tabular figures in fixed slots). Off screen or with reduced motion they
// simply change.
//
// The city's code only loads once the card is near the viewport, runs only
// while the card is on screen and the tab is visible, and lets go of its
// canvases when it unmounts. Screen readers get a summary of the window
// (read with the city when it is focused, where the arrow keys walk the
// days) and a month-by-month table; neither needs the canvas.

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, memo, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ChevronRight } from "@/components/icons";
import { useInView, useIsoLayoutEffect, usePageVisible, useReducedMotion, useTheme } from "@/components/lab/hooks";
import { Section } from "@/components/section";
import { lastYearFallback, useLiveContributions, type Contributions } from "@/lib/contributions";
import { formatNumber } from "@/lib/format";

export type { ContributionDay, Contributions } from "@/lib/contributions";

/* ---------------------------------------------------------------------- */
/* the window in numbers                                                   */
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
const yearDayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

type Peak = { day: number; count: number };

/** One calendar month of the window; `key` is year × 12 + month, so last October and this one stay apart. */
type MonthStats = { key: number; total: number; active: number; best: Peak | null };

type WindowStats = {
  /** "last": the last 12 months; "year": one calendar year. */
  range: "last" | "year";
  /** The calendar year, or the year of the window's last day (dates in it go without a year). */
  year: number;
  total: number;
  /** Days in the data so far, and those with at least one contribution. */
  days: number;
  active: number;
  best: Peak | null;
  streak: { length: number; from: number; to: number } | null;
  months: MonthStats[];
  busiest: MonthStats | null;
  first: number | null;
  last: number | null;
};

/** Everything the card says, worked out from the days themselves. */
function windowStats({ year, days, total: reported, range }: Contributions): WindowStats {
  const rolling = range === "last";
  const start = Math.round(Date.UTC(year, 0, 1) / DAY_MS);
  const end = Math.round(Date.UTC(year, 11, 31) / DAY_MS);
  const byDay = new Map<number, number>();
  for (const entry of days ?? []) {
    const day = toDayNumber(entry.date);
    if (day === null || (!rolling && (day < start || day > end))) continue;
    byDay.set(day, Math.max(0, Math.trunc(Number(entry.count) || 0)));
  }
  const sorted = [...byDay.keys()].sort((a, b) => a - b);

  let sum = 0;
  let active = 0;
  let best: Peak | null = null;
  let streak: WindowStats["streak"] = null;
  let run = 0;
  let runFrom = 0;
  let previous: number | null = null;
  const months = new Map<number, MonthStats>();
  for (const day of sorted) {
    const count = byDay.get(day) ?? 0;
    const date = fromDay(day);
    const key = date.getUTCFullYear() * 12 + date.getUTCMonth();
    let month = months.get(key);
    if (!month) {
      month = { key, total: 0, active: 0, best: null };
      months.set(key, month);
    }
    sum += count;
    month.total += count;
    if (count > 0) {
      active++;
      month.active++;
      if (!best || count > best.count) best = { day, count };
      if (!month.best || count > month.best.count) month.best = { day, count };
      // A streak is unbroken calendar days with contributions.
      if (run > 0 && previous === day - 1) run++;
      else {
        run = 1;
        runFrom = day;
      }
      if (!streak || run > streak.length) streak = { length: run, from: runFrom, to: day };
    } else run = 0;
    previous = day;
  }
  const list = [...months.values()].sort((a, b) => a.key - b.key);
  let busiest: MonthStats | null = null;
  for (const month of list) if (month.total > 0 && (!busiest || month.total > busiest.total)) busiest = month;
  const last = sorted.length ? sorted[sorted.length - 1] : null;

  return {
    range: rolling ? "last" : "year",
    year: rolling && last !== null ? fromDay(last).getUTCFullYear() : year,
    total: sorted.length ? sum : Math.max(0, reported || 0),
    days: sorted.length,
    active,
    best,
    streak,
    months: list,
    busiest,
    first: sorted.length ? sorted[0] : null,
    last,
  };
}

/** "Oct 8", or "Oct 20, 2025" for a day from before the window's last year (`always`: with the year regardless). */
function dayText(day: number, stats: WindowStats, always = false) {
  const date = fromDay(day);
  return (always || date.getUTCFullYear() !== stats.year ? yearDayLabel : dayLabel).format(date);
}

/** "Oct", or "Oct 2025" for a month from before the window's last year (`always`: with the year regardless). */
function monthText(key: number, stats: WindowStats, style: "short" | "long", always = false) {
  const year = Math.floor(key / 12);
  const name = (style === "short" ? monthShort : monthLong).format(new Date(Date.UTC(year, key % 12, 1)));
  return always || year !== stats.year ? `${name} ${year}` : name;
}

/** "in the last year" / "in 2026" */
const spanText = (stats: WindowStats) => (stats.range === "last" ? "in the last year" : `in ${stats.year}`);

/** One paragraph for screen readers: the window, its best day and its longest streak. */
function describeWindow(stats: WindowStats): string {
  const { total, days, active, best, streak, busiest, first, last } = stats;
  if (total === 0 || first === null || last === null) return `No GitHub contributions yet ${spanText(stats)}.`;
  const rolling = stats.range === "last";
  const parts = [
    `${formatNumber(total)} GitHub ${plural(total, "contribution")} ${spanText(stats)}, from ${dayText(first, stats, rolling)} to ${dayText(last, stats, rolling)}, on ${active} of ${days} days.`,
  ];
  if (best) parts.push(`Busiest day: ${dayText(best.day, stats)}, with ${formatNumber(best.count)}.`);
  if (streak)
    parts.push(
      streak.length === 1
        ? "Longest streak: 1 day."
        : `Longest streak: ${streak.length} days in a row, ${dayText(streak.from, stats)} to ${dayText(streak.to, stats)}.`,
    );
  if (busiest) parts.push(`Busiest month: ${monthText(busiest.key, stats, "long", rolling)}, with ${formatNumber(busiest.total)}.`);
  return parts.join(" ");
}

/* ---------------------------------------------------------------------- */
/* figures that count to their new values                                  */
/* ---------------------------------------------------------------------- */

type Figures = { total: number; active: number; days: number; streak: number; best: number; busiest: number };
const FIGURES = ["total", "active", "days", "streak", "best", "busiest"] as const;
/** How long a figure takes to count to its new value. */
const COUNT_MS = 700;

const sameFigures = (a: Figures, b: Figures) => FIGURES.every((key) => a[key] === b[key]);

function figuresOf(stats: WindowStats): Figures {
  return {
    total: stats.total,
    active: stats.active,
    days: stats.days,
    streak: stats.streak?.length ?? 0,
    best: stats.best?.count ?? 0,
    busiest: stats.busiest?.total ?? 0,
  };
}

/** Is any of the element on screen right now (and the tab in front)? */
function onScreenNow(element: Element | null): boolean {
  if (!element || document.visibilityState === "hidden") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
}

/**
 * The figures as shown: the target itself, or (when the target changes
 * while `animate()` says someone can see it) whole numbers counting from
 * what was on screen to the target, fast at first and easing in (expo out).
 * A change mid-count counts on from where the figures are.
 */
function useCountedFigures(target: Figures, animate: () => boolean): Figures {
  const [tween, setTween] = useState<Figures | null>(null);
  const display = tween ?? target;
  const onScreen = useRef(display);
  const canAnimate = useRef(animate);
  useIsoLayoutEffect(() => {
    canAnimate.current = animate;
  });

  // Runs before the commit's own bookkeeping below, so `onScreen` still holds the last frame's figures.
  useIsoLayoutEffect(() => {
    const from = onScreen.current;
    if (sameFigures(from, target) || !canAnimate.current()) {
      setTween(null);
      return;
    }
    setTween(from);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      if (t >= 1) {
        setTween(null);
        return;
      }
      const e = 1 - Math.pow(2, -10 * t);
      const next = { ...from };
      for (const key of FIGURES) next[key] = Math.round(from[key] + (target[key] - from[key]) * e);
      setTween((previous) => (previous && sameFigures(previous, next) ? previous : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  useIsoLayoutEffect(() => {
    onScreen.current = display;
  });

  return display;
}

/* ---------------------------------------------------------------------- */
/* the city                                                                */
/* ---------------------------------------------------------------------- */

const CityCard = dynamic(
  () =>
    import("@/components/lab/pieces/commit-city/card").then((mod) => {
      const Card = mod.default;
      // Fades in over the loading sheen.
      function Arrived(props: ComponentProps<typeof Card>) {
        return (
          <div className="absolute inset-0 animate-fade-in rounded-[inherit]">
            <Card {...props} />
          </div>
        );
      }
      return Arrived;
    }),
  { ssr: false, loading: () => <div aria-hidden="true" className="skeleton absolute inset-0" /> },
);

/** A city that throws is replaced by a short note instead of taking the page down. */
class CityBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("github: the commit city stopped with an error", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="absolute inset-0 grid place-items-center p-4 text-center">
        <p className="text-[13px] text-tertiary">The city couldn&apos;t start in this browser. The figures below still add up.</p>
      </div>
    );
  }
}

/** Memoised: the figures counting over it re-render the section, not the city. */
const LiveCity = memo(function LiveCity({ data, describedBy }: { data: Contributions; describedBy: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Load once it is close; run only while it is on screen and the tab is visible.
  const near = useInView(ref, { rootMargin: "240px 0px", once: true });
  const onScreen = useInView(ref);
  const visible = usePageVisible();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  return (
    <div
      ref={ref}
      className="relative h-[196px] rounded-t-panel sm:h-auto sm:min-h-[256px] sm:min-w-0 sm:flex-1 sm:rounded-none sm:rounded-s-panel"
    >
      {near ? (
        <CityBoundary>
          <CityCard data={data} active={onScreen && visible} reducedMotion={reducedMotion} theme={theme} describedBy={describedBy} />
        </CityBoundary>
      ) : null}
    </div>
  );
});

/* ---------------------------------------------------------------------- */
/* section                                                                 */
/* ---------------------------------------------------------------------- */

export function GitHubGraph({
  data: initial = lastYearFallback,
  id = "github",
}: {
  /** The build's copy of the last 12 months; replaced in the browser by GitHub's current one. */
  data?: Contributions;
  /** Section anchor (#github by default). */
  id?: string;
}) {
  const { data } = useLiveContributions(initial);
  const { username } = data;
  const profile = `https://github.com/${username}`;
  const stats = useMemo(() => windowStats(data), [data]);
  const target = useMemo(() => figuresOf(stats), [stats]);
  const summaryId = useId();
  const empty = stats.total === 0 || stats.days === 0;

  // Fresh numbers (from GitHub, or this tab's cache over the page's own
  // copy) count up only where someone can see them do it.
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const shown = useCountedFigures(target, () => !reducedMotion && onScreenNow(cardRef.current));

  return (
    <Section
      id={id}
      label="GitHub"
      // The window GitHub itself counts ("in the last year"), named as such.
      count={`${formatNumber(shown.total)} ${spanText(stats)}`}
      action={{ label: `@${username}`, href: profile, external: true }}
    >
      <div ref={cardRef} className="overflow-hidden rounded-panel bg-tile sm:flex">
        <p id={summaryId} className="sr-only">
          {describeWindow(stats)}
        </p>

        {empty ? (
          <div className="grid h-[160px] place-items-center px-5 text-center sm:h-auto sm:min-h-[200px] sm:flex-1">
            <p className="text-[13px] text-tertiary">No contributions yet {spanText(stats)}. The city goes up with the first one.</p>
          </div>
        ) : (
          <>
            <LiveCity data={data} describedBy={summaryId} />
            <MonthTable stats={stats} />
          </>
        )}

        {/* The figures: under the city on phones (two by two), beside it from sm up. */}
        <div className="flex flex-col border-t border-border px-5 pt-3.5 pb-2.5 sm:w-[184px] sm:shrink-0 sm:border-t-0 sm:border-s sm:pt-4 sm:pb-3.5">
          {empty ? null : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-1">
              <Stat label="Active days" value={formatNumber(shown.active)} note={`of ${formatNumber(shown.days)}`} />
              {stats.streak ? <Stat label="Longest streak" value={`${shown.streak} ${plural(shown.streak, "day")}`} /> : null}
              {stats.best ? <Stat label="Best day" value={formatNumber(shown.best)} note={`on ${dayText(stats.best.day, stats)}`} /> : null}
              {stats.busiest ? (
                // The count first, as on the best day: "78 in May".
                <Stat label="Busiest month" value={formatNumber(shown.busiest)} note={`in ${monthText(stats.busiest.key, stats, "short")}`} />
              ) : null}
            </dl>
          )}
          {/* The link closes the figures, kept clear of the last one (and its focus ring off it). */}
          <div className="mt-auto pt-2 sm:pt-3">
            <Link href="/lab/commit-city/" className={labLinkClass}>
              Open in the lab
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

/** "Open in the lab ›": the quiet look of the section links ("All work ›"). */
const labLinkClass =
  "-mx-0.5 inline-flex items-center gap-0.5 rounded-[6px] px-0.5 py-1 text-[13px] text-tertiary transition-colors duration-150 ease-out hover:text-primary focus-ring";

/** A figure in the row under the city: the value, then what it counts. */
function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse">
      <dt className="truncate text-[12px]/[16px] text-tertiary">{label}</dt>
      <dd className="text-[15px]/[22px] font-medium whitespace-nowrap text-primary tabular-nums">
        {value}
        {note ? <span className="ms-1.5 text-[13px] font-normal text-tertiary">{note}</span> : null}
      </dd>
    </div>
  );
}

/** The window month by month, for screen readers (the canvas is decoration to them). */
const MonthTable = memo(function MonthTable({ stats }: { stats: WindowStats }) {
  const rolling = stats.range === "last";
  return (
    // The wrapper is what hides it: a table sizes to its content and would
    // not keep the 1px box of sr-only itself.
    <div className="sr-only">
      <table>
        <caption>GitHub contributions by month, {rolling ? "the last 12 months" : stats.year}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Contributions</th>
            <th scope="col">Active days</th>
            <th scope="col">Busiest day</th>
          </tr>
        </thead>
        <tbody>
          {stats.months.map((month) => (
            <tr key={month.key}>
              <th scope="row">{monthText(month.key, stats, "long", rolling)}</th>
              <td>{formatNumber(month.total)}</td>
              <td>{month.active}</td>
              <td>{month.best ? `${dayText(month.best.day, stats)}, ${formatNumber(month.best.count)}` : "None"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
