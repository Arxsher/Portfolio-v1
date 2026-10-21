// The star's eyes: one small engine shared by every live star on the page
// (the header mark and, on first load, the intro star).
//
// Eye model
// ---------
// Each star has a gaze (x, y) in -1…1 (components/logo.tsx turns it into
// eye ovals that stay inside the body) and an openness (1 open, 0 shut).
//
// * Target. With a mouse or pen, the vector from the star's centre to the
//   pointer: direction as is, length eased by distance (1 - e^(-d/R), R
//   grows with the star's size), so a pointer right on the star means
//   "looking straight at you" and anything far away means "eyes all the
//   way over". After IDLE_MS without movement, or once the pointer leaves
//   the window or the window loses focus, the target goes back to the
//   centre. On touch there is no hover, so each tap gets a glance that
//   lasts GLANCE_MS. A star can override the target (the intro looks where
//   it is flying).
// * Motion. The gaze follows its target with a slightly underdamped spring
//   (semi-implicit Euler with dt, sub-stepped), so it darts and settles
//   with a hint of overshoot instead of snapping.
// * Blinks. Every 3–7 s (random), sometimes a double blink: the lid drops
//   fast, holds for a beat and lifts a little slower.
// * Reduced motion. The gaze stays centred; only a slow, gentle blink is
//   left, every 6–11 s.
//
// Performance: one requestAnimationFrame loop for all stars. Each frame
// reads every star's position first, then writes (no read/write
// interleaving). The loop sleeps as soon as every spring has settled and
// no blink is running; a timer, a pointer move, a scroll or a resize wakes
// it again.

export type Gaze = { x: number; y: number; open: number };
type Point = { x: number; y: number };
type Frame = { x: number; y: number; size: number };

export type EyesOptions = {
  /** Where the star is on screen (viewport px, centre and size). Defaults
      to the element's bounding box. */
  frame?: () => Frame | null;
  /** Overrides the gaze target (-1…1) while it returns a point. */
  aim?: () => Point | null;
  /** Random blinks (default true). */
  blinks?: boolean;
};

export type Eyes = {
  /** Blinks now (unless a blink is already running). */
  blink(): void;
  /** Takes over another star's gaze, velocity and blink, for a seamless swap. */
  take(other: Eyes): void;
  /** Wakes the loop (call while `aim` keeps changing). */
  poke(): void;
  detach(): void;
};

const IDLE_MS = 2600;
const GLANCE_MS = 1500;
const STIFFNESS = 170;
const DAMPING = 2 * 0.72 * Math.sqrt(STIFFNESS);
const MAX_STEP = 1 / 120;

// Blink shapes in ms: lid down, held, lid up.
const QUICK = { down: 70, hold: 40, up: 120 };
const SLOW = { down: 200, hold: 110, up: 320 };

type Star = {
  el: Element;
  render: (gaze: Gaze) => void;
  frame?: () => Frame | null;
  aim?: () => Point | null;
  blinks: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  open: number;
  /** When the current blink started (ms), or -1. */
  blinkStart: number;
  /** A second blink right after this one. */
  twice: boolean;
  slow: boolean;
  nextBlink: number;
  box: Frame | null;
  last: Gaze;
};

const stars = new Set<Star>();
const handles = new WeakMap<Eyes, Star>();
const byElement = new WeakMap<Element, Eyes>();

let pointer: { x: number; y: number; t: number; touch: boolean } | null = null;
let reduced = false;
let raf = 0;
let timer = 0;
let lastTick = 0;
let listening = false;
let motionQuery: MediaQueryList | null = null;

const now = () => performance.now();
const random = (min: number, max: number) => min + Math.random() * (max - min);

function nextBlinkTime(from: number) {
  return reduced ? from + random(6000, 11000) : from + random(3000, 7000);
}

/* ---------------------------------------------------------------------- */
/* input                                                                   */
/* ---------------------------------------------------------------------- */

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  pointer = { x: event.clientX, y: event.clientY, t: now(), touch: false };
  wake();
}

function onPointerDown(event: PointerEvent) {
  pointer = { x: event.clientX, y: event.clientY, t: now(), touch: event.pointerType === "touch" };
  wake();
}

