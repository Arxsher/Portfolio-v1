"use client";

// A rolling counter. Each column is a strip of digits (0–9 and a second 0,
// so 9 → 0 rolls on without a seam) that a spring pushes toward
// floor(value / 10^k): low columns spin fast and blur a little, high
// columns tick over one notch at a time, and when the count stops the
// strips wind down and settle like a mechanical counter. Leading zeros
// (and their separators) stay faint until the count reaches them.

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { Spring } from "../../hooks";
import type { RunClock } from "./clock";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
/** Line box of one digit, in em. */
const LINE = 1.25;

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
  /** Number of digit columns (leading ones show as faint zeros). */
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
    const springs = Array.from({ length: columns }, () => new Spring(0, { stiffness: 420, damping: 38, precision: 0.002 }));
    let last = -1;
    let read = -1;
    let since = 0;
    let first = true;
    const draw = (dt: number) => {
      const raw = Math.max(0, Math.floor(readRef.current()));
      // The count moves on in ticks (about six a second), so between them
      // the digits come to rest and can be read; once it stops changing
      // the last value lands at once.
      since += dt;
      const settledRead = raw === read;
      read = raw;
      const value = first || raw < last || settledRead || since >= 0.16 ? raw : last;
      if (value !== last) since = 0;
      // A new run (the count went back down) starts the counter from where it is, no rewinding.
      const snap = first || reducedMotion || value < last;
      first = false;
      last = value;
      let busy = false;
      for (let k = 0; k < columns; k++) {
        const spring = springs[k];
        const target = Math.floor(value / Math.pow(10, k));
        if (snap) spring.set(target);
        else {
          // Never more than one turn of the strip per tick: whole turns are skipped (they look the same).
          const ahead = target - spring.value;
          if (ahead > 10) spring.value += Math.floor((ahead - 1) / 10) * 10;
          spring.to(target);
        }
        const position = spring.step(dt);
        if (!spring.settled) busy = true;
        const offset = ((position % 10) + 10) % 10;
        const strip = stripRefs.current[k];
        if (strip) {
          strip.style.transform = `translate3d(0, ${(-offset * LINE).toFixed(4)}em, 0)`;
          const speed = Math.abs(spring.velocity);
          const blur = reducedMotion ? 0 : Math.min(1.1, Math.max(0, (speed - 6) / 40));
          strip.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
        }
        const lead = k > 0 && value < Math.pow(10, k);
        const col = colRefs.current[k];
        if (col && col.hasAttribute("data-lead") !== lead) col.toggleAttribute("data-lead", lead);
        const sep = sepRefs.current[k];
        if (sep && sep.hasAttribute("data-lead") !== lead) sep.toggleAttribute("data-lead", lead);
      }
      return busy;
    };
    draw(0);
    return clock.subscribe((dt) => draw(dt));
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
              {DIGITS.map((digit, index) => (
                <span key={index}>{digit}</span>
              ))}
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
