// The first-load star's choreography (components/star-intro.tsx), as a pure
// function of time: no DOM, so it can be sampled anywhere.
//
// Beats (seconds, after the 0.36s CSS pop-in that shows the star before
// hydration; about 2.1s in all):
//   hold  0.4   big in the middle, looking at the visitor; one blink
//   wind  0.16  anticipation: crouches (squash), leans back, glances up
//   fly   0.95  the flight home
//   land  0.30  a small overshoot bounce, then the header mark takes over
//
// Flight curve
// ------------
// A spiral around a centre that slides home. With S the start (viewport
// centre) and T the target (the header mark's centre):
//
//   P(u) = C(u) + (1 - u)^1.1 · (rx cos θ(u), ry sin θ(u) · f(u))   u ∈ [0, 1]
//
//   C(u)  slides from C0 to T, arriving early (smoothstep over u ∈ [0, .7])
//         so the last stretch is a spiral around the target itself;
//   the radii shrink as (1 - u)^1.1, so the loops tighten onto the target;
//   θ(u)  sweeps two full turns, faster at first (1 - (1 - u)^1.15);
//   f(u)  flattens a loop vertically when it would leave the top edge
//         (the header sits right under it), never below 0.35.
//
// C0 is chosen so the star sets off straight up and the first loop rolls
// over the top towards the target (counter-clockwise when the target is
// to the left, like a wheel rolling that way). ry is a fifth of the
// viewport height (56–160px, at most half the distance); rx is the same
// unless the side the loop rolls towards is short of room (phones), which
// makes the loop tall and narrow instead of running off the edge.
// The result: launch up, one big loop-de-loop in the open middle of the
// page, a swoop up towards the header and a tightening curl that lands on
// the mark.
//
// Time runs through an ease (see warp()): a smooth launch out of the
// crouch, the loop at speed, a braking curl. The size eases from the big
// start size to the mark's size on a log scale (shrinking feels even),
// mostly during the loop and the swoop.
//
// Cartoon physics, all derived from the analytic path (central
// differences, so they are smooth and frame-rate independent):
//   stretch  along the velocity, by speed in body lengths per second,
//            with the cross axis thinned to roughly keep the area;
//   bank     the star tilts into the horizontal pull of the turn (and a
//            little towards where it is heading), up to ~30°;
//   gaze     the eyes look where it is flying.
// Landing: the size overshoots and settles (a damped sine) with a matching
// squash, the position hops a couple of pixels and settles, and every
// term is back to exactly zero at the end, so the swap to the real mark
// can't pop.

export type Scene = {
  /** Overlay size (the viewport). */
  vw: number;
  vh: number;
  /** Start centre (px). */
  sx: number;
  sy: number;
  /** Target centre (px) and size. */
  tx: number;
  ty: number;
  small: number;
  /** Start size (px). */
  big: number;
};

export type Pose = {
  /** Centre (px). */
  x: number;
  y: number;
  /** Size before squash and stretch (px). */
  size: number;
  /** The star's own tilt (rad, clockwise). */
  angle: number;
  /** Squash and stretch, as a symmetric 2×2 matrix [xx, xy, yy] (identity
      at rest). Built by `squash()`; blending two of them stays smooth. */
  squash: [number, number, number];
  /** Gaze override (-1…1, in the star's own frame), or null to follow the
      pointer. */
  look: { x: number; y: number } | null;
};

/** sessionStorage key: set once the intro has played in this tab. */
export const INTRO_KEY = "star-intro";
/** Attribute on <html> while the intro runs ("" before hydration, then
    "live"). The header mark is hidden while it is there. */
export const INTRO_ATTR = "data-star-intro";
/** If the page never hydrates, CSS gives up on the intro after this many
    seconds; the flight skips the intro when it mounts later than that. */
export const FAILSAFE_S = 7;

/** The CSS pop-in that shows the star before hydration. */
export const POP = 0.36;
export const WIND = 0.16;
export const FLY = 0.95;
export const LAND = 0.3;

/** Default hold (shortened when hydration was slow and the star has
    already been on screen for a while, but never below HOLD_MIN, which
    still fits the blink). */
export const HOLD = 0.4;
export const HOLD_MIN = 0.26;

export const introLength = (hold: number) => hold + WIND + FLY + LAND;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Scale by `along` in the direction `axis` (rad) and by `across` at right
    angles to it: R(axis) · diag(along, across) · R(-axis). */
