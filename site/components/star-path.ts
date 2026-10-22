// The first-load star's choreography (components/star-intro.tsx): pure
// functions of time, no DOM, so every beat can be sampled and tested.
//
// Beats (seconds since the star became visible; about 2.6s in all; the
// page is revealed from the mark at touch-down, components/star-reveal.ts):
//   pop    0.36  CSS: the star pops in, big, in the middle of the screen
//   look         CSS keeps it alive before hydration: it breathes, and
//                blinks once at BLINK_AT. The flight launches once the blink
//                is over (and the page has hydrated and runs smoothly)
//   wind   0.16  anticipation: crouches (squash), leans back, glances up
//   fly   ~1.15  the flight home (its length depends on the screen)
//   land   0.50  touch-down: one soft squash and a small rebound that
//                rings down; over its last HANDOFF it fades onto the header
//                mark, already shown underneath
//
// Flight path
// -----------
// Planned once at launch (`planFlight`) from the screen, the start (the
// viewport centre) and the target (the header mark), in three pieces:
//
//   loop   an ellipse beside the start, on the target's side, entered at
//          its near edge heading straight up and travelled once (rolling
//          towards the target over the top). Its centre drifts up and
//          towards the target meanwhile, so the end of the loop crosses its
//          start: a real loop with daylight in the middle. Radii: a fifth
//          of the viewport height (70-175px), narrower when that side is
//          short of room (phones), and never more than 1.8:1.
//   swoop  a cubic Bézier from the end of the loop (heading up) to a point
//          three mark-sizes up and to the right of the mark, arriving
//          already pointed at it.
//   dive   a short straight run onto the mark, so it lands with speed.
//
// A soft clamp keeps the whole star (its size included) inside the screen.
//
// Size: eases on a log scale through fixed beats: 66% of the start size at
// the top of the loop, 40% at its end, 1.75× the mark's size where the
// dive starts and the mark's size on contact (a monotone cubic in between,
// so the shrink starts with the launch and never stalls).
//
// Timing: the path is retimed by arc length. The speed ramps up out of the
// crouch to a cruise speed proportional to the start size, softly capped
// at SPEED_CAP body lengths per second: the star never moves more than
// about 0.45 of its own size per 60Hz frame, so it reads as one star
// flying, not a strobe. As the star shrinks the cap brakes it, down to
// ~8px a frame on contact.
//
// Cartoon physics, from the retimed path (central differences on a 240Hz
// table, then smoothed over ~20ms so no term can snap between frames):
//   spin     through the loop the star turns once, evenly (like a car on a
//            roller-coaster loop), then hands over to a bank;
//   bank     leans into its horizontal speed and pull, scaled by the start
//            size (not the current one, which would saturate);
//   stretch  along the velocity by body lengths per second (up to ~1.45×),
//            the cross axis thinned to keep the area: a cartoon smear;
//   gaze     the eyes look where it is flying.
// Landing: a soft squash on contact that springs back through a slight
// stretch as it rebounds a fifth of its size, then settles, with every term
// back to exactly zero before the hand-off: the real mark is faded in
// under it, then the star fades out on top, so nothing can pop. It is pure
// and sampled ahead, so the flight can play it as a compositor animation.

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
  /** The star's own tilt (rad, clockwise; whole turns are allowed). */
  angle: number;
  /** Squash and stretch, as a symmetric 2×2 matrix [xx, xy, yy] (identity
      at rest). Built by `squash()`; blending two of them stays smooth. */
  squash: [number, number, number];
  /** Gaze override (-1…1, in the star's own frame), or null to follow the
      pointer. */
  look: { x: number; y: number } | null;
  /** 1 unless fading out. */
  opacity: number;
};

/** The CSS breathing the star does before the flight takes over (read back
    at take-over and eased out during the wind-up). */
export type Breath = { scale: number; dy: number };
export const NO_BREATH: Breath = { scale: 1, dy: 0 };

/** sessionStorage key: set once the intro has played in this tab. */
export const INTRO_KEY = "star-intro";
/** Attribute on <html> while the intro runs ("" before hydration, then
    "live"). The header mark is hidden while it is there. */
export const INTRO_ATTR = "data-star-intro";
/** Attribute on <html> while the page is veiled (everything but the star
    hidden; "" before hydration, then "live"). It goes when the star lands
    and the page is revealed (components/star-reveal.ts). */
