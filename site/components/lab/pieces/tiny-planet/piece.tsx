"use client";

// Tiny planet: a small low-poly world you spin with your hand.
//
// The look
// - A toy planet floating in the stage's studio light: faceted land in
//   soft, slightly chalky colours (beaches, meadows, forests, dry plains,
//   hills, rock, snow, polar ice), a sea that is clear over the shelves
//   and deep blue further out, with facet-broken glints of the sun; little
//   two-tier pines on the forests; low-poly cloud banks drifting with the
//   trade winds and the westerlies and laying soft shadows on the ground;
//   an atmosphere that rims the day side in pale blue, turns amber along
//   the terminator and glows from behind after dark.
// - A day/night terminator that stays put while the planet turns under
//   it: as land rolls into the night, its towns switch on one by one
//   (each light has its own dusk), warm and twinkling, and they go out
//   again at dawn. A cratered moon rides a tilted, dotted orbit, passing
//   in front (and laying an eclipse shadow when it crosses the sun) and
//   behind; it darkens in the planet's shadow.
// - Light theme: the sun is in front and to the left, so most of what you
//   see is day with a band of evening and night on the right. Dark theme:
//   the sun is behind, a bright crescent on the left and the night side's
//   towns across the face, stars in the studio. Switching the theme swings
//   the sun round and the lights cascade on (or off).
//
// The motion model (motion.ts)
// - Grab the planet anywhere on it and the point under your finger stays
//   under your finger (arcball), on a stiff critically damped spring, so
//   it trails by a frame or two and never jitters. Drag off the planet
//   and it turns by the drag, like rolling a ball under your palm.
// - Let go and it keeps the speed of your hand (measured over the last
//   80 ms of the drag; a hand that stopped before letting go doesn't
//   throw). Spin about its own axis glides on for seconds and settles back
//   into the slow idle day; tumble across the axis is pulled upright by a
//   soft, slightly under-damped spring, so a wild throw ends with the
//   planet righting itself like a top, with a small wobble.
// - Everything is interruptible: grabbing a spinning planet catches it
//   where it is (with a little give, and a soft thump), and you can throw
//   it again at once.
// - Secondary motion: the cloud layer rides a lagging copy of the turn (a
//   spring between its speed and the planet's), so clouds trail when you
//   spin it up and slosh past when it stops; the pines lean with the same
//   air; a fast spin bulges the equator; the sea gets choppier. A press
//   squashes the planet a touch and it springs back when released.
// - The moon can be held and dragged along its orbit, or thrown round; it
//   drifts back to its own pace. A tap sends it on a little faster.
// - The "wow" second: the stage opens with the planet arriving in a spin,
//   tipped, with its towns dark, while the moon sweeps across its face;
//   it spins down, rights itself with a wobble and the night side lights
//   up town by town.
// - Keyboard (the planet is focusable): ← → turn it an hour (Shift: six),
//   ↑ ↓ nudge the moon, Space or Enter give it a spin, Home stops it.
// - Readout: the days that go by as it turns (one per turn about its axis,
//   counting down if you turn it back) and how long a day lasts at this
//   speed.
// - Sound (stage, after a gesture, lab mute respected): a whirr that rises
//   with the spin, a soft wooden tick per day, a thump when you catch it,
//   a glassy note for the moon.
// - Tile: the day turns on its own (a day in fifteen seconds), the moon
//   goes round, the clouds drift and the towns twinkle; under the mouse it
//   spins up. 30 fps, lighter geometry, no sound, no controls.
// - Reduced motion: a still planet, moon and clouds; it still turns when
//   you drag it (exactly with your hand, no throw), and keys step at once.
// - Lifetime: geometry is built once per mode and kept; nothing allocates
//   per frame; the idle stage drops to 30 fps; a machine that can't keep
//   up gets a lower pixel ratio; the loop stops offscreen and in hidden
//   tabs; the WebGL context is handed back on unmount (useWebGL2).
//
// Files: world.ts (geometry), motion.ts (physics), math.ts, shaders.ts +
// renderer.ts (WebGL2), sound.ts, icons.tsx.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ensureAudio } from "../../audio";
import { clamp, damp, lerp, Spring, useFinePointer, useFrame, useLatest, useWebGL2 } from "../../hooks";
import type { PieceProps, PieceTheme } from "../../types";
import { IconButton, MuteButton, StageControls, StageHint, Tray, TrayDivider } from "../../ui";
import { SpinIcon } from "./icons";
import { arcQ, axisAngleQ, len3, mat3FromQ, mulQ, qToRotVec, quat, rotVecQ, v3, viewProjection } from "./math";
import { MOON_RADIUS, ORBIT_N, ORBIT_U, ORBIT_V, Planet } from "./motion";
import { newFrame, PlanetRenderer, type Frame } from "./renderer";
import { caught, tick, tink, Whirr } from "./sound";
import { buildWorld, DETAIL, type World } from "./world";

/* ---------------------------------------------------------------------- */
/* tuning                                                                  */
/* ---------------------------------------------------------------------- */

const FOV = (22 * Math.PI) / 180;
const TAN = Math.tan(FOV / 2);
const TAU = Math.PI * 2;