function squash(axis: number, along: number, across: number): [number, number, number] {
  const c = Math.cos(axis);
  const s = Math.sin(axis);
  return [along * c * c + across * s * s, (along - across) * c * s, along * s * s + across * c * c];
}

const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const VERTICAL = Math.PI / 2;
/** The crouch before take-off: 16% shorter, 10% wider. */
const CROUCH = squash(VERTICAL, 1 - 0.16, 1.1);
const IDENTITY: [number, number, number] = [1, 0, 1];
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Time → path parameter: a cubic with control values 0, 0.1, 0.8, 1. It
    leaves the crouch at a gentle 0.3× speed, spends ~40% of the time on
    the big loop (u 0…0.4), ~25% on the swoop (u 0.4…0.7) and the rest
    on the curl, still braking but without crawling at the very end (the
    curve itself already comes to rest on the target, as its radius
    shrinks to zero). */
function warp(tau: number) {
  const t = clamp(tau, 0, 1);
  const s = 1 - t;
  return 3 * 0.1 * t * s * s + 3 * 0.8 * t * t * s + t * t * t;
}

/** Largest loop radius (px). */
const LOOP_MAX = 160;

/** The flight curve at path parameter u (see the comment above). */
function track(scene: Scene, u: number): { x: number; y: number } {
  const dx = scene.tx - scene.sx;
  const dy = scene.ty - scene.sy;
  const distance = Math.hypot(dx, dy) || 1;
  const turn = dx <= 0 ? -1 : 1;
  // Loop radii: up to a fifth of the viewport height, and narrower when
  // the side the loop rolls towards has less room (phones).
  const ry = Math.min(clamp(scene.vh * 0.2, 56, LOOP_MAX), distance * 0.5);
  const room = turn < 0 ? scene.sx : scene.vw - scene.sx;
  const rx = clamp((room - 10 - scene.big * 0.45) / 2, Math.min(40, ry), ry);
  const theta0 = turn < 0 ? 0 : Math.PI;
  const c0x = scene.sx - rx * Math.cos(theta0);
  const c0y = scene.sy - ry * Math.sin(theta0);
  const slide = smooth(clamp(u / 0.7, 0, 1));
  const cx = c0x + (scene.tx - c0x) * slide;
  const cy = c0y + (scene.ty - c0y) * slide;
  const shrink = Math.pow(1 - u, 1.1);
  const theta = theta0 + turn * 4 * Math.PI * (1 - Math.pow(1 - u, 1.15));
  const flatten = clamp((cy - 10) / Math.max(ry * shrink, 1), 0.35, 1);
  return {
    x: cx + rx * shrink * Math.cos(theta),
    y: cy + ry * shrink * Math.sin(theta) * flatten,
  };
}

/** Size along the flight (log scale between big and small). */
function sizeAt(scene: Scene, u: number) {
  const k = smooth(clamp((u - 0.06) / 0.7, 0, 1));
  return scene.big * Math.pow(scene.small / scene.big, k);
}

/** Position during the flight at time fraction τ (0…1). */
function flightAt(scene: Scene, tau: number) {
  const u = warp(tau);
  const p = track(scene, u);
  return { x: p.x, y: p.y, size: sizeAt(scene, u) };
}

const rest = (x: number, y: number, size: number): Pose => ({
  x,
  y,
  size,
  angle: 0,
  squash: IDENTITY,
  look: null,
});

/**
 * The star's pose `t` seconds after the hold began. `hold` is the hold's
 * length (HOLD, or shorter). Past the end it returns the target at rest.
 */
