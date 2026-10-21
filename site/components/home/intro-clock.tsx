"use client";

// Zakaria's local time for the status line at the top of the home page:
//
//   <LocalClock timeZone={site.status.timeZone} zoneFallback="GMT+1" />  →  18:53 GMT+1
//
// 24-hour clock, the short zone name after it. The time only exists in the
// browser (the server snapshot is null), so the static HTML never carries a
// stale reading and hydration always matches; the slot is sized from the
// first paint by an invisible "00:00 GMT+1", so nothing moves when the
// digits arrive.

import { useSyncExternalStore } from "react";

const TICK_MS = 15_000;

let minute: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

const nowMinute = () => Math.floor(Date.now() / 60_000);

function tick() {
  const next = nowMinute();
  if (next === minute) return;
  minute = next;
  listeners.forEach((listener) => listener());
}

function onVisible() {
  if (document.visibilityState === "visible") tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    tick();
    timer = setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

function getMinute() {
  if (minute === null) minute = nowMinute();
  return minute;
}

const getServerMinute = () => null;

const formatters = new Map<string, Intl.DateTimeFormat | null>();

function formatterFor(timeZone: string) {
  if (!formatters.has(timeZone)) {
    try {
      formatters.set(
        timeZone,
        new Intl.DateTimeFormat("en-GB", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
          timeZoneName: "short",
        }),
      );
    } catch {
      formatters.set(timeZone, null); // unknown zone: no clock
    }
  }
  return formatters.get(timeZone) ?? null;
}

function readClock(atMinute: number, timeZone: string) {
  const format = formatterFor(timeZone);
  if (!format) return null;
  const parts = Object.fromEntries(
    format.formatToParts(new Date(atMinute * 60_000)).map((part) => [part.type, part.value]),
  );
  const time = `${parts.hour}:${parts.minute}`;
  return { time, zone: parts.timeZoneName ?? "" };
}

export function LocalClock({ timeZone, zoneFallback }: { timeZone: string; zoneFallback: string }) {
  const current = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  const clock = current === null ? null : readClock(current, timeZone);
  if (current !== null && !clock) return null;
  const zone = clock ? clock.zone : zoneFallback;

  return (
    <span className="inline-grid tabular-nums">
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        00:00 {zone}
      </span>
      {clock ? (
        <time dateTime={clock.time} className="[grid-area:1/1]">
          <span className="text-primary">{clock.time}</span> {clock.zone}
        </time>
      ) : null}
    </span>
  );
}
