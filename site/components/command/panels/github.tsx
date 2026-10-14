"use client";

// "On GitHub": the year's total in Fraunces, a few numbers worked out from
// data/contributions.json, and the last 26 weeks as a small diamond
// lattice (one rotated square per day, deepening cobalt with the count,
// a terracotta eight-pointed star on the busiest days), then a way out to
// the profile. On a phone the lattice keeps its size and scrolls
// sideways, starting at the latest week.

import { useMemo } from "react";
import { Arrow } from "@/components/ornament";
import { contributions } from "@/content/site";
import { formatNumber } from "@/lib/format";
import { starPoints } from "@/lib/zellige";
import { PANELS } from "../items";
import { Panel, type PanelProps } from "./panel";

const WEEKS = 26;
const STEP = 17;
const HALF = 6.6; // half the diagonal of a day's diamond
const PAD = 9;
const WIDTH = (WEEKS - 1) * STEP + PAD * 2;
const HEIGHT = 6 * STEP + PAD * 2;
const DAY = 86_400_000;
const FILL = ["fill-graph-0", "fill-graph-1", "fill-graph-2", "fill-graph-3", "fill-graph-4"] as const;

const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type Day = { date: string; count: number; level: number };

function useLattice(days: readonly Day[]) {
  return useMemo(() => {
    const byDate = new Map(days.map((day) => [day.date, day]));
    const last = days.reduce((latest, day) => (day.date > latest ? day.date : latest), days[0]?.date ?? "");
    if (!last) return null;
    const end = Date.parse(`${last}T00:00:00Z`);
    const endWeekStart = end - new Date(end).getUTCDay() * DAY;
    const start = endWeekStart - (WEEKS - 1) * 7 * DAY;
    const cells: Array<{ x: number; y: number; level: number; key: string }> = [];
    const months: Array<{ x: number; label: string }> = [];
    let lastMonth = -1;
    for (let week = 0; week < WEEKS; week += 1) {
      const weekStart = new Date(start + week * 7 * DAY);
      if (weekStart.getUTCMonth() !== lastMonth) {
        lastMonth = weekStart.getUTCMonth();
        if (week < WEEKS - 2) months.push({ x: PAD + week * STEP, label: month.format(weekStart) });
      }
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const time = start + (week * 7 + weekday) * DAY;
        if (time > end) break;
        const iso = new Date(time).toISOString().slice(0, 10);
        const level = Math.max(0, Math.min(4, byDate.get(iso)?.level ?? 0));
        cells.push({ x: PAD + week * STEP, y: PAD + weekday * STEP, level, key: iso });
      }
    }
    const inRange = days.filter((day) => {
      const time = Date.parse(`${day.date}T00:00:00Z`);
      return time >= start && time <= end;
    });
    return {
      cells,
      months,
      from: month.format(new Date(start)),
      to: month.format(new Date(end)),
      count: inRange.reduce((sum, day) => sum + (day.count || 0), 0),
    };
  }, [days]);
}

/** Active days and the busiest day of the year, worked out from the data. */
function useStats(days: readonly Day[]) {
  return useMemo(() => {
    const active = days.filter((day) => day.count > 0).length;
    const busiest = days.reduce<Day | null>((best, day) => (!best || day.count > best.count ? day : best), null);
    let streak = 0;
    let run = 0;
    for (const day of [...days].sort((a, b) => (a.date < b.date ? -1 : 1))) {
      run = day.count > 0 ? run + 1 : 0;
      streak = Math.max(streak, run);
    }
    return { active, total: days.length, busiest, streak };
  }, [days]);
}

export function GitHubPanel({ titleId, onBack, onClose }: PanelProps) {
  const info = PANELS.github;
  const { username, year } = contributions;
  const total = Math.max(0, contributions.total || 0);
  const lattice = useLattice(contributions.days);
  const stats = useStats(contributions.days);
  const profile = `https://github.com/${username}`;
  const star = (x: number, y: number) => starPoints(x, y, HALF + 1.6);

  return (
    <Panel titleId={titleId} title={info.title} onBack={onBack} onClose={onClose} bodyClassName="pt-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="font-display text-[56px] leading-[0.9] font-[380] tracking-[-0.035em] text-primary tabular-nums">
            {formatNumber(total)}
          </p>
          <p className="serif-italic mt-1.5 text-[18px] text-body">contributions in {year}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-[13.5px]">
          <dt className="caps self-center text-muted">Active days</dt>
          <dd className="text-end text-primary tabular-nums">
            {stats.active} of {stats.total}
          </dd>
          <dt className="caps self-center text-muted">Longest streak</dt>
          <dd className="text-end text-primary tabular-nums">
            {stats.streak} {stats.streak === 1 ? "day" : "days"}
          </dd>
          {stats.busiest && stats.busiest.count > 0 ? (
            <>
              <dt className="caps self-center text-muted">Busiest day</dt>
              <dd className="text-end text-primary tabular-nums">
                {dayMonth.format(new Date(`${stats.busiest.date}T00:00:00Z`))} · {stats.busiest.count}
              </dd>
            </>
          ) : null}
        </dl>
      </div>

      {lattice ? (
        <div className="paper mt-5 p-3 sm:p-4">
          <div dir="rtl" className="no-scrollbar overflow-x-auto overscroll-x-contain">
            <div dir="ltr" className="min-w-[420px]">
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT + 16}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`${formatNumber(lattice.count)} contributions from ${lattice.from} to ${lattice.to}, one diamond per day`}
              >
                {lattice.cells.map((cell) =>
                  cell.level === 4 ? (
                    <polygon key={cell.key} points={star(cell.x, cell.y)} className={FILL[4]} />
                  ) : (
                    <rect
                      key={cell.key}
                      x={cell.x - HALF / Math.SQRT2}
                      y={cell.y - HALF / Math.SQRT2}
                      width={HALF * Math.SQRT2}
                      height={HALF * Math.SQRT2}
                      rx={1}
                      transform={`rotate(45 ${cell.x} ${cell.y})`}
                      className={FILL[cell.level]}
                    />
                  ),
                )}
                {lattice.months.map((label) => (
                  <text
                    key={`${label.label}-${label.x}`}
                    x={label.x - HALF}
                    y={HEIGHT + 12}
                    className="fill-muted text-[9.5px] font-semibold tracking-[0.12em] uppercase"
                  >
                    {label.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
          <div aria-hidden="true" className="mt-2 flex items-center justify-end gap-1.5 text-caption text-muted">
            Quiet
            <svg width="76" height="14" viewBox="0 0 76 14" className="mx-0.5 overflow-visible">
              {[0, 1, 2, 3].map((level) => (
                <rect
                  key={level}
                  x={level * 16 + 7 - 3.6}
                  y={7 - 3.6}
                  width={7.2}
                  height={7.2}
                  rx={1}
                  transform={`rotate(45 ${level * 16 + 7} 7)`}
                  className={FILL[level]}
                />
              ))}
              <polygon points={starPoints(71, 7, 6.2)} className={FILL[4]} />
            </svg>
            Busy
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-muted">
          Updated {dayMonth.format(new Date(`${contributions.updatedAt}T00:00:00Z`))} · {lattice?.from}–{lattice?.to}
        </p>
        <a href={profile} target="_blank" rel="noopener noreferrer" onClick={onClose} className="btn btn-soft">
          @{username} on GitHub
          <Arrow external />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </Panel>
  );
}
