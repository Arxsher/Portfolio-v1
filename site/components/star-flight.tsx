"use client";

// Runs the first-load intro (see components/star-intro.tsx for when it
// plays and components/star-path.ts for the choreography).
//
// The overlay is a fixed, full-viewport layer with pointer-events: none.
// The star inside it is one element moved by a single transform matrix per
// frame (position, size, tilt, squash and stretch); while it is fast,
// three fainter copies of its body trail it at its poses of the last few
// frames (a cartoon smear). One requestAnimationFrame loop does all of it,
// in order: read (the viewport and the header mark's live box), step the
// eye engine (components/star-eyes.ts, driven from here: it reads the
// stars' boxes, then writes their eyes), then write the transforms.
//
// Phases:
//   wait  the CSS pop-in is still running.
//   hold  the flight has taken over; the star sits in the middle (CSS still
//         breathes it) and its eyes follow the pointer. It launches once
//         the CSS blink is over plus a beat, and once the main thread has
//         settled (QUIET_FRAMES smooth frames in a row, or QUIET_MAX later).
//   fly   wind-up, flight and landing, planned at launch (planFlight). The
//         clock is real time: a long frame jumps ahead rather than playing
//         the flight in slow motion.
//   dash  a skip (a click, a tap or a key): a quick dash home (ZIP). Or, if
//         the header mark scrolls out of view mid-flight: a dash up and off
//         the screen, fading out (FADE).
// On landing the star sits exactly where the header mark is, at its size
// and colour; the mark takes over the gaze, and in the same frame the
// overlay goes away and the mark is shown, so nothing pops. Turning on
// reduced motion ends it at once. If the header mark is off-screen when
// the flight would start (the page opened scrolled down), the intro is
// skipped and the session flag cleared, so it plays on the next visit.
//
// The page stays veiled (components/star-reveal.ts) until the star touches
// down on the mark (REVEAL_LEAD before contact), then the reveal grows out
// of the mark while the star does its landing hops. A skip reveals the
// page as the dash starts; every other way out (the end, a scrolled-away
// mark, reduced motion, an error, the WATCHDOG_S watchdog, an unmount)
// lifts the veil too, so the page can never stay hidden.
//
// When the star is home and the reveal is over, window.__starIntro.done
// is true and DONE_EVENT fires on window (heavy start-up work, like WebGL,
// can wait for it).

import { useEffect, useRef } from "react";
import { STAR_BODY, eyeShapes } from "@/components/logo";
import { attachEyes, driveEyes, eyesOf, type Gaze } from "@/components/star-eyes";
import {
  AFTER_BLINK,
  BLINK_LEN,
  DONE_EVENT,
  FADE,
  FAILSAFE_S,
  INTRO_ATTR,
  INTRO_KEY,
  NO_BREATH,
  VEIL_ATTR,
  ZIP,
  dashPose,
  introLength,
  introPose,
  planFlight,
  poseMatrix,
  rest,
  touchdown,
  type Breath,
  type Plan,
  type Pose,
  type Scene,
} from "@/components/star-path";
import { liftVeil, type RevealOrigin } from "@/components/star-reveal";

declare global {
  interface Window {
    /** Set by the inline script in components/star-intro.tsx when the
        intro should play: when it decided (ms), whether the star is home,
        and whether it's all over (the page revealed too). */
    __starIntro?: { at: number; landed?: boolean; done?: boolean };
  }
}

/** The intro star's eyes never shut completely: a closed eye is a thin
    slit, which reads better at this size than an eyeless star. */
const SLIT = 0.08;
const REST = eyeShapes();

/** The smear: opacity of each trailing copy, newest first. */
const GHOSTS = [0.35, 0.2, 0.1];
/** Their spacing: one 60Hz frame, or less when that would put them more
    than SPREAD body lengths apart (a dash), so the smear stays one piece. */
const FRAME = 1 / 60;
const SPREAD = 0.4;

/** Launch once the main thread gives this many frames in a row shorter
    than QUIET_GAP (after hydration a page is often still busy compiling
    shaders or laying out), but wait at most QUIET_MAX for them. */
