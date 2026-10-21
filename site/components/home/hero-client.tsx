"use client";

// The interactive bits of the home hero, kept apart so the server-rendered
// Profile and Intro don't ship the content module to the browser:
//
//   <LocalTime timeZone="Africa/Casablanca" zoneFallback="GMT+1" />
//   <CommandButton view="say-hi" className="btn btn-solid">Say hi</CommandButton>

import { useSyncExternalStore, type ReactNode } from "react";
import { openCommand, type CommandView } from "@/lib/command";

/* ---------------------------------------------------------------------- */
/* clock                                                                   */
/* ---------------------------------------------------------------------- */

const TICK_MS = 15_000;

// One shared ticker for every clock on the page. The snapshot is the
// current minute (a number), so React only re-renders when it changes.
let minute: number | null = null;
const clockListeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

const nowMinute = () => Math.floor(Date.now() / 60_000);

function tick() {
  const next = nowMinute();
  if (next === minute) return;
  minute = next;
  clockListeners.forEach((listener) => listener());
}

function onVisible() {
  if (document.visibilityState === "visible") tick();
}

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockListeners.size === 1) {
    tick();
    timer = setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

function getMinute() {
  if (minute === null) minute = nowMinute();
  return minute;
}

// Nothing on the server (and during hydration): the time only appears once
// we are in the browser, so the static HTML never shows a stale clock.
const getServerMinute = () => null;

const formatters = new Map<string, { clock: Intl.DateTimeFormat; iso: Intl.DateTimeFormat } | null>();

function formattersFor(timeZone: string) {
  if (!formatters.has(timeZone)) {
    try {
      formatters.set(timeZone, {
        clock: new Intl.DateTimeFormat("en-US", {
          timeZone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZoneName: "short",
        }),
        iso: new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      });
    } catch {
      formatters.set(timeZone, null); // unknown zone: show no clock at all
    }
  }
  return formatters.get(timeZone) ?? null;
}

/** "8:28am" + "GMT+1" for the given minute in the given zone. */
function readClock(atMinute: number, timeZone: string) {
  const f = formattersFor(timeZone);
  if (!f) return null;
  const date = new Date(atMinute * 60_000);
  const parts = Object.fromEntries(f.clock.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    time: `${parts.hour}:${parts.minute}${(parts.dayPeriod ?? "").toLowerCase()}`,
    zone: parts.timeZoneName ?? "",
    iso: f.iso.format(date),
  };
}

/**
 * "· 8:28am GMT+1" for the status pill. The slot keeps the width of the
 * widest reading ("12:00am") from the first paint, so the pill doesn't
 * grow when the time arrives after hydration; the time then simply
 * appears (no fade), as on the reference.
 */
export function LocalTime({ timeZone, zoneFallback }: { timeZone: string; zoneFallback: string }) {
  const current = useSyncExternalStore(subscribeClock, getMinute, getServerMinute);
  const clock = current === null ? null : readClock(current, timeZone);
  if (current !== null && !clock) return null;
  const zone = clock ? clock.zone : zoneFallback;

  return (
    <>
      <span aria-hidden="true" className="text-tertiary">
        ·
      </span>
      <span className="inline-grid text-tertiary tabular-nums">
        <span aria-hidden="true" className="invisible [grid-area:1/1]">
          12:00am {zone}
        </span>
        {clock ? (
          <time dateTime={clock.iso} className="[grid-area:1/1]">
            {clock.time} {clock.zone}
          </time>
        ) : null}
      </span>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* buttons that open a view of the command bar                             */
/* ---------------------------------------------------------------------- */

export function CommandButton({
  view,
  className,
  children,
}: {
  view: CommandView;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openCommand(view)}>
      {children}
    </button>
  );
}
