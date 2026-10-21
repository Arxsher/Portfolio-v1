"use client";

// The note that leans out of a window: one floating card for the whole
// house that glides from window to window instead of a tooltip per window.
//
// Motion
// - Position (x, y), height and the leader's foot run on springs with the
//   same stiffness and damping (420 / 40, just under critical), so while
//   the card morphs to a taller or shorter note its bottom edge stays on
//   the window it points at. Moving to another window retargets the
//   springs from wherever they are, with their velocity: sweep across the
//   facade and the card follows like it is on a rail, no jumps.
// - Presence (show / hide) is its own spring with a little overshoot
//   (520 / 30): it pops up from the window, scaled from the leader's foot,
//   and sinks back when you leave. A card that is already out never hides
//   between windows; a hidden one appears in place, it doesn't fly in.
// - The content crossfades with a short blur (keyed by window), and the
//   signature writes itself in each time.
// - One rAF loop, stepped with real dt, asleep as soon as everything has
//   settled. Reduced motion: no springs, it just appears where it belongs.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { clamp, Spring, useFrame } from "@/components/lab/hooks";

const GAP = 12;
const POS = { stiffness: 420, damping: 40, precision: 0.05 };
const POP = { stiffness: 520, damping: 30, precision: 0.002 };

export type CardFace = {
  /** Changes when the card shows something else (drives the crossfade). */
  key: string;
  /** px, or "auto" to fit the content (short callouts). */
  width: number | "auto";
  node: ReactNode;
};

export function NoteCard({
  wrapRef,
  anchor,
  face,
  active,
  reducedMotion,
}: {
  /** The positioned element the card is placed in. */
  wrapRef: RefObject<HTMLElement | null>;
  /** The window to point at; null hides the card. */
  anchor: HTMLElement | null;
  face: CardFace | null;
  /** False offscreen: the loop sleeps. */
  active: boolean;
  reducedMotion: boolean;
}) {
  const card = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const leader = useRef<HTMLSpanElement>(null);
  const [springs] = useState(() => ({
    x: new Spring(0, POS),
    y: new Spring(0, POS),
    h: new Spring(0, POS),
    tail: new Spring(0, POS),
    p: new Spring(0, POP),
  }));
  const placement = useRef({ above: true, width: 0 });
  // The last face stays rendered while the card sinks away.
  const [shown, setShown] = useState<CardFace | null>(face);
  if (face && face !== shown) setShown(face);

  const apply = () => {
    const el = card.current;
    if (!el) return;
    const { x, y, h, tail, p } = springs;
    const presence = clamp(p.value, 0, 1.15);
    const { above } = placement.current;
    const lift = (1 - Math.min(1, presence)) * 8 * (above ? 1 : -1);
    el.style.transform = `translate3d(${x.value.toFixed(2)}px, ${(y.value + lift).toFixed(2)}px, 0) scale(${(0.94 + 0.06 * presence).toFixed(4)})`;
    el.style.transformOrigin = `${tail.value.toFixed(1)}px ${above ? "100%" : "0%"}`;
    el.style.opacity = String(clamp(presence));
    el.style.visibility = presence < 0.01 && p.target === 0 ? "hidden" : "visible";
    if (shell.current) shell.current.style.height = `${Math.max(0, h.value).toFixed(2)}px`;
    if (leader.current) {
      leader.current.style.left = `${tail.value.toFixed(2)}px`;
      leader.current.dataset.side = above ? "below" : "above";
    }
  };

  const wake = useFrame(active, (dt) => {
    const { x, y, h, tail, p } = springs;
    x.step(dt);
    y.step(dt);
    h.step(dt);
    tail.step(dt);
    p.step(dt);
    apply();
    if (x.settled && y.settled && h.settled && tail.settled && p.settled) return false;
  });

  /** Work out where the card goes for the current anchor; snap or glide there. */
  const place = (snap: boolean) => {
    const wrap = wrapRef.current;
    const el = card.current;
    const box = inner.current;
    if (!wrap || !el || !box || !anchor || !shown) return;
    const w = wrap.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    let width: number;
    if (shown.width === "auto") {
      el.style.width = "max-content";
      width = Math.min(el.offsetWidth, w.width - 8);
    } else width = Math.min(shown.width, w.width - 8);
    el.style.width = `${width}px`;
    const height = box.offsetHeight;
    // Above the window unless that would run under the top of the screen.
    const above = a.top - GAP - height > 72 || a.bottom + GAP + height > window.innerHeight - 8;
    const centre = a.left + a.width / 2 - w.left;
    const x = clamp(centre - width / 2, 4, Math.max(4, w.width - width - 4));
    const y = above ? a.top - w.top - GAP - height : a.bottom - w.top + GAP;
    const tail = clamp(centre - x, 14, width - 14);
    placement.current = { above, width };
    const { x: sx, y: sy, h: sh, tail: st } = springs;
    if (snap) {
      sx.set(x);
      sy.set(y);
      sh.set(height);
      st.set(tail);
    } else {
      sx.to(x);
      sy.to(y);
      sh.to(height);
      st.to(tail);
    }
  };

  // New anchor or new content: retarget.
  useLayoutEffect(() => {
    const { p } = springs;
    if (!anchor || !face) {
      if (reducedMotion) p.set(0);
      else p.to(0);
      apply();
      wake();
      return;
    }
    const hidden = p.value < 0.15 && p.target === 0;
    place(hidden || reducedMotion);
    if (reducedMotion) p.set(1);
    else p.to(1);
    apply();
    wake();
  }, [anchor, face?.key, shown, reducedMotion]);

  // The note's height changes (fonts, wrapping) or the page resizes.
  useEffect(() => {
    const box = inner.current;
    const wrap = wrapRef.current;
    if (!box || !wrap) return;
    const observer = new ResizeObserver(() => {
      if (!anchor) return;
      place(reducedMotion);
      apply();
      wake();
    });
    observer.observe(box);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [anchor, shown, reducedMotion]);

  return (
    <div
      ref={card}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-30 will-change-transform"
      style={{ visibility: "hidden", opacity: 0 }}
    >
      <div ref={shell} className="overflow-hidden rounded-[16px] bg-float shadow-float">
        <div ref={inner}>
          {shown ? (
            <div key={shown.key} className="animate-blur-in">
              {shown.node}
            </div>
          ) : null}
        </div>
      </div>
      <span
        ref={leader}
        className="group/leader absolute h-[10px] w-px -translate-x-1/2 bg-[color-mix(in_oklab,var(--foreground)_28%,transparent)] data-[side=above]:-top-[11px] data-[side=below]:-bottom-[11px]"
      >
        <span className="absolute left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)] group-data-[side=above]/leader:-top-[3px] group-data-[side=below]/leader:-bottom-[3px]" />
      </span>
    </div>
  );
}