const unit = (x: number, y: number, z: number) => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l] as const;
};
/** Toward the sun: in front and to the left by day, behind and to the left after dark. */
const SUN_LIGHT = unit(-0.84, 0.28, 0.44);
const SUN_DARK = unit(-0.74, 0.3, -0.6);

/** Which side faces you at rest (turn about the axis, radians). */
const START_SPIN = 2.4;
const IDLE = { stage: 0.16, tile: 0.42, hover: 1.35 };
const MOON_PACE = { stage: 0.24, tile: 0.46 };
const ORBIT = { stage: 1.78, narrow: 1.6, tile: 1.5 };
/** The stage's opening spin (rad/s) and tip (rad). */
const INTRO_SPIN = 5.2;
const INTRO_TIP = 0.62;
const KEY_TURN = Math.PI / 12;
const KICK = 9.5;
/** Equator stretch per (rad/s)² of spin, and its cap. */
const BULGE = 5.5e-4;
const BULGE_MAX = 0.075;
/** Pixel-ratio caps the stage steps through if frames run slow. */
const DPR_STEPS = [2, 1.5, 1.2] as const;

type Rgb = [number, number, number];

function parseColour(value: string, fallback: Rgb): Rgb {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  const parts = v.match(/[\d.]+/g);
  if (parts && parts.length >= 3) return [+parts[0] / 255, +parts[1] / 255, +parts[2] / 255];
  return fallback;
}

/** Geometry is built once per mode and shared by every mount. */
const worlds: Partial<Record<"tile" | "stage", World>> = {};
function worldFor(mode: "tile" | "stage"): World {
  return (worlds[mode] ??= buildWorld(DETAIL[mode]));
}

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

type Layout = {
  width: number;
  height: number;
  /** Planet centre and radius in CSS px. */
  cx: number;
  cy: number;
  r: number;
  /** Camera distance and the lens shift that puts the planet at (cx, cy). */
  dist: number;
  sx: number;
  sy: number;
};

function layoutFor(width: number, height: number, stage: boolean, orbit: number, out: Layout): Layout {
  let cx = width / 2;
  let cy = height / 2;
  let r: number;
  if (stage) {
    const narrow = width < 560;
    const bottom = narrow ? 92 : 102;
    const top = narrow ? 12 : 22;
    const avail = Math.max(80, height - bottom - top);
    r = Math.min(avail / 2.55, (width / 2 - 14) / (orbit + 0.24));
    cy = top + avail / 2;
  } else {
    r = Math.min(height / 2.6, (width / 2 - 4) / (orbit + 0.2));
  }
  r = Math.max(10, r);
  const f = height / 2 / TAN;
  const dist = 1 / Math.sin(Math.atan(r / f));
  out.width = width;
  out.height = height;
  out.cx = cx;
  out.cy = cy;
  out.r = r;
  out.dist = dist;
  out.sx = (cx - width / 2) / (width / 2);
  out.sy = -(cy - height / 2) / (height / 2);
  return out;
}

/* ---------------------------------------------------------------------- */
/* live state                                                              */
/* ---------------------------------------------------------------------- */

type Drag = {
  id: number;
  kind: "planet" | "moon";
  /** Pressed on the planet itself (arcball) or beside it (roll by the drag). */
  onPlanet: boolean;
  x: number;
  y: number;
  x0: number;
  y0: number;
  moved: boolean;
  /** Last point on the sphere under the finger (world, unit). */
  last: Float64Array;
  /** Recent samples: event time (s) and rotation vector (planet) or angle (moon). */
  ts: Float64Array;
  rs: Float64Array;
  n: number;
};

type Live = {
  planet: Planet;
  press: Spring;
  moonHold: Spring;
  theme: Spring;
  themeName: PieceTheme;
  reduced: boolean;
  time: number;
  acc: number;
  lastInput: number;
  lights: number;
  introAt: number;
  hovering: boolean;
  hover: number;
  frame: Frame;
  layout: Layout;
  drag: Drag | null;
  dayOffset: number;
  day: number;
  shownRate: number;
  rateKey: number;
  announced: number;
  whirr: Whirr;
  audio: boolean;
  bg: Rgb;
  bgHover: Rgb;
  fg: Rgb;
  perf: { time: number; slow: number; step: number };
  keyDir: number;
  // scratch
  q: Float64Array;
  q2: Float64Array;
  v: Float64Array;
  v2: Float64Array;
  rv: Float64Array;
};