function forget() {
  pointer = null;
  wake();
}

function onMouseOut(event: MouseEvent) {
  // relatedTarget is null when the pointer leaves the window.
  if (!event.relatedTarget) forget();
}

function onMotionChange() {
  reduced = motionQuery?.matches ?? false;
  const t = now();
  stars.forEach((star) => {
    star.nextBlink = nextBlinkTime(t);
  });
  wake();
}

function onVisibility() {
  if (document.hidden) return;
  // Don't fire a backlog of blinks on return.
  const t = now();
  stars.forEach((star) => {
    if (star.nextBlink < t) star.nextBlink = nextBlinkTime(t);
  });
  lastTick = t;
  wake();
}

function listen(on: boolean) {
  if (listening === on) return;
  listening = on;
  const method = on ? "addEventListener" : "removeEventListener";
  const passive = { passive: true, capture: true } as const;
  window[method]("pointermove", onPointerMove as EventListener, passive);
  window[method]("pointerdown", onPointerDown as EventListener, passive);
  window[method]("scroll", wake, passive);
  window[method]("resize", wake);
  window[method]("blur", forget);
  document[method]("mouseout", onMouseOut as EventListener);
  document[method]("visibilitychange", onVisibility);
  if (on) {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced = motionQuery.matches;
    motionQuery.addEventListener("change", onMotionChange);
  } else {
    motionQuery?.removeEventListener("change", onMotionChange);
    motionQuery = null;
  }
}

/* ---------------------------------------------------------------------- */
/* loop                                                                    */
/* ---------------------------------------------------------------------- */

function wake() {
  if (raf || stars.size === 0 || typeof window === "undefined") return;
  if (timer) {
    window.clearTimeout(timer);
    timer = 0;
  }
  lastTick = now();
  raf = window.requestAnimationFrame(tick);
}

function frameOf(star: Star): Frame | null {
  if (star.frame) return star.frame();
  const rect = star.el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: rect.width };
}

/** Gaze target for one star, and until when it holds (for the wake timer). */
function targetOf(star: Star, t: number): { x: number; y: number; until: number; aimed?: boolean } {
  const aim = star.aim?.();
  if (aim) return { x: aim.x, y: aim.y, until: Infinity, aimed: true };
  if (reduced || !pointer || !star.box) return { x: 0, y: 0, until: Infinity };
  const until = pointer.t + (pointer.touch ? GLANCE_MS : IDLE_MS);
  if (t >= until) return { x: 0, y: 0, until: Infinity };
  const dx = pointer.x - star.box.x;
  const dy = pointer.y - star.box.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.5) return { x: 0, y: 0, until };
  const reach = 1 - Math.exp(-distance / (60 + 1.4 * star.box.size));
  return { x: (dx / distance) * reach, y: (dy / distance) * reach, until };
}

/** Openness during a blink `elapsed` ms in (1 once it is over). */
function lid(elapsed: number, slow: boolean): number {
  const shape = slow ? SLOW : QUICK;
  if (elapsed <= 0) return 1;
  if (elapsed < shape.down) {
    const p = elapsed / shape.down;
    return 1 - p * p;
  }
  if (elapsed < shape.down + shape.hold) return 0;
  const p = Math.min(1, (elapsed - shape.down - shape.hold) / shape.up);
  return 1 - (1 - p) * (1 - p) * (1 - p);
}

function blinkLength(slow: boolean) {
  const shape = slow ? SLOW : QUICK;
  return shape.down + shape.hold + shape.up;
}

function startBlink(star: Star, t: number, twice = false) {
  star.blinkStart = t;
  star.slow = reduced;
  star.twice = twice;
}

