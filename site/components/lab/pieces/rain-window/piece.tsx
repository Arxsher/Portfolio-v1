"use client";

// Rain window: a window on a rainy evening, the street outside blurred into
// warm lights, the glass running with rain and fogged on the inside. Wipe
// it with your finger.
//
// The look
// - A painted casement window set in the stage's wall: a moulded casing,
//   three sashes on a desktop stage (two in a tall full screen, one on a
//   phone and on the tile) with a brass handle, and a sill you see a little
//   from above. The woodwork is a height field lit by a lamp in the room, up
//   and to the left (white paint at blue hour, warm lamplight at night); its
//   faces toward the glass pick up the street's light, and the lightning.
// - Outside, the far side of a wet street at blue hour (the light theme) or
//   at night (the dark one): lit windows, a shop with bulbs under its
//   awning, a café with a pink sign, a teal band on the corner shop,
//   streetlamps, a traffic light changing at the corner, cars passing both
//   ways, all of it doubled in the road. The eye is on the glass, so the
//   street is out of focus: every light a soft disc.
// - Two layers of water. Outside, the rain: fine beads everywhere, drops
//   that gather, hang, let go and run, each one a lens showing the street
//   in focus and upside down. Inside, the condensation: thin up top (warm
//   air), thick in the lower half and along the cold frame, the street's
//   lights glowing through it and the rain behind it seen as soft blots.
//
// The motion model
// - The rain (water.ts) is simulated: drops pinned by surface tension until
//   gravity wins, sliding in stick-slip lurches over a fixed friction field,
//   eating the beads in their lane, leaving a dotted trail, growing when
//   rain lands on them, merging (volume and momentum kept) with a wobble on
//   a stiff spring, and draining into the bottom rail.
// - The wipe (brush.ts) is direct: the clear streak is exactly the path of
//   the finger, every pointer sample of it (coalesced events included), with
//   no smoothing and no lag. Its physics is in the water: the fog taken off
//   is water picked up, shed as beads along both edges of the streak; when
//   the finger holds enough, a drip forms on its lower rim and runs,
//   clearing a lane through the fog; the finger mops up any drips it
//   passes. The wiped glass fogs back over about seven seconds in soft
//   islands, from the frame inward. Only the fingertip's size springs (a
//   light touch flattening into a press). Nothing animates toward the
//   finger, so nothing needs interrupting: press again anywhere, any time.
// - A click or tap that doesn't drag is a knuckle on the glass: a wave runs
//   out from it, every drop it passes jiggles, and the heavy ones near the
//   knock let go and run.
// - Thunder: the clouds flash (two pulses at most, never more than two
//   flashes in a second), the fog lights up, the frame's edges catch it;
//   the rumble follows after a delay that tells how far away it was, and
//   when it arrives the pane shakes and drops let go. The first strike comes
//   a few seconds in, then every half minute or so (sooner in the storm).
// - The "wow" second: a stroke across the fog. It parts onto a pane full of
//   tiny upside-down streets and a crisp, warm shopfront, a row of beads
//   lines the streak, and drips set off from it. A second after the stage
//   opens, an unseen finger makes one such stroke by itself, so the very
//   first frames show what to do.
// - The view shifts a little with the mouse (the street and the towers at
//   different depths), on a soft critically damped spring.
// - Keyboard: the window is focusable. Arrow keys move a fingertip and
//   wipe as it goes (Shift for faster), Space or Enter knocks, T calls the
//   thunder, B breathes on the glass, 1 2 3 set the rain.
// - Sound (stage, after a press or a key on the window, lab mute respected):
//   rain on the glass, the rub of a fingertip on wet glass, a knock with a
//   short glassy ring, thunder, a breath.
// - Tile: the same window, one pane. Rain runs, the light changes at the
//   corner, an unseen finger wipes a stroke every ten seconds or so, thunder
//   now and then; the mouse wipes where it hovers. 30 fps, no sound.
// - Lifetime: the simulation and the street are allocation-free per frame;
//   the street's still part is cached and redrawn only when the light, the
//   theme or the view changes, the lights and cars at 30 fps; the stage
//   steps its resolution down if a machine can't keep up; the loop stops
//   offscreen and in a hidden tab; the WebGL context is handed back on
//   unmount (useWebGL2).
// - Reduced motion: a still: a pane that has been out in the rain with one
//   wiped streak. Wiping still clears the glass (and it stays clear),
//   Breathe fogs it at once, and thunder is a sound and a steady glow,
//   without the flicker.
//
// Files: layout.ts (the window), scene.ts (the street), water.ts (drops),
// brush.ts (the fingertip), fog.ts (condensation), shaders.ts + renderer.ts
// (WebGL2), sound.ts, icons.tsx.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/cn";
import { ensureAudio, getAudio, useMuted } from "../../audio";
import { clamp, damp, seededRandom, Spring, useFinePointer, useFrame, useIsoLayoutEffect, useLatest, useWebGL2 } from "../../hooks";
import type { PieceMode, PieceProps, PieceTheme } from "../../types";
import { IconButton, MuteButton, Segmented, StageControls, StageHint, Tray, TrayDivider } from "../../ui";
import { Brush } from "./brush";
import { FogMirror, Stamps } from "./fog";
import { BoltIcon, BreathIcon } from "./icons";
import { layoutWindow, newLayout, paneAt, type WindowLayout } from "./layout";
import { newRainFrame, RainRenderer, type RainFrame } from "./renderer";
import { City } from "./scene";
import { exhale, knock, RainSound, thunder } from "./sound";
import { Water, type WaterConfig } from "./water";

/* ---------------------------------------------------------------------- */
/* tuning                                                                  */
/* ---------------------------------------------------------------------- */

type Level = 0 | 1 | 2;

