"use client";

// Counters that are written straight into the DOM by a clock subscriber, so
// they move every frame without re-rendering React.
//
// Odometer: each column is a strip of digits that rolls forward to its
// digit. The count only moves on in ticks (about two and a half a second),
// and a roll always takes less time than a tick, so between ticks every
// column has come to rest and the number can be read. While a strip is
// moving fast it dims and softens, so a spinning column reads as motion
// rather than as torn glyphs; the fade at the top and bottom of each column
// does the rest. Leading columns are kept (the number stays right-aligned
// and never shifts) but are invisible until the count reaches them.
//
// Count: the tile's version, too small for rolling digits: a formatted
// number that cross-fades to the new value a couple of times a second.

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { RunClock } from "./clock";
import { formatTokens } from "./script";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
/** Line box of one digit, in em (the digit sits between 23% and 77% of it). */
const LINE = 1.4;
/** Seconds between two values while the count runs. */
const TICK = 0.45;
/** Seconds a column takes to roll to its digit (it is within a hair of it well before). */
const ROLL = 0.24;
/** Snap when this close to a whole digit. */
const SNAP = 0.02;

const POW10 = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000];
/** A strip lands like a wheel that was flicked: quick, then a soft stop. */
const roll = (u: number) => 1 - Math.pow(1 - u, 5);

type Column = {
  /** Where the strip is (in digits, counting whole turns). */
  pos: number;
  from: number;
  to: number;
  /** Seconds into the current roll. */
  time: number;
  /** Last written transform / style, to touch the DOM only on change. */
  shown: number;
  dim: number;
  lead: boolean;
};

