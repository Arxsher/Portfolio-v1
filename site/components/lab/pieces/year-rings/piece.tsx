"use client";

// Year rings: this year's real GitHub contributions grown as the rings of a
// tree, cut and sanded into a slice lying on the stage.
//
// The look
// - A product shot of a wooden slice (a "tree cookie") on the stage's own
//   surface: sanded, oiled end grain with forty-odd rings, pale sapwood
//   round a warmer heartwood, a dark pith, a cream cambium line and
//   fissured grey bark down the side. A soft shadow falls away from the
//   light; a faint dotted dial round it carries the weekdays and the light.
// - The data (rings.ts): one ring per week from January at the pith to this
//   week at the bark, each day a seventh of its ring (Sunday at the back,
//   clockwise). A day's count sets how wide the ring grows there and how
//   dark its latewood band is, so a busy week is a wide dark band, a quiet
//   one a pale hairline, and busy weekdays push the trunk out on their side
//   the way trees grow eccentric. This week's ring is still a crescent.
// - Light does the rest (shaders.ts): the soft earlywood is worn a hair below
//   the latewood, so each ring ends in a tiny step. A light from outside
//   catches the steps as bright hairlines; from the pith side they throw
//   hairline shadows. As the light goes round, that pattern turns with it
//   and the grain shimmers; the oil adds a sheen when it comes from behind.
//
// The motion model
// - The light is an angle on the dial with a velocity. Drag anywhere and
//   it follows your hand round the slice on a stiff, critically damped
//   spring (it trails by a frame, never overshoots); the bead on the dial
//   can be grabbed directly. Let go and it keeps the hand's speed
//   (measured over the last ~80 ms) and coasts round on friction, the
//   shadow sweeping with it, until it stops wherever it stops. Grab it
//   while it coasts and it is caught where it is.
// - The loupe: over the wood a round magnifier glides after the pointer
//   (a stiff, slightly soft spring, so it has weight), pops out on a
//   bouncy spring and shrinks away over the table. It is a real second
//   render of the slice through a zoomed camera, so close up the pores at
//   each ring's start and the fine rays are there; the day under its
//   centre is outlined and named, and crossing rings ticks like a
//   fingernail on the grain. On touch: tap a ring for its day, hold to
//   bring the loupe out above your finger.
// - Growth: the first time the stage is seen, the year grows from the pith
//   ring by ring (ease-out, so the last weeks, the biggest, swell in
//   slowly) while the light swings round into place. "Grow" rewinds the
//   year into the pith and grows it again, with a tick per ring.
// - The "wow" second: the trunk swelling out week by week with the shadow
//   sweeping, then a flick that sends the light whirling round the slice
//   and the whole grain shimmering under it.
// - A click on the wood knocks on it: a wooden knock and a ring of light
//   running out through the grain; it also keeps that day selected.
// - Keyboard: the slice is an application region: ← → walk the days, ↑ ↓
//   the rings (out, in), Page Up / Down four weeks, Home / End the first
//   and last day (the loupe follows), Enter knocks, Q E swing the light,
//   Escape clears. The bead is also a slider (← → move the light).
// - Sound (stage, after a gesture, lab mute respected): ticks for rings
//   crossed and grown, the knock.
// - Tile: the year grows once, then the light circles slowly (one turn in
//   about fifteen seconds) at a gentle height; under the mouse it drops to
//   a raking angle and speeds up, so the relief jumps out. 30 fps, no loupe,
//   no sound, no controls.
// - Lifetime: the ring tables are uploaded once, the mesh only while it
//   grows; the stage sleeps once everything has settled and steps its
//   resolution down if a machine can't keep up; nothing allocates per
//   frame; the WebGL context is handed back on unmount (useWebGL2).
// - Reduced motion: the grown slice, still, with the light at rest; the
//   light and the loupe still follow you, without easing or coasting.
//
// Files: rings.ts (the data as a tree), geometry.ts (the mesh), view.ts
// (camera, picking), shaders.ts + renderer.ts (WebGL2), sound.ts, icons.tsx.

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
import { clamp, damp, lerp, smoothstep, Spring, useFinePointer, useFrame, useIsoLayoutEffect, useLatest, useWebGL2 } from "../../hooks";
import type { PieceProps, PieceTheme } from "../../types";
import { MuteButton, StageControls, StageHint, Tray, TrayButton, TrayDivider, TrayRow } from "../../ui";
import { GrowIcon } from "./icons";
import { RingRenderer, type Frame } from "./renderer";
import {
  angleOf,
  boundAt,
  buildRings,
  dayAt,
  dayCentre,
  describeDay,
  longDate,
  plural,
  ringCoordinate,
  SECTOR,
  SEG,
  stepDay,
  stepWeek,
  TAU,
  THICKNESS,
  WEEKDAYS,
  weekLabel,
  type Day,
  type Rings,
} from "./rings";
import { knock as knockSound, tick } from "./sound";
import { aim, CAM_EL, castToPlane, frame as frameCamera, lightDirection, loupeMatrices, newCamera, project, type Camera } from "./view";

/* ---------------------------------------------------------------------- */
/* tuning                                                                  */
/* ---------------------------------------------------------------------- */

const DEG = Math.PI / 180;
/** Where the light rests: from the back left, so the shadow falls to the front right. */
const REST_AZ = -78 * DEG;
const REST_EL = 25 * DEG;
const TILE_EL = 31 * DEG;
const TILE_HOVER_EL = 12 * DEG;
/** The intro swings the light in from here (relative to the rest). */
const INTRO_SWING = 150 * DEG;
const DIAL_R = 1.2;
const STAGE_FIT = 1.27;
const TILE_FIT = 1.07;
const GROW_TIME = 3.9;
const TILE_GROW_TIME = 3.2;
const REWIND_TIME = 0.85;
/** Coasting light: friction (1/s) and the fastest flick it keeps (rad/s). */
const FRICTION = 1.35;
const MAX_SPIN = 15;
const HAND = { k: 460, c: 2 * Math.sqrt(460) };
const KEYS = { k: 70, c: 2 * Math.sqrt(70) };
const INTRO = { k: 5.5, c: 2 * Math.sqrt(5.5) };
const TILE_ORBIT = 0.42;
const TILE_HOVER_ORBIT = 0.95;
const LOUPE_MAG = 2.5;
/** If a machine can't hold the frame rate, the stage renders at these DPR caps in turn. */
const DPR_STEPS = [2, 1.5, 1.25, 1] as const;

type Look = {
  sun: [number, number, number];
  sky: [number, number, number];
  pool: [number, number, number];
  line: [number, number, number];
  shadowK: number;
  dialA: number;
  exposure: number;
};

const LOOKS: Record<PieceTheme, Look> = {
  light: {
    sun: [2.55, 2.44, 2.28],
    sky: [0.34, 0.355, 0.38],
    pool: [0, 0, 0],
    line: [0.1, 0.075, 0.055],
    shadowK: 0.3,
    dialA: 0.26,
    exposure: 1,
  },
  dark: {
    sun: [3.5, 2.5, 1.55],
    sky: [0.05, 0.042, 0.04],
    pool: [0.052, 0.03, 0.014],
    line: [1, 0.86, 0.55],
    shadowK: 0.7,
    dialA: 0.3,
    exposure: 1.05,
  },
};