/** Raindrops landing, per second per 10 000 px² of glass. */
const RATES: Record<Level, number> = { 0: 1.6, 1: 4, 2: 9 };
/** Seconds between strikes (a range). */
const STRIKES: Record<Level, [number, number]> = { 0: [70, 120], 1: [26, 50], 2: [9, 20] };
/** Sideways push of the wind on running drops. */
const WIND: Record<Level, number> = { 0: 0, 1: 0.02, 2: 0.09 };

const LEVELS = [
  { value: 0 as Level, label: "Drizzle" },
  { value: 1 as Level, label: "Rain" },
  { value: 2 as Level, label: "Storm" },
] as const;

/** Fingertip radius (CSS px). */
const TIP = { mouse: 22, touch: 25, pen: 17, keys: 22, tile: 11 } as const;

/** The settled fog: its density at the top of a pane and at the bottom rail. */
const FOG_LEVEL = { lo: 0.16, hi: 0.97 } as const;

/** The stage's DPR cap, stepped down if a machine can't keep up. */
const DPR_STEPS = [2, 1.5, 1.25, 1] as const;

const OUTER: Omit<WaterConfig, "capacity" | "seed"> = {
  cell: 9,
  cellCap: 4,
  beadMax: 2.8,
  slide: 4.8,
  speed: 70,
  maxSpeed: 320,
  trail: 0.24,
  lanes: false,
};
const INNER: Omit<WaterConfig, "capacity" | "seed"> = {
  cell: 7,
  cellCap: 3,
  beadMax: 1.9,
  slide: 2.5,
  speed: 58,
  maxSpeed: 220,
  trail: 0.22,
  lanes: true,
};

/* ---------------------------------------------------------------------- */
/* state                                                                   */
/* ---------------------------------------------------------------------- */

type Vec3 = [number, number, number];

