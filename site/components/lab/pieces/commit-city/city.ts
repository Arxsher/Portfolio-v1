// The city's plan, worked out once from data/contributions.json.
//
// One lot per day, laid out like the contribution calendar: weeks run along
// x (one column per week, the week of Jan 1 first), days along z (Sunday at
// z = 0, Saturday at z = 6). The gaps between week columns are the streets;
// where a new month starts there is a wider avenue, so the year reads as
// districts. A day with contributions gets a building on its lot, its
// height following the square root of the count (so one busy day doesn't
// flatten the rest of the year); a day with none stays an empty lot. Days
// outside the data (before Jan 1, after the last day) get no lot at all.
//
// Units: one world unit is a day's spacing. Heights are in the same units.

import contributionsJson from "@/data/contributions.json";
import { hash2 } from "../../hooks";

type RawDay = { date: string; count: number; level?: number };
type RawContributions = { username: string; year: number; total: number; updatedAt?: string; days: RawDay[] };

const data = contributionsJson as RawContributions;

/** Spacing of the days in a week (z) and of the weeks (x). */
export const DAY_PITCH = 1;
export const WEEK_PITCH = 1.1;
/** Extra width of the avenue before the first week of a month. */
export const AVENUE = 0.5;
/** A lot's paving and a building's footprint (square, centred on the lot). */
export const LOT = 0.84;
export const FOOTPRINT = 0.62;

/** Building height for a day's count: square-root scaled, 0 for none. */
export function heightFor(count: number): number {
  return count > 0 ? 0.16 + 0.54 * Math.sqrt(count) : 0;
}

/** One box of a building (they stack: base, setbacks, crown). */
export type Tier = { half: number; y0: number; y1: number; windows: boolean };

export type Lot = {
  /** Order in the data (0 = Jan 1). */
  index: number;
  /** "2026-10-08" */
  date: string;
  count: number;
  /** Week column and weekday (0 = Sunday). */
  col: number;
  row: number;
  /** Lot centre in world units. */
  x: number;
  z: number;
  /** Building height (0: an empty lot). */
  height: number;
  tiers: Tier[];
  /** A small plant box on the roof: offset from the centre and size, or null. */
  roofBox: { dx: number; dz: number; half: number; h: number } | null;
  /** The year's tallest building carries a mast and a night beacon. */
  mast: number;
  /** Stable per-lot noise (window patterns, roof boxes). */
  seed: number;
};

export type District = { month: string; x0: number; x1: number };

export type City = {
  lots: Lot[];
  /** Plan extent of the lots' centres (world units). */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  districts: District[];
  tallest: Lot | null;
  total: number;
  year: number;
  username: string;
  /** "Jan 1" and "Oct 14": the first and last day drawn. */
  first: string;
  last: string;
};

const DAY_MS = 86_400_000;
const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

