// The tree, from data/contributions.json: this calendar year's real GitHub
// contributions grown as the rings of a trunk.
//
// - Each week (Sunday to Saturday, as on GitHub's graph) is one growth
//   ring, the first week of January at the pith and this week at the bark.
// - Each ring goes once round the trunk: Sunday at the far side (twelve
//   o'clock seen from the front), then clockwise seen from above, so every
//   day owns a seventh of the ring (its sector) and its centre angle.
// - A day's count sets how wide its ring grows there (a little for a day
//   without contributions, more with the square root of the count, so one
//   huge day doesn't drown the rest) and how dark its latewood is. Between
//   two days' centres the width eases from one to the other, so rings are
//   smooth closed curves; wide days push every later ring outward there,
//   the way a tree grows eccentric.
// - Days that don't exist yet (after today) or fall before January 1 grow
//   no wood, so this week's ring is still a crescent, and so was the first.
//
// Everything is normalised so the finished trunk, bark included, has a
// radius of at most 1. Two tables feed the GPU:
//   bounds  (n + 1) × TH: ring boundary radii by angle (B_k(θ), k = 0 is the pith)
//   field   FR × TH: the "ring coordinate" c at (θ, r): k + how far through ring k
// plus the per-day darkness (`level`, n × 7). picking() and the shader read
// the same numbers through the same small warp, so what you point at is what
// is drawn.

import contributionsJson from "@/data/contributions.json";

type RawData = {
  username: string;
  year: number;
  total: number;
  updatedAt?: string;
  days: ReadonlyArray<{ date: string; count: number }>;
};

export const TAU = Math.PI * 2;
/** One day's share of a ring. */
export const SECTOR = TAU / 7;
/** Angular samples of the tables (and twice the mesh's segments). */
export const TH = 512;
/** Radial samples of the field table. */
export const FR = 1024;
/** Mesh segments round the trunk. */
export const SEG = 256;

/** Ring width for a day without contributions, and per √count (in the same units). */
const BASE = 1;
const GAIN = 0.62;
/** The pith's radius, in the same units. */
const PITH = 1.7;
/** Bark width at full size (normalised radius). */
export const BARK = 0.048;
/** Thickness of the slice (normalised). */
export const THICKNESS = 0.16;

const DAY_MS = 86_400_000;

export type Day = {
  /** "2026-10-08" */
  date: string;
  count: number;
  /** Ring (week) index, 0 at the pith. */
  week: number;
  /** 0 Sunday … 6 Saturday. */
  weekday: number;
  /** Index in `days`. */
  index: number;
  /** 0..1 darkness of its latewood. */
  level: number;
};

export type Week = {
  index: number;
  days: Array<Day | null>;
  total: number;
  /** UTC day number of the week's Sunday. */
  sunday: number;
};

export type Rings = {
  username: string;
  year: number;
  total: number;
  days: Day[];
  weeks: Week[];
  /** Number of rings (weeks). */
  n: number;
  bounds: Float32Array;
  field: Float32Array;
  /** n × 7 latewood darkness (0..1); 0 for days that don't exist. */
  level: Float32Array;
  /** Outer wood radius at each of TH angles when fully grown (= bounds row n). */
  maxCount: number;
  busiest: Day | null;
  activeDays: number;
  /** The normalised radius one BASE unit came to (a quiet day's ring). */
  unit: number;
  first: Day;
  last: Day;
};

/* ---------------------------------------------------------------------- */
/* dates                                                                   */
/* ---------------------------------------------------------------------- */

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / DAY_MS);
}

const fmtShort = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const fmtLong = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
const fmtMonthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "Thu, Oct 8" */
export function shortDate(iso: string): string {
  return fmtShort.format(new Date(dayNumber(iso) * DAY_MS));
}
/** "Thursday, October 8" */
export function longDate(iso: string): string {
  return fmtLong.format(new Date(dayNumber(iso) * DAY_MS));
}
/** "Oct 4" for a UTC day number. */
export function monthDay(day: number): string {
  return fmtMonthDay.format(new Date(day * DAY_MS));
}

export const plural = (count: number, word: string) => (count === 1 ? word : `${word}s`);

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** "56 contributions on Thu, Oct 8" / "No contributions on Sun, Mar 1" */
export function describeDay(day: Day): string {
  return `${day.count === 0 ? "No" : day.count} ${plural(day.count, "contribution")} on ${shortDate(day.date)}`;
}

/* ---------------------------------------------------------------------- */
/* the warp: small natural irregularity, shared with the shader            */
/* ---------------------------------------------------------------------- */

/**
 * Rings in real wood wander a little. The radius a point is looked up at
 * is nudged by a few sines (well under a quiet ring's width, monotonic in
 * r so rings never cross). Mirrored exactly in shaders.ts (WARP_GLSL).
 */