/* ---------------------------------------------------------------------- */
/* state                                                                   */
/* ---------------------------------------------------------------------- */

let sharedRings: Rings | null = null;
function getRings(): Rings {
  if (!sharedRings) sharedRings = buildRings();
  return sharedRings;
}

type Drag = {
  id: number;
  kind: "pending" | "spin" | "grab" | "loupe";
  type: string;
  x0: number;
  y0: number;
  t0: number;
  lastX: number;
  lastPhi: number;
  /** Horizontal drags turn the light this way (−1 in front of the slice, +1 behind). */
  sign: number;
  moved: boolean;
  onWood: boolean;
  /** Recent (time, goal) samples for the release velocity. */
  ts: Float64Array;
  gs: Float64Array;
  n: number;
};

type Slot = { week: number; weekday: number; s: number; day: Day | null };

type Live = {
  rings: Rings;
  cam: Camera;
  frame: Frame;
  // the light
  az: number;
  azV: number;
  azGoal: number;
  azMode: "coast" | "hand" | "keys" | "intro" | "orbit";
  el: Spring;
  // growth
  grown: number;
  phase: "idle" | "rewind" | "grow";
  phaseT: number;
  rewindFrom: number;
  lastRing: number;
  introPending: boolean;
  // camera lean
  leanX: Spring;
  leanY: Spring;
  // the loupe
  loupeX: Spring;
  loupeY: Spring;
  loupeShow: Spring;
  loupeWant: boolean;
  loupeAimX: number;
  loupeAimY: number;
  loupeUntil: number;
  loupeR: number;
  loupeRing: number;
  // selection
  hoverDay: Day | null;
  pinned: Day | null;
  shown: Day | null;
  slotA: Slot;
  slotB: Slot;
  knockAge: number;
  knockS: number;
  // input
  drag: Drag | null;
  pointerX: number;
  pointerY: number;
  pointerIn: boolean;
  hovering: boolean;
  lastInput: number;
  // render
  acc: number;
  dark: number;
  bg: [number, number, number];
  bgHover: [number, number, number];
  ink: [number, number, number];
  hover: number;
  theme: PieceTheme;
  reduced: boolean;
  perf: { time: number; slow: number };
  /** DOM writes: last values. */
  dom: { bx: number; by: number; tx: number; ty: number; tipOn: boolean; labels: Float32Array; az: number };
};

const scratchPoint = { x: 0, y: 0, depth: 0 };
const scratchPlane = { x: 0, z: 0, ok: false };
const scratchCentre = { x: 0, z: 0, r: 0, theta: 0 };

function makeLive(theme: PieceTheme, reduced: boolean, stage: boolean): Live {
  const rings = getRings();
  const startGrown = reduced ? rings.n : 0;
  const az = stage && !reduced ? REST_AZ + INTRO_SWING : REST_AZ + (stage ? 0 : 0.6);
  const frame: Frame = {
    vp: new Float32Array(16),
    inv: new Float32Array(16),
    eye: new Float32Array(3),
    light: new Float32Array(3),
    sun: new Float32Array(3),
    sky: new Float32Array(3),
    pool: new Float32Array(3),
    bg: new Float32Array(3),
    line: new Float32Array(3),
    dial: new Float32Array(4),
    dialR: stage ? DIAL_R : 99,
    exposure: 1,
    relief: 0.0007,
    shadowK: 0.3,
    soft: 0.32,
    bump: 0.0022,
    dark: theme === "dark" ? 1 : 0,
    dpr: 1,
    selA: new Float32Array(4),
    selB: new Float32Array(4),
    knock: new Float32Array(4),
    loupe: {
      show: 0,
      x: 0,
      y: 0,
      radius: 64,
      rim: 5,
      shadowX: 0,
      shadowY: 0,
      shadowA: 0.22,
      lightX: 0,
      lightY: -1,
      mag: LOUPE_MAG,
      vp: new Float32Array(16),
      inv: new Float32Array(16),
    },
  };
  return {
    rings,
    cam: newCamera(),
    frame,
    az,
    azV: stage ? 0 : TILE_ORBIT,
    azGoal: az,
    azMode: stage ? "coast" : "orbit",
    el: new Spring(stage ? REST_EL : TILE_EL, { stiffness: 40, damping: 12.6 }),
    grown: startGrown,
    phase: "idle",
    phaseT: 0,
    rewindFrom: 0,
    lastRing: Math.floor(startGrown),
    introPending: !reduced,
    leanX: new Spring(0, { stiffness: 50, damping: 14 }),
    leanY: new Spring(0, { stiffness: 50, damping: 14 }),
    loupeX: new Spring(0, { stiffness: 620, damping: 44 }),
    loupeY: new Spring(0, { stiffness: 620, damping: 44 }),
    loupeShow: new Spring(0, { stiffness: 340, damping: 23 }),
    loupeWant: false,
    loupeAimX: 0,
    loupeAimY: 0,
    loupeUntil: 0,
    loupeR: 64,
    loupeRing: NaN,
    hoverDay: null,
    pinned: null,
    shown: null,
    slotA: { week: 0, weekday: 0, s: 0, day: null },
    slotB: { week: 0, weekday: 0, s: 0, day: null },
    knockAge: 10,
    knockS: 0,
    drag: null,
    pointerX: 0,
    pointerY: 0,
    pointerIn: false,
    hovering: false,
    lastInput: -10,
    acc: 0,
    dark: theme === "dark" ? 1 : 0,
    bg: theme === "dark" ? [0.055, 0.02, 0.024] : [0.949, 0.949, 0.949],
    bgHover: theme === "dark" ? [0.031, 0.012, 0.012] : [0.922, 0.922, 0.922],
    ink: theme === "dark" ? [0.886, 0.647, 0.157] : [0.09, 0.09, 0.09],
    hover: 0,
    theme,
    reduced,
    perf: { time: 0, slow: 0 },
    dom: { bx: NaN, by: NaN, tx: NaN, ty: NaN, tipOn: false, labels: new Float32Array(21).fill(NaN), az: NaN },
  };
}

