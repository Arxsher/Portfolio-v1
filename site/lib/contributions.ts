// Live GitHub contributions: the last 12 months, counted the way the GitHub
// profile counts them ("602 contributions in the last year").
//
// The static export ships data/contributions-last.json (written by
// scripts/fetch-contributions.mjs before every build), so the page renders
// real numbers before any script runs. In the browser, useLiveContributions
// then asks the public contributions API for the current window (CORS is
// open) and swaps it in, so the numbers stay current without a rebuild:
//
//   1. On mount, before paint: a copy fetched in this tab within the hour
//      (sessionStorage) is used at once, and nothing is fetched.
//   2. Otherwise, once the browser is idle, one request (8 s timeout,
//      aborted on unmount). A good answer is cached for the hour and
//      replaces what is on screen when it differs; anything else (offline,
//      blocked, rate-limited, malformed, older than the build's own copy)
//      quietly keeps what is there.
//
// Only real data: days and counts come from GitHub; the total is the sum of
// the days shown, as GitHub's own is.

import { useEffect, useLayoutEffect, useState } from "react";
import lastJson from "@/data/contributions-last.json";

export type ContributionDay = { date: string; count: number; level: number };

export type Contributions = {
  username: string;
  /** The calendar year, or (for the last 12 months) the year of the last day. */
  year: number;
  /** "last": the rolling window the GitHub profile shows; absent: one calendar year. */
  range?: string;
  total: number;
  /** "2026-10-21": when the data was taken. */
  updatedAt?: string;
  days: ContributionDay[];
};

/** Where the data on screen came from. */
export type ContributionsSource = "build" | "cache" | "live";

/** The build's own copy of the last 12 months. */
export const lastYearFallback = lastJson as Contributions;

const API = "https://github-contributions-api.jogruber.de/v4/";
/** How long a fetched copy is good for (per tab). */
const TTL = 60 * 60 * 1000;
const TIMEOUT = 8000;
const cacheKey = (username: string) => `arsher:contributions:last:v1:${username.toLowerCase()}`;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Today's date as it can be anywhere right now (GitHub's calendar runs ahead of some time zones). */
function latestToday(): string {
  const now = new Date();
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const utc = isoDay(now);
  return local > utc ? local : utc;
}

/** Clean days: valid dates, whole non-negative counts, in order, one per date, none after today. */
function cleanDays(raw: unknown): ContributionDay[] | null {
  if (!Array.isArray(raw)) return null;
  const today = latestToday();
  const byDate = new Map<string, ContributionDay>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { date, count, level } = entry as Record<string, unknown>;
    if (typeof date !== "string" || !ISO.test(date) || date > today) continue;
    const n = Math.max(0, Math.trunc(Number(count) || 0));
    const l = Math.min(4, Math.max(0, Math.trunc(Number(level) || 0)));
    byDate.set(date, { date, count: n, level: l });
  }
  const days = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  // A real window is 52 to 53 weeks long; anything much shorter is not one.
  return days.length >= 300 ? days : null;
}

function fromDays(username: string, days: ContributionDay[], updatedAt: string): Contributions {
  return {
    username,
    year: Number(days[days.length - 1].date.slice(0, 4)),
    range: "last",
    total: days.reduce((sum, day) => sum + day.count, 0),
    updatedAt,
    days,
  };
}

const lastDate = (data: Contributions) => data.days[data.days.length - 1]?.date ?? "";

/** Same days and counts? */
function sameDays(a: Contributions, b: Contributions): boolean {
  if (a.days.length !== b.days.length || a.total !== b.total) return false;
  for (let i = 0; i < a.days.length; i++) if (a.days[i].date !== b.days[i].date || a.days[i].count !== b.days[i].count) return false;
  return true;
}

type Cached = { at: number; data: Contributions };

function readCache(username: string): Cached | null {
  try {
    const text = window.sessionStorage.getItem(cacheKey(username));
    if (!text) return null;
    const parsed = JSON.parse(text) as { at?: unknown; data?: { days?: unknown; updatedAt?: unknown } };
    const at = Number(parsed.at);
    const days = cleanDays(parsed.data?.days);
    if (!Number.isFinite(at) || !days) return null;
    return { at, data: fromDays(username, days, typeof parsed.data?.updatedAt === "string" ? parsed.data.updatedAt : isoDay(new Date(at))) };
  } catch {
    return null;
  }
}

function writeCache(username: string, data: Contributions) {
  try {
    window.sessionStorage.setItem(cacheKey(username), JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Storage full or blocked: the next visit simply asks again.
  }
}

/** The last 12 months from the API (rejects on any failure). */
export async function fetchLastYear(username: string, signal: AbortSignal): Promise<Contributions> {
  const response = await fetch(`${API}${encodeURIComponent(username)}?y=last`, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = (await response.json()) as { contributions?: unknown };
  const days = cleanDays(json?.contributions);
  if (!days) throw new Error("unexpected response");
  return fromDays(username, days, isoDay(new Date()));
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The last 12 months: the build's copy first (so the server render and
 * hydration match), then this tab's cached copy or a fresh one from GitHub.
 * `data` only changes identity when the days themselves change.
 */
export function useLiveContributions(fallback: Contributions = lastYearFallback): { data: Contributions; source: ContributionsSource } {
  const [state, setState] = useState<{ data: Contributions; source: ContributionsSource }>({ data: fallback, source: "build" });

  useIsoLayoutEffect(() => {
    const { username } = fallback;
    let shown = fallback;
    const show = (data: Contributions, source: ContributionsSource) => {
      // Never step back to an older window than the one on screen.
      if (lastDate(data) < lastDate(shown)) return;
      if (sameDays(data, shown)) return;
      shown = data;
      setState({ data, source });
    };

    const cached = readCache(username);
    if (cached) {
      show(cached.data, "cache");
      if (Date.now() - cached.at < TTL && lastDate(cached.data) >= lastDate(fallback)) return;
    }

    const controller = new AbortController();
    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => controller.abort(), TIMEOUT);
      fetchLastYear(username, controller.signal)
        .then((live) => {
          if (controller.signal.aborted) return;
          writeCache(username, live);
          show(live, "live");
        })
        .catch(() => {
          // Keep what is on screen: the build's copy, or the cached one.
        })
        .finally(() => window.clearTimeout(timer));
    };
    // Not every browser has requestIdleCallback (Safari).
    const idle = "requestIdleCallback" in window;
    const handle = idle ? window.requestIdleCallback(start, { timeout: 2000 }) : window.setTimeout(start, 400);
    return () => {
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fallback]);

  return state;
}