export function warp(theta: number, r: number): number {
  const a = Math.sin(3 * theta + 1.3 + 9 * r) * 0.6 + Math.sin(5 * theta + 4.1 - 13 * r) * 0.4;
  const b = Math.sin(11 * theta + 23 * r + 0.7);
  return r * (1 + 0.0075 * a + 0.0028 * b);
}

/* ---------------------------------------------------------------------- */
/* building                                                                */
/* ---------------------------------------------------------------------- */

/** Ease between two days' values from one centre to the next (C1, flat at the centres). */
function ease(u: number) {
  return u * u * (3 - 2 * u);
}

/**
 * Value of a ring's per-day table at angle θ: each day's own value at its
 * centre angle, eased in between. `row` is 7 numbers.
 */
export function aroundRing(row: ArrayLike<number>, offset: number, theta: number): number {
  let s = theta / SECTOR;
  s -= Math.floor(s / 7) * 7;
  const d0 = Math.floor(s) % 7;
  const d1 = (d0 + 1) % 7;
  const u = ease(s - Math.floor(s));
  return row[offset + d0] + (row[offset + d1] - row[offset + d0]) * u;
}

export function buildRings(raw: RawData = contributionsJson as RawData): Rings {
  const year = raw.year;
  const source = raw.days
    .filter((d) => d.date.startsWith(`${year}-`))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const firstNumber = dayNumber(source[0]?.date ?? `${year}-01-01`);
  const offset = new Date(firstNumber * DAY_MS).getUTCDay();

  const days: Day[] = [];
  const weeks: Week[] = [];
  let maxCount = 0;
  let busiest: Day | null = null;
  let activeDays = 0;
  let total = 0;
  for (const entry of source) {
    const slot = dayNumber(entry.date) - firstNumber + offset;
    const week = Math.floor(slot / 7);
    const weekday = slot - week * 7;
    const count = Math.max(0, Math.round(entry.count));
    const day: Day = { date: entry.date, count, week, weekday, index: days.length, level: 0 };
    days.push(day);
    while (weeks.length <= week) {
      weeks.push({ index: weeks.length, days: [null, null, null, null, null, null, null], total: 0, sunday: firstNumber - offset + weeks.length * 7 });
    }
    weeks[week].days[weekday] = day;
    weeks[week].total += count;
    total += count;
    if (count > 0) activeDays++;
    if (count > maxCount) {
      maxCount = count;
      busiest = day;
    }
  }
  const n = weeks.length;

  // per-day widths (raw units) and darkness
  const widths = new Float32Array(Math.max(1, n) * 7);
  const level = new Float32Array(Math.max(1, n) * 7);
  for (const day of days) {
    widths[day.week * 7 + day.weekday] = BASE + GAIN * Math.sqrt(day.count);
    // 1 → 0.15, 5 → 0.56, 15 → 0.92, 56 → 1
    day.level = day.count > 0 ? 1 - Math.exp(-day.count / 6.2) : 0;
    level[day.week * 7 + day.weekday] = day.level;
  }

  // boundary radii by angle, raw units
  const bounds = new Float32Array((n + 1) * TH);
  let outerMax = PITH;
  for (let i = 0; i < TH; i++) {
    const theta = (i / TH) * TAU;
    let r = PITH;
    bounds[i] = r;
    for (let k = 0; k < n; k++) {
      r += aroundRing(widths, k * 7, theta);
      bounds[(k + 1) * TH + i] = r;
    }
    if (r > outerMax) outerMax = r;
  }
  // normalise: the widest point of the finished wood sits a bark's width inside 1
  const scale = (1 - BARK) / outerMax;
  for (let i = 0; i < bounds.length; i++) bounds[i] *= scale;
  const unit = BASE * scale;

  // the ring coordinate at (θ, r) for r in (0, 1): row j, column i
  const field = new Float32Array(FR * TH);
  for (let i = 0; i < TH; i++) {
    let k = 0;
    for (let j = 0; j < FR; j++) {
      const r = (j + 0.5) / FR;
      const b0 = bounds[i];
      let c: number;
      if (r < b0) {
        c = r / b0 - 1;
      } else {
        while (k < n && bounds[(k + 1) * TH + i] <= r) k++;
        if (k >= n) {
          c = n + (r - bounds[n * TH + i]) / unit;
        } else {
          const lo = bounds[k * TH + i];
          const hi = bounds[(k + 1) * TH + i];
          c = k + (r - lo) / Math.max(1e-6, hi - lo);
        }
      }
      field[j * TH + i] = c;
    }
  }

  const first = days[0] ?? { date: `${year}-01-01`, count: 0, week: 0, weekday: 0, index: 0, level: 0 };
  const last = days[days.length - 1] ?? first;
  return {
    username: raw.username,
    year,
    total,
    days,
    weeks,
    n,
    bounds,
    field,
    level,
    maxCount,
    busiest,
    activeDays,
    unit,
    first,
    last,
  };
}

/* ---------------------------------------------------------------------- */
/* reading the tree                                                        */
/* ---------------------------------------------------------------------- */

