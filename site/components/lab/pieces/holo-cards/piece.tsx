"use client";

// Holo cards: three foil cards on the stage that you tilt, throw, fan and
// turn over (WebGL2).
//
// The look
// - Three cards of one small edition, each with its own foil: Prism (black
//   card, a sunburst foil round a raised star), Lattice (pearl paper, a
//   mosaic of tiny foil tiles round a star cut out of the foil) and Ripple
//   (a silver card with flowing foil and engraved rings), and a shared back
//   with a woven guilloche round a medallion (art.ts). Colour only ever
//   comes from the foil: the inks are black, pearl, graphite and silver.
// - The foil is a real diffraction grating in the shader (shaders.ts):
//   each pixel sends the eye the wavelength its groove spacing and the
//   light and view angles select, so bands of spectral colour sweep across
//   the card as it tilts; the pearl paper shimmers by thin-film
//   interference; micro-facets glint; embossed marks catch the light along
//   their edges. The cards shade each other and lay soft shadows on the
//   stage that widen as they lift. A soft studio by day, a single warm lamp
//   at night (dark theme), with a faint pool of light under the cards.
//
// The motion model (deck.ts)
// - Hover: the card under the pointer tilts toward it on an under-damped
//   spring (the stacked cards tilt together, a fanned card on its own),
//   and the light follows the pointer like a lamp in your hand, so the
//   colours slide across the foil. On a phone the gyroscope stands in for
//   the pointer: tilt it and the whole deck leans with it while the light
//   slides across the foil (measured from a baseline that slowly follows
//   the way the phone is held, so any grip is level).
// - Grab: the card lifts toward you and hangs off the point you took it
//   by: a stiff spring pulls that point to your finger while the card's
//   centre feels a drag of its own, so a card held by a corner swings round
//   behind your hand, leans toward where it is going and bows a touch. A
//   card behind the front one slides out before it lifts.
// - Flick (or drag it mostly off the deck): it flies with your speed and
//   spin, through the air with drag and against soft walls at the stage's
//   edges; once it is clear it drops behind the deck and a soft spring
//   brings it home to the back from wherever it is, while the others step
//   forward one after the other. Let go slowly and it springs back with
//   the momentum it has. Every state can be grabbed mid-flight.
// - Fan: drag the table sideways and the cards spread round a low pivot
//   like a hand of cards (rubber-banded past either end, settling open or
//   closed with your speed); the deck's framing follows, so on a phone the
//   camera eases out to fit the fan. Tap the front card to turn it over
//   (an under-damped flip that lifts clear of the others); tap another
//   card to bring it to the front.
// - The "wow" second: the cards are dealt up from below into a fan while
//   the light sweeps across them, hold a beat, and gather into a stack.
// - Keyboard: the front card is a button (Space or Enter sends it to the
//   back, F turns it over, S spreads or gathers the fan, arrows tilt it).
// - Sound (stage, after a gesture, lab mute respected): a paper tick on
//   pick-up, a whoosh by speed, the slide and tap of a card going to the
//   back, the flap and slap of a flip, a riffle for the fan.
// - Tile: the stack sways in a drifting light and every few seconds the
//   front card is tossed round to the back; hovering tilts it. 30 fps,
//   smaller faces, no sound, no controls.
// - Reduced motion: a still stack in a fixed light; the light still follows
//   the pointer (colour, not movement), and throws, flips and the fan
//   happen at once.
// - Lifetime: the faces are painted once (again when Geist arrives); the
//   frame loop allocates nothing; the idle stage drifts for a while at 30
//   fps and then sleeps; a stage that can't keep up lowers its pixel ratio;
//   nothing runs offscreen or in a hidden tab; the WebGL context is handed
//   back on unmount (useWebGL2).
//
// Files: deck.ts (motion), view.ts (camera, picking, overlays), art.ts
// (faces), shaders.ts + renderer.ts (WebGL2), sound.ts, icons.tsx.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ensureAudio } from "../../audio";
import { clamp, damp, useFinePointer, useFrame, useWebGL2 } from "../../hooks";
import type { PieceProps, PieceTheme } from "../../types";
import { IconButton, MuteButton, Segmented, StageControls, StageHint, Tray, TrayDivider, TrayRow } from "../../ui";
import { CARD_LOOK, CardArt, fontLoaded, fontReady, LAYERS } from "./art";
import {
  CARD_H,
  CARD_W,
  COUNT,
  Deck,
  EV_CLEAR,
  EV_FAN,
  EV_FLIP,
  EV_FLIP_LAND,
  EV_LAND,
  EV_STEP,
  EV_THROW,
  FLY,
} from "./deck";
import { FanIcon, FlipIcon, NextIcon, StackIcon, TiltIcon } from "./icons";
import { blankLook, HoloRenderer, mixLook, type Frame } from "./renderer";
import { flap, land, pick as pickSound, riffle, slide, snap, whoosh } from "./sound";
import { cardDistance, cardOutline, cardTransform, View } from "./view";

/** Pixel-ratio caps the stage steps through if frames run slow. */
const DPR_STEPS = [2, 1.5, 1.2] as const;
/** Degrees of phone tilt (from the way it is held) for the full lean. */
const GYRO_RANGE = 18;
/** iOS granted motion access this visit (the tiles can listen too, then). */
let motionGranted = false;
/** Seconds of quiet before the idle light stops drifting and the stage sleeps. */
const DRIFT_FOR = 14;
/** The light's resting place, relative to the deck (world units), by theme. */
const LIGHT_REST: Record<PieceTheme, [number, number, number]> = {
  light: [-0.8, 1.15, 1.9],
  dark: [-0.7, 1.05, 1.55],
};
/** The DOM stand-ins are this many CSS px per world unit (before their transform). */
const BOX = 100;
const FOCUS_GAP = 5;