export const VEIL_ATTR = "data-intro-veil";
/** Fired on window once the intro is over and the page is revealed
    (window.__starIntro.done is then true; window.__starIntro is undefined
    when no intro plays at all). Heavy start-up work (WebGL) can wait for
    it. */
export const DONE_EVENT = "star-intro-done";
/** If the page never hydrates, CSS gives up on the intro after this many
    seconds: the star fades out and the page fades in. The flight skips the
    intro when it mounts later than half a second before that. */
export const FAILSAFE_S = 3.5;

/** The CSS pop-in that shows the star before hydration. */
export const POP = 0.36;
/** The CSS blink: when it starts (after the pop starts) and how long. */
export const BLINK_AT = 0.5;
export const BLINK_LEN = 0.23;
/** A beat of looking at the visitor after the blink before launching. */
export const AFTER_BLINK = 0.14;
export const WIND = 0.16;
export const LAND = 0.5;
/** The last part of the landing, over which the star fades out onto the
    header mark (shown underneath just before). */
export const HANDOFF = 0.12;
/** A skip dashes home in this long. */
export const ZIP = 0.16;
/** When the mark scrolls away mid-flight: dash up and fade in this long. */
export const FADE = 0.15;

/** Body lengths per second the flight never exceeds (0.45 a frame). */
const SPEED_CAP = 27;
/** Cruise speed, in start sizes per second. */
const CRUISE = 13.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smooth = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

type Mat = [number, number, number];

/** Scale by `along` in the direction `axis` (rad) and by `across` at right
    angles to it: R(axis) · diag(along, across) · R(-axis). */
function squash(axis: number, along: number, across: number): Mat {
  const c = Math.cos(axis);
  const s = Math.sin(axis);
  return [along * c * c + across * s * s, (along - across) * c * s, along * s * s + across * c * c];
}

const mix = (a: Mat, b: Mat, t: number): Mat => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Stretch for a speed in body lengths per second (1 at rest). */
const stretchFor = (bodies: number) => 1 + 0.55 * Math.tanh(bodies / 20);

const VERTICAL = Math.PI / 2;
/** The crouch before take-off: 16% shorter, 10% wider. */
const CROUCH = squash(VERTICAL, 1 - 0.16, 1.1);
const IDENTITY: Mat = [1, 0, 1];
/** Lean back during the crouch (rad, away from the target). */
const LEAN = 0.14;
/** How far it sinks into the crouch (fraction of its size). */
const SINK = 0.07;

const turnOf = (scene: Scene) => (scene.tx - scene.sx <= 0 ? -1 : 1);

/** The same angle in -π…π. */
const normalize = (angle: number) => angle - 2 * Math.PI * Math.round(angle / (2 * Math.PI));

export const rest = (x: number, y: number, size: number): Pose => ({
  x,
  y,
  size,
  angle: 0,
  squash: IDENTITY,
  look: null,
  opacity: 1,
});

/* ---------------------------------------------------------------------- */
/* planning                                                                */
/* ---------------------------------------------------------------------- */

/** Plan table step (s). */
const STEP = 1 / 240;

export type Plan = {
  /** The scene it was planned for (the live one is applied as an offset). */
  scene: Scene;
  /** Flight length (s). */
  fly: number;
  count: number;
  x: Float64Array;
  y: Float64Array;
  size: Float64Array;
  /** Unwrapped (the loop's whole turn is in there). */
  angle: Float64Array;
  s0: Float64Array;
  s1: Float64Array;
  s2: Float64Array;
  /** Look direction, in the world frame. */
  lx: Float64Array;
  ly: Float64Array;
  /** 0 → 1: how much of a move of the live target the path follows (the
      start follows the rest). */
  follow: Float64Array;
};

/** Monotone cubic (Fritsch-Carlson) through (xs, ys). */
function monotone(xs: number[], ys: number[]) {
  const n = xs.length;
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m.push(d[0]);
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  m.push(d[n - 2]);
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

/** Keeps `v` above `lo` softly: unchanged above lo + k, easing towards lo
    below it (C1, so a path bent by it stays smooth). */
function soft(v: number, lo: number, k: number) {
  return v >= lo + k ? v : lo + k * Math.exp((v - lo) / k - 1);
}

/** Gaussian smoothing of a uniform table (in place; the ends are held). */
function blur(values: Float64Array, sigma: number) {
  const radius = Math.ceil(sigma * 3);
  const weights: number[] = [];
  for (let i = -radius; i <= radius; i++) weights.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const copy = Float64Array.from(values);
  const n = values.length;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let total = 0;
    for (let j = -radius; j <= radius; j++) {
      const k = clamp(i + j, 0, n - 1);
      const w = weights[j + radius];
      sum += copy[k] * w;
      total += w;
    }
    values[i] = sum / total;
  }
}

