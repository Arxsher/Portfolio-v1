// The city's plan, worked out once from data/contributions.json.
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
/** Extra depth of the boulevard between two bands of the folded year. */
export const BOULEVARD = 1.15;
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
  /** Position in `City.lots` (date order). */
  slot: number;
  /** "2026-10-08" */
  date: string;
  count: number;
  /** Week column (0 = the week of Jan 1) and weekday (0 = Sunday). */
  col: number;
  row: number;
  /** Which band of the folded year the lot stands in (0 = the back one). */
  band: number;
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

/** A month inside one band: its extent along x and the streets in front of and behind it. */
export type District = {
  month: string;
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
function bandStarts(lo: number, hi: number, columnMonth: string[], bands: number): number[] {
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
  /** Only the last `weeks` weeks (the tile's district). Default: the whole year. */
  weeks?: number;
  /** Fold the weeks into bands (default true). */
  fold?: boolean;
  /** Plinth margins; the stage leaves room in front of the lots for month names. Default [0.85, 1.2]. */
  margin?: readonly [number, number];
};

export function buildCity({ weeks, fold = true, margin = [0.85, 1.2] }: CityOptions = {}): City {
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
  const hi = columns - 1;
  const lo = weeks ? Math.max(0, columns - weeks) : 0;

  // A column belongs to the month of its Wednesday (the month holding most
  // of its days), kept inside the year.
  const columnMonth: string[] = [];
  for (let col = 0; col < columns; col++) {
    const wednesday = Math.min(end, Math.max(start, firstWeek + col * 7 + 3));
    columnMonth.push(monthLabel.format(new Date(wednesday * DAY_MS)));
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

  // Districts: one per month per band (for the month labels).
  const districts: District[] = [];
  for (let col = lo; col <= hi; col++) {
    const month = columnMonth[col];
    const band = bandOf(col);
    const last = districts[districts.length - 1];
    if (last && last.month === month && last.band === band) last.x1 = columnX[col];
    else {
      const z0 = bandZ(band);
      districts.push({
        month,
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
  return {
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
    total: data.total ?? lots.reduce((sum, lot) => sum + lot.count, 0),
    year: data.year,
    username: data.username,
    first: lots.length ? shortDate(lots[0].date) : "",
    last: lots.length ? shortDate(lots[lots.length - 1].date) : "",
  };
}
