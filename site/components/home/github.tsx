"use client";

// GitHub: the "github / 544 in 2026" section of the home page.
//
//   github / 544 in 2026 ................................... @Arxsher ↗
//   ┌────────────────────────────────────────────┬──────────────────┐
//   │ Drag to turn · hover a building       ↺ ↻ │ 166 of 287       │
//   │                                            │ Active days      │
//   │        ◇ the year as a model city ◇        │ 13 days …        │
//   │                                            │ 78 in May …      │
//   │                                            │ Open in the lab ›│
//   └────────────────────────────────────────────┴──────────────────┘
//
// (On phones the figures sit under the city, two by two.)
//
// The card is Commit city, the lab piece (components/lab/pieces/commit-city),
// in its card variant (card.tsx): every day of the year as a lot, laid out
// week by week, with a building whose height follows that day's count. It
// is live: drag to turn it, point at (or tap) a building for its date and
// count, and at rest it sways slowly. Under it, a row of figures worked out
// from the same data, and a link to the full piece in the lab.
//
// The city's code only loads once the card is near the viewport, runs only
// while the card is on screen and the tab is visible, and lets go of its
// canvases when it unmounts. Screen readers get a summary of the year (read
// with the city when it is focused, where the arrow keys walk the days) and
// a month-by-month table; neither needs the canvas.
//
// Data: data/contributions.json  { username, year, total, days: [{ date, count, level 0-4 }] }

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useId, useMemo, useRef, type ComponentProps, type ReactNode } from "react";
import contributionsJson from "@/data/contributions.json";
import { ChevronRight } from "@/components/icons";
import { useInView, usePageVisible, useReducedMotion, useTheme } from "@/components/lab/hooks";
import { Section } from "@/components/section";
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
/* the year in numbers                                                     */
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

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

type Peak = { day: number; count: number };

type MonthStats = { key: number; total: number; active: number; best: Peak | null };

type YearStats = {
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

/** Everything the card says about the year, worked out from the days themselves. */
function yearStats({ year, days, total: reported }: Contributions): YearStats {
  const start = Math.round(Date.UTC(year, 0, 1) / DAY_MS);
  const end = Math.round(Date.UTC(year, 11, 31) / DAY_MS);
  const byDay = new Map<number, number>();
  for (const entry of days ?? []) {
    const day = toDayNumber(entry.date);
    if (day === null || day < start || day > end) continue;
    byDay.set(day, Math.max(0, Math.trunc(Number(entry.count) || 0)));
  }
  const sorted = [...byDay.keys()].sort((a, b) => a - b);

  let sum = 0;
  let active = 0;
  let best: Peak | null = null;
  let streak: YearStats["streak"] = null;
  let run = 0;
  let runFrom = 0;
  let previous: number | null = null;
  const months = new Map<number, MonthStats>();
  for (const day of sorted) {
    const count = byDay.get(day) ?? 0;
    const key = fromDay(day).getUTCMonth();
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

  return {
    total: sorted.length ? sum : Math.max(0, reported || 0),
    days: sorted.length,
    active,
    best,
    streak,
    months: list,
    busiest,
    first: sorted.length ? sorted[0] : null,
    last: sorted.length ? sorted[sorted.length - 1] : null,
  };
}

const monthName = (key: number, year: number, style: "short" | "long") =>
  (style === "short" ? monthShort : monthLong).format(new Date(Date.UTC(year, key, 1)));

/** One paragraph for screen readers: the year, its best day and its longest streak. */
function describeYear(stats: YearStats, year: number): string {
  const { total, days, active, best, streak, busiest, first, last } = stats;
  if (total === 0 || first === null || last === null) return `No GitHub contributions yet in ${year}.`;
  const parts = [
    `${formatNumber(total)} GitHub ${plural(total, "contribution")} in ${year}, from ${dayLabel.format(fromDay(first))} to ${dayLabel.format(fromDay(last))}, on ${active} of ${days} days.`,
  ];
  if (best) parts.push(`Busiest day: ${dayLabel.format(fromDay(best.day))}, with ${formatNumber(best.count)}.`);
  if (streak)
    parts.push(
      streak.length === 1
        ? "Longest streak: 1 day."
        : `Longest streak: ${streak.length} days in a row, ${dayLabel.format(fromDay(streak.from))} to ${dayLabel.format(fromDay(streak.to))}.`,
    );
  if (busiest) parts.push(`Busiest month: ${monthName(busiest.key, year, "long")}, with ${formatNumber(busiest.total)}.`);
  return parts.join(" ");
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

function LiveCity({ describedBy }: { describedBy: string }) {
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
          <CityCard active={onScreen && visible} reducedMotion={reducedMotion} theme={theme} describedBy={describedBy} />
        </CityBoundary>
      ) : null}
    </div>
  );
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
  const profile = `https://github.com/${username}`;
  const stats = useMemo(() => yearStats(data), [data]);
  const summaryId = useId();
  const empty = stats.total === 0 || stats.days === 0;

  return (
    <Section
      id={id}
      label="GitHub"
      // The data's own year, not "this year": still true once the calendar turns over.
      count={`${formatNumber(stats.total)} in ${year}`}
      action={{ label: `@${username}`, href: profile, external: true }}
    >
      <div className="overflow-hidden rounded-panel bg-tile sm:flex">
        <p id={summaryId} className="sr-only">
          {describeYear(stats, year)}
        </p>

        {empty ? (
          <div className="grid h-[160px] place-items-center px-5 text-center sm:h-auto sm:min-h-[200px] sm:flex-1">
            <p className="text-[13px] text-tertiary">No contributions yet in {year}. The city goes up with the first one.</p>
          </div>
        ) : (
          <>
            <LiveCity describedBy={summaryId} />
            <MonthTable stats={stats} year={year} />
          </>
        )}

        {/* The figures: under the city on phones (two by two), beside it from sm up. */}
        <div className="flex flex-col border-t border-border px-5 pt-3.5 pb-2.5 sm:w-[184px] sm:shrink-0 sm:border-t-0 sm:border-s sm:pt-4 sm:pb-3.5">
          {empty ? null : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-1">
              <Stat label="Active days" value={formatNumber(stats.active)} note={`of ${formatNumber(stats.days)}`} />
              {stats.streak ? (
                <Stat label="Longest streak" value={`${stats.streak.length} ${plural(stats.streak.length, "day")}`} />
              ) : null}
              {stats.best ? (
                <Stat label="Best day" value={formatNumber(stats.best.count)} note={`on ${dayLabel.format(fromDay(stats.best.day))}`} />
              ) : null}
              {stats.busiest ? (
                // The count first, as on the best day: "78 in May".
                <Stat
                  label="Busiest month"
                  value={formatNumber(stats.busiest.total)}
                  note={`in ${monthName(stats.busiest.key, year, "short")}`}
                />
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

/** The year month by month, for screen readers (the canvas is decoration to them). */
function MonthTable({ stats, year }: { stats: YearStats; year: number }) {
  return (
    // The wrapper is what hides it: a table sizes to its content and would
    // not keep the 1px box of sr-only itself.
    <div className="sr-only">
      <table>
        <caption>GitHub contributions by month, {year}</caption>
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
              <th scope="row">{monthName(month.key, year, "long")}</th>
              <td>{formatNumber(month.total)}</td>
              <td>{month.active}</td>
              <td>{month.best ? `${dayLabel.format(fromDay(month.best.day))}, ${formatNumber(month.best.count)}` : "None"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