/** The flight path as a polyline, with the sample indices of its beats. */
function track(scene: Scene) {
  const { vw, vh, sx, sy, big, small } = scene;
  const turn = turnOf(scene);
  // Built as if the target were to the left, then mirrored back.
  const back = (x: number) => (turn < 0 ? x : 2 * sx - x);
  const tx = back(scene.tx);
  const ty = scene.ty;
  const room = turn < 0 ? sx : vw - sx;

  // The far side of the loop sits ~2.1 rx from the start, where the star is
  // about half its start size. The loop is kept within 1.8:1 either way.
  const wide = clamp((room - 10 - big * 0.27) / 2.11, 44, 175);
  const ry = clamp(Math.min(vh * 0.2, wide * 1.8), 70, 175);
  const rx = Math.min(wide, ry * 1.8);
  const c0x = sx - rx;
  const c0y = sy;
  const driftX = -0.22 * rx;
  const driftY = -0.3 * ry;

  const xs: number[] = [];
  const ys: number[] = [];
  /** How far round the loop (0…1; 1 after it). */
  const phase: number[] = [];
  const LOOP = 720;
  for (let i = 0; i <= LOOP; i++) {
    const f = i / LOOP;
    const theta = -2 * Math.PI * f;
    const d = smooth(f);
    phase.push(f);
    xs.push(c0x + driftX * d + rx * Math.cos(theta));
    ys.push(c0y + driftY * d + ry * Math.sin(theta));
  }
  const ex = sx + driftX;
  const ey = sy + driftY;

  // The dive: three mark-sizes long, 20° below the horizontal, from the
  // right (the side the star comes from).
  const slope = (20 * Math.PI) / 180;
  const run = 3 * small;
  const ax = tx + run * Math.cos(slope);
  const ay = ty - run * Math.sin(slope);

  // The swoop: leaves the loop heading up, arrives pointed at the mark.
  const lift = 0.55 * Math.max(60, ey - ay);
  const reach = clamp(0.45 * Math.abs(ex - ax), 40, 160);
  const p1x = ex;
  const p1y = ey - lift;
  const p2x = ax + reach * Math.cos(slope);
  const p2y = ay - reach * Math.sin(slope);
  const SWOOP = 600;
  for (let i = 1; i <= SWOOP; i++) {
    const t = i / SWOOP;
    const s = 1 - t;
    phase.push(1);
    xs.push(s * s * s * ex + 3 * s * s * t * p1x + 3 * s * t * t * p2x + t * t * t * ax);
    ys.push(s * s * s * ey + 3 * s * s * t * p1y + 3 * s * t * t * p2y + t * t * t * ay);
  }
  const DIVE = 60;
  for (let i = 1; i <= DIVE; i++) {
    const t = i / DIVE;
    phase.push(1);
    xs.push(ax + (tx - ax) * t);
    ys.push(ay + (ty - ay) * t);
  }
  for (let i = 0; i < xs.length; i++) xs[i] = back(xs[i]);
  return {
    xs,
    ys,
    phase,
    marks: [0, LOOP / 4, LOOP, LOOP + SWOOP, LOOP + SWOOP + DIVE],
    turn,
    big,
    small,
    vw,
    vh,
  };
}

/**
 * Plans the flight for a scene: the path, its timing and the cartoon
 * physics, as a table sampled at 240Hz. Cheap (a few thousand samples);
 * done once at launch.
 */
