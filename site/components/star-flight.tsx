"use client";

// Runs the first-load intro (see components/star-intro.tsx for when it
// plays and components/star-path.ts for the choreography).
//
// The overlay is a fixed, full-viewport layer with pointer-events: none;
// the star inside it is one element moved by a single transform matrix per
// frame (position, size, tilt, squash and stretch), from a
// requestAnimationFrame loop with a clamped dt. Each frame first reads
// (the viewport size and the header mark's live position, so scrolling,
// resizing or the mark moving are all followed), then writes. The eyes are
// ovals in the page background colour, driven by the shared eye engine
// (components/star-eyes.ts): they follow the pointer while the star waits
// and look where it flies while it flies.
//
// On landing the star sits exactly where the header mark is, at its size
// and colour; the mark takes over the gaze, and in the same frame the
// overlay goes away and the mark is shown, so nothing pops. A click or tap
// anywhere, Esc, or turning on reduced motion skips to that end at once
// (scrolling doesn't: the star just follows the mark).

import { useEffect, useRef } from "react";
import { STAR_BODY, eyeShapes } from "@/components/logo";
import { attachEyes, eyesOf, type Gaze } from "@/components/star-eyes";
import {
  FAILSAFE_S,
  HOLD,
  HOLD_MIN,
  INTRO_ATTR,
  POP,
  introLength,
  poseAt,
  poseMatrix,
  type Pose,
} from "@/components/star-path";

declare global {
  interface Window {
    /** Set by the inline script in components/star-intro.tsx when the
        intro should play: when it decided (ms), and whether it's over. */
    __starIntro?: { at: number; done?: boolean };
  }
}

/** The intro star's eyes never shut completely: a closed eye is a thin
    slit, which reads better at this size than an eyeless star. */
const SLIT = 0.08;

const REST = eyeShapes();

/** Counts effect runs, so a cleanup can tell a remount (React's dev double
    effects) from a real unmount. */
let generation = 0;

export function StarFlight() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<SVGEllipseElement>(null);
  const rightRef = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    const intro = window.__starIntro;
    const wrap = wrapRef.current;
    const star = starRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!intro || intro.done || !wrap || !star || !left || !right) return;

    const root = document.documentElement;
    const run = ++generation;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let cancelled = false;
    let finished = false;
    let started = false;
    let last = 0;
    let t = 0;
    let hold = HOLD;
    let blinked = false;
    let big = 0;
    let pose: Pose | null = null;
    let home: Element | null = null;

    const findHome = () => {
      if (!home || !home.isConnected) home = document.querySelector("[data-star-home]");
      return home;
    };

    const drawEyes = ({ x, y, open }: Gaze) => {
      const shapes = eyeShapes(x, y, Math.max(open, SLIT));
      [left, right].forEach((el, index) => {
        const eye = shapes[index];
        el.setAttribute("cx", eye.cx.toFixed(3));
        el.setAttribute("cy", eye.cy.toFixed(3));
        el.setAttribute("rx", eye.rx.toFixed(3));
        el.setAttribute("ry", eye.ry.toFixed(3));
      });
    };

    const eyes = attachEyes(star, drawEyes, {
      blinks: false,
      // While CSS still holds the star, it sits in the middle at full size.
      frame: () =>
        pose
          ? { x: pose.x, y: pose.y, size: pose.size }
          : { x: wrap.clientWidth / 2, y: wrap.clientHeight / 2, size: star.offsetWidth },
      aim: () => pose?.look ?? null,
    });

    const end = () => {
      if (finished) return;
      finished = true;
      intro.done = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      // Hand the gaze to the header mark, then swap in the same frame.
      eyesOf(findHome())?.take(eyes);
      root.removeAttribute(INTRO_ATTR);
      detach();
    };

    /** Reads this frame's scene: the viewport and the header mark. */
    const scene = () => {
      const target = findHome()?.getBoundingClientRect();
      if (!target || target.width === 0) return null;
      const vw = wrap.clientWidth;
      const vh = wrap.clientHeight;
      return {
        vw,
        vh,
        sx: vw / 2,
        sy: vh / 2,
        tx: target.left + target.width / 2,
        ty: target.top + target.height / 2,
        small: target.width,
        big,
      };
    };

    /** Places the star for time t; false once there is nothing to fly to. */
    const place = () => {
      const now = scene();
      if (!now) return false;
      pose = poseAt(now, t, hold);
      star.style.transform = poseMatrix(pose, big);
      return true;
    };

    const frame = (now: number) => {
      raf = 0;
      t += Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!place() || t >= introLength(hold)) {
        end();
        return;
      }
      eyes.poke();
      if (!blinked && t >= hold * 0.35) {
        blinked = true;
        eyes.blink();
      }
      raf = requestAnimationFrame(frame);
    };

    const begin = () => {
      if (cancelled || finished || started) return;
      started = true;
      // A slow hydration already kept the star on screen for a while: the
      // time it waited past the pop-in counts towards the hold.
      const waited = (performance.now() - intro.at) / 1000;
      hold = Math.min(HOLD, Math.max(HOLD_MIN, HOLD + POP - waited));
      big = star.offsetWidth || 128;
      // Take over from the CSS pop-in in one go: same place, same size.
      star.style.left = "0px";
      star.style.top = "0px";
      star.style.translate = "none";
      star.style.animation = "none";
      star.style.transformOrigin = "0 0";
      if (!place()) {
        end();
        return;
      }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    // A mouse press skips at once. A finger only skips on a tap, so that
    // starting to scroll the page doesn't cut the flight short.
    let press: { id: number; x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") end();
      else press = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      if (press && press.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 12) {
        end();
      }
      press = null;
    };
    const onCancel = () => {
      press = null;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") end();
    };
    const onResize = () => {
      if (started) big = star.offsetWidth || big;
    };
    const onMotion = () => {
      if (reducedQuery.matches) end();
    };

    function detach() {
      eyes.detach();
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onResize);
      reducedQuery.removeEventListener("change", onMotion);
    }

    // Too late (the CSS failsafe has given up) or no longer wanted.
    if (performance.now() - intro.at > (FAILSAFE_S - 0.5) * 1000 || reducedQuery.matches) {
      end();
      return;
    }
    root.setAttribute(INTRO_ATTR, "live");

    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onResize);
    reducedQuery.addEventListener("change", onMotion);

    // Let the CSS pop-in finish, then fly.
    const popping = typeof star.getAnimations === "function" ? star.getAnimations() : [];
    if (popping.length === 0) begin();
    else Promise.all(popping.map((animation) => animation.finished)).then(begin, begin);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (finished) return;
      detach();
      // A real unmount mid-intro must not leave the header mark hidden; a
      // dev remount runs this effect again right away and carries on.
      window.setTimeout(() => {
        if (generation === run && !intro.done) {
          intro.done = true;
          root.removeAttribute(INTRO_ATTR);
        }
      }, 0);
    };
  }, []);

  return (
    <div ref={wrapRef} className="star-intro" aria-hidden="true">
      <div ref={starRef} className="star-intro-star">
        <svg viewBox="0 0 16 16" focusable="false">
          <path d={STAR_BODY} fill="currentColor" />
          <ellipse ref={leftRef} {...REST[0]} style={{ fill: "var(--background)" }} />
          <ellipse ref={rightRef} {...REST[1]} style={{ fill: "var(--background)" }} />
        </svg>
      </div>
    </div>
  );
}
