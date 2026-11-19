// The city's plan, worked out once from a contribution calendar: by default
// data/contributions.json (one calendar year: the lab piece), or any data
// passed in, such as the last 12 months the home page shows (a rolling
// window that runs from a Sunday in October last year to today).
//
// One lot per day, laid out like the contribution calendar: each week is a
// short street of seven lots along z (Sunday at the back, Saturday at the
// front), and the weeks follow one another along x. The gaps between weeks
// are the streets; where a new month starts there is a wider avenue, so the
// months read as districts.
//
// A whole year in one line is a long thin strip (about 6:1), which never
// fills a stage. So the year folds, like lines on a page: the weeks wrap
// into a few bands (a season each, broken where a month starts) laid one in
// front of the other with a boulevard between them. Three bands of a
// quarter or so make a plan that is close to square, the most compact shape
// to turn on a turntable. The first band sits at the back; the most recent
// weeks end at the front corner, nearest to you.
//
// A day with contributions gets a building on its lot, its height following
// the square root of the count (so one busy day doesn't flatten the rest of
// the year); a day with none stays an empty lot. Days outside the data
// (before Jan 1, after the last day) get no lot at all.
//
// A rolling window works the same way: its weeks start on the Sunday on or
// before its first day, and its months are keyed by year as well, so the
// two Octobers at either end of "the last year" are two districts (the
// oldest at the back, this month at the front corner), never one.
//
// Units: one world unit is a day's spacing. Heights are in the same units.

import contributionsJson from "@/data/contributions.json";
import { hash2 } from "../../hooks";

type RawDay = { date: string; count: number; level?: number };
/** A contribution calendar (data/contributions.json, data/contributions-last.json or the live API's days). */
export type CityData = { username: string; year: number; total?: number; range?: string; updatedAt?: string; days: RawDay[] };

const yearData = contributionsJson as CityData;

/** Spacing of the days in a week (z) and of the weeks (x). */
export const DAY_PITCH = 1;
export const WEEK_PITCH = 1.1;
/** Extra width of the avenue before the first week of a month. */
export const AVENUE = 0.5;
/** Extra depth of the boulevard between two bands of the folded year. */
export const BOULEVARD = 1.15;
/** A lot's paving and a building's footprint (square, centred on the lot). */
export const LOT = 0.84;
export const FOOTPRINT = 0.62;

/** Building height for a day's count: square-root scaled, 0 for none. */
export function heightFor(count: number): number {
  return count > 0 ? 0.16 + 0.54 * Math.sqrt(count) : 0;
}

/**
 * One box of a building (they stack: base, setbacks, crown). `key` seeds its
 * window pattern: fixed when the plan is made, so the pattern holds while
 * the box itself grows (see rise.ts).
 */
export type Tier = { half: number; y0: number; y1: number; windows: boolean; key: number };

export type Lot = {
  /** Order in the data (0 = the first day: Jan 1, or the window's first Sunday). */
  index: number;
  /** Position in `City.lots` (date order). */
  slot: number;
  /** "2026-10-08" */
  date: string;
  count: number;
  /** Week column (0 = the first week) and weekday (0 = Sunday). */
  col: number;
  row: number;
  /** Which band of the folded year the lot stands in (0 = the back one). */
  band: number;
  /** Lot centre in world units. */
  x: number;
  z: number;
  /** Building height (0: an empty lot). It moves while the city rises (rise.ts); `fullHeight` doesn't. */
  height: number;
  fullHeight: number;
  tiers: Tier[];
  /** A small plant box on the roof: offset from the centre and size, or null. */
  roofBox: { dx: number; dz: number; half: number; h: number } | null;
  /** The year's tallest building carries a mast and a night beacon. */
  mast: number;
  /** Stable per-lot noise (window patterns, roof boxes). */
  seed: number;
};

/** A month inside one band: its extent along x and the streets in front of and behind it. */
export type District = {
  /** "Oct": the name set along the boulevard. */
  month: string;
  /** year × 12 + month: tells the two Octobers of a rolling window apart. */
  key: number;
  band: number;
  x0: number;
  x1: number;
  /** z of the open ground just behind the band's first row and in front of its last. */
  zBack: number;
  zFront: number;
};