function dayNumber(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return Math.round(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

/** "Oct 8" */
export function shortDate(iso: string): string {
  const day = dayNumber(iso);
  return day === null ? iso : dayLabel.format(new Date(day * DAY_MS));
}

/** "Thursday, October 8" */
export function longDate(iso: string): string {
  const day = dayNumber(iso);
  return day === null ? iso : longDayLabel.format(new Date(day * DAY_MS));
}

export const plural = (count: number, word: string) => (count === 1 ? word : `${word}s`);

/** "54 contributions on Oct 8", "No contributions on Jan 1". */
export function describeLot(lot: Lot): string {
  return `${lot.count === 0 ? "No" : lot.count} ${plural(lot.count, "contribution")} on ${shortDate(lot.date)}`;
}

/**
 * The plan for the weeks `fromCol` … `toCol` (inclusive; negative counts
 * from the end, so -8 is the last eight weeks). The default is the whole
 * year in the data.
 */
export function buildCity(fromCol = 0, toCol = -1): City {
  const entries: Array<{ day: number; date: string; count: number }> = [];
  const start = Math.round(Date.UTC(data.year, 0, 1) / DAY_MS);
  const end = Math.round(Date.UTC(data.year, 11, 31) / DAY_MS);
  for (const raw of data.days ?? []) {
    const day = dayNumber(raw.date);
    if (day === null || day < start || day > end) continue;
    entries.push({ day, date: raw.date, count: Math.max(0, Math.trunc(Number(raw.count) || 0)) });
  }
  entries.sort((a, b) => a.day - b.day);

  const firstWeek = start - new Date(start * DAY_MS).getUTCDay(); // the Sunday on or before Jan 1
  const columns = entries.length ? Math.floor((entries[entries.length - 1].day - firstWeek) / 7) + 1 : 1;
  const lo = Math.max(0, fromCol < 0 ? columns + fromCol : fromCol);
  const hi = Math.min(columns - 1, toCol < 0 ? columns + toCol : toCol);

  // A column belongs to the month of its first day in the year.
  const columnMonth: string[] = [];
  for (let col = 0; col < columns; col++) {
    const first = Math.max(start, firstWeek + col * 7);
    columnMonth.push(monthLabel.format(new Date(first * DAY_MS)));
  }

  // Column → x, with an avenue before each new month.
  const columnX: number[] = [];
  let x = 0;
  for (let col = lo; col <= hi; col++) {
    if (col > lo) x += WEEK_PITCH + (columnMonth[col] !== columnMonth[col - 1] ? AVENUE : 0);
    columnX[col] = x;
  }

  const lots: Lot[] = [];
  entries.forEach((entry, index) => {
    const offset = entry.day - firstWeek;
    const col = Math.floor(offset / 7);
    if (col < lo || col > hi) return;
    const row = offset % 7;
    const seed = hash2(col, row, 7);
    const height = heightFor(entry.count);
    lots.push({
      index,
      date: entry.date,
      count: entry.count,
      col,
      row,
      x: columnX[col],
      z: row * DAY_PITCH,
      height,
      tiers: [],
      roofBox: null,
      mast: 0,
      seed,
    });
  });

  // The tallest building of the set gets the landmark treatment.
  let tallest: Lot | null = null;
  for (const lot of lots) if (lot.count > 0 && (!tallest || lot.count > tallest.count)) tallest = lot;

  const half = FOOTPRINT / 2;
  for (const lot of lots) {
    const h = lot.height;
    if (h <= 0) continue;
    if (lot === tallest && lot.count >= 20) {
      // A slim tower in three setbacks with a mast.
      lot.tiers = [
        { half, y0: 0, y1: h * 0.5, windows: true },
        { half: half * 0.8, y0: h * 0.5, y1: h * 0.82, windows: true },
        { half: half * 0.58, y0: h * 0.82, y1: h, windows: true },
      ];
      lot.mast = Math.max(0.35, h * 0.16);
    } else if (h >= 1.75) {
      // Tall: one setback near the top.
      lot.tiers = [
        { half, y0: 0, y1: h * 0.72, windows: true },
        { half: half * 0.74, y0: h * 0.72, y1: h, windows: true },
      ];
    } else {
      lot.tiers = [{ half, y0: 0, y1: h, windows: h >= 0.5 }];
      // Some mid-rise roofs carry a small plant box (decoration only).
      if (h >= 0.9 && hash2(lot.col, lot.row, 31) < 0.4) {
        const side = hash2(lot.col, lot.row, 37) < 0.5 ? -1 : 1;
        lot.roofBox = {
          dx: side * half * 0.38,
          dz: (hash2(lot.col, lot.row, 41) - 0.5) * half * 0.6,
          half: half * 0.24,
          h: 0.07,
        };
      }
    }
  }

  // Districts (for the month labels on the plinth).
  const districts: District[] = [];
  for (let col = lo; col <= hi; col++) {
    const month = columnMonth[col];
    const last = districts[districts.length - 1];
    if (last && last.month === month) last.x1 = columnX[col];
    else districts.push({ month, x0: columnX[col], x1: columnX[col] });
  }

  const xs = lots.map((lot) => lot.x);
  const zs = lots.map((lot) => lot.z);
  const inRange = lots.length > 0;
  return {
    lots,
    minX: inRange ? Math.min(...xs) : 0,
    maxX: inRange ? Math.max(...xs) : 0,
    minZ: inRange ? Math.min(...zs, 0) : 0,
    maxZ: inRange ? Math.max(...zs, 6) : 6,
    districts,
    tallest,
    total: data.total ?? lots.reduce((sum, lot) => sum + lot.count, 0),
    year: data.year,
    username: data.username,
    first: lots.length ? shortDate(lots[0].date) : "",
    last: lots.length ? shortDate(lots[lots.length - 1].date) : "",
  };
}