export function planFlight(scene: Scene): Plan {
  const { xs, ys, phase, marks, turn, big, small, vw, vh } = track(scene);
  const n = xs.length;

  // Arc length of the raw path, for the size beats.
  const arc = new Float64Array(n);
  for (let i = 1; i < n; i++) arc[i] = arc[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  const total = arc[n - 1] || 1;
  const beat = marks.map((index) => arc[index] / total);
  // The way round the loop by distance, so the spin is even in time.
  for (let i = 0; i <= marks[2]; i++) phase[i] = arc[i] / arc[marks[2]];
  const end = Math.log(small / big);
  const dive = Math.min(Math.log((1.75 * small) / big), Math.log(0.4) - 0.1);
  const logSize = monotone(beat, [0, Math.log(0.66), Math.log(0.4), dive, end]);
  const size = new Float64Array(n);
  for (let i = 0; i < n; i++) size[i] = big * Math.exp(logSize(arc[i] / total));
  size[n - 1] = small;

  // Keep the star on screen (but never move the end).
  for (let i = 0; i < n - 1; i++) {
    const margin = 4 + 0.6 * size[i];
    const band = 0.5 * size[i];
    ys[i] = soft(ys[i], margin, band);
    ys[i] = vh - soft(vh - ys[i], margin, band);
    xs[i] = soft(xs[i], margin, band);
    xs[i] = vw - soft(vw - xs[i], margin, band);
  }

  // Retime by arc length: dt = ds / v.
  const time = new Float64Array(n);
  const cruise = CRUISE * big;
  const ramp = 0.9 * big;
  const speed = (index: number, distance: number) => {
    const eased = 1 - (1 - clamp(distance / ramp, 0, 1)) ** 2;
    const want = cruise * (0.18 + 0.82 * eased);
    const cap = SPEED_CAP * size[index];
    return (want ** -4 + cap ** -4) ** -0.25;
  };
  let walked = 0;
  let last = speed(0, 0);
  for (let i = 1; i < n; i++) {
    const ds = Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    walked += ds;
    const v = speed(i, walked);
    time[i] = time[i - 1] + (ds * (1 / last + 1 / v)) / 2;
    last = v;
  }
  const fly = time[n - 1];

  // Resample on a uniform clock.
  const count = Math.ceil(fly / STEP) + 1;
  const plan: Plan = {
    scene,
    fly,
    count,
    x: new Float64Array(count),
    y: new Float64Array(count),
    size: new Float64Array(count),
    angle: new Float64Array(count),
    s0: new Float64Array(count),
    s1: new Float64Array(count),
    s2: new Float64Array(count),
    lx: new Float64Array(count),
    ly: new Float64Array(count),
    follow: new Float64Array(count),
  };
  const sigma = new Float64Array(count);
  const round = new Float64Array(count);
  let j = 0;
  for (let k = 0; k < count; k++) {
    const t = Math.min(k * STEP, fly);
    while (j < n - 2 && time[j + 1] < t) j++;
    const span = time[j + 1] - time[j] || 1;
    const f = clamp((t - time[j]) / span, 0, 1);
    plan.x[k] = xs[j] + (xs[j + 1] - xs[j]) * f;
    plan.y[k] = ys[j] + (ys[j + 1] - ys[j]) * f;
    plan.size[k] = size[j] * Math.pow(size[j + 1] / size[j], f);
    sigma[k] = (arc[j] + (arc[j + 1] - arc[j]) * f) / total;
    round[k] = phase[j] + (phase[j + 1] - phase[j]) * f;
  }
  plan.x[count - 1] = scene.tx;
  plan.y[count - 1] = scene.ty;
  plan.size[count - 1] = small;

  // Velocity and horizontal acceleration (central differences).
  const vx = new Float64Array(count);
  const vy = new Float64Array(count);
  for (let k = 0; k < count; k++) {
    const a = Math.max(0, k - 1);
    const b = Math.min(count - 1, k + 1);
    vx[k] = (plan.x[b] - plan.x[a]) / ((b - a) * STEP);
    vy[k] = (plan.y[b] - plan.y[a]) / ((b - a) * STEP);
  }
  const ax = new Float64Array(count);
  for (let k = 0; k < count; k++) {
    const a = Math.max(0, k - 1);
    const b = Math.min(count - 1, k + 1);
    ax[k] = (vx[b] - vx[a]) / ((b - a) * STEP);
  }

  // Orientation: through the loop the star turns once, evenly with the
  // distance flown (on a round loop that is its heading: up at the start
  // and the end, upside down at the far side), so it never whips round the
  // tight ends of a narrow loop. After the loop, a bank. The two blend
  // around the end of the loop, where both are "up". Angles stay unwrapped
  // (a whole turn is invisible, and the smoothing below needs them
  // continuous).
  const loopEnd = beat[2];
  const turned = turn * 2 * Math.PI;
  for (let k = 0; k < count; k++) {
    const bank = 0.3 * Math.tanh(vx[k] / (9 * big)) + 0.24 * Math.tanh(ax[k] / (90 * big));
    const hand = smooth((sigma[k] - (loopEnd - 0.05)) / 0.12);
    plan.angle[k] = turned * round[k] * (1 - hand) + (turned + bank) * hand;
  }

  // Stretch along the velocity; look where it's going.
  for (let k = 0; k < count; k++) {
    const v = Math.hypot(vx[k], vy[k]);
    const bodies = v / plan.size[k];
    const stretch = stretchFor(bodies);
    const axis = v > 1e-3 ? Math.atan2(vy[k], vx[k]) : VERTICAL;
    const m = squash(axis, stretch, 1 / Math.pow(stretch, 0.6));
    plan.s0[k] = m[0];
    plan.s1[k] = m[1];
    plan.s2[k] = m[2];
    const weight = Math.min(1, bodies / 6) * 0.9;
    plan.lx[k] = v > 1e-3 ? (vx[k] / v) * weight : 0;
    plan.ly[k] = v > 1e-3 ? (vy[k] / v) * weight : -0.9;
    plan.follow[k] = smooth((sigma[k] - 0.3) / 0.6);
  }
  plan.follow[count - 1] = 1;

  // Smooth over ~20ms so no term can snap between two frames.
  const width = 0.02 / STEP;
  [plan.angle, plan.s0, plan.s1, plan.s2, plan.lx, plan.ly].forEach((values) => blur(values, width));

  // The crouch lets go over the first 90ms: squash, lean, sink and glance.
  for (let k = 0; k < count; k++) {
    const release = Math.max(0, 1 - (k * STEP) / 0.09);
    const crouch = release * release;
    if (crouch <= 0) break;
    plan.angle[k] = plan.angle[k] * (1 - crouch) - turn * LEAN * crouch;
    const m = mix([plan.s0[k], plan.s1[k], plan.s2[k]], CROUCH, crouch);
    plan.s0[k] = m[0];
    plan.s1[k] = m[1];
    plan.s2[k] = m[2];
    plan.y[k] += SINK * big * crouch;
    plan.lx[k] = plan.lx[k] * (1 - crouch) + turn * 0.35 * crouch;
    plan.ly[k] = plan.ly[k] * (1 - crouch) - 0.75 * crouch;
  }
  return plan;
}

/* ---------------------------------------------------------------------- */
/* poses                                                                   */
/* ---------------------------------------------------------------------- */

/** A look in the world frame, turned into the star's own frame. */
function own(lx: number, ly: number, angle: number) {
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  return { x: lx * c - ly * s, y: lx * s + ly * c };
}

function windPose(scene: Scene, p: number, breath: Breath): Pose {
  const turn = turnOf(scene);
  const crouch = Math.sin((Math.PI / 2) * clamp(p, 0, 1)) ** 2;
  const fading = 1 - smooth(p);
  return {
    x: scene.sx,
    y: scene.sy + SINK * scene.big * crouch + breath.dy * fading,
    size: scene.big * (1 + (breath.scale - 1) * fading),
    angle: -turn * LEAN * crouch,
    squash: mix(IDENTITY, CROUCH, crouch),
    look: { x: turn * 0.35 * crouch, y: -0.75 * crouch },
    opacity: 1,
  };
}

function flightPose(plan: Plan, t: number, live: Scene): Pose {
  const at = clamp(t / STEP, 0, plan.count - 1);
  const k = Math.min(Math.floor(at), plan.count - 2);
  const f = at - k;
  const lerp = (values: Float64Array) => values[k] + (values[k + 1] - values[k]) * f;
  const follow = lerp(plan.follow);
  const angle = lerp(plan.angle);
  return {
    x: lerp(plan.x) + (live.tx - plan.scene.tx) * follow + (live.sx - plan.scene.sx) * (1 - follow),
    y: lerp(plan.y) + (live.ty - plan.scene.ty) * follow + (live.sy - plan.scene.sy) * (1 - follow),
    size: plan.size[k] * Math.pow(plan.size[k + 1] / plan.size[k], f),
    angle,
    squash: [lerp(plan.s0), lerp(plan.s1), lerp(plan.s2)],
    look: own(lerp(plan.lx), lerp(plan.ly), angle),
    opacity: 1,
  };
}

/** The landing's vertical form (<0 squash, >0 stretch) and rebound height
    (in mark sizes), q seconds after contact: a damped spring that starts
    squashing at once, and a lift that floats up and down with no corners. */
function settle(q: number): { lift: number; form: number } {
  const form = -0.3 * Math.exp(-q / 0.09) * Math.sin((2 * Math.PI * q) / 0.2);
  const u = clamp((q - 0.07) / 0.2, 0, 1);
  const lift = 0.26 * Math.sin(Math.PI * smooth(u));
  return { lift, form };
}

function landPose(plan: Plan, q: number, live: Scene): Pose {
  const small = plan.scene.small;
  const { lift, form: raw } = settle(q);
  // everything at rest before the hand-off begins
  const calm = 1 - smooth(q / (LAND - HANDOFF));
  const form = raw * calm;
  const formed: Mat =
    form < 0 ? squash(VERTICAL, 1 + form, 1 - 0.67 * form) : squash(VERTICAL, 1 + form, 1 / (1 + form) ** 0.6);
  // Hand over from the flight's last stretch and tilt.
  const last = plan.count - 1;
  const flown: Mat = [plan.s0[last], plan.s1[last], plan.s2[last]];
  return {
    x: live.tx,
    y: live.ty - lift * calm * small,
    size: small,
    angle: normalize(plan.angle[last]) * (1 - smooth(q / 0.12)),
    squash: mix(flown, formed, smooth(q / 0.045)),
    look: null,
    opacity: 1 - smooth((q - (LAND - HANDOFF)) / HANDOFF),
  };
}

/** Length of the intro from launch (wind-up + flight + landing). */
export const introLength = (plan: Plan) => WIND + plan.fly + LAND;

/** Seconds from launch at which the star touches down. */
export const touchdown = (plan: Plan) => WIND + plan.fly;

/**
 * The star's pose `t` seconds after launch (the start of the wind-up), in
 * the live scene (the mark may have moved since the plan was made). Past
 * the end it returns the target at rest.
 */
export function introPose(plan: Plan, t: number, live: Scene, breath: Breath = NO_BREATH): Pose {
  if (t < WIND) return windPose(live, t / WIND, breath);
  if (t < WIND + plan.fly) return flightPose(plan, t - WIND, live);
  const q = t - WIND - plan.fly;
  if (q < LAND) return landPose(plan, q, live);
  return rest(live.tx, live.ty, plan.scene.small);
}

/**
 * A quick dash from `from` to `to`, `p` (0…1) of the way through a dash
 * `length` seconds long: off at once (no hesitation after a click), braking
 * to a stop on arrival, resized on a log scale, smeared along the dash
 * while it is fast, level and round on arrival. Skipping uses it to get
 * home; with `fade` it fades out on the way (when home has scrolled
 * off-screen).
 */
export function dashPose(
  from: Pose,
  to: { x: number; y: number; size: number },
  p: number,
  length: number,
  fade = false,
): Pose {
  const c = clamp(p, 0, 1);
  // Cubic with slope 1.5 at the start and 0 at the end.
  const e = c * (1.5 - 0.5 * c * c);
  const rate = 1.5 * (1 - c * c); // de/dp
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const size = from.size * Math.pow(to.size / from.size, e);
  // Round again by the end, so the hand-off can't snap.
  const settle = 1 - smooth((c - 0.55) / 0.45);
  const stretch = 1 + (stretchFor((distance * rate) / length / size) - 1) * settle;
  const axis = distance > 1e-3 ? Math.atan2(dy, dx) : VERTICAL;
  const angle = normalize(from.angle) * (1 - e);
  const aim = 0.9 * (1 - e);
  return {
    x: from.x + dx * e,
    y: from.y + dy * e,
    size,
    angle,
    squash: mix(from.squash, squash(axis, stretch, 1 / Math.pow(stretch, 0.6)), smooth(c / 0.35)),
    look: distance > 1e-3 ? own((dx / distance) * aim, (dy / distance) * aim, angle) : null,
    opacity: fade ? from.opacity * (1 - smooth(c)) : from.opacity,
  };
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