const QUIET_FRAMES = 3;
const QUIET_GAP = 0.024;
const QUIET_MAX = 1.2;
/** The shortest hold once the flight has taken over. */
const HOLD_MIN = 0.12;
/** While it keeps waiting, it blinks again this long after the last one. */
const BLINK_EVERY = 1.8;
/** The page is revealed this long before the star touches down, so the
    first frames of the reveal meet the impact. */
const REVEAL_LEAD = 0.05;
/** The reveal's circle (a clip-path, which browsers animate on the main
    thread) is only used when the last ROUGH_FRAMES frames all came within
    ROUGH_GAP: on a struggling page a stall would freeze it half-way, while
    the rest of the reveal (opacity and transform) runs on the compositor. */
const ROUGH_FRAMES = 12;
const ROUGH_GAP = 0.05;
/** Ends the intro (and lifts the veil) if it is somehow still running this
    long after hydration; the longest real one is about 5s (a hold that
    waits out QUIET_MAX, then a long flight). Hidden-tab time is not
    counted. */
const WATCHDOG_S = 8;

/** Keys that don't skip the intro on their own. */
const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock", "Fn", "FnLock", "OS"]);

/** Counts effect runs, so a cleanup can tell a remount (React's dev double
    effects) from a real unmount. */
let generation = 0;

type Mode = "wait" | "hold" | "fly" | "dash" | "done";