function makeLive(mode: "tile" | "stage", theme: PieceTheme, reduced: boolean): Live {
  const stage = mode === "stage";
  const planet = new Planet(START_SPIN);
  planet.orbit = stage ? ORBIT.stage : ORBIT.tile;
  planet.idle = reduced ? 0 : IDLE[mode];
  planet.moonPace = reduced ? 0 : MOON_PACE[mode];
  planet.moonW = planet.moonPace;
  // the stage's moon starts just behind the planet's right edge; the opening sends it across the face
  planet.moon = stage ? (reduced ? 2.25 : -0.12) : 2.6;
  const intro = stage && !reduced;
  if (intro) {
    // arrive tipped toward you and spinning; the physics brings it home
    const tip = quat();
    axisAngleQ(tip, 1, 0.25, 0, INTRO_TIP);
    const o = quat();
    mulQ(o, tip, planet.o);
    planet.o.set(o);
    planet.target.set(o);
    planet.kick(INTRO_SPIN);
    planet.moonW = planet.moonPace + 1.6;
  } else if (!reduced) {
    planet.kick(planet.idle);
  }
  const dark = theme === "dark";
  // the stage's planet arrives a little small and swells into place with a soft bounce
  const press = new Spring(intro ? 0.86 : 1, { stiffness: 90, damping: 11 });
  press.to(1);
  return {
    planet,
    press,
    moonHold: new Spring(0, { stiffness: 380, damping: 24 }),
    theme: new Spring(dark ? 1 : 0, { stiffness: 18, damping: 8.2 }),
    themeName: theme,
    reduced,
    time: 0,
    acc: 0,
    lastInput: -10,
    lights: intro ? 0 : 1,
    introAt: 0,
    hovering: false,
    hover: 0,
    frame: newFrame(),
    layout: { width: 0, height: 0, cx: 0, cy: 0, r: 1, dist: 6, sx: 0, sy: 0 },
    drag: null,
    dayOffset: 1,
    day: 1,
    shownRate: planet.idle,
    rateKey: NaN,
    announced: 1,
    whirr: new Whirr(),
    audio: false,
    bg: dark ? [0.055, 0.02, 0.024] : [0.949, 0.949, 0.949],
    bgHover: dark ? [0.03, 0.012, 0.012] : [0.922, 0.922, 0.922],
    fg: dark ? [0.886, 0.647, 0.157] : [0.09, 0.09, 0.09],
    perf: { time: 0, slow: 0, step: 0 },
    keyDir: 1,
    q: quat(),
    q2: quat(),
    v: v3(),
    v2: v3(),
    rv: v3(),
  };
}

/**
 * The readout for a spin rate, as a number that only changes when the
 * text would (so the frame loop compares numbers, not strings):
 * −1 standing still, −2 rewinding, otherwise the length of a day in tenths
 * of a second (rounded to whole seconds past ten, to minutes past 100).
 */
function rateKey(rate: number): number {
  const a = Math.abs(rate);
  if (a < 0.02) return -1;
  if (rate < -0.05) return -2;
  const t = TAU / a;
  if (t < 10) return Math.round(t * 10);
  if (t < 100) return Math.round(t) * 10;
  return Math.round(t / 60) * 600;
}

/** "1 day = 39 s", "standing still", "rewinding". */
function rateLabel(key: number): string {
  if (key === -1) return "standing still";
  if (key === -2) return "rewinding";
  if (key < 100) return `1 day = ${(key / 10).toFixed(1)} s`;
  if (key < 1000) return `1 day = ${key / 10} s`;
  return `1 day = ${key / 600} min`;
}

/* ---------------------------------------------------------------------- */
/* the piece                                                               */
/* ---------------------------------------------------------------------- */

export default function Piece(props: PieceProps) {
  return <TinyPlanet {...props} />;
}