/** B_k(θ) with k fractional (the ring being grown), linear in θ between samples. */
export function boundAt(rings: Rings, k: number, theta: number): number {
  const n = rings.n;
  const kk = Math.max(0, Math.min(n, k));
  const k0 = Math.floor(kk);
  const k1 = Math.min(n, k0 + 1);
  const fk = kk - k0;
  let x = (theta / TAU) * TH;
  x -= Math.floor(x / TH) * TH;
  const i0 = Math.floor(x) % TH;
  const i1 = (i0 + 1) % TH;
  const fx = x - Math.floor(x);
  const b = rings.bounds;
  const a0 = b[k0 * TH + i0] + (b[k0 * TH + i1] - b[k0 * TH + i0]) * fx;
  const a1 = b[k1 * TH + i0] + (b[k1 * TH + i1] - b[k1 * TH + i0]) * fx;
  return a0 + (a1 - a0) * fk;
}

/**
 * The ring coordinate where a point of the face is (after the warp), exact
 * (a search through the boundaries rather than the sampled field).
 */
export function ringCoordinate(rings: Rings, theta: number, r: number): number {
  const rw = warp(theta, r);
  const n = rings.n;
  const b0 = boundAt(rings, 0, theta);
  if (rw < b0) return rw / b0 - 1;
  let lo = 0;
  let hi = n;
  if (rw >= boundAt(rings, n, theta)) return n + (rw - boundAt(rings, n, theta)) / rings.unit;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (boundAt(rings, mid, theta) <= rw) lo = mid;
    else hi = mid;
  }
  const a = boundAt(rings, lo, theta);
  const b = boundAt(rings, lo + 1, theta);
  return lo + (rw - a) / Math.max(1e-6, b - a);
}

/** θ (0..τ, clockwise from the far side seen from above) of a point on the face. */
export function angleOf(x: number, z: number): number {
  const a = Math.atan2(x, -z);
  return a < 0 ? a + TAU : a;
}

/**
 * The day under a point of the face (object space x, z), or null off the
 * wood. `grown` is how many rings exist right now (fractional while growing).
 */
export function dayAt(rings: Rings, x: number, z: number, grown: number): Day | null {
  const r = Math.hypot(x, z);
  const theta = angleOf(x, z);
  const c = ringCoordinate(rings, theta, r);
  if (c < 0 || c >= Math.min(grown, rings.n)) return null;
  const week = rings.weeks[Math.floor(c)];
  if (!week) return null;
  const s = theta / SECTOR;
  let best: Day | null = null;
  let bestDistance = Infinity;
  for (let d = 0; d < 7; d++) {
    const day = week.days[d];
    if (!day) continue;
    let delta = Math.abs(s - d);
    delta = Math.min(delta, 7 - delta);
    if (delta < bestDistance) {
      bestDistance = delta;
      best = day;
    }
  }
  return best;
}

/** The radius that the warp sends to `target` at θ (its inverse, a few fixed-point steps). */
export function unwarp(theta: number, target: number): number {
  let r = target;
  for (let i = 0; i < 5; i++) r *= target / Math.max(1e-6, warp(theta, r));
  return r;
}

/** Where a day's segment sits on the face (as drawn, warp included): its centre angle and mid radius. */
export function dayCentre(rings: Rings, day: Day, out: { x: number; z: number; r: number; theta: number }) {
  const theta = day.weekday * SECTOR;
  const inner = boundAt(rings, day.week, theta);
  const outer = boundAt(rings, day.week + 1, theta);
  const r = unwarp(theta, (inner + outer) / 2);
  out.theta = theta;
  out.r = r;
  out.x = Math.sin(theta) * r;
  out.z = -Math.cos(theta) * r;
  return out;
}

/** The week a day belongs to, read as "week of Oct 4". */
export function weekLabel(rings: Rings, week: number): string {
  const w = rings.weeks[week];
  if (!w) return "";
  return `week of ${monthDay(w.sunday)}`;
}

/** Days in order, for keyboard walking. */
export function stepDay(rings: Rings, day: Day | null, by: number): Day | null {
  if (!rings.days.length) return null;
  if (!day) return by >= 0 ? rings.days[rings.days.length - 1] : rings.days[0];
  const next = Math.max(0, Math.min(rings.days.length - 1, day.index + by));
  return rings.days[next];
}

/** The same weekday a ring further out (by > 0) or in, or the nearest day that exists. */
export function stepWeek(rings: Rings, day: Day | null, by: number): Day | null {
  if (!day) return stepDay(rings, null, by);
  const target = day.week + by;
  if (target < 0 || target >= rings.n) return day;
  const week = rings.weeks[target];
  const same = week.days[day.weekday];
  if (same) return same;
  let best: Day | null = null;
  let bestDistance = Infinity;
  for (const candidate of week.days) {
    if (!candidate) continue;
    const distance = Math.abs(candidate.weekday - day.weekday);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best ?? day;
}