type Layout = "stack" | "fan";
const LAYOUTS = [
  { value: "stack" as const, label: "Stack", icon: <StackIcon size={15} /> },
  { value: "fan" as const, label: "Fan", icon: <FanIcon size={15} /> },
];

type Drag = {
  kind: "card" | "fan";
  pointer: number;
  card: number;
  startX: number;
  startY: number;
  startT: number;
  moved: boolean;
  touch: boolean;
  /** The card was the front one when it was grabbed. */
  front: boolean;
  fan0: number;
  /** Which way opens the fan (±1; 0 until the first move decides). */
  side: number;
  range: number;
};

function makeLive(theme: PieceTheme, reduced: boolean) {
  const rest = LIGHT_REST[theme];
  return {
    theme,
    reduced,
    night: theme === "dark" ? 1 : 0,
    look: mixLook(theme === "dark" ? 1 : 0, blankLook()),
    /** Light position relative to the deck's centre (springs) and its goal. */
    light: new Float64Array(rest),
    lightV: new Float64Array(3),
    lightGoal: new Float64Array(rest),
    lightWorld: new Float32Array(3),
    /** The mouse over the stage (CSS px), or not. */
    hover: false,
    hx: 0,
    hy: 0,
    /** Keyboard aim (-1…1), while the deck has focus and the arrows were used. */
    keyAim: false,
    kx: 0,
    ky: 0,
    /** Phone tilt: the raw angles (degrees), their slowly re-centring
        baseline, the screen's rotation, and the lean on screen (x, y: -1…1, y up). */
    orient: { has: false, beta: 0, gamma: 0, baseB: 0, baseG: 0, lastX: 0, lastY: 0, angle: 0, x: 0, y: 0 },
    drag: null as Drag | null,
    /** Recent pointer samples for release speed (CSS px, seconds). */
    st: new Float64Array(16),
    sx: new Float64Array(16),
    sy: new Float64Array(16),
    sn: 0,
    /** Smoothed pointer velocity, CSS px / s. */
    pvx: 0,
    pvy: 0,
    /** The usable part of the stage (CSS px): x0, y0, x1, y1. */
    rect: new Float64Array(4),
    fitDirty: true,
    ext: new Float64Array(4),
    slot: new Float64Array(4),
    hit: new Float64Array(2),
    tmp: new Float64Array(2),
    /** Wall clock of the last input (s), the drift amount, the frame accumulator. */
    lastInput: performance.now() / 1000,
    drift: reduced ? 0 : 1,
    time: 0,
    acc: 0,
    perf: { time: 0, slow: 0, step: 0 },
    audio: false,
    /** Next throw from the keyboard goes this way. */
    throwDir: 1,
    /** When the last pointer press began (a click that follows it is not assistive tech). */
    pressedAt: -Infinity,
    /** DOM stand-ins: last transforms written. */
    placed: ["", "", "", ""],
    placedZ: [-1, -1, -1],
    ring: false,
    ringPath: "",
    frontShown: -1,
    fanShown: false,
    flippedShown: [false, false, false],
    frame: null as Frame | null,
  };
}

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [deck] = useState(() => {
    const d = new Deck();
    d.reduced = reducedMotion;
    if (stage && !reducedMotion) d.deal();
    return d;
  });
  const [view] = useState(() => new View());
  const [L] = useState(() => makeLive(theme, reducedMotion));
  const rendererRef = useRef<HoloRenderer | null>(null);
  const artRef = useRef<CardArt | null>(null);
  /** The faces were last painted with Geist loaded (no repaint needed when it arrives). */
  const paintedWithFont = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const overlayRefs = useRef<Array<HTMLDivElement | null>>([]);
  const deckRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const ringHaloRef = useRef<SVGPathElement>(null);
  const hintId = useId();
  const fine = useFinePointer();

  const [layout, setLayout] = useState<Layout>("stack");
  const [front, setFront] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [touched, setTouched] = useState(false);
  const [dprStep, setDprStep] = useState(0);
  const [orientOK, setOrientOK] = useState(false);
  /** The phone's tilt steers the deck (the tray's tilt button turns it off). */
  const [gyro, setGyro] = useState(true);
  const [canTilt, setCanTilt] = useState(false);

  /* -------------------------------------------------------------------- */
  /* layout                                                                */
  /* -------------------------------------------------------------------- */

  /** The part of the stage the deck may use (above the trays). */
  const measure = useCallback(() => {
    const { width, height } = sizeRef.current;
    const r = L.rect;
    if (stage) {
      const narrow = width < 520;
      let bottom = height - 16;
      const root = rootRef.current;
      const controls = controlsRef.current?.querySelector<HTMLElement>("[data-lab-controls]");
      if (root && controls) {
        const top = controls.getBoundingClientRect().top - root.getBoundingClientRect().top;
        if (top > 0) bottom = Math.min(bottom, top);
      }
      r[0] = narrow ? 14 : 40;
      r[1] = narrow ? 20 : 34;
      r[2] = width - r[0];
      r[3] = bottom - (narrow ? 14 : 22);
      // a portrait stage fans more tightly
      deck.fanAngle = width / Math.max(1, height) < 1.05 ? 0.2 : 0.27;
    } else {
      r[0] = width * 0.12;
      r[1] = height * 0.1;
      r[2] = width * 0.88;
      r[3] = height * 0.9;
    }
    L.fitDirty = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /** Frame the deck: the union of the cards' slots at the current fan, fitted to the rect. */
  const fit = () => {
    const { width, height } = sizeRef.current;
    const f = clamp(deck.fan, 0, 1);
    const ext = L.ext;
    ext[0] = ext[2] = Infinity;
    ext[1] = ext[3] = -Infinity;
    for (let r = 0; r < COUNT; r++) {
      deck.slot(r, f, L.slot);
      const c = Math.cos(L.slot[3]);
      const s = Math.sin(L.slot[3]);
      for (let k = 0; k < 4; k++) {
        const lx = (k & 1 ? 0.5 : -0.5) * CARD_W;
        const ly = (k & 2 ? 0.5 : -0.5) * CARD_H;
        const x = L.slot[0] + c * lx - s * ly;
        const y = L.slot[1] + s * lx + c * ly;
        if (x < ext[0]) ext[0] = x;
        if (x > ext[1]) ext[1] = x;
        if (y < ext[2]) ext[2] = y;
        if (y > ext[3]) ext[3] = y;
      }
    }
    const margin = stage ? 0.07 : 0.03;
    const r = L.rect;
    const w = ext[1] - ext[0] + margin * 2;
    const h = ext[3] - ext[2] + margin * 2;
    let scale = Math.min((r[2] - r[0]) / w, (r[3] - r[1]) / h);
    if (stage) scale = Math.min(scale, 470);
    scale = Math.max(20, scale);
    const midX = (ext[0] + ext[1]) / 2;
    const midY = (ext[2] + ext[3]) / 2;
    const cx = (r[0] + r[2]) / 2 - midX * scale;
    const cy = (r[1] + r[3]) / 2;
    view.set(width, height, cx, cy, scale, midY);
    // a thrown card's centre may go this far before the soft walls push back
    // (a tile keeps its toss mostly in frame)
    const b = deck.bounds;
    const ix = stage ? 0.2 : 0.3;
    const iy = stage ? 0.3 : 0.42;
    b[0] = -cx / scale + ix;
    b[1] = (width - cx) / scale - ix;
    b[2] = midY + (cy - height) / scale + iy;
    b[3] = midY + cy / scale - iy;
  };

  /* -------------------------------------------------------------------- */
  /* picking                                                               */
  /* -------------------------------------------------------------------- */

  /** The front-most card under (x, y) CSS px, or -1. */
  const pickCard = (x: number, y: number): number => {
    const order = deck.drawOrder;
    for (let i = order.length - 1; i >= 0; i--) {
      const card = deck.cards[order[i]];
      if (card.hold) continue;
      if (view.hitCard(x, y, card, L.hit) < Infinity && cardDistance(L.hit[0], L.hit[1]) < 0.006) return card.id;
    }
    return -1;
  };

  /** (x, y) CSS px on the plane of a card's face → world x, y into L.tmp. */
  const toWorld = (x: number, y: number, z: number) => {
    view.unproject(x, y, z, L.tmp);
    return L.tmp;
  };

  /** Where the pointer sits over card `id`, as -1…1 across its untilted face (y up). */
  const aimAt = (id: number, x: number, y: number) => {
    const card = deck.cards[id];
    const w = toWorld(x, y, card.z);
    const ox = w[0] - card.x;
    const oy = w[1] - card.y;
    const c = Math.cos(card.p[3]);
    const s = Math.sin(card.p[3]);
    deck.aimX = clamp((c * ox + s * oy) / (CARD_W / 2), -1, 1);
    deck.aimY = clamp((-s * ox + c * oy) / (CARD_H / 2), -1, 1);
  };

  /* -------------------------------------------------------------------- */
  /* the frame                                                             */
  /* -------------------------------------------------------------------- */

  /** Point the light: pointer, keyboard, phone tilt, the deal's sweep, or the idle drift. */
  const steerLight = (dt: number) => {
    const rest = LIGHT_REST[L.theme];
    const g = L.lightGoal;
    const reduced = L.reduced;
    g[0] = rest[0];
    g[1] = rest[1];
    g[2] = rest[2];
    let stiff = 60;
    if (deck.introT >= 0 && deck.introT < 1.7 && !reduced) {
      // the deal: a sweep from left to right across the rising cards
      const t = clamp((deck.introT - 0.15) / 1.35);
      const e = t * t * (3 - 2 * t);
      g[0] = -1.9 + 3.1 * e;
      g[1] = 0.55 + 0.35 * Math.sin(e * Math.PI);
      g[2] = 1.5;
      stiff = 220;
    } else if (L.drag?.kind === "card" || L.hover) {
      // a lamp in your hand: the glare tracks the pointer across the cards
      const x = L.drag ? L.sx[(L.sn - 1) & 15] : L.hx;
      const y = L.drag ? L.sy[(L.sn - 1) & 15] : L.hy;
      const w = toWorld(x, y, 0);
      g[0] = clamp(w[0] * 1.3, -1.8, 1.8);
      g[1] = clamp((w[1] - view.yc) * 1.3 + 0.12, -0.45, 1.5);
      g[2] = 1.75;
      stiff = 140;
    } else if (L.keyAim) {
      g[0] = L.kx * 1.5;
      g[1] = L.ky * 1.1 + 0.15;
      g[2] = 1.75;
      stiff = 120;
    } else if (L.orient.has) {
      // the phone's tilt: the lamp swings the way the phone leans
      g[0] = rest[0] * 0.4 + L.orient.x * 1.45;
      g[1] = rest[1] * 0.6 + L.orient.y * 1.15;
      stiff = 90;
    } else if (!reduced && L.drift > 0) {
      const t = L.time;
      g[0] += (0.55 * Math.sin(t * 0.29) + 0.18 * Math.sin(t * 0.71 + 0.4)) * L.drift;
      g[1] += 0.3 * Math.sin(t * 0.41 + 1.3) * L.drift;
    }
    let moving = false;
    const c = 2 * Math.sqrt(stiff);
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    for (let i = 0; i < 3; i++) {
      if (reduced) {
        L.light[i] = g[i];
        L.lightV[i] = 0;
        continue;
      }
      // critically damped, in 240 Hz substeps (stable on a slow frame)
      for (let n = 0; n < steps; n++) {
        L.lightV[i] += (-stiff * (L.light[i] - g[i]) - c * L.lightV[i]) * h;
        L.light[i] += L.lightV[i] * h;
      }
      if (Math.abs(L.light[i] - g[i]) > 1e-4 || Math.abs(L.lightV[i]) > 1e-3) moving = true;
    }
    L.lightWorld[0] = L.light[0];
    L.lightWorld[1] = L.light[1] + view.yc;
    L.lightWorld[2] = L.light[2];
    return moving;
  };

  /** Lay the DOM stand-ins (touch targets, the focusable front card, its ring) over the cards. */
  const placeOverlays = () => {
    if (!stage) return;
    const order = deck.drawOrder;
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const el = overlayRefs.current[id];
      if (!el) continue;
      const card = deck.cards[id];
      const t = card.hold ? null : cardTransform(view, card, CARD_W * BOX, CARD_H * BOX);
      const value = t ?? "scale(0)";
      if (L.placed[id] !== value) {
        L.placed[id] = value;
        el.style.transform = value;
      }
      if (L.placedZ[id] !== i) {
        L.placedZ[id] = i;
        el.style.zIndex = String(i + 1);
      }
    }
    const top = deck.cards[deck.order[0]];
    const button = deckRef.current;
    if (button) {
      const t = top.hold || top.mode === FLY ? "scale(0)" : (cardTransform(view, top, CARD_W * BOX, CARD_H * BOX) ?? "scale(0)");
      if (L.placed[3] !== t) {
        L.placed[3] = t;
        button.style.transform = t;
      }
    }
    if (L.ring) {
      const d = cardOutline(view, top, FOCUS_GAP);
      if (d !== L.ringPath) {
        L.ringPath = d;
        ringRef.current?.setAttribute("d", d);
        ringHaloRef.current?.setAttribute("d", d);
      }
    }
  };

  /** Things the deck did since the last frame: sounds, announcements, the tray. */
  const handleEvents = () => {
    const ev = deck.events;
    deck.events = 0;
    if (!stage) return;
    const sound = L.audio;
    const panOf = (id: number) => clamp(deck.cards[id].x / 1.4, -1, 1);
    const back = deck.order[COUNT - 1];
    if (sound) {
      if (ev & EV_THROW) whoosh(deck.throwSpeed, panOf(back));
      if (ev & EV_CLEAR) slide(panOf(back));
      if (ev & EV_LAND) land(panOf(back));
      if (ev & EV_FLIP_LAND) snap(panOf(deck.order[0]));
      if (ev & EV_FAN) riffle(deck.fanGoal === 1);
    }
    if (ev & EV_FLIP && sound) flap(1, panOf(deck.order[0]));
    // the front card, the fan and the faces, for the tray and screen readers
    const top = deck.order[0];
    if (ev & (EV_THROW | EV_STEP) && top !== L.frontShown) {
      L.frontShown = top;
      setFront(top);
      setAnnounce(`${CARD_LOOK[top].name} is in front`);
    }
    const fanned = deck.fanGoal === 1;
    if (fanned !== L.fanShown) {
      L.fanShown = fanned;
      setLayout(fanned ? "fan" : "stack");
      if (deck.introT < 0) setAnnounce(fanned ? "Fanned out" : "Stacked");
    }
    if (ev & EV_FLIP_LAND) {
      for (const card of deck.cards) {
        const down = Math.cos(card.g[6]) < 0;
        if (down !== L.flippedShown[card.id]) {
          L.flippedShown[card.id] = down;
          setAnnounce(`${CARD_LOOK[card.id].name}, ${down ? "face down" : "face up"}`);
        }
      }
    }
  };

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const { width, height } = sizeRef.current;
    if (!renderer || width < 2 || height < 2 || !L.frame) return false;
    const reduced = L.reduced;
    const now = performance.now() / 1000;
    const idle = now - L.lastInput;
    const calm = stage && !L.drag && idle > 2.5 && deck.introT < 0;

    // tiles (and a calm stage) run at 30 fps
    if (!stage || calm) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    } else L.acc = 0;

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

    if (L.fitDirty) measure();
    L.time += dt;
    deck.reduced = reduced;

    // the idle drift fades out after a quiet spell on the stage
    const driftGoal = reduced ? 0 : !stage || idle < DRIFT_FOR ? 1 : 0;
    L.drift = reduced ? 0 : damp(L.drift, driftGoal, driftGoal ? 2 : 0.6, dt);
    if (Math.abs(L.drift - driftGoal) < 0.003) L.drift = driftGoal;

    // the phone's tilt, from a baseline that slowly follows the way it is held
    const o = L.orient;
    if (o.has) {
      const k = 1 - Math.exp(-dt / 6);
      o.baseB += (o.beta - o.baseB) * k;
      o.baseG += (o.gamma - o.baseG) * k;
      // well past the range the baseline gives way at once (lying down, a new grip)
      o.baseB = clamp(o.baseB, o.beta - 2 * GYRO_RANGE, o.beta + 2 * GYRO_RANGE);
      o.baseG = clamp(o.baseG, o.gamma - 2 * GYRO_RANGE, o.gamma + 2 * GYRO_RANGE);
      // lower the right edge and the lean goes right; lower the bottom and it goes down
      const px = clamp((o.gamma - o.baseG) / GYRO_RANGE, -1, 1);
      const py = clamp((o.baseB - o.beta) / GYRO_RANGE, -1, 1);
      // from the phone's axes to the screen's (landscape turns them)
      const a = (o.angle * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      o.x = px * c - py * s;
      o.y = px * s + py * c;
    }

    // the hover: which card is under the mouse (or the keyboard's aim, or the phone's tilt)
    if (!reduced && !L.drag && L.hover) {
      const id = pickCard(L.hx, L.hy);
      deck.aimAll = false;
      deck.aimCard = id;
      deck.aimOn = id >= 0;
      if (id >= 0) aimAt(id, L.hx, L.hy);
    } else if (!reduced && !L.drag && L.keyAim) {
      deck.aimAll = false;
      deck.aimCard = deck.order[0];
      deck.aimOn = true;
      deck.aimX = L.kx;
      deck.aimY = L.ky;
    } else if (!reduced && !L.drag && o.has) {
      // the whole deck leans with the phone, the front card the most
      deck.aimAll = true;
      deck.aimCard = deck.order[0];
      deck.aimOn = true;
      deck.aimX = o.x;
      deck.aimY = o.y;
    } else deck.aimOn = false;

    if (!stage) {
      // the tile: a slow sway in the drifting light, and a toss now and then
      if (!reduced) {
        deck.extraTy = 0.11 * Math.sin(L.time * 0.47);
        deck.extraTx = 0.06 * Math.sin(L.time * 0.33 + 0.6);
        deck.auto(dt);
      }
    } else deck.extraTx = deck.extraTy = 0;

    // the held card follows the finger
    const drag = L.drag;
    if (drag?.kind === "card") {
      const card = deck.cards[drag.card];
      const i = (L.sn - 1) & 15;
      // a finger that has stopped sends no events: let its speed die away
      if (now - L.st[i] > 0.045) {
        const k = Math.exp(-dt / 0.035);
        L.pvx *= k;
        L.pvy *= k;
      }
      const w = toWorld(L.sx[i], L.sy[i], card.z);
      const k = (view.depth - card.z) / (view.scale * view.depth);
      deck.drag(w[0], w[1], L.pvx * k, -L.pvy * k);
    }

    const busy = deck.step(dt);
    handleEvents();
    fit();
    const lightMoving = steerLight(dt);

    // the theme's light eases over
    const night = L.theme === "dark" ? 1 : 0;
    L.night = reduced ? night : damp(L.night, night, 5, dt);
    if (Math.abs(L.night - night) < 0.002) L.night = night;
    mixLook(L.night, L.look);

    const f = L.frame;
    f.dpr = sizeRef.current.dpr;
    renderer.draw(f);
    placeOverlays();

    // sleep once everything has settled (a moving tile never does)
    const settled = !busy && !lightMoving && L.night === night && !L.drag;
    if (stage ? settled && L.drift === 0 : reduced && settled) return false;
  });

  /** Something happened: the loop runs at full rate and the drift comes back. */
  const nudge = useCallback(() => {
    L.lastInput = performance.now() / 1000;
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wake]);

  /** Paint the faces into the textures (again once Geist has loaded). */
  const paintArt = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (!artRef.current) artRef.current = new CardArt(stage ? 640 : 320);
    const art = artRef.current;
    paintedWithFont.current = fontLoaded();
    try {
      renderer.allocate(art.width, art.height);
      for (let layer = 0; layer < LAYERS; layer++) {
        const { print, mask } = art.paint(layer);
        renderer.uploadLayer(layer, print, mask);
      }
      renderer.finishArt();
    } catch (error) {
      console.error(error);
    }
  }, [stage]);

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? DPR_STEPS[dprStep] : 1.5,
    attributes: { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: HoloRenderer | null = null;
      try {
        renderer = new HoloRenderer(gl, stage ? 24 : 12);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      paintArt();
      L.frame = {
        view,
        dpr: 1,
        cards: deck.cards,
        drawOrder: deck.drawOrder,
        light: L.lightWorld,
        look: L.look,
        sparkle: stage ? 1 : 0.6,
      };
      L.placed.fill("");
      L.placedZ.fill(-1);
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => {
      L.fitDirty = true;
      wake();
    },
  });

  // repaint the faces once Geist has loaded
  useEffect(() => {
    let alive = true;
    void fontReady().then(() => {
      if (!alive || paintedWithFont.current) return;
      paintArt();
      wake();
    });
    return () => {
      alive = false;
    };
  }, [paintArt, wake]);

  // the trays' height decides how much room the deck has
  useEffect(() => {
    if (!stage) return;
    const controls = controlsRef.current?.querySelector<HTMLElement>("[data-lab-controls]");
    if (!controls) return;
    const observer = new ResizeObserver(() => {
      L.fitDirty = true;
      wake();
    });
    observer.observe(controls);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, wake]);

  // theme and reduced motion
  useEffect(() => {
    L.theme = theme;
    nudge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  useEffect(() => {
    L.reduced = reducedMotion;
    deck.reduced = reducedMotion;
    if (reducedMotion) {
      deck.introT = -1;
      deck.setFanNow(deck.fanGoal);
      deck.settle();
      L.drift = 0;
    }
    nudge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // let go of everything when the piece stops (offscreen, hidden tab)
  useEffect(() => {
    if (active) return;
    if (L.drag) {
      if (L.drag.kind === "card") deck.release(0, 0);
      else deck.releaseFan(0);
      L.drag = null;
    }
    L.hover = false;
    rootRef.current?.removeAttribute("data-grabbing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /* -------------------------------------------------------------------- */
  /* phone tilt                                                            */
  /* -------------------------------------------------------------------- */

  const needsPermission = () =>
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function";

  useEffect(() => {
    if (typeof DeviceOrientationEvent === "undefined") return;
    // iOS asks first (from a tap: see askOrientation); elsewhere just listen
    if (motionGranted || !needsPermission()) setOrientOK(true);
    // the tray's tilt button, on touch screens
    if (stage && !window.matchMedia("(pointer: fine)").matches) setCanTilt(true);
  }, [stage]);

  /** On iOS, ask for motion access (from a tap; resolves true once granted). */
  const askOrientation = () => {
    if (orientOK || !needsPermission()) return Promise.resolve(orientOK);
    const request = (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission;
    return request()
      .then((answer) => {
        if (answer !== "granted") return false;
        motionGranted = true;
        setOrientOK(true);
        return true;
      })
      .catch(() => false);
  };

  const toggleTilt = () => {
    if (!orientOK) {
      void askOrientation().then((granted) => {
        if (granted) setGyro(true);
      });
      return;
    }
    setGyro((on) => !on);
    nudge();
  };

  useEffect(() => {
    if (!active || !orientOK || !gyro) return;
    const o = L.orient;
    const screenAngle = () => {
      const angle = screen.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0;
      return ((angle % 360) + 360) % 360;
    };
    const onOrient = (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return;
      const angle = screenAngle();
      // the first reading, a turn to landscape, or a jump in the angles (the
      // phone passing upright or onto its side): level from here
      if (
        !o.has ||
        angle !== o.angle ||
        Math.abs(event.beta - o.beta) > 90 ||
        Math.abs(event.gamma - o.gamma) > 90
      ) {
        o.has = true;
        o.angle = angle;
        o.baseB = event.beta;
        o.baseG = event.gamma;
      }
      o.beta = event.beta;
      o.gamma = event.gamma;
      const dx = o.gamma - o.baseG;
      const dy = o.beta - o.baseB;
      if (Math.abs(dx - o.lastX) + Math.abs(dy - o.lastY) > 0.4) {
        o.lastX = dx;
        o.lastY = dy;
        nudge();
      }
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      o.has = false;
      o.x = o.y = 0;
      nudge();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, orientOK, gyro, nudge]);

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return rect ? [event.clientX - rect.left, event.clientY - rect.top] : [0, 0];
  };

  /** Record a pointer position at the event's own time (bursts of late events keep their speed). */
  const sample = (x: number, y: number, stamp: number) => {
    const t = stamp / 1000;
    const prev = (L.sn - 1) & 15;
    if (L.sn > 0) {
      const dt = t - L.st[prev];
      if (dt > 1e-4 && dt < 0.25) {
        const k = 1 - Math.exp(-dt / 0.045);
        L.pvx += ((x - L.sx[prev]) / dt - L.pvx) * k;
        L.pvy += ((y - L.sy[prev]) / dt - L.pvy) * k;
      } else if (dt >= 0.25) L.pvx = L.pvy = 0;
    }
    const i = L.sn & 15;
    L.st[i] = t;
    L.sx[i] = x;
    L.sy[i] = y;
    L.sn++;
  };

  /** The hand's speed as it let go, over the last ~90 ms (CSS px / s); zero if it had stopped. */
  const releaseSpeed = (out: Float64Array) => {
    out[0] = out[1] = 0;
    if (L.sn < 2) return;
    const last = (L.sn - 1) & 15;
    const prev = (L.sn - 2) & 15;
    // the hand rested before letting go: no throw
    if (L.st[last] - L.st[prev] > 0.07 && Math.hypot(L.sx[last] - L.sx[prev], L.sy[last] - L.sy[prev]) < 2) return;
    let first = last;
    for (let n = 1; n < Math.min(L.sn, 16); n++) {
      const i = (L.sn - 1 - n) & 15;
      if (L.st[last] - L.st[i] > 0.09) break;
      first = i;
    }
    const span = L.st[last] - L.st[first];
    if (span < 0.012) {
      out[0] = L.pvx;
      out[1] = L.pvy;
      return;
    }
    out[0] = (L.sx[last] - L.sx[first]) / span;
    out[1] = (L.sy[last] - L.sy[first]) / span;
  };

  const touch = () => {
    if (!touched) setTouched(true);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || event.button > 0 || L.drag) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    ensureAudio();
    L.audio = true;
    L.pressedAt = performance.now();
    const [x, y] = local(event);
    L.sn = 0;
    L.pvx = L.pvy = 0;
    sample(x, y, event.timeStamp);
    const id = pickCard(x, y);
    const touchInput = event.pointerType !== "mouse";
    try {
      rootRef.current?.setPointerCapture(event.pointerId);
    } catch {}
    const base = { pointer: event.pointerId, startX: x, startY: y, startT: event.timeStamp / 1000, moved: false, touch: touchInput };
    if (id >= 0) {
      event.preventDefault();
      const card = deck.cards[id];
      const w = toWorld(x, y, card.z);
      deck.grab(id, w[0], w[1]);
      L.drag = { ...base, kind: "card", card: id, front: deck.order[0] === id, fan0: 0, side: 0, range: 1 };
      rootRef.current?.setAttribute("data-grabbing", "");
      pickSound(clamp(card.x / 1.4, -1, 1));
    } else {
      const { width } = sizeRef.current;
      deck.holdFan();
      L.drag = { ...base, kind: "fan", card: -1, front: false, fan0: deck.fan, side: 0, range: Math.max(110, width * 0.28) };
    }
    touch();
    nudge();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const [x, y] = local(event);
    const drag = L.drag;
    if (!drag) {
      if (event.pointerType === "mouse") {
        // over the trays the light rests: it's a hand reaching for a button
        if ((event.target as Element).closest("[data-lab-controls]")) {
          if (L.hover) {
            L.hover = false;
            rootRef.current?.removeAttribute("data-over");
            nudge();
          }
          return;
        }
        L.hover = true;
        L.hx = x;
        L.hy = y;
        if (L.keyAim) L.keyAim = false;
        const over = pickCard(x, y) >= 0;
        const root = rootRef.current;
        if (root && root.hasAttribute("data-over") !== over) root.toggleAttribute("data-over", over);
        nudge();
      }
      return;
    }
    if (event.pointerId !== drag.pointer) return;
    sample(x, y, event.timeStamp);
    if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) > 6) drag.moved = true;
    if (drag.kind === "fan") {
      const dx = x - drag.startX;
      if (!drag.side) {
        if (Math.abs(dx) < 8) return;
        // whichever way the hand first goes spreads a stack, or gathers a fan
        // (a phone's table has no room to swipe outward from its edge)
        drag.side = drag.fan0 >= 0.5 ? -Math.sign(dx) : Math.sign(dx);
      }
      const raw = drag.fan0 + (dx * drag.side) / drag.range;
      const band = (over: number) => over / (1 + over * 3);
      deck.fanTarget = raw > 1 ? 1 + band(raw - 1) : raw < 0 ? -band(-raw) : raw;
    }
    nudge();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = L.drag;
    if (!drag || event.pointerId !== drag.pointer) return;
    L.drag = null;
    rootRef.current?.removeAttribute("data-grabbing");
    const cancelled = event.type !== "pointerup";
    const [x, y] = local(event);
    if (!cancelled) sample(x, y, event.timeStamp);
    const speed = L.tmp;
    if (cancelled) speed[0] = speed[1] = 0;
    else releaseSpeed(speed);
    if (drag.kind === "fan") {
      deck.releaseFan(drag.side ? (speed[0] * drag.side) / drag.range : 0);
      askOrientation();
      nudge();
      return;
    }
    const card = deck.cards[drag.card];
    const quick = event.timeStamp / 1000 - drag.startT < 0.45;
    if (!drag.moved && quick && !cancelled) {
      // a tap: the front card turns over, any other comes to the front
      deck.release(0, 0);
      if (deck.order[0] === card.id) {
        const c = Math.cos(card.p[3]);
        const s = Math.sin(card.p[3]);
        const w = toWorld(x, y, card.z);
        const side = c * (w[0] - card.x) + s * (w[1] - card.y);
        deck.flip(card.id, side >= 0 ? 1 : -1);
      } else deck.toFront(card.id);
      askOrientation();
      nudge();
      return;
    }
    const k = (view.depth - card.z) / (view.scale * view.depth);
    deck.release(speed[0] * k, -speed[1] * k);
    askOrientation();
    nudge();
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    L.hover = false;
    rootRef.current?.removeAttribute("data-over");
    nudge();
  };

  const onDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    const [x, y] = local(event);
    if (pickCard(x, y) >= 0) return;
    deck.setFan(deck.fanGoal === 1 ? 0 : 1);
    nudge();
  };

  /* -------------------------------------------------------------------- */
  /* buttons and keys                                                      */
  /* -------------------------------------------------------------------- */

  const sendBack = () => {
    ensureAudio();
    L.audio = true;
    deck.throwTop(L.throwDir);
    L.throwDir = -L.throwDir;
    touch();
    nudge();
  };

  const flipFront = () => {
    ensureAudio();
    L.audio = true;
    deck.flip(deck.order[0], 1);
    touch();
    nudge();
  };

  const chooseLayout = (value: Layout) => {
    ensureAudio();
    L.audio = true;
    deck.setFan(value === "fan" ? 1 : 0);
    touch();
    nudge();
  };

  const onDeckKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    if (arrows[key]) {
      event.preventDefault();
      const [dx, dy] = arrows[key];
      if (!L.keyAim) {
        L.keyAim = true;
        L.kx = L.ky = 0;
      }
      L.kx = clamp(L.kx + dx * 0.34, -1, 1);
      L.ky = clamp(L.ky + dy * 0.34, -1, 1);
      L.hover = false;
      nudge();
      return;
    }
    if (key === "Escape" && L.keyAim) {
      L.keyAim = false;
      nudge();
      return;
    }
    if (event.repeat) return;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      sendBack();
    } else if (key === "f" || key === "F") {
      event.preventDefault();
      flipFront();
    } else if (key === "s" || key === "S") {
      event.preventDefault();
      chooseLayout(deck.fanGoal === 1 ? "stack" : "fan");
    }
  };

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  if (supported === false) return <Fallback stage={stage} />;

  if (!stage) {
    return (
      <div
        className="absolute inset-0"
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse" || L.reduced) return;
          const [x, y] = local(event);
          L.hover = true;
          L.hx = x;
          L.hy = y;
          wake();
        }}
        onPointerLeave={() => {
          L.hover = false;
          wake();
        }}
        ref={rootRef}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />
      </div>
    );
  }

  const frontName = CARD_LOOK[front].name;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[over]:cursor-grab data-[grabbing]:cursor-grabbing data-[grabbing]:**:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      onContextMenu={(event) => {
        if (!(event.target as Element).closest("[data-lab-controls]")) event.preventDefault();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onPointerLeave={onPointerLeave}
      onDoubleClick={onDoubleClick}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />

      {/* touch targets laid exactly over each card, so a swipe on a card
          throws it while a swipe on the table still scrolls the page */}
      {Array.from({ length: COUNT }, (_, id) => (
        <div
          key={id}
          ref={(node) => {
            overlayRefs.current[id] = node;
          }}
          aria-hidden="true"
          className="absolute top-0 left-0 origin-top-left [touch-action:none]"
          style={{ width: CARD_W * BOX, height: CARD_H * BOX, transform: "scale(0)" }}
        />
      ))}

      {/* the front card, for the keyboard and assistive tech */}
      <button
        ref={deckRef}
        type="button"
        aria-label={`${frontName}, the front card of three`}
        aria-describedby={hintId}
        aria-keyshortcuts="Space Enter F S"
        onMouseDown={(event) => event.preventDefault()}
        onFocus={(event) => {
          let keyboard = true;
          try {
            keyboard = event.currentTarget.matches(":focus-visible");
          } catch {}
          L.ring = keyboard;
          L.ringPath = "";
          ringRef.current?.parentElement?.setAttribute("opacity", keyboard ? "1" : "0");
          nudge();
        }}
        onBlur={() => {
          L.ring = false;
          L.keyAim = false;
          ringRef.current?.parentElement?.setAttribute("opacity", "0");
          nudge();
        }}
        onKeyDown={onDeckKey}
        onClick={(event) => {
          // assistive tech "clicks" without pointer events (a tap's own click follows a press)
          if (event.detail === 0 && performance.now() - L.pressedAt > 800) sendBack();
        }}
        className="absolute top-0 left-0 z-[5] origin-top-left cursor-grab rounded-[4%] outline-none [touch-action:none]"
        style={{ width: CARD_W * BOX, height: CARD_H * BOX, transform: "scale(0)" }}
      />

      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] size-full overflow-visible">
        <g opacity="0" fill="none" strokeLinejoin="round">
          <path ref={ringHaloRef} strokeWidth={4} style={{ stroke: "color-mix(in oklab, var(--background) 70%, transparent)" }} />
          <path ref={ringRef} strokeWidth={2} style={{ stroke: "var(--foreground)" }} />
        </g>
      </svg>

      <p id={hintId} className="sr-only">
        Three holographic cards. Space or Enter sends the front card to the back, F turns it over, S fans the cards out
        or stacks them, and the arrow keys tilt the front card in the light. With a pointer: drag a card and flick it to
        send it to the back, tap the front card to turn it over, tap another card to bring it to the front, and drag the
        table sideways to fan the cards. On a phone, tilting it tilts the cards.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <div ref={controlsRef} className="contents">
        <StageControls placement="bottom">
          <TrayRow>
            <Tray label="Layout">
              <Segmented label="Layout" options={LAYOUTS} value={layout} onChange={chooseLayout} />
            </Tray>
            <Tray label="Cards">
              <IconButton label="Send the front card to the back" onClick={sendBack}>
                <NextIcon size={15} />
              </IconButton>
              <IconButton label="Turn the front card over" onClick={flipFront}>
                <FlipIcon size={15} />
              </IconButton>
              {canTilt ? (
                <IconButton label="Tilt your phone to tilt the cards" pressed={orientOK && gyro} onClick={toggleTilt}>
                  <TiltIcon size={15} />
                </IconButton>
              ) : null}
              <TrayDivider />
              <MuteButton />
            </Tray>
          </TrayRow>
          <StageHint className={touched ? "opacity-0 transition-opacity duration-700" : "transition-opacity duration-700"}>
            {fine
              ? "Flick a card to the back · tap to turn it over · drag the table to fan"
              : "Tilt your phone · flick a card to the back · tap to turn it over · swipe the table to fan"}
          </StageHint>
        </StageControls>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** Three flat cards with a CSS sheen, for browsers without WebGL2. */
function Fallback({ stage }: { stage: boolean }) {
  const faces = [
    { bg: "linear-gradient(160deg,#1c1d23,#0e0f12)", foil: "conic-gradient(from 200deg at 50% 38%,#f6a5c0,#f7e08a,#9ee6b8,#8fc8f7,#c6a3f5,#f6a5c0)", rot: 5 },
    { bg: "linear-gradient(160deg,#f5f2ec,#e8e3da)", foil: "linear-gradient(135deg,#d8f1ff,#f8d9ef,#fff3c9,#d9fbe8)", rot: -4 },
    { bg: "linear-gradient(160deg,#f4f5f8,#c9ccd4)", foil: "linear-gradient(120deg,#e6e9f2,#cfe7ff,#f3d6f3,#e6e9f2)", rot: 0 },
  ];
  return (
    <div
      role={stage ? "img" : undefined}
      aria-label={stage ? "Three holographic cards in a stack" : undefined}
      aria-hidden={stage ? undefined : true}
      className="absolute inset-0 grid place-items-center"
    >
      <div className="relative h-[min(64%,380px)] aspect-[63/88]">
        {faces.map((face, i) => (
          <div
            key={i}
            className="absolute inset-0 overflow-hidden rounded-[5%/3.6%] shadow-[0_14px_30px_-14px_rgb(0_0_0/0.45)]"
            style={{ background: face.bg, rotate: `${face.rot}deg`, translate: `0 ${(2 - i) * -3}%` }}
          >
            <div className="absolute inset-[7%_7%_30%] rounded-[4%] opacity-80" style={{ background: face.foil }} />
          </div>
        ))}
      </div>
    </div>
  );
}