export function Odometer({
  clock,
  read,
  columns,
  reducedMotion,
  className,
}: {
  clock: RunClock;
  /** The value right now (called every frame). */
  read: () => number;
  /** Number of digit columns (leading ones stay invisible until reached). */
  columns: number;
  reducedMotion: boolean;
  className?: string;
}) {
  const stripRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const colRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sepRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });

  useEffect(() => {
    const cols: Column[] = Array.from({ length: columns }, () => ({ pos: 0, from: 0, to: 0, time: ROLL, shown: NaN, dim: NaN, lead: false }));
    let value = -1;
    let previousRaw = -1;
    let since = TICK;

    const retarget = (next: number, snap: boolean) => {
      for (let k = 0; k < columns; k++) {
        const col = cols[k];
        const digit = Math.floor(next / POW10[k]) % 10;
        if (snap) {
          col.pos = col.from = col.to = digit;
          col.time = ROLL;
          continue;
        }
        const resting = ((Math.round(col.to) % 10) + 10) % 10;
        if (digit === resting) continue;
        // Always forward: a counter only ever counts up.
        col.from = col.pos;
        col.to = Math.round(col.to) + ((digit - resting + 10) % 10);
        col.time = 0;
      }
    };

    const draw = (dt: number) => {
      const raw = Math.max(0, Math.floor(readRef.current()));
      since += dt;
      if (value < 0 || raw < value || reducedMotion) {
        // First frame, a new run (the count went back down), or no motion: land at once.
        if (raw !== value) retarget(raw, true);
        value = raw;
        since = 0;
      } else if (raw !== value) {
        // Move on once per tick; when the count has paused, land the last value as soon as the roll allows.
        const paused = raw === previousRaw;
        if (since >= TICK || (paused && since >= ROLL)) {
          retarget(raw, false);
          value = raw;
          since = 0;
        }
      }
      previousRaw = raw;

      let busy = value !== raw;
      for (let k = 0; k < columns; k++) {
        const col = cols[k];
        let speed = 0;
        if (col.time < ROLL) {
          col.time = Math.min(ROLL, col.time + dt);
          const u = col.time / ROLL;
          const span = col.to - col.from;
          col.pos = col.from + span * roll(u);
          speed = Math.abs((span * 5 * Math.pow(1 - u, 4)) / ROLL);
          if (Math.abs(col.to - col.pos) < SNAP) {
            col.pos = col.to;
            col.time = ROLL;
            speed = 0;
          } else busy = true;
        }
        const offset = Math.round((((col.pos % 10) + 10) % 10) * 1000) / 1000;
        const strip = stripRefs.current[k];
        if (strip && offset !== col.shown) {
          col.shown = offset;
          // Past 9 the strip shows the 0 that follows it (the 11th cell), so it never jumps.
          strip.style.transform = `translate3d(0, ${(-offset * LINE).toFixed(4)}em, 0)`;
        }
        // Fast strips dim and soften; resting ones are crisp.
        const dim = reducedMotion ? 0 : Math.round(Math.min(1, Math.max(0, (speed - 2) / 22)) * 20) / 20;
        if (strip && dim !== col.dim) {
          col.dim = dim;
          strip.style.opacity = dim ? String(1 - 0.62 * dim) : "";
          strip.style.filter = dim > 0.15 ? `blur(${(dim * 1.1).toFixed(2)}px)` : "";
        }
        const lead = k > 0 && value < POW10[k];
        if (lead !== col.lead) {
          col.lead = lead;
          colRefs.current[k]?.toggleAttribute("data-lead", lead);
          sepRefs.current[k]?.toggleAttribute("data-lead", lead);
        }
      }
      return busy;
    };
    draw(0);
    return clock.subscribe(draw);
  }, [clock, columns, reducedMotion]);

  // Columns from the most significant down.
  const order = Array.from({ length: columns }, (_, index) => columns - 1 - index);
  return (
    <span aria-hidden="true" className={cn("ar-odo ar-mono inline-flex items-baseline", className)}>
      {order.map((k) => (
        <span key={k} className="contents">
          <span
            ref={(node) => {
              colRefs.current[k] = node;
            }}
            className="ar-odo-col"
          >
            {/* sizer keeps the column one digit wide and on the baseline */}
            <span className="invisible">0</span>
            <span
              ref={(node) => {
                stripRefs.current[k] = node;
              }}
              className="ar-odo-strip"
            >
              {DIGITS.map((digit) => (
                <span key={digit}>{digit}</span>
              ))}
              <span>0</span>
            </span>
          </span>
          {k > 0 && k % 3 === 0 ? (
            <span
              ref={(node) => {
                sepRefs.current[k] = node;
              }}
              className="ar-odo-sep"
            >
              ,
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

/**
 * The tile's token count: "8,640", cross-fading (old value up and out, new
 * one up from below) to the latest value every `every` seconds.
 */
export function Count({
  clock,
  read,
  every = 0.5,
  reducedMotion,
  className,
}: {
  clock: RunClock;
  read: () => number;
  every?: number;
  reducedMotion: boolean;
  className?: string;
}) {
  const aRef = useRef<HTMLSpanElement>(null);
  const bRef = useRef<HTMLSpanElement>(null);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });

  useEffect(() => {
    let shown = -1;
    let since = every;
    let front = 0;
    const layers = [aRef.current, bRef.current];
    const draw = (dt: number) => {
      const value = Math.max(0, Math.round(readRef.current()));
      since += dt;
      if (value === shown) return false;
      const reset = shown < 0 || value < shown;
      if (!reset && since < every) return true;
      since = 0;
      shown = value;
      const text = formatTokens(value);
      const incoming = layers[1 - front];
      const outgoing = layers[front];
      if (!incoming || !outgoing) return false;
      incoming.textContent = text;
      const animated = !reset && !reducedMotion && typeof incoming.animate === "function";
      for (const layer of layers) layer?.getAnimations?.().forEach((animation) => animation.cancel());
      incoming.style.opacity = "1";
      outgoing.style.opacity = "0";
      if (animated) {
        const timing = { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };
        incoming.animate([{ opacity: 0, transform: "translateY(45%)" }, { opacity: 1, transform: "none" }], timing);
        outgoing.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-45%)" }], timing);
      }
      front = 1 - front;
      return false;
    };
    draw(0);
    return clock.subscribe(draw);
  }, [clock, every, reducedMotion]);

  return (
    <span aria-hidden="true" className={cn("ar-mono inline-grid overflow-hidden", className)}>
      <span ref={aRef} className="col-start-1 row-start-1 text-end" />
      <span ref={bRef} className="col-start-1 row-start-1 text-end" style={{ opacity: 0 }} />
    </span>
  );
}

/** A seconds readout ("12.4s") written straight into the DOM every frame. */
export function Timer({
  clock,
  read,
  className,
}: {
  clock: RunClock;
  read: () => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const readRef = useRef(read);
  useEffect(() => {
    readRef.current = read;
  });
  useEffect(() => {
    const draw = () => {
      const node = ref.current;
      if (!node) return;
      const text = readRef.current();
      if (node.textContent !== text) node.textContent = text;
    };
    draw();
    return clock.subscribe(() => {
      draw();
    });
  }, [clock]);
  return <span ref={ref} aria-hidden="true" className={cn("ar-mono", className)} />;
}
