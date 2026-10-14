// Casablanca's clock: one shared one-second tick and the local time, date
// and part of day in site.status.timeZone.
//
//   const time = casaTime(useNow());   // null on the server and while hydrating
//   time?.hh, time?.mm, time?.zone ("GMT+1"), time?.date ("14 OCT 2026"), time?.part ("evening")
//
// useNow() returns 0 until the component has mounted, so server and client
// markup match; render a placeholder ("--:--") for that first pass. The
// ready-made inline clock is <LocalTime /> in components/local-time.tsx.
//
// Where the time shows (DESIGN.md): the hero's arch caption and the
// postcard's postmark. Nowhere else.

import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

export const TIME_ZONE: string = site.status.timeZone;

const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (timer === undefined) {
    // One interval for every clock on the page.
    timer = window.setInterval(() => listeners.forEach((listener) => listener()), 1000);
  }
  return () => {
    listeners.delete(onChange);
    if (!listeners.size && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

const now = () => Math.floor(Date.now() / 1000);
const never = () => 0;

/** Seconds since the epoch, ticking once a second; 0 on the server and while hydrating. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, now, never);
}

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const zoneFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "shortOffset" });
const dayFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" });

export type PartOfDay = "night" | "morning" | "afternoon" | "evening";

export type CasaTime = {
  hh: string;
  mm: string;
  /** Short offset, e.g. "GMT+1". */
  zone: string;
  /** "14 OCT 2026" (for the postmark). */
  date: string;
  /** Hour 0..23 in Casablanca. */
  hour: number;
  part: PartOfDay;
};

export function partOfDay(hour: number): PartOfDay {
  return hour < 5 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
}

/** The time in Casablanca for a useNow() value; null for 0 (not mounted yet). */
export function casaTime(seconds: number): CasaTime | null {
  if (!seconds) return null;
  const date = new Date(seconds * 1000);
  const [hh, mm] = timeFormat.format(date).split(":");
  const zone = zoneFormat.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "";
  const hour = Number(hourFormat.format(date)) % 24;
  return { hh, mm, zone, date: dayFormat.format(date).toUpperCase(), hour, part: partOfDay(hour) };
}