export function StarFlight() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const leftRef = useRef<SVGEllipseElement>(null);
  const rightRef = useRef<SVGEllipseElement>(null);
  const ghostRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const intro = window.__starIntro;
    const wrap = wrapRef.current;
    const star = starRef.current;
    const svg = svgRef.current;
    const leftEye = leftRef.current;
    const rightEye = rightRef.current;
    const ghosts = GHOSTS.map((_, index) => ghostRefs.current[index]).filter(
      (ghost): ghost is HTMLDivElement => !!ghost,
    );
    if (!intro || intro.landed || intro.done || !wrap || !star || !svg || !leftEye || !rightEye) return;

    const root = document.documentElement;
    const run = ++generation;
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let mode: Mode = "wait";
    let raf = 0;
    let last = 0;
    let cancelled = false;
    let big = 0;
    let pose: Pose | null = null;
    let plan: Plan | null = null;
    let breath: Breath = NO_BREATH;
    /** Seconds since launch (fly). */
    let t = 0;
    /** Seconds in the hold, when it may launch, and when the last blink
        ended (hold clock; negative if before the hold). */
    let held = 0;
    let readyAt = 0;
    let blinkedAt = 0;
    let quiet = 0;
    let dash: { from: Pose; p: number; fade: boolean } | null = null;
    let stopBreathing = false;
    let ghostsShown = false;
    let home: Element | null = null;
    let homeBox: DOMRect | null = null;
    let revealing: Promise<void> | null = null;
    let watchdog = 0;
    /** Recent frame gaps (s), newest last. */
    const gaps: number[] = [];

    const findHome = () => {
      if (!home || !home.isConnected) home = document.querySelector("[data-star-home]");
      return home;
    };

    const drawEyes = ({ x, y, open }: Gaze) => {
      // Small on a 1x screen (the end of the flight): whole pixels only, the
      // same as the header mark, so the swap can't shift the eyes.
      const scale = ((window.devicePixelRatio || 1) * (pose ? pose.size : 1000)) / 16;
      const shapes = eyeShapes(x, y, Math.max(open, SLIT), scale < 2 ? scale : undefined);
      [leftEye, rightEye].forEach((el, index) => {
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
          : { x: wrap.clientWidth / 2, y: wrap.clientHeight / 2, size: big || 128 },
      aim: () => pose?.look ?? null,
    });
    const drive = driveEyes();

    /** Reads this frame's scene: the viewport and the header mark. */
    const scene = (): Scene | null => {
      const target = findHome()?.getBoundingClientRect();
      if (!target || target.width === 0) return null;
      homeBox = target;
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
        big: big || 128,
      };
    };
    const homeVisible = (vh: number) => !!homeBox && homeBox.bottom > 0 && homeBox.top < vh;

    /** Let the intro play again on the next visit. */
    const forget = () => {
      try {
        sessionStorage.removeItem(INTRO_KEY);
      } catch {}
    };

    /** Lifts the veil (once): the reveal grows out of the header mark, or
        the page just fades in if the mark is off-screen. */
    const reveal = () => {
      if (revealing) return;
      let origin: RevealOrigin | null = null;
      try {
        const box = findHome()?.getBoundingClientRect();
        if (box && box.width > 0 && box.bottom > 0 && box.top < window.innerHeight) {
          origin = { x: box.left + box.width / 2, y: box.top + box.height / 2, size: box.width };
        }
      } catch {}
      const smooth = gaps.length >= ROUGH_FRAMES && gaps.every((gap) => gap < ROUGH_GAP);
      revealing = liftVeil(origin, !reducedQuery.matches, smooth);
    };

    /** The CSS breathing, as it stands right now. */
    const readBreath = (): Breath => {
      const style = getComputedStyle(svg);
      const scale = parseFloat(style.scale);
      const dy = parseFloat(style.translate.split(" ")[1] ?? "0");
      return { scale: Number.isFinite(scale) ? scale : 1, dy: Number.isFinite(dy) ? dy : 0 };
    };

    /** Seconds until the CSS blink is over (negative once it is), or null
        if there is none to wait for. */
    const cssBlinkLeft = (): number | null => {
      const animations = typeof leftEye.getAnimations === "function" ? leftEye.getAnimations() : [];
      const timing = animations[0]?.effect?.getComputedTiming();
      if (!timing) return null;
      const end = Number(timing.endTime ?? 0);
      const local = timing.localTime == null ? end : Number(timing.localTime);
      return (end - local) / 1000;
    };

    const dashTarget = (live: Scene, from: Pose, fade: boolean) =>
      fade
        ? { x: from.x + (live.tx - from.x) * 0.4, y: -0.8 * from.size, size: from.size * 0.6 }
        : { x: live.tx, y: live.ty, size: live.small };

    /** The pose `lag` seconds before now. */
    const poseAt = (live: Scene, lag = 0): Pose => {
      if (mode === "fly" && plan) {
        return t - lag < 0 ? rest(live.sx, live.sy, big) : introPose(plan, t - lag, live, breath);
      }
      if (mode === "dash" && dash) {
        const length = dash.fade ? FADE : ZIP;
        const p = dash.p - lag / length;
        return p <= 0 ? dash.from : dashPose(dash.from, dashTarget(live, dash.from, dash.fade), p, length, dash.fade);
      }
      return rest(live.sx, live.sy, big);
    };

    /** Takes over from the CSS pop-in in one go: same place, same size. */
    const takeOver = () => {
      big = star.offsetWidth || 128;
      star.style.left = "0px";
      star.style.top = "0px";
      star.style.translate = "none";
      star.style.animation = "none";
      star.style.transformOrigin = "0 0";
      pose = rest(wrap.clientWidth / 2, wrap.clientHeight / 2, big);
      star.style.transform = poseMatrix(pose, big);
    };

    const launch = (live: Scene) => {
      // The wind-up eases the CSS breathing out from where it stands.
      breath = readBreath();
      stopBreathing = true;
      plan = planFlight(live);
      t = 0;
      mode = "fly";
    };

    const startDash = (fade: boolean) => {
      if (!pose || mode === "dash" || mode === "done") return;
      if (mode === "hold") {
        const now = readBreath();
        stopBreathing = true;
        pose = { ...pose, y: pose.y + now.dy, size: pose.size * now.scale };
      }
      dash = { from: pose, p: 0, fade };
      mode = "dash";
      reveal();
    };

    const skip = () => {
      if (mode === "wait") {
        takeOver();
        mode = "hold";
      }
      if (mode === "hold" || (mode === "fly" && plan && t < touchdown(plan))) startDash(false);
      else if (mode === "fly") end();
    };

    const writeGhosts = (live: Scene) => {
      if (!pose) return;
      const moving = mode === "fly" || mode === "dash";
      const before = moving ? poseAt(live, FRAME) : pose;
      const bodies = Math.hypot(pose.x - before.x, pose.y - before.y) / Math.max(1, pose.size);
      // Only past ~0.2 bodies a frame (the flight and dashes, not the
      // landing hops), full by 0.4.
      const strength = Math.min(1, Math.max(0, (bodies - 0.18) / 0.22)) * pose.opacity;
      if (strength <= 0) {
        if (ghostsShown) ghosts.forEach((ghost) => (ghost.style.opacity = "0"));
        ghostsShown = false;
        return;
      }
      ghostsShown = true;
      const spacing = FRAME * Math.min(1, SPREAD / bodies);
      ghosts.forEach((ghost, index) => {
        const lagged = index === 0 && spacing === FRAME ? before : poseAt(live, spacing * (index + 1));
        ghost.style.transform = poseMatrix(lagged, big);
        ghost.style.opacity = String(GHOSTS[index] * strength);
      });
    };

    const step = (now: number) => {
      raf = 0;
      const gap = last ? Math.max(0, (now - last) / 1000) : 0;
      last = now;
      const dt = Math.min(gap, 1);
      if (gap > 0) {
        gaps.push(gap);
        if (gaps.length > ROUGH_FRAMES) gaps.shift();
      }

      // 1. Read.
      const live = scene();
      if (!live) {
        end();
        return;
      }

      // 2. Advance.
      if (mode === "hold") {
        held += dt;
        quiet = gap > 0 && gap < QUIET_GAP ? quiet + 1 : 0;
        if (!homeVisible(live.vh)) {
          forget();
          end();
          return;
        }
        if (held >= readyAt && held - blinkedAt > BLINK_EVERY) {
          eyes.blink();
          blinkedAt = held + BLINK_LEN;
          readyAt = Math.max(readyAt, blinkedAt + AFTER_BLINK);
        }
        if (held >= readyAt && (quiet >= QUIET_FRAMES || held >= readyAt + QUIET_MAX)) launch(live);
      } else if (mode === "fly" && plan) {
        t += dt;
        if (t >= introLength(plan)) {
          end();
          return;
        }
        if (!homeVisible(live.vh) && t < touchdown(plan)) startDash(true);
        else if (t >= touchdown(plan) - REVEAL_LEAD) reveal();
      }
      // (A dash started just above moves on in this same frame.)
      if (mode === "dash" && dash) {
        dash.p += dt / (dash.fade ? FADE : ZIP);
        if (dash.p >= 1) {
          end();
          return;
        }
      }
      if (mode !== "wait") pose = poseAt(live);

      // 3. The eyes: reads the header mark's box (layout is still clean),
      //    then writes the eyes of both stars.
      drive.step(now);

      // 4. Write.
      if (stopBreathing) {
        svg.style.animation = "none";
        stopBreathing = false;
      }
      if (mode !== "wait" && pose) {
        star.style.transform = poseMatrix(pose, big);
        star.style.opacity = pose.opacity < 1 ? pose.opacity.toFixed(3) : "";
        writeGhosts(live);
      }
      raf = requestAnimationFrame(frame);
    };

    /** Anything going wrong ends the intro (and so shows the page). */
    function frame(now: number) {
      try {
        step(now);
      } catch {
        end();
      }
    }

    const start = () => {
      if (cancelled || mode !== "wait") return;
      const box = findHome()?.getBoundingClientRect();
      if (!box || box.width === 0 || box.bottom <= 0 || box.top >= window.innerHeight) {
        // Opened scrolled down: the landing couldn't be seen.
        forget();
        end();
        return;
      }
      takeOver();
      // The look-and-blink beat: CSS blinks once; launch a beat after it.
      const left = cssBlinkLeft();
      if (left === null) {
        eyes.blink();
        blinkedAt = BLINK_LEN;
      } else blinkedAt = left;
      readyAt = Math.max(HOLD_MIN, blinkedAt + AFTER_BLINK);
      held = 0;
      quiet = 0;
      mode = "hold";
    };
    const begin = () => {
      try {
        start();
      } catch {
        end();
      }
    };

    const end = () => {
      if (mode === "done") return;
      mode = "done";
      intro.landed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.clearTimeout(watchdog);
      // Hand the gaze to the header mark, then swap in the same frame.
      try {
        eyesOf(findHome())?.take(eyes);
      } catch {}
      root.removeAttribute(INTRO_ATTR);
      reveal();
      try {
        detach();
      } catch {}
      revealing?.then(finish);
    };

    /** All over: the star is home and the page revealed. */
    const finish = () => {
      if (intro.done) return;
      intro.done = true;
      window.dispatchEvent(new Event(DONE_EVENT));
    };

    // A mouse press skips at once. A finger only skips on a tap, so that
    // starting to scroll the page doesn't cut the flight short.
    let press: { id: number; x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") skip();
      else press = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const onUp = (event: PointerEvent) => {
      if (press && press.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 12) {
        skip();
      }
      press = null;
    };
    const onCancel = () => {
      press = null;
    };
    // Esc, or any other key: with the page veiled, a key press means the
    // visitor wants to get going (Tab then lands on the revealed page).
    const onKey = (event: KeyboardEvent) => {
      if (!MODIFIERS.has(event.key)) skip();
    };
    const onResize = () => {
      if (mode !== "wait") big = star.offsetWidth || big;
    };
    const onMotion = () => {
      if (reducedQuery.matches) end();
    };

    function detach() {
      eyes.detach();
      drive.release();
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
    if (root.hasAttribute(VEIL_ATTR)) {
      root.setAttribute(VEIL_ATTR, "live");
      document.getElementById("main")?.setAttribute("aria-busy", "true");
    }
    let watched = 0;
    let checked = performance.now();
    const watch = () => {
      if (mode === "done") return;
      const now = performance.now();
      if (!document.hidden) watched += now - checked;
      checked = now;
      if (watched >= WATCHDOG_S * 1000) end();
      else watchdog = window.setTimeout(watch, 1000);
    };
    watchdog = window.setTimeout(watch, 1000);

    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onResize);
    reducedQuery.addEventListener("change", onMotion);
    raf = requestAnimationFrame(frame);

    // Let the CSS pop-in finish, then take over.
    const popping = typeof star.getAnimations === "function" ? star.getAnimations() : [];
    if (popping.length === 0) begin();
    else Promise.all(popping.map((animation) => animation.finished)).then(begin, begin);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.clearTimeout(watchdog);
      if (mode === "done") return;
      detach();
      // A real unmount mid-intro must not leave the header mark or the
      // page hidden; a dev remount runs this effect again right away and
      // carries on.
      window.setTimeout(() => {
        if (generation === run && !intro.landed) {
          intro.landed = true;
          root.removeAttribute(INTRO_ATTR);
          liftVeil(null, false);
          finish();
        }
      }, 0);
    };
  }, []);

  return (
    <div ref={wrapRef} className="star-intro" aria-hidden="true">
      {/* The smear, oldest (faintest) first so the newest sits on top. */}
      {[2, 1, 0].map((index) => (
        <div
          key={index}
          ref={(el) => {
            ghostRefs.current[index] = el;
          }}
          className="star-intro-ghost"
        >
          <svg viewBox="0 0 16 16" focusable="false">
            <path d={STAR_BODY} fill="currentColor" />
          </svg>
        </div>
      ))}
      <div ref={starRef} className="star-intro-star">
        <svg ref={svgRef} viewBox="0 0 16 16" focusable="false">
          <path d={STAR_BODY} fill="currentColor" />
          <ellipse ref={leftRef} {...REST[0]} style={{ fill: "var(--background)" }} />
          <ellipse ref={rightRef} {...REST[1]} style={{ fill: "var(--background)" }} />
        </svg>
      </div>
    </div>
  );
}