function parseColour(value: string, fallback: Vec3): Vec3 {
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

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** A stroke the window makes by itself (the tile's loop, the stage's first moment, the still). */
type Ghost = { on: boolean; t: number; dur: number; x0: number; y0: number; x1: number; y1: number; bend: number };

type Live = {
  stage: boolean;
  layout: WindowLayout;
  sized: boolean;
  outer: Water;
  inner: Water;
  mirror: FogMirror;
  stamps: Stamps;
  brush: Brush;
  city: City;
  frame: RainFrame;
  level: Level;
  theme: PieceTheme;
  reduced: boolean;
  night: number;
  clock: number;
  acc: number;
  sceneAcc: number;
  // lightning
  flashT: number;
  flashA0: number;
  flashT1: number;
  flashA1: number;
  flashGlow: number;
  nextStrike: number;
  shakeAt: number;
  shakeStrength: number;
  // the view's parallax
  parX: Spring;
  parY: Spring;
  // the fingertip ring
  ring: number;
  hoverX: number;
  hoverY: number;
  hoverOn: boolean;
  /** the fingertip size of the pointer in use */
  pointerTip: number;
  /** the pointer that is wiping, and where its press began */
  pointerId: number;
  downX: number;
  downY: number;
  downT: number;
  downMoved: boolean;
  lastMoveT: number;
  // keyboard fingertip
  keyX: number;
  keyY: number;
  keyVX: number;
  keyVY: number;
  keyL: boolean;
  keyR: boolean;
  keyU: boolean;
  keyD: boolean;
  keyFast: boolean;
  keyBrush: boolean;
  keyIdle: number;
  keyFocus: boolean;
  // strokes by themselves
  ghost: Ghost;
  ghostNext: number;
  ghostFlip: boolean;
  // breath
  breathOn: boolean;
  breathT: number;
  breathX: number;
  breathY: number;
  // colours
  bg: Vec3;
  bgHover: Vec3;
  hover: number;
  hovering: boolean;
  // performance
  dprStep: number;
  perfTime: number;
  perfSlow: number;
  range: { x0: number; x1: number };
  rand: () => number;
  /** the controls' reserve at the bottom of the stage (CSS px) */
  reserve: number;
};

function makeLive(mode: PieceMode, theme: PieceTheme, reduced: boolean): Live {
  const stage = mode === "stage";
  const rand = seededRandom(0x5eed + (stage ? 1 : 2));
  const dark = theme === "dark";
  return {
    stage,
    layout: newLayout(),
    sized: false,
    outer: new Water({ ...OUTER, capacity: stage ? 420 : 140, seed: 0x9e37 }),
    inner: new Water({ ...INNER, capacity: stage ? 140 : 60, seed: 0x2b71 }),
    mirror: new FogMirror(FOG_LEVEL),
    stamps: new Stamps(),
    brush: new Brush(rand),
    city: new City(),
    frame: newRainFrame(),
    level: 1,
    theme,
    reduced,
    night: dark ? 1 : 0,
    clock: 0,
    acc: 0,
    sceneAcc: 1,
    flashT: 99,
    flashA0: 0,
    flashT1: 0,
    flashA1: 0,
    flashGlow: 0,
    nextStrike: stage ? 7.5 : 9,
    shakeAt: -1,
    shakeStrength: 0,
    parX: new Spring(0, { stiffness: 38, damping: 12.3 }),
    parY: new Spring(0, { stiffness: 38, damping: 12.3 }),
    ring: 0,
    hoverX: 0,
    hoverY: 0,
    hoverOn: false,
    pointerTip: TIP.mouse,
    pointerId: -1,
    downX: 0,
    downY: 0,
    downT: 0,
    downMoved: false,
    lastMoveT: 0,
    keyX: 0,
    keyY: 0,
    keyVX: 0,
    keyVY: 0,
    keyL: false,
    keyR: false,
    keyU: false,
    keyD: false,
    keyFast: false,
    keyBrush: false,
    keyIdle: 0,
    keyFocus: false,
    ghost: { on: false, t: 0, dur: 1, x0: 0, y0: 0, x1: 0, y1: 0, bend: 0 },
    ghostNext: stage ? 0.9 : 2.2,
    ghostFlip: false,
    breathOn: false,
    breathT: 0,
    breathX: 0,
    breathY: 0,
    bg: dark ? [0.055, 0.02, 0.024] : [0.949, 0.949, 0.949],
    bgHover: dark ? [0.03, 0.012, 0.012] : [0.922, 0.922, 0.922],
    hover: 0,
    hovering: false,
    dprStep: 0,
    perfTime: 0,
    perfSlow: 0,
    range: { x0: -1, x1: 1 },
    rand,
    reserve: 108,
  };
}

/** One pulse of lightning: a 25 ms rise and a quick fall. */
const pulse = (s: number) => (s < 0 ? 0 : s < 0.025 ? s / 0.025 : Math.exp(-(s - 0.025) / 0.075));

/** Smootherstep, for the strokes the window makes itself. */
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/* ---------------------------------------------------------------------- */
/* the piece                                                               */
/* ---------------------------------------------------------------------- */

export default function Piece(props: PieceProps) {
  return <RainWindow {...props} />;
}

function RainWindow({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [L] = useState(() => makeLive(mode, theme, reducedMotion));
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<RainRenderer | null>(null);
  const soundRef = useRef<RainSound | null>(null);
  const heard = useRef(false);
  const rectRef = useRef<DOMRect | null>(null);
  const hintId = useId();
  const fine = useFinePointer();
  const muted = useMuted();
  const [level, setLevel] = useState<Level>(1);
  const [touched, setTouched] = useState(false);
  const [keyFocus, setKeyFocus] = useState(false);
  const [presented, setPresented] = useState(false);
  const presentedRef = useRef(false);
  const [announce, setAnnounce] = useState("");
  const [dprStep, setDprStep] = useState(0);
  const [grip, setGrip] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  /* -------------------------------------------------------------------- */
  /* sizes                                                                 */
  /* -------------------------------------------------------------------- */

  /** A stroke by itself across a pane. */
  const startGhost = (dur: number) => {
    const l = L.layout;
    if (!l.paneCount) return;
    const pane = l.panes[l.paneCount === 3 ? 1 : 0];
    const flip = (L.ghostFlip = !L.ghostFlip);
    const v = stage ? 0.6 : 0.5 + L.rand() * 0.25;
    const a = { x: pane.x + pane.w * 0.16, y: pane.y + pane.h * (v + 0.04) };
    const b = { x: pane.x + pane.w * 0.84, y: pane.y + pane.h * (v - 0.05) };
    const g = L.ghost;
    g.on = true;
    g.t = 0;
    g.dur = dur;
    g.x0 = flip ? a.x : b.x;
    g.y0 = flip ? a.y : b.y;
    g.x1 = flip ? b.x : a.x;
    g.y1 = flip ? b.y : a.y;
    g.bend = pane.h * (0.07 + L.rand() * 0.05);
    L.brush.begin(g.x0, g.y0, stage ? TIP.mouse * l.unit ** 0.3 : TIP.tile);
    L.brush.r = L.brush.size;
  };

  const ghostPoint = (t: number, out: { x: number; y: number }) => {
    const g = L.ghost;
    const e = ease(clamp(t));
    out.x = g.x0 + (g.x1 - g.x0) * e;
    // a lazy S, the way a hand sweeps across glass
    out.y = g.y0 + (g.y1 - g.y0) * e + Math.sin(e * Math.PI * 2) * g.bend * 0.6;
    return out;
  };
  const [scratch] = useState(() => ({ x: 0, y: 0 }));

  /** The still (reduced motion): a pane out in the rain with one wiped streak. */
  const composeStill = () => {
    startGhost(1);
    for (let i = 1; i <= 60; i++) {
      ghostPoint(i / 60, scratch);
      L.brush.to(scratch.x, scratch.y, 1 / 60, L.layout, L.inner, L.mirror, L.stamps);
    }
    L.brush.end(L.layout, L.inner);
    L.ghost.on = false;
  };

  const applySize = useCallback(() => {
    const renderer = rendererRef.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || width < 2 || height < 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prev = L.layout;
    const before = `${prev.glass.x},${prev.glass.y},${prev.glass.w},${prev.glass.h},${prev.paneCount}`;
    layoutWindow(width, height, !stage, stage ? L.reserve : 0, L.layout);
    const l = L.layout;
    const after = `${l.glass.x},${l.glass.y},${l.glass.w},${l.glass.h},${l.paneCount}`;
    const fieldScale = Math.min(1.75, Math.max(1, dpr));
    renderer.setSize(canvas.width, canvas.height, width, l, fieldScale);
    renderer.sceneRange(L.range);
    const fresh = renderer.takeFogReset();
    if (before !== after || !L.sized) {
      L.outer.setBounds(l);
      L.inner.setBounds(l);
      L.mirror.setBounds(l);
      L.stamps.clear();
      L.outer.wind = WIND[L.level];
      L.outer.mist(0.75);
      // the first time, a glass that has been out in the rain a while; after a
      // resize (full screen), a shorter shower so the change doesn't hitch
      L.outer.prewarm(L.sized ? 6 : L.reduced ? 26 : stage ? 16 : 20, RATES[L.level]);
      L.keyX = l.glass.x + l.glass.w / 2;
      L.keyY = l.glass.y + l.glass.h * 0.55;
      if (L.reduced) composeStill();
      L.sized = true;
    } else if (fresh) {
      L.mirror.reset();
    }
    L.sceneAcc = 1;
    if (stage) {
      const pad = 6;
      const next = { x: l.casing.x - pad, y: l.casing.y - pad, w: l.casing.w + pad * 2, h: l.bottom - l.casing.y + pad * 2 };
      setGrip((g) =>
        g && Math.abs(g.x - next.x) < 0.5 && Math.abs(g.y - next.y) < 0.5 && Math.abs(g.w - next.w) < 0.5 && Math.abs(g.h - next.h) < 0.5 ? g : next,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* -------------------------------------------------------------------- */
  /* weather                                                               */
  /* -------------------------------------------------------------------- */

  /** A strike: the flash now, the thunder (and the pane's shake) after it. */
  const strike = (close: number) => {
    const r = L.rand;
    const x0 = L.range.x0;
    const x1 = L.range.x1;
    L.frame.flashX = x0 + (x1 - x0) * (0.2 + r() * 0.6);
    if (L.reduced) {
      // a steady glow, no flicker
      L.flashT = 0;
      L.flashA0 = 0;
      L.flashA1 = 0;
      L.flashGlow = 0.35 + 0.25 * close;
    } else {
      L.flashT = 0;
      L.flashA0 = (stage ? 0.75 : 0.6) * (0.55 + 0.45 * close);
      L.flashT1 = 0.12 + r() * 0.12;
      L.flashA1 = L.flashA0 * (0.45 + r() * 0.4);
      L.flashGlow = 0;
    }
    const delay = 0.35 + (1 - close) * 2.6;
    if (stage) thunder(close, delay, (L.frame.flashX - (x0 + x1) / 2) / Math.max(0.5, (x1 - x0) / 2));
    L.shakeAt = L.clock + delay + 0.25;
    L.shakeStrength = 0.3 + 0.55 * close;
    const [lo, hi] = STRIKES[L.level];
    L.nextStrike = (stage ? lo + r() * (hi - lo) : 15 + r() * 12) + delay;
  };

  const flashAt = (t: number): number => {
    if (L.flashGlow > 0) {
      // reduced motion: rise and fade once, slowly
      return L.flashGlow * (t < 0.4 ? t / 0.4 : Math.exp(-(t - 0.4) / 0.8));
    }
    return L.flashA0 * pulse(t) + L.flashA1 * pulse(t - L.flashT1) + 0.14 * L.flashA0 * (t > 0 ? Math.exp(-t / 0.7) : 0);
  };

  const breathe = (x: number, y: number) => {
    L.breathOn = true;
    L.breathT = 0;
    L.breathX = x;
    L.breathY = y;
    if (stage) exhale();
  };

  /* -------------------------------------------------------------------- */
  /* the frame                                                             */
  /* -------------------------------------------------------------------- */

  const onFrame = (dt: number): void | boolean => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas || !L.sized) return false;
    const reduced = L.reduced;

    // tiles run at 30 fps
    if (!stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }
    L.clock += dt;
    const motion = !reduced;

    // a stage that keeps running slow renders smaller
    if (stage && motion && L.dprStep < DPR_STEPS.length - 1) {
      L.perfTime += dt;
      if (dt > 1 / 40) L.perfSlow += dt;
      if (L.perfTime >= 1.5) {
        if (L.perfSlow > L.perfTime * 0.7) {
          L.dprStep += 1;
          setDprStep(L.dprStep);
        }
        L.perfTime = 0;
        L.perfSlow = 0;
      }
    }

    // night follows the theme
    const nightTarget = L.theme === "dark" ? 1 : 0;
    L.night = reduced ? nightTarget : damp(L.night, nightTarget, 2.6, dt);
    if (Math.abs(L.night - nightTarget) < 1e-3) L.night = nightTarget;

    // the hover colour (tile)
    L.hover = reduced ? (L.hovering ? 1 : 0) : damp(L.hover, L.hovering ? 1 : 0, 10, dt);

    const l = L.layout;
    const brush = L.brush;

    // the window making strokes by itself
    if (motion) {
      if (!L.ghost.on) {
        L.ghostNext -= dt;
        const busy = brush.down || L.hovering || L.keyBrush;
        if (L.ghostNext <= 0 && !busy) {
          if (stage && touched) L.ghostNext = Infinity;
          else {
            startGhost(stage ? 1.25 : 1.0);
            L.ghostNext = stage ? Infinity : 9 + L.rand() * 4;
          }
        }
      } else {
        const g = L.ghost;
        g.t += dt / g.dur;
        ghostPoint(g.t, scratch);
        brush.to(scratch.x, scratch.y, dt, l, L.inner, L.mirror, L.stamps);
        if (g.t >= 1) {
          g.on = false;
          brush.end(l, L.inner);
        }
      }
    }

    // the keyboard's fingertip
    {
      const dx = (L.keyR ? 1 : 0) - (L.keyL ? 1 : 0);
      const dy = (L.keyD ? 1 : 0) - (L.keyU ? 1 : 0);
      const len = Math.hypot(dx, dy) || 1;
      const speed = L.keyFast ? 460 : 250;
      const tx = (dx / len) * speed;
      const ty = (dy / len) * speed;
      const k = 1 - Math.exp(-dt * 9);
      L.keyVX += (tx - L.keyVX) * k;
      L.keyVY += (ty - L.keyVY) * k;
      if (dx || dy || Math.hypot(L.keyVX, L.keyVY) > 4) {
        L.keyX = clamp(L.keyX + L.keyVX * dt, l.glass.x + 4, l.glass.x + l.glass.w - 4);
        L.keyY = clamp(L.keyY + L.keyVY * dt, l.glass.y + 4, l.glass.y + l.glass.h - 4);
        if (!L.keyBrush && (dx || dy) && !brush.down) {
          if (paneAt(l, L.keyX, L.keyY) >= 0) {
            L.keyBrush = true;
            brush.begin(L.keyX, L.keyY, TIP.keys);
          }
        } else if (L.keyBrush) {
          brush.to(L.keyX, L.keyY, dt, l, L.inner, L.mirror, L.stamps);
        }
      }
      if (L.keyBrush && !dx && !dy) {
        L.keyIdle += dt;
        if (L.keyIdle > 0.12) {
          L.keyBrush = false;
          brush.end(l, L.inner);
        }
      } else L.keyIdle = 0;
    }

    brush.step(dt);

    // the breath: a cloud of fog blooming on the glass
    if (L.breathOn) {
      L.breathT += dt;
      const R = l.glass.h * (stage ? 0.42 : 0.55);
      if (reduced) {
        L.stamps.breath(L.breathX, L.breathY, R, 1);
        L.mirror.breathe(L.breathX, L.breathY, R, 1);
        L.breathOn = false;
      } else {
        const t = Math.min(1, L.breathT / 0.9);
        const r = R * (0.25 + 0.75 * (1 - Math.pow(1 - t, 3)));
        const a = 1 - Math.exp(-dt * 7);
        L.stamps.breath(L.breathX, L.breathY, r, a);
        L.mirror.breathe(L.breathX, L.breathY, r, a);
        if (L.breathT > 1.15) L.breathOn = false;
      }
    }

    // the rain and the condensation's drips
    if (motion) {
      L.outer.rain(dt, RATES[L.level]);
      L.outer.step(dt);
      L.inner.step(dt);
      const lanes = L.inner.lanes;
      for (let i = 0; i < L.inner.laneCount; i++) {
        const o = i * 5;
        const r = lanes[o + 4] * 0.85;
        L.stamps.lane(lanes[o], lanes[o + 1], lanes[o + 2], lanes[o + 3], r);
        L.mirror.wipe(lanes[o], lanes[o + 1], lanes[o + 2], lanes[o + 3], r, Math.max(0.8, r * 0.3));
      }
    }
    L.mirror.decay(dt, motion);

    // lightning and thunder
    L.nextStrike -= dt;
    if (L.nextStrike <= 0 && motion) strike(0.25 + L.rand() * 0.6);
    L.flashT += dt;
    const flash = flashAt(L.flashT);
    if (L.shakeAt > 0 && L.clock >= L.shakeAt) {
      L.shakeAt = -1;
      if (motion) {
        L.outer.rattle(L.shakeStrength);
        L.inner.rattle(L.shakeStrength * 0.6);
      }
    }

    // the street
    const pointerPar = stage && fine && L.hoverOn && motion;
    L.parX.to(pointerPar ? (L.hoverX / Math.max(1, l.W) - 0.5) * 0.045 : 0);
    L.parY.to(pointerPar ? (L.hoverY / Math.max(1, l.H) - 0.5) * 0.02 : 0);
    if (reduced) {
      L.parX.set(L.parX.target);
      L.parY.set(L.parY.target);
    } else {
      L.parX.step(dt);
      L.parY.step(dt);
    }
    L.sceneAcc += dt;
    const sceneDue = L.sceneAcc >= 1 / 30 - 0.002 || flash > 0.002 || !presentedRef.current;
    if (sceneDue) {
      L.city.update(L.sceneAcc, L.night, L.range.x0, L.range.x1, motion);
      L.sceneAcc = 0;
    }

    // the fingertip ring: under a hovering mouse, under a finger, at the keys' fingertip
    const keyRing = L.keyFocus && stage;
    const ringOn = stage && (brush.down || (L.hoverOn && fine && paneAt(l, L.hoverX, L.hoverY, 2) >= 0) || keyRing);
    L.ring = reduced ? (ringOn ? 1 : 0) : damp(L.ring, ringOn ? 1 : 0, 14, dt);

    // draw
    const f = L.frame;
    f.night = L.night;
    f.flash = flash;
    f.time = L.clock;
    f.parX = L.parX.value;
    f.parY = L.parY.value;
    for (let c = 0; c < 3; c++) f.wall[c] = toLinear(L.bg[c] + (L.bgHover[c] - L.bg[c]) * L.hover);
    f.fogLo = FOG_LEVEL.lo;
    f.fogHi = FOG_LEVEL.hi;
    const rx = keyRing && !brush.down ? L.keyX : brush.down ? brush.x : L.hoverX;
    const ry = keyRing && !brush.down ? L.keyY : brush.down ? brush.y : L.hoverY;
    f.ring[0] = rx;
    f.ring[1] = ry;
    f.ring[2] = brush.down ? brush.r : (keyRing ? TIP.keys : L.pointerTip) * 0.92;
    f.ring[3] = L.ghost.on ? 0 : L.ring;
    f.pressed = brush.down ? 1 : 0;
    f.fogBack = motion;

    if (sceneDue) renderer.drawScene(L.city, f);
    const od = L.outer.dirty;
    const id = L.inner.dirty;
    if (od) L.outer.build();
    if (id) L.inner.build();
    if (od || id || !presentedRef.current) renderer.drawField(L.outer, L.inner, od, id);
    renderer.updateFog(L.stamps, dt, motion);
    L.stamps.clear();
    renderer.composite(f);
    if (!presentedRef.current) {
      presentedRef.current = true;
      setPresented(true);
    }

    // sound: the fingertip's rub
    soundRef.current?.setRub(brush.down && !L.ghost.on ? brush.speed : 0, brush.fog);

    // under reduced motion, sleep once nothing changes
    if (reduced && !brush.down && !L.breathOn && L.flashT > 3 && Math.abs(L.ring - (ringOn ? 1 : 0)) < 1e-3 && !L.keyBrush) {
      return false;
    }
  };

  const wake = useFrame(active, onFrame);
  const latestWake = useLatest(wake);

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? DPR_STEPS[dprStep] : 1.5,
    attributes: { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: RainRenderer | null = null;
      try {
        renderer = new RainRenderer(gl, !stage);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      L.outer.dirty = true;
      L.inner.dirty = true;
      applySize();
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
        presentedRef.current = false;
        setPresented(false);
      };
    },
    onResize: () => {
      applySize();
      L.outer.dirty = true;
      L.inner.dirty = true;
      wake();
    },
  });

  /* -------------------------------------------------------------------- */
  /* controls reserve (stage)                                              */
  /* -------------------------------------------------------------------- */

  useIsoLayoutEffect(() => {
    if (!stage) return;
    const root = rootRef.current;
    const el = root?.querySelector<HTMLElement>(".rain-controls");
    if (!root || !el) return;
    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      let top = rootRect.height;
      for (const child of Array.from(el.children)) {
        const r = child.getBoundingClientRect();
        if (r.height > 0) top = Math.min(top, r.top - rootRect.top);
      }
      const reserve = Math.round(rootRect.height - top + (rootRect.width < 560 ? 12 : 16));
      if (Math.abs(reserve - L.reserve) > 1) {
        L.reserve = reserve;
        applySize();
        latestWake.current();
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(root);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, supported]);

  /* -------------------------------------------------------------------- */
  /* theme, reduced motion, colours                                        */
  /* -------------------------------------------------------------------- */

  const readColours = useCallback(() => {
    try {
      const style = getComputedStyle(document.documentElement);
      L.bg = parseColour(style.getPropertyValue("--tile"), L.bg);
      L.bgHover = parseColour(style.getPropertyValue("--tile-hover"), L.bgHover);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    L.theme = theme;
    readColours();
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      readColours();
      latestWake.current();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "style"] });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstReduced = useRef(true);
  useEffect(() => {
    if (firstReduced.current) {
      firstReduced.current = false;
      return;
    }
    L.reduced = reducedMotion;
    if (L.sized) {
      if (reducedMotion) {
        // settle into the still: no strokes in flight, the drops where they are
        L.ghost.on = false;
        if (L.brush.down) L.brush.end(L.layout, L.inner);
        L.flashT = 99;
      }
      L.outer.dirty = true;
      L.inner.dirty = true;
    }
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  /* -------------------------------------------------------------------- */
  /* sound                                                                 */
  /* -------------------------------------------------------------------- */

  const syncSound = useCallback(() => {
    const want = stage && heard.current && active && !muted;
    const sound = (soundRef.current ??= new RainSound());
    if (want) {
      const kit = getAudio();
      if (kit && !sound.playing) sound.start(kit, L.level);
    } else if (sound.playing) sound.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, active, muted]);

  useEffect(() => {
    syncSound();
  }, [syncSound]);

  useEffect(
    () => () => {
      soundRef.current?.stop();
    },
    [],
  );

  /** A press or a key on the window: the first one starts the rain's sound. */
  const gesture = () => {
    if (!stage) return;
    heard.current = true;
    ensureAudio();
    syncSound();
  };

  const noteInput = () => {
    if (!touched) setTouched(true);
    latestWake.current();
  };

  /* -------------------------------------------------------------------- */
  /* actions                                                               */
  /* -------------------------------------------------------------------- */

  const doKnock = (x: number, y: number) => {
    const l = L.layout;
    if (!L.reduced) {
      L.outer.knock(x, y, 0.95);
      L.inner.knock(x, y, 0.7);
    }
    if (stage) knock(1, ((x - l.W / 2) / Math.max(1, l.W / 2)) * 0.8);
  };

  const doThunder = () => {
    gesture();
    strike(0.88);
    setAnnounce("Thunder");
    noteInput();
  };

  const doBreathe = (x?: number, y?: number) => {
    gesture();
    const l = L.layout;
    const bx = x ?? (L.keyFocus ? L.keyX : l.glass.x + l.glass.w / 2);
    const by = y ?? (L.keyFocus ? L.keyY : l.glass.y + l.glass.h * 0.5);
    breathe(bx, by);
    setAnnounce("You breathe on the glass and it fogs over");
    noteInput();
  };

  const chooseLevel = (value: Level) => {
    L.level = value;
    L.outer.wind = WIND[value];
    const [lo, hi] = STRIKES[value];
    L.nextStrike = Math.min(L.nextStrike, lo + L.rand() * (hi - lo));
    setLevel(value);
    soundRef.current?.setLevel(value);
    noteInput();
  };

  /* -------------------------------------------------------------------- */
  /* pointer (stage)                                                       */
  /* -------------------------------------------------------------------- */

  const local = (clientX: number, clientY: number, out: { x: number; y: number }) => {
    const rect = rectRef.current;
    out.x = clientX - (rect?.left ?? 0);
    out.y = clientY - (rect?.top ?? 0);
    return out;
  };
  const [pt] = useState(() => ({ x: 0, y: 0 }));

  const tipFor = (type: string) => (type === "touch" ? TIP.touch : type === "pen" ? TIP.pen : TIP.mouse);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || !event.isPrimary || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    rectRef.current = surfaceRef.current?.getBoundingClientRect() ?? null;
    local(event.clientX, event.clientY, pt);
    const l = L.layout;
    const onWindow = pt.x >= l.sillX0 - 4 && pt.x <= l.sillX1 + 4 && pt.y >= l.casing.y - 4 && pt.y <= l.bottom + 4;
    if (!onWindow) return;
    gesture();
    L.pointerId = event.pointerId;
    L.downX = pt.x;
    L.downY = pt.y;
    L.downT = event.timeStamp;
    L.downMoved = false;
    L.lastMoveT = event.timeStamp;
    L.pointerTip = tipFor(event.pointerType);
    L.hoverX = pt.x;
    L.hoverY = pt.y;
    // the stroke the window was making gives way to yours
    if (L.ghost.on) {
      L.ghost.on = false;
      L.brush.end(l, L.inner);
    }
    if (L.keyBrush) {
      L.keyBrush = false;
      L.brush.end(l, L.inner);
    }
    if (paneAt(l, pt.x, pt.y) >= 0) L.brush.begin(pt.x, pt.y, L.pointerTip);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    noteInput();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || !event.isPrimary) return;
    if (L.pointerId !== event.pointerId) {
      // hovering: the ring and the view's parallax follow
      rectRef.current = surfaceRef.current?.getBoundingClientRect() ?? rectRef.current;
      local(event.clientX, event.clientY, pt);
      L.hoverX = pt.x;
      L.hoverY = pt.y;
      L.hoverOn = event.pointerType === "mouse";
      L.pointerTip = tipFor(event.pointerType);
      // over the glass the fingertip ring is the cursor; over the woodwork, the arrow
      const grip = gripRef.current;
      if (grip && fine) {
        const cursor = paneAt(L.layout, pt.x, pt.y, 2) >= 0 ? "none" : "";
        if (grip.style.cursor !== cursor) grip.style.cursor = cursor;
      }
      latestWake.current();
      return;
    }
    const l = L.layout;
    const native = event.nativeEvent;
    const list = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : null;
    const n = list && list.length ? list.length : 1;
    for (let i = 0; i < n; i++) {
      const e = list && list.length ? list[i] : native;
      local(e.clientX, e.clientY, pt);
      const dt = Math.max(0.001, (e.timeStamp - L.lastMoveT) / 1000);
      L.lastMoveT = e.timeStamp;
      if (!L.downMoved && Math.hypot(pt.x - L.downX, pt.y - L.downY) > 5) L.downMoved = true;
      if (L.brush.down) {
        L.brush.to(pt.x, pt.y, dt, l, L.inner, L.mirror, L.stamps);
      } else if (paneAt(l, pt.x, pt.y) >= 0) {
        // a drag from the frame onto the glass starts wiping where it enters
        L.brush.begin(pt.x, pt.y, L.pointerTip);
      }
    }
    L.hoverX = pt.x;
    L.hoverY = pt.y;
    latestWake.current();
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (L.pointerId !== event.pointerId) return;
    L.pointerId = -1;
    const l = L.layout;
    local(event.clientX, event.clientY, pt);
    if (!cancelled && !L.downMoved && event.timeStamp - L.downT < 320) doKnock(L.downX, L.downY);
    L.brush.end(l, L.inner);
    if (event.pointerType !== "mouse") L.hoverOn = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    noteInput();
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (L.pointerId === event.pointerId) return;
    L.hoverOn = false;
    latestWake.current();
  };

  /* -------------------------------------------------------------------- */
  /* keyboard (stage)                                                      */
  /* -------------------------------------------------------------------- */

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const k = event.key;
    let handled = true;
    switch (k) {
      case "ArrowLeft":
        L.keyL = true;
        break;
      case "ArrowRight":
        L.keyR = true;
        break;
      case "ArrowUp":
        L.keyU = true;
        break;
      case "ArrowDown":
        L.keyD = true;
        break;
      case " ":
      case "Enter":
        if (!event.repeat) {
          gesture();
          doKnock(L.keyX, L.keyY);
          setAnnounce("You knock on the glass");
        }
        break;
      case "t":
      case "T":
        if (!event.repeat) doThunder();
        break;
      case "b":
      case "B":
        if (!event.repeat) doBreathe(L.keyX, L.keyY);
        break;
      case "1":
      case "2":
      case "3": {
        const value = (Number(k) - 1) as Level;
        chooseLevel(value);
        setAnnounce(LEVELS[value].label);
        break;
      }
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    event.stopPropagation();
    if (k.startsWith("Arrow")) {
      L.keyFast = event.shiftKey;
      if (L.ghost.on) {
        L.ghost.on = false;
        L.brush.end(L.layout, L.inner);
      }
      gesture();
    }
    noteInput();
  };

  const onKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        L.keyL = false;
        break;
      case "ArrowRight":
        L.keyR = false;
        break;
      case "ArrowUp":
        L.keyU = false;
        break;
      case "ArrowDown":
        L.keyD = false;
        break;
      case "Shift":
        L.keyFast = false;
        break;
      default:
        return;
    }
    latestWake.current();
  };

  const releaseKeys = () => {
    L.keyL = L.keyR = L.keyU = L.keyD = false;
    L.keyFocus = false;
    setKeyFocus(false);
    latestWake.current();
  };

  /* -------------------------------------------------------------------- */
  /* tile hover: the mouse wipes                                           */
  /* -------------------------------------------------------------------- */

  useEffect(() => {
    if (stage) return;
    const root = rootRef.current;
    if (!root) return;
    let rect: DOMRect | null = null;
    let last = 0;
    const at = (event: PointerEvent) => {
      rect = rect ?? root.getBoundingClientRect();
      pt.x = event.clientX - rect.left;
      pt.y = event.clientY - rect.top;
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      rect = root.getBoundingClientRect();
      L.hovering = true;
      last = event.timeStamp;
      latestWake.current();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || L.reduced) return;
      L.hovering = true;
      at(event);
      const l = L.layout;
      const dt = Math.max(0.001, (event.timeStamp - last) / 1000);
      last = event.timeStamp;
      if (L.ghost.on) {
        L.ghost.on = false;
        L.brush.end(l, L.inner);
      }
      if (L.brush.down) L.brush.to(pt.x, pt.y, dt, l, L.inner, L.mirror, L.stamps);
      else if (paneAt(l, pt.x, pt.y) >= 0) L.brush.begin(pt.x, pt.y, TIP.tile);
      latestWake.current();
    };
    const leave = () => {
      L.hovering = false;
      rect = null;
      if (L.brush.down) L.brush.end(L.layout, L.inner);
      L.ghostNext = Math.max(L.ghostNext, 4);
      latestWake.current();
    };
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  const fallback = supported === false;
  const art = fallback || !presented ? <FallbackArt mode={mode} theme={theme} /> : null;

  if (!stage) {
    return (
      <div ref={rootRef} aria-hidden="true" className="absolute inset-0">
        <canvas ref={canvasRef} className={cn("absolute inset-0 block size-full", fallback && "hidden")} />
        {art}
      </div>
    );
  }

  const hint = fallback
    ? "A still: this browser can't run the live window"
    : keyFocus
      ? "Arrows wipe · Space knocks · T thunder · B breathe · 1 2 3 rain"
      : reducedMotion
        ? fine
          ? "Drag on the glass to wipe it · Breathe fogs it again"
          : "Drag a finger on the glass to wipe it · Breathe fogs it again"
        : fine
          ? "Drag on the glass to wipe it · click to knock"
          : "Wipe the glass with a finger · tap to knock";

  return (
    <div ref={rootRef} className="absolute inset-0 select-none">
      <div
        ref={surfaceRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => onPointerEnd(event, false)}
        onPointerCancel={(event) => onPointerEnd(event, true)}
        onPointerLeave={onPointerLeave}
        className="absolute inset-0 touch-pan-y [-webkit-tap-highlight-color:transparent]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className={cn("absolute inset-0 block size-full", fallback && "hidden")} />
        {art}
        {grip && !fallback ? (
          <div
            tabIndex={0}
            role="application"
            aria-roledescription="rainy window"
            aria-label="A window on a rainy evening, fogged on the inside"
            aria-describedby={hintId}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={(event) => {
              const visible = event.currentTarget.matches(":focus-visible");
              L.keyFocus = visible;
              setKeyFocus(visible);
              latestWake.current();
            }}
            onBlur={releaseKeys}
            ref={gripRef}
            className="absolute touch-none rounded-[6px] outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]"
            style={{ left: grip.x, top: grip.y, width: grip.w, height: grip.h }}
          />
        ) : null}
      </div>

      <p id={hintId} className="sr-only">
        A painted window on a rainy evening. Outside, out of focus, a wet street with lit windows, a shop, streetlamps
        and passing cars; rain runs down the outside of the glass, and the inside is fogged with condensation. Drag on
        the glass to wipe the fog away; it fogs back over in a few seconds. Click or tap without dragging to knock on
        the glass and shake the drops loose. With the keyboard: the arrow keys move a fingertip and wipe as it goes
        (hold Shift to go faster), Space or Enter knocks, T calls the thunder, B breathes on the glass, and 1, 2 and 3
        set the rain to drizzle, rain or storm.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="bottom" className="rain-controls">
        {fallback ? null : (
          <Tray label="Weather">
            <Segmented label="Rain" options={LEVELS} value={level} onChange={chooseLevel} />
            <TrayDivider />
            <IconButton label="Thunder" onClick={doThunder}>
              <BoltIcon size={16} />
            </IconButton>
            <IconButton label="Breathe on the glass" onClick={() => doBreathe()}>
              <BreathIcon size={16} />
            </IconButton>
            <TrayDivider />
            <MuteButton />
          </Tray>
        )}
        <StageHint className={cn("transition-opacity duration-700", touched && !keyFocus && "opacity-0")}>{hint}</StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2 (and before the first frame)                             */
/* ---------------------------------------------------------------------- */

/**
 * A flat drawing of the same window: the frame, the street's lights as
 * soft discs through the glass, a fogged lower half. Shown where WebGL2 is
 * missing, and for the moment before the first frame.
 */
function FallbackArt({ mode, theme }: { mode: PieceMode; theme: PieceTheme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const l = layoutWindow(rect.width, rect.height, mode === "tile", mode === "stage" ? (rect.width < 560 ? 112 : 104) : 0, newLayout());
      const dark = theme === "dark";
      const paint = dark ? "#3a302a" : "#ece9e3";
      const shade = dark ? "#2a221e" : "#d9d5cd";
      // casing and sill
      ctx.fillStyle = shade;
      ctx.fillRect(l.casing.x + 4, l.casing.y + 5, l.casing.w, l.bottom - l.casing.y);
      ctx.fillStyle = paint;
      ctx.fillRect(l.casing.x, l.casing.y, l.casing.w, l.casing.h);
      ctx.fillRect(l.sillX0, l.sillY, l.sillX1 - l.sillX0, l.sillTop + l.nose);
      ctx.fillStyle = shade;
      ctx.fillRect(l.casing.x, l.sillY + l.sillTop + l.nose, l.casing.w, l.apron);
      ctx.fillRect(l.opening.x, l.opening.y, l.opening.w, 1);
      for (let i = 0; i < l.paneCount; i++) {
        const p = l.panes[i];
        const sky = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
        sky.addColorStop(0, dark ? "#0b0d16" : "#45506a");
        sky.addColorStop(0.55, dark ? "#1a1216" : "#7b7480");
        sky.addColorStop(1, dark ? "#120c0c" : "#5c5552");
        ctx.fillStyle = sky;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.save();
        ctx.beginPath();
        ctx.rect(p.x, p.y, p.w, p.h);
        ctx.clip();
        // the street's lights, out of focus
        let seed = 7 + i * 13;
        const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (let k = 0; k < 26; k++) {
          const x = p.x + rnd() * p.w;
          const y = p.y + p.h * (0.3 + rnd() * 0.45);
          const r = l.glass.h * (0.025 + rnd() * 0.02);
          ctx.fillStyle = rnd() < 0.8 ? `rgba(255, 176, 96, ${dark ? 0.55 : 0.45})` : `rgba(255, 226, 190, 0.5)`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        // the fog, thick low down
        const fog = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
        fog.addColorStop(0, dark ? "rgba(60, 46, 44, 0.25)" : "rgba(214, 218, 226, 0.25)");
        fog.addColorStop(1, dark ? "rgba(60, 46, 44, 0.8)" : "rgba(214, 218, 226, 0.85)");
        ctx.fillStyle = fog;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.restore();
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [mode, theme]);
  return (
    <canvas
      ref={ref}
      role={mode === "stage" ? "img" : undefined}
      aria-label={mode === "stage" ? "A window on a rainy evening, the street's lights blurred behind fogged glass" : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="pointer-events-none absolute inset-0 block size-full"
    />
  );
}