export function poseAt(scene: Scene, t: number, hold: number = HOLD): Pose {
  const turn = scene.tx - scene.sx <= 0 ? -1 : 1;

  // Hold: big in the middle, breathing very slightly.
  if (t < hold) {
    const p = t / hold;
    const breath = Math.sin(Math.PI * p);
    return rest(scene.sx, scene.sy - 2 * breath, scene.big * (1 + 0.012 * breath));
  }

  // Wind-up: crouch, lean back, glance where it's going.
  if (t < hold + WIND) {
    const p = (t - hold) / WIND;
    const crouch = Math.sin((Math.PI / 2) * p) ** 2;
    return {
      x: scene.sx,
      y: scene.sy + 0.07 * scene.big * crouch,
      size: scene.big,
      angle: -turn * 0.14 * crouch,
      squash: mix(IDENTITY, CROUCH, crouch),
      look: { x: turn * 0.35 * crouch, y: -0.75 * crouch },
    };
  }

  // Flight.
  if (t < hold + WIND + FLY) {
    const tau = (t - hold - WIND) / FLY;
    const h = 1 / 480;
    const a = flightAt(scene, tau - h);
    const b = flightAt(scene, tau);
    const c = flightAt(scene, tau + h);
    const dt = h * FLY;
    const vx = (c.x - a.x) / (2 * dt);
    const vy = (c.y - a.y) / (2 * dt);
    const ax = (c.x - 2 * b.x + a.x) / (dt * dt);
    const speed = Math.hypot(vx, vy);
    const size = b.size;
    const bodies = speed / size; // body lengths per second

    // The crouch lets go over the first 90ms.
    const release = Math.max(0, 1 - (tau * FLY) / 0.09);
    const crouch = release * release;

    // Stretch and bank ease out over the last 10% of the flight, so the
    // star touches down level and round.
    const settle = smooth(clamp((1 - tau) / 0.1, 0, 1));
    const stretch = 1 + 0.3 * Math.tanh(bodies / 22) * settle;
    const bank = (0.42 * Math.tanh(ax / size / 160) + 0.16 * Math.tanh(vx / size / 30)) * settle;
    const angle = bank * (1 - crouch) - turn * 0.14 * crouch;

    // Look where it's flying (in the star's own frame), fading out as it
    // slows into the landing.
    const lookWeight = Math.min(1, bodies / 6) * (1 - crouch) + crouch;
    let lx = speed > 1e-3 ? vx / speed : 0;
    let ly = speed > 1e-3 ? vy / speed : -1;
    if (crouch > 0) {
      lx = lx * (1 - crouch) + turn * 0.35 * crouch;
      ly = ly * (1 - crouch) - 0.75 * crouch;
    }
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const look = {
      x: (lx * cos - ly * sin) * 0.9 * lookWeight,
      y: (lx * sin + ly * cos) * 0.9 * lookWeight,
    };

    const axis = speed > 1e-3 ? Math.atan2(vy, vx) : VERTICAL;
    // The crouch's squash hands over to the velocity stretch.
    const flying = squash(axis, stretch, 1 / Math.pow(stretch, 0.6));
    return {
      x: b.x,
      y: b.y + 0.07 * scene.big * crouch,
      size,
      angle,
      squash: mix(flying, CROUCH, crouch),
      look,
    };
  }

  // Landing: overshoot bounce, then rest.
  const q = t - hold - WIND - FLY;
  if (q < LAND) {
    const decay = Math.exp(-q / 0.075);
    const wave = Math.sin((2 * Math.PI * q) / 0.2);
    const fade = 1 - smooth(q / LAND); // guarantees an exact zero at the end
    const pop = 0.17 * decay * wave * fade;
    const flat = 0.14 * decay * wave * fade;
    const hop = 0.22 * scene.small * decay * Math.sin((2 * Math.PI * q) / 0.24) * fade;
    return {
      x: scene.tx,
      y: scene.ty - hop,
      size: scene.small * (1 + pop),
      angle: 0,
      squash: squash(VERTICAL, 1 - flat, 1 + flat * 0.7),
      look: null,
    };
  }

  return rest(scene.tx, scene.ty, scene.small);
}

/**
 * The CSS matrix() that puts a `big`-px square element (transform-origin
 * at its top left) at the pose.
 */
export function poseMatrix(pose: Pose, big: number): string {
  const k = pose.size / big;
  const [s00, s01, s11] = pose.squash;
  // Squash/stretch · tilt · size.
  const rc = Math.cos(pose.angle) * k;
  const rs = Math.sin(pose.angle) * k;
  const m00 = s00 * rc + s01 * rs;
  const m01 = -s00 * rs + s01 * rc;
  const m10 = s01 * rc + s11 * rs;
  const m11 = -s01 * rs + s11 * rc;
  const half = big / 2;
  const e = pose.x - (m00 + m01) * half;
  const f = pose.y - (m10 + m11) * half;
  const n = (value: number) => Math.round(value * 10000) / 10000;
  return `matrix(${n(m00)}, ${n(m10)}, ${n(m01)}, ${n(m11)}, ${n(e)}, ${n(f)})`;
}
