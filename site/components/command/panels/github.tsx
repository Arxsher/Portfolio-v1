"use client";

// "GitHub": a compact contribution card, the last 28 weeks of
// data/contributions.json drawn as one small SVG, the profile link and the
// year's total. On a phone the weeks keep a readable size and scroll
// sideways, starting at the latest week.

import { useMemo } from "react";
import { ArrowUpRight, GitHub } from "@/components/icons";
import { contributions } from "@/content/site";
import { formatNumber } from "@/lib/format";
import { VIEWS } from "../items";
import { Panel } from "./panel";

const WEEKS = 28;
const CELL = 12;
const GAP = 4;
const STEP = CELL + GAP;
const WIDTH = WEEKS * STEP - GAP;
const HEIGHT = 7 * STEP - GAP;
const LEVELS = [0.07, 0.22, 0.42, 0.68, 1] as const;
const DAY = 86_400_000;

const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

type Day = { date: string; count: number; level: number };

function useWeeks(days: readonly Day[]) {
  return useMemo(() => {
    const byDate = new Map(days.map((day) => [day.date, day]));
    const last = days.reduce((latest, day) => (day.date > latest ? day.date : latest), days[0]?.date ?? "");
    if (!last) return null;
    const end = Date.parse(`${last}T00:00:00Z`);
    const endWeekStart = end - new Date(end).getUTCDay() * DAY;
    const start = endWeekStart - (WEEKS - 1) * 7 * DAY;
    const cells: Array<{ x: number; y: number; level: number; label: string }> = [];
    for (let week = 0; week < WEEKS; week += 1) {
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const time = start + (week * 7 + weekday) * DAY;
        if (time > end) break;
        const iso = new Date(time).toISOString().slice(0, 10);
        const day = byDate.get(iso);
        cells.push({ x: week * STEP, y: weekday * STEP, level: Math.max(0, Math.min(4, day?.level ?? 0)), label: iso });
      }
    }
    const inRange = days.filter((day) => {
      const time = Date.parse(`${day.date}T00:00:00Z`);
      return time >= start && time <= end;
    });
    return {
      cells,
      from: month.format(new Date(start)),
      to: month.format(new Date(end)),
      count: inRange.reduce((sum, day) => sum + (day.count || 0), 0),
    };
  }, [days]);
}

export function GitHubPanel({ onClose }: { onClose: () => void }) {
  const info = VIEWS.github;
  const { username, year } = contributions;
  const total = Math.max(0, contributions.total || 0);
  const weeks = useWeeks(contributions.days);
  const profile = `https://github.com/${username}`;

  return (
    <Panel title={info.title} description={info.description} icon="github" onClose={onClose}>
      <div className="flex flex-col rounded-panel bg-tile p-5 text-left">
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
            {formatNumber(total)} {total === 1 ? "contribution" : "contributions"} in {year}
          </span>
        </div>
        {weeks ? (
          <div
            dir="rtl"
            className="no-scrollbar -mx-5 mt-4 overflow-x-auto overscroll-x-contain px-5 [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]"
          >
            <div dir="ltr" style={{ minWidth: 355 }}>
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`${formatNumber(weeks.count)} contributions from ${weeks.from} to ${weeks.to}`}
              >
                {weeks.cells.map((cell) => (
                  <rect
                    key={cell.label}
                    x={cell.x}
                    y={cell.y}
                    width={CELL}
                    height={CELL}
                    rx={3.5}
                    className="fill-primary"
                    fillOpacity={LEVELS[cell.level]}
                  />
                ))}
              </svg>
              <div className="mt-3 flex justify-between text-[11px]/[1.6] text-tertiary">
                <span>{weeks.from}</span>
                <span>{weeks.to}</span>
              </div>
            </div>
          </div>
        ) : null}
        <div aria-hidden="true" className="mt-2 flex justify-end text-[11px]/[1.6] text-tertiary">
          <span className="flex items-center gap-1.5">
            Less
            {LEVELS.map((opacity) => (
              <span key={opacity} className="size-2.5 rounded-[3px] bg-primary" style={{ opacity }} />
            ))}
            More
          </span>
        </div>
      </div>
    </Panel>
  );
}