export type City = {
  /** In date order. */
  lots: Lot[];
  /** Plan extent of the lots' centres (world units). */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  districts: District[];
  bands: number;
  /** Open plinth around the lots (world units): across the weeks and in front of / behind the days. */
  marginX: number;
  marginZ: number;
  tallest: Lot | null;
  /** The tallest building's height (fixed: the lots' own heights move while the city rises). */
  peak: number;
  total: number;
  /** The calendar year, or the year of the last day for a rolling window. */
  year: number;
  /** "year": one calendar year; "last": the rolling window up to today. */
  range: "year" | "last";
  username: string;
  /** "Jan 1" and "Oct 14" ("Oct 19, 2025" for a day before the last day's year): the first and last day drawn. */
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
const yearDayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const longYearDayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

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

/**
 * A day as the city names it: "Oct 8", or "Nov 12, 2025" for a day from
 * before the year of the city's last day (the back of a rolling window), so
 * the two Octobers at either end never read the same. `long`: "Thursday,
 * October 8" (with the year likewise).
 */
export function dateIn(city: City, iso: string, long = false): string {
  const day = dayNumber(iso);
  if (day === null) return iso;
  const date = new Date(day * DAY_MS);
  const withYear = date.getUTCFullYear() !== city.year;
  return (long ? (withYear ? longYearDayLabel : longDayLabel) : withYear ? yearDayLabel : dayLabel).format(date);
}

/** "54 contributions on Oct 8", "No contributions on Jan 1". */
export function describeLot(lot: Lot): string {
  return `${lot.count === 0 ? "No" : lot.count} ${plural(lot.count, "contribution")} on ${shortDate(lot.date)}`;
}

/** How many bands to fold `weeks` columns into: the most compact plan. */
function bandCount(weeks: number): number {
  if (weeks <= 12) return 1;
  if (weeks <= 26) return 2;
  return 3;
}

/**
 * Where each band starts (column numbers): even splits, each moved to the
 * nearest month start within three weeks so a month never straddles two
 * bands.
 */
function bandStarts(lo: number, hi: number, columnMonth: number[], bands: number): number[] {
  const weeks = hi - lo + 1;
  const monthStarts: number[] = [];
  for (let col = lo + 1; col <= hi; col++) if (columnMonth[col] !== columnMonth[col - 1]) monthStarts.push(col);
  const starts = [lo];
  for (let k = 1; k < bands; k++) {
    const ideal = lo + Math.round((k * weeks) / bands);
    let best = ideal;
    let bestDistance = Infinity;
    for (const start of monthStarts) {
      const distance = Math.abs(start - ideal);
      if (distance <= 3 && distance < bestDistance && start > starts[starts.length - 1]) {
        best = start;
        bestDistance = distance;
      }
    }
    starts.push(Math.max(best, starts[starts.length - 1] + 1));
  }
  return starts;
}

export type CityOptions = {
  /** The calendar. Default: data/contributions.json (this calendar year). */
  data?: CityData;
  /**
   * "year" (default): only the days of `data.year`, Jan 1 to Dec 31.
   * "last": every day in the data, as a rolling window (the home page's
   * last 12 months).
   */
  range?: "year" | "last";
  /** Only the last `weeks` weeks (the tile's district). Default: the whole year. */
  weeks?: number;
  /** Fold the weeks into bands (default true). */
  fold?: boolean;
  /** Plinth margins; the stage leaves room in front of the lots for month names. Default [0.85, 1.2]. */
  margin?: readonly [number, number];
};

export function buildCity({ data = yearData, range = "year", weeks, fold = true, margin = [0.85, 1.2] }: CityOptions = {}): City {
  const entries: Array<{ day: number; date: string; count: number }> = [];
  const seen = new Set<number>();
  const yearStart = Math.round(Date.UTC(data.year, 0, 1) / DAY_MS);
  const yearEnd = Math.round(Date.UTC(data.year, 11, 31) / DAY_MS);
  for (const raw of data.days ?? []) {
    const day = dayNumber(raw.date);
    if (day === null || seen.has(day)) continue;
    if (range === "year" && (day < yearStart || day > yearEnd)) continue;
    seen.add(day);
    entries.push({ day, date: raw.date, count: Math.max(0, Math.trunc(Number(raw.count) || 0)) });
  }
  entries.sort((a, b) => a.day - b.day);
  // The days the plan spans: the calendar year, or the window itself.
  const start = range === "year" || !entries.length ? yearStart : entries[0].day;
  const end = range === "year" || !entries.length ? yearEnd : entries[entries.length - 1].day;
  // The year the labels count from: the calendar year, or the year of the window's last day.
  const year = range === "year" || !entries.length ? data.year : new Date(end * DAY_MS).getUTCFullYear();

  const firstWeek = start - new Date(start * DAY_MS).getUTCDay(); // the Sunday on or before the first day
  const columns = entries.length ? Math.floor((entries[entries.length - 1].day - firstWeek) / 7) + 1 : 1;
  const hi = columns - 1;
  const lo = weeks ? Math.max(0, columns - weeks) : 0;

  // A column belongs to the month of its Wednesday (the month holding most
  // of its days), kept inside the span. Months are keyed by year too.
  const columnMonth: number[] = [];
  const columnName: string[] = [];
  for (let col = 0; col < columns; col++) {
    const wednesday = new Date(Math.min(end, Math.max(start, firstWeek + col * 7 + 3)) * DAY_MS);
    columnMonth.push(wednesday.getUTCFullYear() * 12 + wednesday.getUTCMonth());
    columnName.push(monthLabel.format(wednesday));
  }

  const bands = fold ? bandCount(hi - lo + 1) : 1;
  const starts = bandStarts(lo, hi, columnMonth, bands);
  const bandOf = (col: number) => {
    let band = 0;
    while (band + 1 < starts.length && col >= starts[band + 1]) band++;
    return band;
  };
  const bandZ = (band: number) => band * (7 * DAY_PITCH + BOULEVARD);

  // Column → x within its band, with an avenue before each new month.
  const columnX: number[] = [];
  for (let col = lo; col <= hi; col++) {
    const band = bandOf(col);
    if (col === starts[band]) columnX[col] = 0;
    else columnX[col] = columnX[col - 1] + WEEK_PITCH + (columnMonth[col] !== columnMonth[col - 1] ? AVENUE : 0);
  }
  // Bands of different lengths sit centred on the plinth, so the open
  // ground at their ends is shared out instead of pooling in one corner.
  if (bands > 1) {
    const widths = starts.map((first, band) => columnX[band + 1 < starts.length ? starts[band + 1] - 1 : hi] - columnX[first]);
    const widest = Math.max(...widths);
    for (let col = lo; col <= hi; col++) columnX[col] += (widest - widths[bandOf(col)]) / 2;
  }

  const lots: Lot[] = [];
  entries.forEach((entry, index) => {
    const offset = entry.day - firstWeek;
    const col = Math.floor(offset / 7);
    if (col < lo || col > hi) return;
    const row = offset % 7;
    const band = bandOf(col);
    lots.push({
      index,
      slot: lots.length,
      date: entry.date,
      count: entry.count,
      col,
      row,
      band,
      x: columnX[col],
      z: bandZ(band) + row * DAY_PITCH,
      height: heightFor(entry.count),
      fullHeight: heightFor(entry.count),
      tiers: [],
      roofBox: null,
      mast: 0,
      seed: hash2(col, row, 7),
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
        tier(half, 0, h * 0.5, true),
        tier(half * 0.8, h * 0.5, h * 0.82, true),
        tier(half * 0.58, h * 0.82, h, true),
      ];
      lot.mast = Math.max(0.35, h * 0.16);
    } else if (h >= 1.75) {
      // Tall: one setback near the top.
      lot.tiers = [tier(half, 0, h * 0.72, true), tier(half * 0.74, h * 0.72, h, true)];
    } else {
      lot.tiers = [tier(half, 0, h, h >= 0.5)];
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

  // Districts: one per month per band (for the month labels).
  const districts: District[] = [];
  for (let col = lo; col <= hi; col++) {
    const key = columnMonth[col];
    const band = bandOf(col);
    const last = districts[districts.length - 1];
    if (last && last.key === key && last.band === band) last.x1 = columnX[col];
    else {
      const z0 = bandZ(band);
      districts.push({
        month: columnName[col],
        key,
        band,
        x0: columnX[col],
        x1: columnX[col],
        zBack: z0 - LOT / 2 - BOULEVARD * 0.42,
        zFront: z0 + 6 * DAY_PITCH + LOT / 2 + BOULEVARD * 0.42,
      });
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const lot of lots) {
    minX = Math.min(minX, lot.x);
    maxX = Math.max(maxX, lot.x);
  }
  // Every band keeps its full seven rows of ground, even where a week is short.
  for (let band = 0; band < bands; band++) {
    minZ = Math.min(minZ, bandZ(band));
    maxZ = Math.max(maxZ, bandZ(band) + 6 * DAY_PITCH);
  }
  const inRange = lots.length > 0;
  const city: City = {
    lots,
    minX: inRange ? minX : 0,
    maxX: inRange ? maxX : 0,
    minZ: inRange ? minZ : 0,
    maxZ: inRange ? maxZ : 6,
    districts,
    bands,
    marginX: margin[0],
    marginZ: margin[1],
    tallest,
    peak: tallest ? tallest.height : 0,
    // A rolling window counts its own days (that is GitHub's "in the last year").
    total: range === "year" && Number.isFinite(data.total) ? Number(data.total) : entries.reduce((sum, entry) => sum + entry.count, 0),
    year,
    range,
    username: data.username,
    first: "",
    last: "",
  };
  if (lots.length) {
    city.first = dateIn(city, lots[0].date);
    city.last = dateIn(city, lots[lots.length - 1].date);
  }
  return city;
}

/** A building's box; its window pattern is seeded by where it starts (see Tier). */
function tier(half: number, y0: number, y1: number, windows: boolean): Tier {
  return { half, y0, y1, windows, key: y0 * 100 };
}