function tick(t: number) {
  raf = 0;
  const dt = Math.min(0.05, Math.max(0, (t - lastTick) / 1000));
  lastTick = t;

  // Reads first …
  stars.forEach((star) => {
    star.box = frameOf(star);
  });

  // … then the simulation and the writes.
  let busy = false;
  let wakeAt = Infinity;
  stars.forEach((star) => {
    const target = targetOf(star, t);
    wakeAt = Math.min(wakeAt, target.until);

    let left = dt;
    while (left > 1e-6) {
      const h = Math.min(MAX_STEP, left);
      star.vx += (STIFFNESS * (target.x - star.x) - DAMPING * star.vx) * h;
      star.vy += (STIFFNESS * (target.y - star.y) - DAMPING * star.vy) * h;
      star.x += star.vx * h;
      star.y += star.vy * h;
      left -= h;
    }
    const settled =
      Math.abs(target.x - star.x) < 0.002 &&
      Math.abs(target.y - star.y) < 0.002 &&
      Math.abs(star.vx) < 0.02 &&
      Math.abs(star.vy) < 0.02;
    if (settled) {
      star.x = target.x;
      star.y = target.y;
      star.vx = 0;
      star.vy = 0;
    } else busy = true;

    if (star.blinkStart < 0 && star.blinks && t >= star.nextBlink && !document.hidden) {
      startBlink(star, t, !reduced && Math.random() < 0.18);
    }
    if (star.blinkStart >= 0) {
      const elapsed = t - star.blinkStart;
      star.open = lid(elapsed, star.slow);
      if (elapsed >= blinkLength(star.slow)) {
        star.open = 1;
        if (star.twice) startBlink(star, t + 60);
        else {
          star.blinkStart = -1;
          star.nextBlink = nextBlinkTime(t);
        }
      }
      busy = true;
    }
    if (star.blinkStart < 0 && star.blinks) wakeAt = Math.min(wakeAt, star.nextBlink);
    if (target.aimed) busy = true;

    const gaze = { x: star.x, y: star.y, open: star.open };
    if (gaze.x !== star.last.x || gaze.y !== star.last.y || gaze.open !== star.last.open) {
      star.last = gaze;
      star.render(gaze);
    }
  });

  if (busy) {
    raf = window.requestAnimationFrame(tick);
  } else if (wakeAt < Infinity) {
    timer = window.setTimeout(
      () => {
        timer = 0;
        wake();
      },
      Math.max(16, wakeAt - now()),
    );
  }
}

/* ---------------------------------------------------------------------- */
/* public                                                                  */
/* ---------------------------------------------------------------------- */

/**
 * Gives a star eyes. `render` is called with the gaze whenever it changes
 * (from inside the shared animation frame: write to the DOM there, don't
 * read layout). Returns a handle; call `detach()` on unmount.
 */
export function attachEyes(el: Element, render: (gaze: Gaze) => void, options: EyesOptions = {}): Eyes {
  if (typeof window === "undefined") {
    return { blink() {}, take() {}, poke() {}, detach() {} };
  }
  listen(true);
  const star: Star = {
    el,
    render,
    frame: options.frame,
    aim: options.aim,
    blinks: options.blinks ?? true,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    open: 1,
    blinkStart: -1,
    twice: false,
    slow: false,
    nextBlink: nextBlinkTime(now()),
    box: null,
    last: { x: 0, y: 0, open: 1 },
  };
  stars.add(star);

  const handle: Eyes = {
    blink() {
      if (star.blinkStart < 0) startBlink(star, now());
      wake();
    },
    take(other) {
      const from = handles.get(other);
      if (!from) return;
      star.x = from.x;
      star.y = from.y;
      star.vx = from.vx;
      star.vy = from.vy;
      star.open = from.open;
      star.blinkStart = from.blinkStart;
      star.twice = from.twice;
      star.slow = from.slow;
      if (star.blinkStart < 0) star.nextBlink = nextBlinkTime(now());
      star.last = { x: star.x, y: star.y, open: star.open };
      render(star.last);
      wake();
    },
    poke: wake,
    detach() {
      stars.delete(star);
      if (byElement.get(el) === handle) byElement.delete(el);
      if (stars.size === 0) {
        if (raf) window.cancelAnimationFrame(raf);
        if (timer) window.clearTimeout(timer);
        raf = 0;
        timer = 0;
        listen(false);
      }
    },
  };
  handles.set(handle, star);
  byElement.set(el, handle);
  wake();
  return handle;
}

/** The eyes attached to an element, so another component (the intro) can
    hand its gaze over to them. */
export function eyesOf(el: Element | null): Eyes | null {
  return el ? (byElement.get(el) ?? null) : null;
}