function parseColour(value: string, fallback: [number, number, number]): [number, number, number] {
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

/** Shortest signed angle from a to b. */
function wrapPi(a: number) {
  return a - TAU * Math.floor(a / TAU + 0.5);
}

/** The growth curve: quick at first, the last (biggest) weeks swelling in slowly. */
function growEase(p: number) {
  return 1 - Math.pow(1 - clamp(p), 1.85);
}

/* ---------------------------------------------------------------------- */
/* the piece                                                               */
/* ---------------------------------------------------------------------- */

export default function Piece(props: PieceProps) {
  return <YearRings {...props} />;
}

function YearRings({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [live] = useState(() => makeLive(theme, reducedMotion, stage));
  const L = live;
  const rings = L.rings;
  const rendererRef = useRef<RingRenderer | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const beadRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const fine = useFinePointer();
  const hintId = useId();

  const [shown, setShown] = useState<Day | null>(null);
  const [announce, setAnnounce] = useState("");
  const [touched, setTouched] = useState(false);
  const [keyFocus, setKeyFocus] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [dprStep, setDprStep] = useState(0);

  /* -------------------------------------------------------------------- */
  /* sizes                                                                 */
  /* -------------------------------------------------------------------- */

  const applySize = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (width < 2 || height < 2) return;
    const small = width < 560;
    if (stage) {
      frameCamera(L.cam, width, height, { top: small ? 66 : 22, bottom: small ? 100 : 96, side: small ? 14 : 24 }, STAGE_FIT);
      L.loupeR = small ? 54 : Math.round(clamp(width * 0.055, 58, 72));
    } else {
      frameCamera(L.cam, width, height, { top: 4, bottom: 4, side: 4 }, TILE_FIT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* -------------------------------------------------------------------- */
  /* selection                                                             */
  /* -------------------------------------------------------------------- */

  const showDay = (day: Day | null) => {
    if (day === L.shown) return;
    L.shown = day;
    const a = L.slotA;
    const b = L.slotB;
    // the old selection fades from slot B, the new one rises in slot A
    if (b.day === day && day) {
      const s = b.s;
      b.day = a.day;
      b.week = a.week;
      b.weekday = a.weekday;
      b.s = a.s;
      a.day = day;
      a.week = day.week;
      a.weekday = day.weekday;
      a.s = s;
    } else {
      b.day = a.day;
      b.week = a.week;
      b.weekday = a.weekday;
      b.s = a.s;
      a.day = day;
      if (day) {
        a.week = day.week;
        a.weekday = day.weekday;
      }
      a.s = 0;
    }
    if (stage) setShown(day);
  };

  /* -------------------------------------------------------------------- */
  /* growing                                                               */
  /* -------------------------------------------------------------------- */

  const regrow = useCallback(() => {
    if (L.reduced) {
      L.grown = L.rings.n;
      L.phase = "idle";
      return;
    }
    if (L.grown > 0.5) {
      L.phase = "rewind";
      L.rewindFrom = L.grown;
    } else {
      L.phase = "grow";
    }
    L.phaseT = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------- */
  /* drawing                                                               */
  /* -------------------------------------------------------------------- */

  const paint = (): boolean => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || !canvas || width < 2 || height < 2) return false;
    const f = L.frame;
    const cam = L.cam;
    const look = LOOKS[L.theme];
    const other = LOOKS[L.theme === "dark" ? "light" : "dark"];
    const t = L.theme === "dark" ? L.dark : 1 - L.dark;

    // camera with its lean
    aim(cam, L.leanX.value * 3.2 * DEG, CAM_EL + L.leanY.value * 2.2 * DEG);
    f.vp.set(cam.vp);
    f.inv.set(cam.inv);
    f.eye.set(cam.eye);
    lightDirection(L.az, L.el.value, f.light);
    for (let i = 0; i < 3; i++) {
      f.sun[i] = lerp(other.sun[i], look.sun[i], t);
      f.sky[i] = lerp(other.sky[i], look.sky[i], t);
      f.pool[i] = lerp(other.pool[i], look.pool[i], t);
      f.line[i] = lerp(other.line[i], look.line[i], t);
      f.bg[i] = lerp(L.bg[i], L.bgHover[i], L.hover);
      f.dial[i] = L.ink[i];
    }
    f.dial[3] = lerp(other.dialA, look.dialA, t);
    f.shadowK = lerp(other.shadowK, look.shadowK, t);
    f.exposure = lerp(other.exposure, look.exposure, t);
    f.dark = L.dark;
    f.dpr = dpr;
    renderer.setGrown(L.grown);

    // selection slots
    const a = L.slotA;
    const b = L.slotB;
    const grownRing = Math.floor(L.grown);
    f.selA[0] = a.week;
    f.selA[1] = a.weekday;
    f.selA[2] = a.day && a.week < grownRing ? a.s : 0;
    f.selB[0] = b.week;
    f.selB[1] = b.weekday;
    f.selB[2] = b.day && b.week < grownRing ? b.s : 0;
    f.knock[2] = L.knockAge;
    f.knock[3] = L.knockS * Math.exp(-L.knockAge * 2.2);

    // the loupe
    const lo = f.loupe;
    lo.show = L.loupeShow.value;
    if (stage && lo.show > 0.01) {
      lo.radius = L.loupeR * clamp(0.35 + 0.65 * lo.show, 0, 1.12);
      lo.rim = Math.max(2.5, L.loupeR * 0.075);
      lo.x = L.loupeX.value;
      lo.y = L.loupeY.value;
      lo.mag = LOUPE_MAG;
      // which way the light is on screen
      project(cam, 0, THICKNESS, 0, scratchPoint);
      const ox = scratchPoint.x;
      const oy = scratchPoint.y;
      project(cam, f.light[0] * 0.6, THICKNESS + f.light[1] * 0.6, f.light[2] * 0.6, scratchPoint);
      let lx = scratchPoint.x - ox;
      let ly = scratchPoint.y - oy;
      const len = Math.hypot(lx, ly) || 1;
      lx /= len;
      ly /= len;
      lo.lightX = lx;
      lo.lightY = ly;
      const lift = 8 + 20 * Math.cos(L.el.value);
      lo.shadowX = -lx * lift;
      lo.shadowY = -ly * lift + 6;
      lo.shadowA = lerp(0.2, 0.42, L.dark) * clamp(lo.show);
      const side = 2 * Math.max(1, lo.radius - lo.rim);
      loupeMatrices(cam, lo.x, lo.y, side, lo.mag, lo.vp, lo.inv);
    }
    renderer.render(f, canvas.width, canvas.height);
    return true;
  };

  /** Bead, weekday labels and the readout, written straight to the DOM when they change. */
  const syncDom = () => {
    if (!stage) return;
    const cam = L.cam;
    const dom = L.dom;
    const bead = beadRef.current;
    if (bead) {
      project(cam, Math.sin(L.az) * DIAL_R, 0, -Math.cos(L.az) * DIAL_R, scratchPoint);
      const x = Math.round(scratchPoint.x * 4) / 4;
      const y = Math.round(scratchPoint.y * 4) / 4;
      if (x !== dom.bx || y !== dom.by) {
        dom.bx = x;
        dom.by = y;
        bead.style.transform = `translate3d(${x - 20}px, ${y - 20}px, 0)`;
      }
      const deg = Math.round(((((L.az / DEG) % 360) + 360) % 360) / 5) * 5;
      if (deg !== dom.az) {
        dom.az = deg;
        bead.setAttribute("aria-valuenow", String(deg));
        bead.setAttribute("aria-valuetext", `Light from ${compass(deg)}`);
      }
    }
    for (let d = 0; d < 7; d++) {
      const label = labelRefs.current[d];
      if (!label) continue;
      const th = d * SECTOR;
      project(cam, Math.sin(th) * DIAL_R, 0, -Math.cos(th) * DIAL_R, scratchPoint);
      const x = Math.round(scratchPoint.x * 4) / 4;
      const y = Math.round(scratchPoint.y * 4) / 4;
      // labels step aside for the bead
      const near = Math.abs(wrapPi(L.az - th));
      const o = Math.round(smoothstep(0.1, 0.32, near) * 100) / 100;
      if (x !== dom.labels[d * 3] || y !== dom.labels[d * 3 + 1]) {
        dom.labels[d * 3] = x;
        dom.labels[d * 3 + 1] = y;
        label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      if (o !== dom.labels[d * 3 + 2]) {
        dom.labels[d * 3 + 2] = o;
        label.style.opacity = String(o);
      }
    }
    // the readout rides above the loupe, or above the day's segment
    const tip = tipRef.current;
    if (tip) {
      const day = L.shown;
      const on = Boolean(day) && (!day || day.week < Math.floor(L.grown));
      let tx = dom.tx;
      let ty = dom.ty;
      if (day) {
        if (L.loupeShow.value > 0.5) {
          tx = L.loupeX.value;
          ty = L.loupeY.value - L.loupeR * clamp(0.35 + 0.65 * L.loupeShow.value, 0, 1.1) - 10;
        } else {
          dayCentre(rings, day, scratchCentre);
          project(cam, scratchCentre.x, THICKNESS, scratchCentre.z, scratchPoint);
          tx = scratchPoint.x;
          ty = scratchPoint.y - 12;
        }
        tx = Math.round(tx * 2) / 2;
        ty = Math.round(ty * 2) / 2;
      }
      if (on && (tx !== dom.tx || ty !== dom.ty)) {
        dom.tx = tx;
        dom.ty = ty;
        const below = ty < 46;
        tip.style.transform = below
          ? `translate3d(${tx}px, ${ty + 2 * L.loupeR + 26}px, 0) translate(-50%, 0)`
          : `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -100%)`;
      }
      if (on !== dom.tipOn) {
        dom.tipOn = on;
        tip.style.opacity = on ? "1" : "0";
      }
    }
  };

  /* -------------------------------------------------------------------- */
  /* picking                                                               */
  /* -------------------------------------------------------------------- */

  /** What is at CSS px (x, y) on the slice's face: the day, and whether it is over the slice at all. */
  const probe = (x: number, y: number) => {
    castToPlane(L.cam, x, y, THICKNESS, scratchPlane);
    if (!scratchPlane.ok) return { day: null as Day | null, onSlice: false, r: 0, px: 0, pz: 0 };
    const px = scratchPlane.x;
    const pz = scratchPlane.z;
    const r = Math.hypot(px, pz);
    const outline = rendererRef.current?.outline;
    let outer = 1;
    if (outline) {
      const s = (angleOf(px, pz) / TAU) * SEG;
      const i0 = Math.floor(s) % SEG;
      const i1 = (i0 + 1) % SEG;
      outer = lerp(outline[i0], outline[i1], s - Math.floor(s));
    }
    const day = dayAt(rings, px, pz, L.grown);
    return { day, onSlice: r < outer + 0.015, r, px, pz };
  };

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const { width } = sizeRef.current;
    if (!renderer || width < 2) return false;
    const reduced = L.reduced;
    const now = performance.now() / 1000;

    // tiles run at 30 fps
    if (!stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }

    // a stage that runs slow for a sustained stretch renders a step smaller
    if (stage && (L.phase !== "idle" || L.drag || L.loupeShow.value > 0.01)) {
      const perf = L.perf;
      perf.time += dt;
      if (dt > 1 / 40) perf.slow += dt;
      if (perf.time >= 1.6) {
        if (perf.slow > perf.time * 0.7 && dprStepRef.current < DPR_STEPS.length - 1) setDprStep(dprStepRef.current + 1);
        perf.time = 0;
        perf.slow = 0;
      }
    }

    // the first frame on screen: grow the year, swing the light in
    if (L.introPending) {
      L.introPending = false;
      if (!reduced) {
        L.grown = 0;
        L.lastRing = 0;
        L.phase = "grow";
        L.phaseT = 0;
        if (stage) {
          L.azMode = "intro";
          L.azGoal = REST_AZ;
        }
      }
    }

    // growth
    if (L.phase !== "idle") {
      L.phaseT += dt;
      const n = rings.n;
      if (L.phase === "rewind") {
        const p = clamp(L.phaseT / REWIND_TIME);
        const e = p * p * (3 - 2 * p);
        L.grown = L.rewindFrom * (1 - e);
        if (p >= 1) {
          L.phase = "grow";
          L.phaseT = 0;
          L.grown = 0;
        }
      } else {
        const p = clamp(L.phaseT / (stage ? GROW_TIME : TILE_GROW_TIME));
        L.grown = n * growEase(p);
        if (p >= 1) {
          L.phase = "idle";
          L.grown = n;
        }
      }
      // a tick per ring that lands (or goes back in)
      const ring = Math.floor(L.grown + 1e-6);
      if (ring !== L.lastRing && stage) {
        const k = Math.max(0, Math.min(n - 1, Math.min(ring, L.lastRing)));
        const week = rings.weeks[k];
        const level = week ? 0.35 + 0.65 * smoothstep(0, 40, week.total) : 0.4;
        const rewinding = L.phase === "rewind";
        tick(rewinding ? 0.28 : level * 0.85, rewinding ? 0.25 + 0.5 * (k / n) : 0.15 + 0.85 * (k / n), 0, rewinding ? 10 : 14);
      }
      L.lastRing = ring;
    }

    // the light
    if (stage) {
      if (L.azMode === "coast") {
        L.az += L.azV * dt;
        L.azV *= Math.exp(-FRICTION * dt);
        if (Math.abs(L.azV) < 0.004) L.azV = 0;
        L.azGoal = L.az;
      } else {
        const s = L.azMode === "hand" ? HAND : L.azMode === "keys" ? KEYS : INTRO;
        if (reduced) {
          L.az = L.azGoal;
          L.azV = 0;
        } else {
          let remaining = dt;
          while (remaining > 1e-6) {
            const h = Math.min(1 / 240, remaining);
            const acc = s.k * (L.azGoal - L.az) - s.c * L.azV;
            L.azV += acc * h;
            L.az += L.azV * h;
            remaining -= h;
          }
        }
        if (L.azMode !== "hand" && Math.abs(L.azGoal - L.az) < 1e-4 && Math.abs(L.azV) < 1e-3) {
          L.az = L.azGoal;
          L.azV = 0;
          L.azMode = "coast";
        }
      }
    } else if (!reduced) {
      const target = L.hovering ? TILE_HOVER_ORBIT : TILE_ORBIT;
      L.azV = damp(L.azV, target, 2.2, dt);
      L.az += L.azV * dt;
      L.el.to(L.hovering ? TILE_HOVER_EL : TILE_EL + Math.sin(now * 0.37) * 5 * DEG);
    }
    if (L.az > 40 || L.az < -40) {
      const turns = Math.round(L.az / TAU) * TAU;
      L.az -= turns;
      L.azGoal -= turns;
    }
    if (reduced) L.el.set(L.el.target);
    else L.el.step(dt);

    // the camera leans a little after the pointer
    if (stage) {
      const lean = fine && L.pointerIn && !L.drag && !reduced;
      const { height } = sizeRef.current;
      L.leanX.to(lean ? clamp((L.pointerX / width) * 2 - 1, -1, 1) : 0);
      L.leanY.to(lean ? clamp((L.pointerY / Math.max(1, height)) * 2 - 1, -1, 1) : 0);
      if (reduced) {
        L.leanX.set(0);
        L.leanY.set(0);
      } else {
        L.leanX.step(dt);
        L.leanY.step(dt);
      }
    }

    // the loupe
    if (stage) {
      const touchHold = L.drag?.kind === "loupe";
      const keep = now < L.loupeUntil;
      const want = (L.loupeWant || touchHold || keep) && L.grown > 1;
      if (want && L.loupeShow.value < 0.02 && L.loupeShow.target === 0) {
        // appear where it is aimed, not glide in from the last place
        L.loupeX.set(L.loupeAimX);
        L.loupeY.set(L.loupeAimY);
      }
      L.loupeShow.to(want ? 1 : 0);
      L.loupeX.to(L.loupeAimX);
      L.loupeY.to(L.loupeAimY);
      if (reduced) {
        L.loupeShow.set(L.loupeShow.target);
        L.loupeX.set(L.loupeAimX);
        L.loupeY.set(L.loupeAimY);
      } else {
        L.loupeShow.step(dt);
        L.loupeX.step(dt);
        L.loupeY.step(dt);
      }
      // the day under the loupe's centre, and a tick per ring crossed
      if (L.loupeShow.value > 0.05 && L.loupeShow.target > 0) {
        const hit = probe(L.loupeX.value, L.loupeY.value);
        if (L.loupeWant || touchHold) {
          L.hoverDay = hit.day;
        }
        if (hit.onSlice) {
          const c = ringCoordinate(rings, angleOf(hit.px, hit.pz), hit.r);
          const ring = Math.floor(Math.min(c, L.grown));
          if (!Number.isNaN(L.loupeRing) && ring !== L.loupeRing && ring >= 0) {
            const speed = Math.hypot(L.loupeX.velocity, L.loupeY.velocity);
            const level = 0.55 * (1 - 0.55 * smoothstep(300, 2400, speed));
            tick(level, clamp(0.25 + 0.6 * (ring / rings.n) + speed / 6000), (L.loupeX.value / width) * 2 - 1, 20);
          }
          L.loupeRing = ring;
        } else {
          L.loupeRing = NaN;
        }
      } else if (L.loupeShow.target === 0) {
        L.loupeRing = NaN;
      }
    }

    // what is shown: the day under the loupe, else the pinned one
    const want = stage ? L.hoverDay ?? L.pinned : null;
    if (want !== L.shown) showDay(want);
    const a = L.slotA;
    const b = L.slotB;
    if (reduced) {
      a.s = a.day ? 1 : 0;
      b.s = 0;
    } else {
      a.s = damp(a.s, a.day ? 1 : 0, 16, dt);
      b.s = damp(b.s, 0, 12, dt);
    }
    if (b.s < 0.002) b.s = 0;

    // the knock's ring of light
    L.knockAge += dt;

    // the tile's hover colour
    L.hover = reduced ? (L.hovering ? 1 : 0) : damp(L.hover, L.hovering && !stage ? 1 : 0, 10, dt);
    // the theme eases
    L.dark = reduced ? (L.theme === "dark" ? 1 : 0) : damp(L.dark, L.theme === "dark" ? 1 : 0, 5, dt);

    paint();
    syncDom();

    // sleep once everything has settled
    const settled =
      L.phase === "idle" &&
      !L.drag &&
      (stage ? L.azMode === "coast" && L.azV === 0 : reduced) &&
      L.el.settled &&
      L.leanX.settled &&
      L.leanY.settled &&
      L.loupeShow.settled &&
      L.loupeX.settled &&
      L.loupeY.settled &&
      now >= L.loupeUntil &&
      (a.s === 0 || a.s > 0.998) &&
      b.s === 0 &&
      L.knockAge > 2.5 &&
      Math.abs(L.dark - (L.theme === "dark" ? 1 : 0)) < 0.002 &&
      (L.hover === 0 || L.hover > 0.998);
    if (settled) {
      if (a.s > 0.998) a.s = 1;
      L.hover = L.hover > 0.5 ? 1 : 0;
      L.dark = L.theme === "dark" ? 1 : 0;
      paint();
      return false;
    }
  });

  const dprStepRef = useLatest(dprStep);

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? DPR_STEPS[dprStep] : 1.5,
    attributes: { alpha: false, antialias: true, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: RingRenderer | null = null;
      try {
        renderer = new RingRenderer(gl, mode, rings);
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
    onResize: (size) => {
      setNarrow(size.width < 560);
      applySize();
      // the backing store was just cleared: repaint before the browser shows it
      paint();
      syncDom();
      wake();
    },
  });

  /* -------------------------------------------------------------------- */
  /* theme, reduced motion, colours                                        */
  /* -------------------------------------------------------------------- */

  const readColours = useCallback(() => {
    try {
      const style = getComputedStyle(document.documentElement);
      L.bg = parseColour(style.getPropertyValue("--tile"), L.bg);
      L.bgHover = parseColour(style.getPropertyValue("--tile-hover"), L.bgHover);
      L.ink = parseColour(style.getPropertyValue("--foreground"), L.ink);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    L.theme = theme;
    readColours();
    // the palette attribute (AMOLED) can change the colours without the theme
    const observer = new MutationObserver(() => {
      readColours();
      wake();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "class"] });
    wake();
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    L.reduced = reducedMotion;
    if (reducedMotion) {
      L.introPending = false;
      L.phase = "idle";
      L.grown = rings.n;
      if (L.azMode !== "coast" && L.azMode !== "orbit") {
        L.az = L.azGoal;
        L.azMode = "coast";
      }
      L.azV = stage ? 0 : L.azV;
    }
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const latestWake = useLatest(wake);
  const noteInput = () => {
    L.lastInput = performance.now() / 1000;
    latestWake.current();
  };

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  /** The floor angle under CSS px (x, y) and how far out it is. */
  const floorAt = (x: number, y: number) => {
    castToPlane(L.cam, x, y, 0, scratchPlane);
    return { phi: angleOf(scratchPlane.x, scratchPlane.z), rho: Math.hypot(scratchPlane.x, scratchPlane.z), z: scratchPlane.z };
  };

  const record = (drag: Drag, at: number) => {
    const i = drag.n % drag.ts.length;
    drag.ts[i] = at / 1000;
    drag.gs[i] = L.azGoal;
    drag.n += 1;
  };

  /** Radians per second over the last ~80 ms of the drag (event times). */
  const releaseVelocity = (drag: Drag, upAt: number): number => {
    const size = drag.ts.length;
    if (drag.n < 2) return 0;
    const last = (drag.n - 1) % size;
    const tEnd = drag.ts[last];
    if (upAt / 1000 - tEnd > 0.09) return 0;
    let first = last;
    for (let j = 1; j < Math.min(drag.n, size); j++) {
      const idx = (drag.n - 1 - j) % size;
      first = idx;
      if (tEnd - drag.ts[idx] > 0.08) break;
    }
    const span = tEnd - drag.ts[first];
    if (span < 0.012) return 0;
    return (drag.gs[last] - drag.gs[first]) / span;
  };

  const startHand = () => {
    L.azGoal = L.az;
    L.azMode = "hand";
  };

  const knockAt = (px: number, pz: number, r: number) => {
    L.frame.knock[0] = px;
    L.frame.knock[1] = pz;
    L.knockAge = 0;
    L.knockS = L.reduced ? 0 : 1;
    const { width } = sizeRef.current;
    knockSound(r, 1, (L.pointerX / Math.max(1, width)) * 2 - 1);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || !event.isPrimary || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    ensureAudio();
    const { x, y } = local(event);
    L.pointerX = x;
    L.pointerY = y;
    const onBead = Boolean((event.target as Element).closest("[data-light]"));
    const floor = floorAt(x, y);
    const hit = probe(x, y);
    const drag: Drag = {
      id: event.pointerId,
      kind: onBead ? "grab" : "pending",
      type: event.pointerType,
      x0: x,
      y0: y,
      t0: performance.now() / 1000,
      lastX: x,
      lastPhi: floor.phi,
      sign: floor.z > 0 ? -1 : 1,
      moved: false,
      onWood: Boolean(hit.day),
      ts: new Float64Array(8),
      gs: new Float64Array(8),
      n: 0,
    };
    L.drag = drag;
    try {
      rootRef.current?.setPointerCapture(event.pointerId);
    } catch {}
    if (drag.kind === "grab") {
      startHand();
      L.loupeWant = false;
      if (rootRef.current) rootRef.current.style.cursor = "grabbing";
    }
    if (drag.type !== "mouse") {
      L.loupeAimX = x;
      L.loupeAimY = y - L.loupeR - 34;
    }
    record(drag, event.timeStamp);
    if (!touched) setTouched(true);
    noteInput();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage) return;
    const { x, y } = local(event);
    L.pointerX = x;
    L.pointerY = y;
    L.pointerIn = true;
    const drag = L.drag;
    if (!drag) {
      // hover: the loupe comes out over the slice
      if (event.pointerType === "mouse") {
        const hit = probe(x, y);
        L.loupeWant = hit.onSlice;
        L.loupeAimX = x;
        L.loupeAimY = y;
        if (!hit.onSlice) L.hoverDay = null;
        if (rootRef.current) rootRef.current.style.cursor = hit.onSlice ? "crosshair" : "grab";
      }
      noteInput();
      return;
    }
    if (event.pointerId !== drag.id) return;
    const threshold = drag.type === "mouse" ? 5 : 9;
    if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) > threshold) {
      drag.moved = true;
      if (drag.kind === "pending") {
        drag.kind = "spin";
        startHand();
        L.loupeWant = false;
        L.hoverDay = null;
        drag.lastX = x;
        drag.lastPhi = floorAt(x, y).phi;
        if (rootRef.current) rootRef.current.style.cursor = "grabbing";
      }
    }
    if (drag.kind === "loupe") {
      L.loupeAimX = x;
      L.loupeAimY = y - L.loupeR - 34;
    } else if (drag.kind === "grab") {
      const floor = floorAt(x, y);
      L.azGoal += wrapPi(floor.phi - L.azGoal);
    } else if (drag.kind === "spin") {
      const floor = floorAt(x, y);
      const dx = x - drag.lastX;
      const radius = Math.max(40, L.cam.pxPerUnit);
      if (drag.type === "mouse" || drag.type === "pen") {
        // turn it like a dial where the hand is far enough out; slide it near the middle
        const w = smoothstep(0.22, 0.6, floor.rho);
        const sign = floor.z > 0 ? -1 : 1;
        L.azGoal += w * wrapPi(floor.phi - drag.lastPhi) + (1 - w) * sign * (dx / radius);
      } else {
        L.azGoal += drag.sign * (dx / (radius * 0.95));
      }
      drag.lastX = x;
      drag.lastPhi = floor.phi;
    }
    record(drag, event.timeStamp);
    noteInput();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = L.drag;
    if (!drag || event.pointerId !== drag.id) return;
    L.drag = null;
    try {
      rootRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
    const { x, y } = local(event);
    if (rootRef.current) rootRef.current.style.cursor = fine ? (probe(x, y).onSlice ? "crosshair" : "grab") : "";
    if (drag.kind === "pending" && !cancelled) {
      // a tap or a click: knock on the wood and keep that day, or clear on the table
      const hit = probe(x, y);
      if (hit.day) {
        L.pinned = L.pinned === hit.day && drag.type === "mouse" ? null : hit.day;
        if (L.pinned) setAnnounce(announcement(rings, hit.day));
        knockAt(hit.px, hit.pz, hit.r);
      } else {
        L.pinned = null;
      }
      if (drag.type === "mouse") {
        L.loupeWant = hit.onSlice;
        L.loupeAimX = x;
        L.loupeAimY = y;
      }
      noteInput();
      return;
    }
    if (drag.kind === "loupe") {
      // keep what the loupe was on, and let the loupe linger a moment
      if (L.hoverDay) {
        L.pinned = L.hoverDay;
        setAnnounce(announcement(rings, L.hoverDay));
      }
      L.hoverDay = null;
      L.loupeUntil = performance.now() / 1000 + 1.1;
      noteInput();
      return;
    }
    if (drag.kind === "spin" || drag.kind === "grab") {
      const v = cancelled || L.reduced ? 0 : releaseVelocity(drag, event.timeStamp);
      L.azMode = "coast";
      L.az = L.reduced ? L.azGoal : L.az;
      L.azV = clamp(v, -MAX_SPIN, MAX_SPIN);
      if (drag.type === "mouse") {
        const hit = probe(x, y);
        L.loupeWant = hit.onSlice;
        L.loupeAimX = x;
        L.loupeAimY = y;
      }
    }
    noteInput();
  };

  // a touch held still on the wood brings the loupe out above the finger
  useEffect(() => {
    if (!stage) return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const check = () => {
      raf = requestAnimationFrame(check);
      const drag = L.drag;
      if (!drag || drag.kind !== "pending" || drag.type === "mouse" || drag.moved) return;
      if (performance.now() / 1000 - drag.t0 < 0.26) return;
      drag.kind = "loupe";
      L.loupeAimX = drag.x0;
      L.loupeAimY = drag.y0 - L.loupeR - 34;
      latestWake.current();
    };
    raf = requestAnimationFrame(check);
    // once the loupe is out, the finger moves it instead of scrolling the page
    const onTouchMove = (event: TouchEvent) => {
      const kind = L.drag?.kind;
      if ((kind === "loupe" || kind === "spin" || kind === "grab") && event.cancelable) event.preventDefault();
    };
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("touchmove", onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || L.drag) return;
    if (event.pointerType !== "mouse") return;
    L.pointerIn = false;
    L.loupeWant = false;
    L.hoverDay = null;
    noteInput();
  };

  /** Put the loupe on a day (keyboard). */
  const lookAt = (day: Day | null) => {
    L.pinned = day;
    if (!day) {
      L.loupeWant = false;
      L.hoverDay = null;
      return;
    }
    dayCentre(rings, day, scratchCentre);
    project(L.cam, scratchCentre.x, THICKNESS, scratchCentre.z, scratchPoint);
    L.loupeAimX = scratchPoint.x;
    L.loupeAimY = scratchPoint.y;
    L.loupeWant = true;
    L.hoverDay = null;
    setAnnounce(announcement(rings, day));
    tick(0.5, 0.3 + 0.6 * (day.week / rings.n), 0, 0);
  };

  const swing = (by: number) => {
    L.azGoal = (L.azMode === "coast" ? L.az : L.azGoal) + by;
    L.azMode = "keys";
    if (L.reduced) {
      L.az = L.azGoal;
      L.azMode = "coast";
    }
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    ensureAudio();
    const current = L.pinned ?? L.hoverDay;
    let next: Day | null | undefined;
    switch (event.key) {
      case "ArrowRight":
        next = current ? stepDay(rings, current, 1) : lastActive(rings);
        break;
      case "ArrowLeft":
        next = current ? stepDay(rings, current, -1) : lastActive(rings);
        break;
      case "ArrowUp":
        next = current ? stepWeek(rings, current, 1) : lastActive(rings);
        break;
      case "ArrowDown":
        next = current ? stepWeek(rings, current, -1) : lastActive(rings);
        break;
      case "PageUp":
        next = current ? stepWeek(rings, current, 4) : lastActive(rings);
        break;
      case "PageDown":
        next = current ? stepWeek(rings, current, -4) : lastActive(rings);
        break;
      case "Home":
        next = rings.days[0] ?? null;
        break;
      case "End":
        next = rings.days[rings.days.length - 1] ?? null;
        break;
      case "q":
      case "Q":
      case "[":
        event.preventDefault();
        swing(-Math.PI / 6);
        noteInput();
        return;
      case "e":
      case "E":
      case "]":
        event.preventDefault();
        swing(Math.PI / 6);
        noteInput();
        return;
      case "Enter":
      case " ": {
        event.preventDefault();
        const day = current ?? lastActive(rings);
        if (day) {
          if (!current) lookAt(day);
          dayCentre(rings, day, scratchCentre);
          knockAt(scratchCentre.x, scratchCentre.z, scratchCentre.r);
        }
        noteInput();
        return;
      }
      case "Escape":
        if (L.pinned || L.loupeWant) {
          event.preventDefault();
          lookAt(null);
          setAnnounce("");
          noteInput();
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next === undefined) return;
    if (next === current && next) setAnnounce(announcement(rings, next));
    else lookAt(next);
    noteInput();
  };

  const onBeadKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? Math.PI / 4 : Math.PI / 12;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        swing(step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        swing(-step);
        break;
      case "PageUp":
        swing(Math.PI / 2);
        break;
      case "PageDown":
        swing(-Math.PI / 2);
        break;
      case "Home":
        swing(wrapPi(REST_AZ - L.az));
        break;
      default:
        return;
    }
    event.preventDefault();
    ensureAudio();
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

  // the DOM bits follow before the first paint
  useIsoLayoutEffect(() => {
    L.dom.bx = NaN;
    L.dom.tx = NaN;
    L.dom.az = NaN;
    L.dom.labels.fill(NaN);
    syncDom();
  });

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  if (supported === false) return <Fallback mode={mode} theme={theme} rings={rings} />;

  if (!stage) {
    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />;
  }

  const busiest = rings.busiest;
  const description = `A slice of a tree trunk grown from ${rings.username}'s ${rings.total} GitHub contributions in ${rings.year}: ${rings.n} rings, one for each week from January at the pith to this week at the bark. Each day is a seventh of its ring, Sunday at the back and the rest clockwise, and the more contributions a day had, the wider and darker its part of the ring.${
    busiest ? ` The widest, darkest band is ${describeDay(busiest)}.` : ""
  }`;

  const hint = keyFocus
    ? narrow
      ? "← → days · ↑ ↓ rings · Q E light"
      : "← → walk the days · ↑ ↓ the rings · Enter knocks · Q E swing the light"
    : fine
      ? "Move over the wood to look closer · Drag to swing the light round · Click to knock"
      : "Tap a ring for its day · Hold to look closer · Swipe sideways to swing the light";
  const hintHidden = !fine && !keyFocus && touched;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      style={{ touchAction: "pan-y", cursor: fine ? "grab" : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endDrag(event, false)}
      onPointerCancel={(event) => endDrag(event, true)}
      onPointerLeave={onPointerLeave}
      onContextMenu={(event) => {
        if (event.nativeEvent instanceof PointerEvent && event.nativeEvent.pointerType === "mouse") return;
        event.preventDefault();
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />

      {/* the weekdays on the dial */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {WEEKDAYS.map((name, index) => (
          <span
            key={name}
            ref={(element) => {
              labelRefs.current[index] = element;
            }}
            data-on={shown && shown.weekday === index ? "" : undefined}
            className="absolute start-0 top-0 text-[11px] leading-none font-medium tracking-[0.02em] text-tertiary transition-colors duration-200 will-change-transform data-[on]:text-primary"
          >
            {name}
          </span>
        ))}
      </div>

      {/* the slice as a keyboard-walkable application region */}
      <div
        role="application"
        tabIndex={0}
        aria-roledescription="tree ring slice"
        aria-label={`Year rings. ${description}`}
        aria-describedby={hintId}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown PageUp PageDown Home End Enter Q E Escape"
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          try {
            if (event.currentTarget.matches(":focus-visible")) setKeyFocus(true);
          } catch {}
        }}
        onBlur={() => setKeyFocus(false)}
        className="absolute inset-0 rounded-[24px] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"
      />

      {/* the light, riding on the dial */}
      <div
        ref={beadRef}
        data-light=""
        role="slider"
        tabIndex={0}
        aria-label="Light direction"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-orientation="horizontal"
        onKeyDown={onBeadKey}
        className="group/bead absolute start-0 top-0 grid size-10 touch-none place-items-center rounded-full outline-none will-change-transform"
        style={{ cursor: "grab" }}
      >
        <span
          aria-hidden="true"
          className="block size-[15px] rounded-full bg-[radial-gradient(circle_at_38%_35%,#fffdf6_0%,#ffe7b8_42%,#f3b968_100%)] shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_1px_3px_rgb(0_0_0/0.18),0_0_14px_3px_rgb(255_196_110/0.45)] transition-[scale,box-shadow] duration-200 ease-out group-hover/bead:scale-115 group-focus-visible/bead:shadow-[0_0_0_2px_var(--foreground),0_0_14px_3px_rgb(255_196_110/0.5)] group-active/bead:scale-125 dark:shadow-[0_0_0_1px_rgb(255_220_160/0.25),0_0_18px_5px_rgb(255_170_80/0.5)]"
        />
      </div>

      {/* the day under the loupe */}
      <div
        ref={tipRef}
        aria-hidden="true"
        className="pointer-events-none absolute start-0 top-0 z-[5] rounded-[10px] bg-float px-2.5 py-1.5 text-center text-[12px] leading-[1.35] whitespace-nowrap text-primary opacity-0 shadow-float transition-opacity duration-150 ease-out"
      >
        {shown ? (
          <>
            <span className="font-medium tabular-nums">{shown.count === 0 ? "No" : shown.count}</span>{" "}
            <span className="text-secondary">
              {plural(shown.count, "contribution")} on {shortWeekday(shown)}
            </span>
            <span className="block text-[11px] text-tertiary">
              Ring {shown.week + 1} of {rings.n} · {weekLabel(rings, shown.week)}
            </span>
          </>
        ) : null}
      </div>

      <p id={hintId} className="sr-only">
        The light rides on a dial round the slice: drag anywhere, or move the light&apos;s handle with the arrow keys.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* phones: the legend rides at the top */}
      <StageControls placement="top" className="sm:hidden">
        <Legend rings={rings} />
      </StageControls>

      <StageControls placement="bottom">
        <TrayRow>
          <Legend rings={rings} className="max-sm:hidden" />
          <Tray label="Controls">
            <TrayButton
              icon={<GrowIcon size={15} />}
              onClick={() => {
                ensureAudio();
                regrow();
                noteInput();
              }}
            >
              Grow
            </TrayButton>
            <TrayDivider />
            <MuteButton />
          </Tray>
        </TrayRow>
        <StageHint className={`transition-opacity duration-500 ease-out ${hintHidden ? "opacity-0" : "opacity-100"}`}>
          <span aria-hidden={hintHidden ? true : undefined}>{hint}</span>
        </StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* bits                                                                    */
/* ---------------------------------------------------------------------- */

function shortWeekday(day: Day): string {
  const [, m, d] = day.date.split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(m || 1) - 1];
  return `${WEEKDAYS[day.weekday]}, ${month} ${d}`;
}

function announcement(rings: Rings, day: Day): string {
  return `${day.count === 0 ? "No" : day.count} ${plural(day.count, "contribution")} on ${longDate(day.date)}, ring ${day.week + 1} of ${rings.n}.`;
}

/** Where the keys start: the latest day with contributions. */
function lastActive(rings: Rings): Day | null {
  for (let i = rings.days.length - 1; i >= 0; i--) if (rings.days[i].count > 0) return rings.days[i];
  return rings.days[rings.days.length - 1] ?? null;
}

function compass(deg: number): string {
  // 0° is the back of the slice (behind it, seen from the front)
  const names = ["behind", "behind, right", "the right", "in front, right", "in front", "in front, left", "the left", "behind, left"];
  return names[Math.round(deg / 45) % 8];
}

/** "562 contributions in 2026" and a key: a quiet day's thin pale ring to the busiest day's wide dark one. */
function Legend({ rings, className }: { rings: Rings; className?: string }) {
  const max = rings.maxCount || 1;
  const steps = [0, Math.max(1, Math.round(max / 14)), Math.max(2, Math.round(max / 4)), max].filter(
    (value, index, all) => all.indexOf(value) === index,
  );
  let x = 1;
  const bands = steps.map((count) => {
    const w = 2 + Math.sqrt(count) * 1.05;
    const level = count > 0 ? 1 - Math.exp(-count / 6.2) : 0;
    const band = { x, w, level, count };
    x += w + 3;
    return band;
  });
  const total = x;
  return (
    <Tray label="Legend" className={className}>
      <div className="flex h-10 items-center gap-2 ps-2.5 pe-2">
        <span className="text-[13px] whitespace-nowrap text-primary">
          <span className="font-medium tabular-nums">{rings.total.toLocaleString("en-US")}</span>{" "}
          <span className="text-secondary">contributions in {rings.year}</span>
        </span>
      </div>
      <TrayDivider />
      <div
        className="flex h-10 items-center gap-1.5 ps-1.5 pe-2.5"
        role="img"
        aria-label={`A ring is wider and darker the more contributions its day had: from none to ${max}`}
      >
        <span aria-hidden="true" className="text-[11px] text-tertiary tabular-nums">
          0
        </span>
        <svg aria-hidden="true" width={Math.ceil(total)} height={18} viewBox={`0 0 ${Math.ceil(total)} 18`}>
          {bands.map((band) => (
            <g key={band.count}>
              <rect x={band.x} y={2} width={band.w} height={14} rx={1} fill="#e2c7a2" />
              <rect
                x={band.x + band.w * (1 - lerp(0.22, 0.55, band.level))}
                y={2}
                width={band.w * lerp(0.22, 0.55, band.level)}
                height={14}
                rx={0.8}
                fill={band.level > 0.5 ? "#6e4426" : band.level > 0.1 ? "#9a6a42" : "#c39d71"}
              />
            </g>
          ))}
        </svg>
        <span aria-hidden="true" className="text-[11px] text-tertiary tabular-nums">
          {max}
        </span>
      </div>
    </Tray>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat drawing of the rings from above for browsers without WebGL2. */
function Fallback({ mode, theme, rings }: { mode: "tile" | "stage"; theme: PieceTheme; rings: Rings }) {
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
      ctx.clearRect(0, 0, rect.width, rect.height);
      const stageMode = mode === "stage";
      const cx = rect.width / 2;
      const cy = stageMode ? rect.height * 0.45 : rect.height / 2;
      const scale = Math.min(rect.width, rect.height * (stageMode ? 0.78 : 1)) * 0.44;
      const pts = 96;
      const outline = (k: number, extra: number) => {
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
          const th = (i / pts) * TAU;
          const r = (boundAt(rings, k, th) + extra) * scale;
          const x = cx + Math.sin(th) * r;
          const y = cy - Math.cos(th) * r;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.closePath();
      };
      ctx.fillStyle = theme === "dark" ? "#4a3d34" : "#6f6156";
      outline(rings.n, 0.045);
      ctx.fill();
      ctx.fillStyle = "#e4c9a3";
      outline(rings.n, 0);
      ctx.fill();
      for (let k = 1; k <= rings.n; k++) {
        // latewood: one stroke per day's sector, darker for busier days
        for (let d = 0; d < 7; d++) {
          const day = rings.weeks[k - 1]?.days[d];
          if (!day) continue;
          ctx.beginPath();
          for (let s = 0; s <= 8; s++) {
            const th = (d - 0.5 + s / 8) * SECTOR;
            const r = boundAt(rings, k, th) * scale - 0.6;
            const x = cx + Math.sin(th) * r;
            const y = cy - Math.cos(th) * r;
            if (s) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.strokeStyle = day.level > 0.5 ? "#6e4426" : day.level > 0.1 ? "#9a6a42" : "#c9a67c";
          ctx.lineWidth = 0.8 + day.level * 2.2;
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#7a5034";
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1.5, boundAt(rings, 0, 0) * scale), 0, TAU);
      ctx.fill();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [mode, theme, rings]);
  return (
    <canvas
      ref={ref}
      role={mode === "stage" ? "img" : undefined}
      aria-label={mode === "stage" ? `Year rings: ${rings.total} GitHub contributions in ${rings.year} as the rings of a tree, one ring per week` : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="absolute inset-0 block size-full"
    />
  );
}