function TinyPlanet({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [live] = useState(() => makeLive(mode, theme, reducedMotion));
  const L = live;
  const rendererRef = useRef<PlanetRenderer | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const rateRef = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const hintId = useId();

  const [dprStep, setDprStep] = useState(0);
  const [disc, setDisc] = useState<{ x: number; y: number; r: number } | null>(null);
  const [day, setDay] = useState({ value: 1, dir: undefined as "up" | "down" | undefined });
  const [announce, setAnnounce] = useState("");
  const [touched, setTouched] = useState(false);
  const [keyFocus, setKeyFocus] = useState(false);
  const [wide, setWide] = useState(true);

  /* -------------------------------------------------------------------- */
  /* sizes                                                                 */
  /* -------------------------------------------------------------------- */

  const applySize = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (width < 2 || height < 2) return;
    // on a phone the moon keeps a tighter orbit so the planet can be bigger
    if (stage) L.planet.orbit = width < 480 ? ORBIT.narrow : ORBIT.stage;
    const layout = layoutFor(width, height, stage, L.planet.orbit, L.layout);
    if (stage) {
      setDisc((prev) =>
        prev && Math.abs(prev.x - layout.cx) < 0.5 && Math.abs(prev.y - layout.cy) < 0.5 && Math.abs(prev.r - layout.r) < 0.5
          ? prev
          : { x: layout.cx, y: layout.cy, r: layout.r },
      );
      setWide(width >= 640);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* -------------------------------------------------------------------- */
  /* drawing                                                               */
  /* -------------------------------------------------------------------- */

  const paint = (): boolean => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || !canvas || width < 2 || height < 2) return false;
    const f = L.frame;
    const layout = L.layout;
    const planet = L.planet;
    const mix = L.theme.value;
    const dist = layout.dist;

    viewProjection(f.viewProj, FOV, width / height, Math.max(0.1, dist - 2.6), dist + 2.6, dist, layout.sx, layout.sy);
    f.cam[0] = 0;
    f.cam[1] = 0;
    f.cam[2] = dist;
    const sx = lerp(SUN_LIGHT[0], SUN_DARK[0], mix);
    const sy = lerp(SUN_LIGHT[1], SUN_DARK[1], mix);
    const sz = lerp(SUN_LIGHT[2], SUN_DARK[2], mix);
    const sl = Math.hypot(sx, sy, sz) || 1;
    f.sun[0] = sx / sl;
    f.sun[1] = sy / sl;
    f.sun[2] = sz / sl;

    const scale = L.press.value * (1 + 0.035 * L.hover);
    f.planetR = scale;
    mat3FromQ(f.rot, planet.o, scale);
    // the cloud layer: the air's lag on top of the planet's turn
    planet.airShown(L.v);
    rotVecQ(L.q, L.v[0], L.v[1], L.v[2]);
    mulQ(L.q2, L.q, planet.o);
    mat3FromQ(f.cloudRot, L.q2, scale);
    f.air[0] = L.v[0];
    f.air[1] = L.v[1];
    f.air[2] = L.v[2];

    // spinning fast stretches the equator
    const rate = planet.spinRate;
    const b = L.reduced ? 0 : Math.min(BULGE_MAX, BULGE * rate * rate);
    f.bulge[0] = 1 + b;
    f.bulge[1] = 1 - b * 0.85;
    f.bulge[2] = 1 + b;
    const stir = Math.min(1, len3(planet.air) * 2.5);
    f.wave = L.reduced ? 0.0022 : 0.0026 + 0.002 * stir;
    f.sway = L.reduced ? 0 : stage ? 0.07 : 0.05;

    // the moon
    planet.moonPosition(L.v2);
    const moonScale = MOON_RADIUS * (1 + 0.12 * L.moonHold.value);
    f.moon[0] = L.v2[0];
    f.moon[1] = L.v2[1];
    f.moon[2] = L.v2[2];
    f.moon[3] = moonScale;
    axisAngleQ(L.q, ORBIT_N[0], ORBIT_N[1], ORBIT_N[2], planet.moon);
    mat3FromQ(f.moonRot, L.q, moonScale);
    f.orbitU[0] = ORBIT_U[0] * planet.orbit;
    f.orbitU[1] = ORBIT_U[1] * planet.orbit;
    f.orbitU[2] = ORBIT_U[2] * planet.orbit;
    f.orbitV[0] = ORBIT_V[0] * planet.orbit;
    f.orbitV[1] = ORBIT_V[1] * planet.orbit;
    f.orbitV[2] = ORBIT_V[2] * planet.orbit;

    // cloud banks for the shadows (the same drift as the shader)
    const world = worldFor(mode);
    const banks = world.banks;
    const t = L.time;
    const cr = f.cloudRot;
    for (let i = 0; i < world.bankCount; i++) {
      const bx = banks[i * 5], by = banks[i * 5 + 1], bz = banks[i * 5 + 2];
      const a = banks[i * 5 + 4] * t;
      const c = Math.cos(a), s = Math.sin(a);
      const mx = (c * bx + s * bz) * f.bulge[0];
      const my = by * f.bulge[1];
      const mz = (-s * bx + c * bz) * f.bulge[2];
      f.banks[i * 4] = cr[0] * mx + cr[3] * my + cr[6] * mz;
      f.banks[i * 4 + 1] = cr[1] * mx + cr[4] * my + cr[7] * mz;
      f.banks[i * 4 + 2] = cr[2] * mx + cr[5] * my + cr[8] * mz;
      f.banks[i * 4 + 3] = banks[i * 5 + 3] * scale;
    }
    f.bankCount = Math.min(16, world.bankCount);

    f.time = t;
    f.dark = mix;
    f.stars = mix;
    f.glow = 1;
    f.lights = L.lights;
    const hover = L.hover;
    f.bg[0] = lerp(L.bg[0], L.bgHover[0], hover);
    f.bg[1] = lerp(L.bg[1], L.bgHover[1], hover);
    f.bg[2] = lerp(L.bg[2], L.bgHover[2], hover);
    f.width = width;
    f.height = height;
    f.cx = layout.cx;
    f.cy = layout.cy;
    f.radiusPx = layout.r * scale;
    f.dpr = dpr;
    f.dotColour[0] = L.fg[0];
    f.dotColour[1] = L.fg[1];
    f.dotColour[2] = L.fg[2];
    f.dotColour[3] = lerp(stage ? 0.3 : 0.2, stage ? 0.42 : 0.3, mix);
    f.dotPx = (stage ? 1.9 : 1.35) * dpr;
    f.lightPx = clamp(layout.r * 0.032, 2.9, 6.4) * dpr;
    renderer.draw(f, canvas.width, canvas.height);
    return true;
  };

  /** The rate readout and the day counter (DOM writes only when they change). */
  const syncDom = () => {
    if (!stage) return;
    const planet = L.planet;
    const raw = Math.floor(planet.spin / TAU);
    let value = raw + L.dayOffset;
    if (value < 1) {
      L.dayOffset += 1 - value;
      value = 1;
    }
    if (value !== L.day) {
      const dir = value > L.day ? "up" : "down";
      L.day = value;
      setDay({ value, dir });
      if (L.audio) tick(Math.abs(planet.spinRate));
    }
    const key = rateKey(L.shownRate);
    if (key !== L.rateKey) {
      L.rateKey = key;
      if (rateRef.current) rateRef.current.textContent = rateLabel(key);
    }
  };

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const { width } = sizeRef.current;
    if (!renderer || width < 2) return false;
    const reduced = L.reduced;
    const planet = L.planet;
    const now = performance.now() / 1000;
    const speed = len3(planet.w);
    const calm = !L.drag && now - L.lastInput > 4 && speed < 0.5 && L.press.settled && L.theme.settled && L.lights >= 1;

    // tiles (and a calm stage) run at 30 fps
    if (!stage || calm) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }

    // a stage that runs slow for a sustained stretch drops its pixel ratio a step
    if (stage && !calm && L.perf.step < DPR_STEPS.length - 1) {
      const perf = L.perf;
      perf.time += dt;
      if (dt > 1 / 40) perf.slow += dt;
      if (perf.time >= 1.6) {
        if (perf.slow > perf.time * 0.7) {
          perf.step += 1;
          setDprStep(perf.step);
        }
        perf.time = 0;
        perf.slow = 0;
      }
    }

    if (!reduced) L.time += dt;

    // tile hover: the day speeds up under the mouse
    if (!stage) {
      L.hover = reduced ? (L.hovering ? 1 : 0) : damp(L.hover, L.hovering ? 1 : 0, 8, dt);
      if (!reduced) planet.idle = L.hovering ? IDLE.hover : IDLE.tile;
    }

    if (reduced) {
      if (planet.mode !== "free") {
        planet.snapToTarget();
        if (planet.mode === "key") planet.mode = "free";
      }
      planet.w[0] = planet.w[1] = planet.w[2] = 0;
      planet.air.fill(0);
      planet.airW.fill(0);
      if (planet.moonHeld) planet.moon = planet.moonGoal;
      L.press.set(L.press.target);
      L.moonHold.set(L.moonHold.target);
      L.theme.set(L.theme.target);
      L.lights = 1;
    } else {
      planet.step(dt);
      L.press.step(dt);
      L.moonHold.step(dt);
      L.theme.step(dt);
      // the towns come on a beat after the stage opens
      if (L.lights < 1) {
        L.introAt += dt;
        if (L.introAt > 1.1) L.lights = Math.min(1, L.lights + dt / 1.4);
      }
    }

    const rate = planet.spinRate;
    L.shownRate = reduced ? rate : damp(L.shownRate, rate, 6, dt);
    if (stage && L.audio) {
      // (re)started here too, after the piece was paused offscreen
      L.whirr.start();
      L.whirr.set(len3(planet.w));
    }

    // announce the day once the planet has calmed down
    if (stage && Math.abs(rate) < 1 && !L.drag && L.day !== L.announced) {
      L.announced = L.day;
      setAnnounce(`Day ${L.day}`);
    }

    paint();
    syncDom();

    if (reduced && !L.drag && planet.mode === "free" && L.hover % 1 === 0) return false;
  });

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? DPR_STEPS[dprStep] : 1.5,
    attributes: { alpha: false, antialias: true, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: PlanetRenderer | null = null;
      try {
        renderer = new PlanetRenderer(gl, worldFor(mode));
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      applySize();
      paint();
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => {
      applySize();
      // the backing store was just cleared: repaint before the browser shows it
      paint();
      wake();
    },
  });

  /* -------------------------------------------------------------------- */
  /* theme, reduced motion, colours, sound lifetime                        */
  /* -------------------------------------------------------------------- */

  const readColours = useCallback(() => {
    try {
      const style = getComputedStyle(document.documentElement);
      L.bg = parseColour(style.getPropertyValue("--tile"), L.bg);
      L.bgHover = parseColour(style.getPropertyValue("--tile-hover"), L.bgHover);
      L.fg = parseColour(style.getPropertyValue("--foreground"), L.fg);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mountedAt = useRef(0);
  useEffect(() => {
    if (!mountedAt.current) mountedAt.current = performance.now();
    L.themeName = theme;
    L.theme.to(theme === "dark" ? 1 : 0);
    // the first moments (hydration settling on the stored theme) jump; later switches swing the sun round
    if (L.reduced || performance.now() - mountedAt.current < 800) L.theme.set(L.theme.target);
    readColours();
    paint();
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    L.reduced = reducedMotion;
    const planet = L.planet;
    if (reducedMotion) {
      planet.idle = 0;
      planet.moonPace = 0;
      planet.moonW = 0;
      L.lights = 1;
      L.press.set(1);
    } else {
      planet.idle = stage ? IDLE.stage : L.hovering ? IDLE.hover : IDLE.tile;
      planet.moonPace = MOON_PACE[mode];
    }
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    if (!active) L.whirr.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const whirr = L.whirr;
    return () => whirr.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------- */
  /* picking                                                               */
  /* -------------------------------------------------------------------- */

  /** View ray through a CSS px point: direction into `out` (origin is the camera). */
  const rayAt = (x: number, y: number, out: Float64Array) => {
    const layout = L.layout;
    const aspect = layout.width / Math.max(1, layout.height);
    const nx = (x / layout.width) * 2 - 1 - layout.sx;
    const ny = 1 - (y / layout.height) * 2 - layout.sy;
    const dx = nx * TAN * aspect;
    const dy = ny * TAN;
    const l = Math.hypot(dx, dy, 1);
    out[0] = dx / l;
    out[1] = dy / l;
    out[2] = -1 / l;
    return out;
  };

  /** The point of the planet under (x, y) as a unit vector; past the edge, the nearest point of the rim. */
  const spherePoint = (x: number, y: number, out: Float64Array): boolean => {
    const d = rayAt(x, y, L.rv);
    const D = L.layout.dist;
    const r = L.frame.planetR || 1;
    const b = D * d[2];
    const c = D * D - r * r;
    const disc = b * b - c;
    const t = disc >= 0 ? -b - Math.sqrt(disc) : -b;
    const px = d[0] * t, py = d[1] * t, pz = D + d[2] * t;
    const l = Math.hypot(px, py, pz) || 1;
    out[0] = px / l;
    out[1] = py / l;
    out[2] = pz / l;
    return disc >= 0;
  };

  /** World point → CSS px (and the clip w), using the last frame's matrix. */
  const project = (x: number, y: number, z: number, out: Float64Array) => {
    const m = L.frame.viewProj;
    const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
    const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
    const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    out[0] = ((cx / cw + 1) / 2) * L.layout.width;
    out[1] = ((1 - cy / cw) / 2) * L.layout.height;
    out[2] = cw;
    return out;
  };

  const moonOnScreen = (out: Float64Array) => {
    const m = L.frame.moon;
    project(m[0], m[1], m[2], out);
    const pxPerUnit = L.layout.height / 2 / TAN / out[2];
    return m[3] * pxPerUnit;
  };

  const hitMoon = (x: number, y: number) => {
    const p = L.v2;
    const r = moonOnScreen(p);
    // behind the planet it can't be grabbed
    const m = L.frame.moon;
    if (m[2] < 0 && Math.hypot(p[0] - L.layout.cx, p[1] - L.layout.cy) < L.layout.r * 0.98) return false;
    return Math.hypot(x - p[0], y - p[1]) < r + 14;
  };

  /** The orbit angle whose point on screen is nearest (x, y). */
  const orbitAngleAt = (x: number, y: number): number => {
    const o = L.planet.orbit;
    const p = L.v2;
    let best = 0;
    let bestD = Infinity;
    const N = 72;
    const at = (a: number) => {
      const c = Math.cos(a) * o, s = Math.sin(a) * o;
      project(ORBIT_U[0] * c + ORBIT_V[0] * s, ORBIT_U[1] * c + ORBIT_V[1] * s, ORBIT_U[2] * c + ORBIT_V[2] * s, p);
      return Math.hypot(p[0] - x, p[1] - y);
    };
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU;
      const d = at(a);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    // refine around the best sample
    let step = TAU / N / 2;
    for (let k = 0; k < 6; k++) {
      const dl = at(best - step);
      const dr = at(best + step);
      if (dl < bestD) {
        bestD = dl;
        best -= step;
      } else if (dr < bestD) {
        bestD = dr;
        best += step;
      }
      step /= 2;
    }
    return best;
  };

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const latestWake = useLatest(wake);
  const noteInput = () => {
    L.lastInput = performance.now() / 1000;
    if (!touched) setTouched(true);
    latestWake.current();
  };

  const startSound = () => {
    if (!stage) return;
    const kit = ensureAudio();
    if (kit && !L.audio) {
      L.audio = true;
      L.whirr.start();
    }
  };

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const record = (drag: Drag, at: number, a: number, b = 0, c = 0) => {
    const i = drag.n % drag.ts.length;
    drag.ts[i] = at / 1000;
    drag.rs[i * 3] = a;
    drag.rs[i * 3 + 1] = b;
    drag.rs[i * 3 + 2] = c;
    drag.n += 1;
  };

  /**
   * The hand's speed over the last ~80 ms (event times, so a busy frame
   * doesn't skew it): rad/s as a vector for the planet; for the moon, the
   * angle samples' slope. Null when the hand had stopped before letting go.
   */
  const releaseVelocity = (drag: Drag, upAt: number, out: Float64Array): boolean => {
    const size = drag.ts.length;
    if (drag.n < 2) return false;
    const last = (drag.n - 1) % size;
    const tEnd = drag.ts[last];
    if (upAt / 1000 - tEnd > 0.09) return false;
    let first = last;
    let sx = 0, sy = 0, sz = 0;
    for (let j = 0; j < Math.min(drag.n, size) - 1; j++) {
      const idx = (drag.n - 1 - j + size * 4) % size;
      const prev = (idx - 1 + size) % size;
      if (tEnd - drag.ts[prev] > 0.085) break;
      first = prev;
      if (drag.kind === "planet") {
        sx += drag.rs[idx * 3];
        sy += drag.rs[idx * 3 + 1];
        sz += drag.rs[idx * 3 + 2];
      }
    }
    const span = tEnd - drag.ts[first];
    if (span < 0.012) return false;
    if (drag.kind === "planet") {
      out[0] = sx / span;
      out[1] = sy / span;
      out[2] = sz / span;
    } else {
      let d = drag.rs[last * 3] - drag.rs[first * 3];
      d -= Math.round(d / TAU) * TAU;
      out[0] = d / span;
    }
    return true;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || !event.isPrimary || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    startSound();
    const { x, y } = local(event);
    const planet = L.planet;
    const onMoon = hitMoon(x, y);
    const drag: Drag = {
      id: event.pointerId,
      kind: onMoon ? "moon" : "planet",
      onPlanet: false,
      x,
      y,
      x0: x,
      y0: y,
      moved: false,
      last: v3(),
      ts: new Float64Array(12),
      rs: new Float64Array(36),
      n: 0,
    };
    if (onMoon) {
      planet.moonHeld = true;
      // hold it where it is (the hand's angle takes over once it moves)
      planet.moonGoal = planet.moon;
      L.moonHold.to(1);
      record(drag, event.timeStamp, planet.moonGoal);
      tink(planet.moonW, (L.v2[0] / Math.max(1, L.layout.width)) * 2 - 1);
    } else {
      drag.onPlanet = spherePoint(x, y, drag.last);
      const speed = len3(planet.w);
      if (L.audio && speed > 1) caught(speed, ((x / Math.max(1, L.layout.width)) * 2 - 1) * 0.5);
      planet.hold();
      L.press.configure({ stiffness: 420, damping: 30 });
      L.press.to(0.972);
      record(drag, event.timeStamp, 0, 0, 0);
    }
    L.drag = drag;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    if (surfaceRef.current) surfaceRef.current.style.cursor = "grabbing";
    noteInput();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage) return;
    const drag = L.drag;
    if (!drag || event.pointerId !== drag.id) return;
    const { x, y } = local(event);
    if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) > 3) drag.moved = true;
    const planet = L.planet;
    if (drag.kind === "planet") {
      const q = L.q;
      if (drag.onPlanet) {
        spherePoint(x, y, L.v);
        arcQ(q, drag.last, L.v);
        drag.last.set(L.v);
      } else {
        const r = Math.max(30, L.layout.r);
        rotVecQ(q, (y - drag.y) / r, (x - drag.x) / r, 0);
      }
      planet.turnTarget(q);
      qToRotVec(L.rv, q);
      record(drag, event.timeStamp, L.rv[0], L.rv[1], L.rv[2]);
      if (L.reduced) planet.snapToTarget();
    } else if (drag.moved) {
      // keep the angle continuous so the throw is measured the short way round
      const a = orbitAngleAt(x, y);
      let d = a - planet.moonGoal;
      d -= Math.round(d / TAU) * TAU;
      planet.moonGoal += d;
      record(drag, event.timeStamp, planet.moonGoal);
    }
    drag.x = x;
    drag.y = y;
    noteInput();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = L.drag;
    if (!drag || event.pointerId !== drag.id) return;
    L.drag = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    if (surfaceRef.current) surfaceRef.current.style.cursor = fine ? "grab" : "";
    const planet = L.planet;
    const v = L.v;
    const thrown = !cancelled && !L.reduced && releaseVelocity(drag, event.timeStamp, v);
    if (drag.kind === "planet") {
      L.press.configure({ stiffness: 320, damping: 13 });
      L.press.to(1);
      if (L.reduced) planet.release(0, 0, 0);
      else if (thrown) planet.release(v[0], v[1], v[2]);
      else planet.release(planet.w[0], planet.w[1], planet.w[2]);
    } else {
      planet.moonHeld = false;
      L.moonHold.to(0);
      if (!drag.moved && !cancelled) {
        // a tap sends it on a little faster
        if (!L.reduced) planet.moonW += 2.4;
        else planet.moon += 0.5;
        tink(planet.moonW, 0);
      } else if (thrown) {
        planet.moonW = clamp(v[0], -8, 8);
      }
    }
    noteInput();
  };

  const spinIt = (dir = L.keyDir) => {
    startSound();
    const planet = L.planet;
    if (L.reduced) {
      planet.keyTurn(dir * Math.PI / 2);
      planet.snapToTarget();
      planet.mode = "free";
    } else {
      planet.kick(dir * KICK);
    }
    noteInput();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const planet = L.planet;
    const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", " ", "Enter", "Home"];
    if (!keys.includes(event.key)) return;
    startSound();
    let handled = true;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        const dir = event.key === "ArrowRight" ? 1 : -1;
        L.keyDir = dir;
        planet.keyTurn(dir * KEY_TURN * (event.shiftKey ? 6 : 1));
        if (L.reduced) planet.snapToTarget();
        break;
      }
      case "ArrowUp":
      case "ArrowDown": {
        const dir = event.key === "ArrowUp" ? 1 : -1;
        if (L.reduced) planet.moon += dir * 0.4;
        else planet.moonW += dir * 1.6;
        tink(planet.moonW, 0);
        break;
      }
      case " ":
      case "Enter":
        spinIt();
        break;
      case "Home":
        planet.keyTurn(0);
        if (L.reduced) planet.snapToTarget();
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    noteInput();
  };

  /* -------------------------------------------------------------------- */
  /* tile hover                                                            */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    if (stage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      L.hovering = true;
      latestWake.current();
    };
    const leave = () => {
      L.hovering = false;
      latestWake.current();
    };
    canvas.addEventListener("pointerenter", enter);
    canvas.addEventListener("pointerleave", leave);
    return () => {
      canvas.removeEventListener("pointerenter", enter);
      canvas.removeEventListener("pointerleave", leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, supported]);

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  if (supported === false) return <Fallback theme={theme} />;

  if (!stage) {
    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />;
  }

  const hint = keyFocus
    ? wide
      ? "← → turn it an hour, Shift for six · ↑ ↓ nudge the moon · Space to spin it"
      : "← → turn it · ↑ ↓ the moon · Space to spin"
    : fine
      ? "Drag the planet to turn it, flick to spin it · drag the moon along its orbit"
      : "Drag or flick the planet · tap the moon";

  const ring = disc ? disc.r * 1.07 + 6 : 0;

  return (
    <div className="absolute inset-0 select-none">
      <div
        ref={surfaceRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
        className="absolute inset-0 touch-pan-y [-webkit-tap-highlight-color:transparent]"
        style={{ cursor: fine ? "grab" : undefined }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A small low-poly planet with seas, forests and drifting clouds, town lights on its night side and a moon on a tilted orbit"
          className="absolute inset-0 block size-full"
        />
        {disc ? (
          <div
            tabIndex={0}
            role="application"
            aria-roledescription="planet"
            aria-label="Tiny planet"
            aria-describedby={hintId}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Space Enter Home"
            onKeyDown={onKeyDown}
            onFocus={(event) => setKeyFocus(event.currentTarget.matches(":focus-visible"))}
            onBlur={() => setKeyFocus(false)}
            className="absolute touch-none rounded-full outline-none focus-visible:shadow-[0_0_0_2px_var(--foreground)]"
            style={{ left: disc.x - ring, top: disc.y - ring, width: ring * 2, height: ring * 2 }}
          />
        ) : null}
      </div>

      <p id={hintId} className="sr-only">
        Drag the planet to turn it and flick to set it spinning; it slows back to its own pace and sets itself upright.
        With the keyboard, the left and right arrows turn it an hour, with Shift six hours; up and down nudge the moon
        along its orbit; Space or Enter spins it, and Home stops it.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="bottom">
        <Tray label="Planet">
          <span className="flex h-10 items-center gap-2.5 ps-2.5 pe-2 text-[13px]">
            <span aria-hidden="true" className="relative inline-flex h-5 min-w-[50px] items-center overflow-hidden font-medium text-primary tabular-nums">
              <span key={day.value} className="lab-roll block whitespace-nowrap" data-dir={day.dir}>
                Day {day.value}
              </span>
            </span>
            <span ref={rateRef} aria-hidden="true" className="w-[96px] whitespace-nowrap text-secondary tabular-nums" />
          </span>
          <TrayDivider />
          <IconButton label="Give it a spin" onClick={() => spinIt()}>
            <SpinIcon />
          </IconButton>
          <TrayDivider />
          <MuteButton />
        </Tray>
        <StageHint className={!touched || keyFocus ? "transition-opacity duration-300" : "opacity-0 transition-opacity duration-700"}>
          {hint}
        </StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat drawing of the planet and its moon for browsers without WebGL2. */
function Fallback({ theme }: { theme: PieceTheme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const dark = theme === "dark";
      const r = Math.min(h / 2.6, w / 4.2);
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#2f7fa8";
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = "#93bd63";
      for (const [dx, dy, s] of [
        [-0.35, -0.2, 0.42],
        [0.3, 0.25, 0.36],
        [0.1, -0.55, 0.22],
      ] as const) {
        ctx.beginPath();
        ctx.ellipse(cx + dx * r, cy + dy * r, s * r, s * r * 0.7, dx, 0, Math.PI * 2);
        ctx.fill();
      }
      // night falls from the right (most of the face after dark), with a soft roundness
      const shade = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      const sideLit = dark ? 0.05 : 0.55;
      shade.addColorStop(0, "rgba(8, 12, 30, 0)");
      shade.addColorStop(sideLit, "rgba(8, 12, 30, 0)");
      shade.addColorStop(Math.min(1, sideLit + 0.3), "rgba(8, 12, 30, 0.82)");
      shade.addColorStop(1, "rgba(8, 12, 30, 0.88)");
      ctx.fillStyle = shade;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      const round = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      round.addColorStop(0, "rgba(255, 255, 255, 0.12)");
      round.addColorStop(0.7, "rgba(255, 255, 255, 0)");
      round.addColorStop(1, "rgba(0, 10, 30, 0.25)");
      ctx.fillStyle = round;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
      // a thin rim of air on the lit side
      ctx.strokeStyle = "rgba(120, 175, 255, 0.45)";
      ctx.lineWidth = Math.max(1, r * 0.025);
      ctx.beginPath();
      ctx.arc(cx, cy, r + ctx.lineWidth / 2, Math.PI * 0.6, Math.PI * 1.45);
      ctx.stroke();
      ctx.fillStyle = dark ? "#9c9a94" : "#d5d1c8";
      ctx.beginPath();
      ctx.arc(cx + r * 1.6, cy + r * 0.35, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [theme]);
  return <canvas ref={ref} role="img" aria-label="A small planet and its moon" className="absolute inset-0 block size-full" />;
}
