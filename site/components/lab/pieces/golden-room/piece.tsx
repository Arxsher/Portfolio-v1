"use client";

// Golden hour room: a small room seen as a cut-away model, lit through one
// window by a sun you drag across the sky.
//
// The look
// - A white architectural model (commit city's language): plaster walls
//   cut at the top so you see their thickness, an oak floor, a desk with a
//   monitor, a lamp, books and a mug, a walnut chair on a woven rug, a tall
//   fig by the window, a clock and a framed print on the desk wall. The cut
//   faces stay in the stage's light; inside, the room has its own hour.
// - Light, per pixel every frame (shaders.ts): sunlight only gets in
//   through the window, so it lands as a patch with the steel glazing bars'
//   shadows in it, crisp near the sill and softening across the room. It
//   rakes across the floor through the afternoon, climbs the desk and the
//   wall toward sunset, warms from white to amber to red, and everything
//   in its path (chair, fig, lamp, monitor, mug, books, the clock) throws
//   a soft shadow. Shafts hang in the air where the beam crosses it, and
//   dust glitters only inside them. The sky through the window, the patch's
//   bounce, ambient occlusion and a filmic tone curve do the rest. After
//   dark the monitor wakes, the lamp clicks on (two quick flickers, then a
//   warm rise) with a pool of light and short shadows on the desk, the moon
//   lays a faint cold window on the floor and stars come out in the glass.
//
// The motion model
// - One number drives everything: the hour (06:00 to 23:30). The sun's
//   path on screen is the true projection of its direction (a real sun
//   model, so it rises on the right, tops out at 13:15, sets on the left
//   at 19:45, then sinks below the room) drawn as a faint dotted arc.
// - The hour shown is a spring chasing a goal. Grab the sun and the goal
//   is the point on the arc nearest your hand (stiff, critically damped:
//   the disc trails the finger by a frame or two, never overshoots: it is
//   the sun). Or drag anywhere: a sideways drag scrubs the hour (left is
//   later, the way the sun goes). Every grab starts from where the sun is
//   right now, so a sun still gliding is caught mid-flight without a jump.
// - Let go with speed and it carries on: the release velocity, measured
//   over the last ~80 ms, is projected forward (a fifth of a second of
//   travel) and handed to a softer spring as its starting velocity, so the
//   light keeps sweeping and settles. Past either end the drag gives with
//   rubber banding and springs back.
// - The "wow" second: the first moments on the stage play three hours in
//   (afternoon to golden hour in the light theme, golden hour to night with
//   the lamp coming on in the dark one), and any fast drag through the late
//   afternoon sends the bar shadows raking across the room while the dust
//   swirls in the beam.
// - Lamp and screen switch themselves at dusk (with hysteresis, so a sun
//   resting on the line never flickers them) and can be clicked by hand.
// - Keyboard: the sun is a slider (← → a quarter hour, Shift or Page Up /
//   Down an hour, Home and End the ends of the day).
// - Sound (stage, after a gesture, lab mute respected): the clock ticks as
//   the sun passes each hour, the lamp's switch and filament, the monitor
//   waking.
// - Tile: the day loops on its own in about twenty seconds, slower through
//   the golden hour; under the mouse the sun glides to sunset and waits.
//   30 fps, smaller dust, no sound, no controls.
// - Lifetime: the room's geometry is marched once per size into a
//   G-buffer and only relit per frame; the stage steps its internal
//   resolution down if a machine can't keep up; the idle stage drops to
//   30 fps; nothing allocates per frame; the context is handed back on
//   unmount (useWebGL2).
// - Reduced motion: a still at the rest hour; the sun still moves when you
//   move it, without easing, and the lamp switches without its flicker.
//
// Files: scene.ts (the room, camera, sun model, light levels, framing),
// shaders.ts + renderer.ts (WebGL2), sound.ts, icons.tsx.

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
import { IconButton, MuteButton, StageControls, StageHint, Tray, TrayDivider } from "../../ui";
import { LampIcon, MoonIcon, ScreenIcon, SunIcon } from "./icons";
import { RoomRenderer, type Frame } from "./renderer";
import {
  clockText,
  HOUR_MAX,
  HOUR_MIN,
  hourForAngle,
  layoutFor,
  lightAt,
  newLayout,
  newLight,
  newSun,
  pathAngle,
  phaseAt,
  pick,
  project,
  sunAt,
  sunScreen,
  type Layout,
  type Light,
  type Pickable,
  type Vec3,
} from "./scene";
import { lampClick, screenOn as screenSound, tick } from "./sound";

/* ---------------------------------------------------------------------- */
/* tuning                                                                  */
/* ---------------------------------------------------------------------- */

/** Where the sun rests: golden light on the desk wall, or night with the lamp on. */
const REST: Record<PieceTheme, number> = { light: 19.3, dark: 21.6 };
/** The first moments on the stage play this many hours up to the rest. */
const INTRO_HOURS = 3;
/** The tile under the mouse glides here (the sun just above the horizon). */
const HOVER_HOUR = 19.15;

const SPRING_DRAG = { stiffness: 260, damping: 31 };
const SPRING_GLIDE = { stiffness: 40, damping: 12.6 };
const SPRING_SLOW = { stiffness: 8, damping: 5.8 };

/** Lamp and screen switch at these sun elevations (degrees), with hysteresis. */
const LAMP_ON = -3.2;
const LAMP_OFF = -1.6;
const SCREEN_ON = 0.6;
const SCREEN_OFF = 2.4;

/** If a machine can't hold the frame rate, the stage renders a step below (×). */
const RENDER_STEPS = [1, 0.8, 0.64] as const;

/** Light on the model's cut faces per theme (linear). */
const STUDIO: Record<PieceTheme, Vec3> = { light: [1.24, 1.23, 1.21], dark: [0.068, 0.068, 0.072] };

const KEY_STEP = 0.25;

/** Scratch sun for the readout (the light keeps its own). */
const scratchSun = newSun();

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

/** The lamp coming on: nothing, a flash, a dip, a second catch, then a warm rise. */
function ignition(t: number): number {
  if (t < 0.03) return 0;
  if (t < 0.07) return 0.7;
  if (t < 0.13) return 0.06;
  if (t < 0.17) return 0.5;
  if (t < 0.22) return 0.18;
  return 1 - 0.82 * Math.exp(-(t - 0.22) / 0.08);
}

/** The screen waking: a beat, then up with a slight overshoot. */
function wakeCurve(t: number): number {
  if (t < 0.09) return 0;
  const k = (t - 0.09) / 0.5;
  if (k >= 1) return 1;
  const e = 1 - Math.pow(1 - k, 3);
  return e + Math.sin(k * Math.PI) * 0.08;
}

/** Tile: how fast the day runs (hours per second), slowest in the golden hour. */
function tileRate(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  const golden = Math.exp(-(((h - 18.6) / 1.9) ** 2));
  const dark = h < 9 || h > 21.5 ? 1 : 0;
  return 1.45 - 1.05 * golden + 1.1 * dark;
}

type Drag = {
  id: number;
  kind: "grab" | "scrub" | "pick";
  x0: number;
  y0: number;
  hour0: number;
  moved: boolean;
  pick: Pickable | null;
  /** Recent (time, goal) samples for the release velocity. */
  ts: Float64Array;
  hs: Float64Array;
  n: number;
};

type Live = {
  hour: Spring;
  /** 0..1 while the sun is held (the disc swells and brightens). */
  held: Spring;
  goal: number;
  drag: Drag | null;
  lampOn: boolean;
  lampLevel: number;
  lampT: number;
  screenOn: boolean;
  screenLevel: number;
  screenT: number;
  prevEl: number;
  light: Light;
  frame: Frame;
  layout: Layout;
  sun: { x: number; y: number };
  clock: number;
  stir: number;
  hovering: boolean;
  hover: number;
  tileHour: number;
  acc: number;
  renderStep: number;
  perf: { time: number; slow: number };
  bg: Vec3;
  bgHover: Vec3;
  studio: Vec3;
  /** Internal px per CSS px. */
  k: number;
  lastInput: number;
  prevHour: number;
  introPending: boolean;
  /** What the DOM shows now (syncDom writes only changes). */
  minute: number;
  phase: string;
  handleX: number;
  handleY: number;
  night: boolean;
  theme: PieceTheme;
  reduced: boolean;
};

function makeLive(theme: PieceTheme, reduced: boolean, stage: boolean): Live {
  const rest = REST[theme];
  // the stage opens three hours early and plays up to the rest; the tile starts mid-afternoon
  const startHour = stage ? (reduced ? rest : rest - INTRO_HOURS) : reduced ? rest : 16.4;
  const sun = sunAt(startHour, { dir: [0, 1, 0], elevation: 0, bearing: 0 });
  const light = newLight();
  return {
    hour: new Spring(startHour, SPRING_GLIDE),
    held: new Spring(0, { stiffness: 380, damping: 22 }),
    goal: startHour,
    drag: null,
    lampOn: sun.elevation < LAMP_ON,
    lampLevel: sun.elevation < LAMP_ON ? 1 : 0,
    lampT: 10,
    screenOn: sun.elevation < SCREEN_ON,
    screenLevel: sun.elevation < SCREEN_ON ? 1 : 0,
    screenT: 10,
    prevEl: sun.elevation,
    light,
    frame: {
      viewX: 0,
      viewY: 0,
      unitsPerPx: 0.01,
      light,
      lamp: 0,
      screen: 0,
      hour: startHour,
      time: 0,
      shaft: 0,
      stir: 0,
      bg: [0.95, 0.95, 0.95],
      dark: theme === "dark",
      studio: [...STUDIO[theme]] as Vec3,
      sunX: 0,
      sunY: 0,
      sunR: 0,
      glow: 0,
      bloom: 0.5,
      motes: 0,
      moteScale: 1,
      moteColor: [1, 0.86, 0.62],
    },
    layout: newLayout(),
    sun: { x: 0, y: 0 },
    clock: 0,
    stir: 0,
    hovering: false,
    hover: 0,
    tileHour: startHour,
    acc: 0,
    renderStep: 0,
    perf: { time: 0, slow: 0 },
    bg: theme === "dark" ? [0.137, 0.137, 0.137] : [0.949, 0.949, 0.949],
    bgHover: theme === "dark" ? [0.165, 0.165, 0.165] : [0.922, 0.922, 0.922],
    studio: [...STUDIO[theme]] as Vec3,
    k: 1,
    lastInput: -10,
    prevHour: startHour,
    introPending: stage && !reduced,
    minute: NaN,
    phase: "",
    handleX: NaN,
    handleY: NaN,
    night: sun.elevation < -0.6,
    theme,
    reduced,
  };
}

export default function Piece(props: PieceProps) {
  return <Room {...props} />;
}

function Room({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [live] = useState(() => makeLive(theme, reducedMotion, stage));
  const L = live;
  const rendererRef = useRef<RoomRenderer | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGSVGElement>(null);
  const maskRef = useRef<SVGCircleElement>(null);
  const maskId = `gr-sun-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const fine = useFinePointer();
  const hintId = useId();

  const [path, setPath] = useState<{ day: string; night: string; w: number; h: number } | null>(null);
  const [night, setNight] = useState(L.night);
  const [lampOn, setLampOn] = useState(L.lampOn);
  const [screenIsOn, setScreenIsOn] = useState(L.screenOn);
  const [touched, setTouched] = useState(false);
  const [keyFocus, setKeyFocus] = useState(false);
  const [wide, setWide] = useState(true);

  const bottomFor = (width: number) => (width < 560 ? 92 : 102);

  /* -------------------------------------------------------------------- */
  /* sizes                                                                 */
  /* -------------------------------------------------------------------- */

  const applySize = useCallback(() => {
    const renderer = rendererRef.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || width < 2 || height < 2) return;
    const base = stage ? (dpr >= 1.5 ? Math.min(dpr, 1.5) : dpr) : dpr;
    const scale = base * (stage ? RENDER_STEPS[L.renderStep] : 1);
    renderer.setSize(width * scale, height * scale);
    L.k = renderer.width / width;
    layoutFor(width, height, mode, bottomFor(width), L.layout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, mode]);

  /** The dotted path of the sun, as two SVG paths (day, and below the horizon). */
  const buildPath = useCallback(() => {
    if (!stage) return;
    const { width, height } = sizeRef.current;
    const layout = L.layout;
    const point = { x: 0, y: 0 };
    let day = "";
    let below = "";
    let previousNight: boolean | null = null;
    for (let h = HOUR_MIN; h <= HOUR_MAX + 1e-6; h += 0.125) {
      sunScreen(h, layout, point);
      const el = sunAt(h, L.light.sun).elevation;
      const isNight = el < -0.6;
      const seg = `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      if (isNight) {
        below += previousNight === true ? ` L${seg}` : `M${seg}`;
      } else {
        day += previousNight === false ? ` L${seg}` : `M${seg}`;
      }
      if (previousNight !== null && previousNight !== isNight) {
        // join the two halves at the horizon
        if (isNight) day += ` L${seg}`;
        else below += ` L${seg}`;
      }
      previousNight = isNight;
    }
    sunAt(L.hour.value, L.light.sun);
    setPath({ day, night: below, w: width, h: height });
    setWide(width >= 640);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* -------------------------------------------------------------------- */
  /* switching the lamp and the screen                                     */
  /* -------------------------------------------------------------------- */

  const switchLamp = useCallback(
    (on: boolean, sound: boolean) => {
      if (L.lampOn === on) return;
      L.lampOn = on;
      L.lampT = 0;
      setLampOn(on);
      if (sound && stage) lampClick(on, 0.45);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage],
  );
  const switchScreen = useCallback(
    (on: boolean, sound: boolean) => {
      if (L.screenOn === on) return;
      L.screenOn = on;
      L.screenT = 0;
      setScreenIsOn(on);
      if (sound && stage && on) screenSound(0.25);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage],
  );

  /* -------------------------------------------------------------------- */
  /* drawing                                                               */
  /* -------------------------------------------------------------------- */

  const paint = (): boolean => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!renderer || !canvas || width < 2 || height < 2) return false;
    const layout = L.layout;
    const k = L.k;
    const f = L.frame;
    const hour = L.hour.value;
    const light = lightAt(hour, L.lampLevel, L.screenLevel, L.light);

    f.viewX = layout.ox * k;
    f.viewY = (height - layout.oy) * k;
    f.unitsPerPx = 1 / (layout.scale * k);
    f.hour = hour;
    f.time = L.clock;
    f.lamp = L.lampLevel;
    f.screen = L.screenLevel;
    f.stir = L.stir;
    f.dark = L.theme === "dark";
    const hover = L.hover;
    f.bg[0] = lerp(L.bg[0], L.bgHover[0], hover);
    f.bg[1] = lerp(L.bg[1], L.bgHover[1], hover);
    f.bg[2] = lerp(L.bg[2], L.bgHover[2], hover);
    f.studio[0] = L.studio[0];
    f.studio[1] = L.studio[1];
    f.studio[2] = L.studio[2];

    const el = light.sun.elevation;
    if (light.sunShare > 0) {
      f.shaft = lerp(0.1, 0.6, smoothstep(34, 4, el));
      const level = clamp((light.winCol[0] + light.winCol[1] + light.winCol[2]) / 5.5, 0.2, 1);
      const warm = smoothstep(25, 2, el);
      f.moteColor[0] = 0.95 * level;
      f.moteColor[1] = lerp(0.9, 0.7, warm) * level;
      f.moteColor[2] = lerp(0.78, 0.42, warm) * level;
    } else {
      f.shaft = 0.22 * light.night;
      f.moteColor[0] = 0.32 * light.night;
      f.moteColor[1] = 0.38 * light.night;
      f.moteColor[2] = 0.52 * light.night;
    }
    f.motes = renderer.moteCount;
    f.moteScale = k * (stage ? 1 : 0.75);
    f.bloom = stage ? 0.55 : 0.45;

    // the disc on its path
    sunScreen(hour, layout, L.sun);
    if (stage) {
      f.sunX = L.sun.x * k;
      f.sunY = (height - L.sun.y) * k;
      const held = L.held.value;
      f.sunR = layout.sunR * k * (1 + 0.16 * held);
      f.glow = light.discSun > 0 ? lerp(0.5, 1, smoothstep(30, 2, el)) * smoothstep(-2.5, 0.5, el) : 0;
      f.glow = Math.max(f.glow, 0.4 * light.night) * (1 + 0.45 * held);
    } else {
      f.sunR = 0;
      f.glow = 0;
    }
    renderer.draw(f, canvas.width, canvas.height);
    return true;
  };

  /** Readout, slider value and the handle's place, written straight to the DOM when they change. */
  const syncDom = () => {
    if (!stage) return;
    const handle = handleRef.current;
    const x = Math.round(L.sun.x * 4) / 4;
    const y = Math.round(L.sun.y * 4) / 4;
    if (handle && (x !== L.handleX || y !== L.handleY)) {
      L.handleX = x;
      L.handleY = y;
      handle.style.transform = `translate3d(${x - 22}px, ${y - 22}px, 0)`;
      maskRef.current?.setAttribute("cx", String(x));
      maskRef.current?.setAttribute("cy", String(y));
    }
    // while a hand holds the sun, say where it's going; otherwise where it is
    const hour = L.drag ? L.goal : L.hour.value;
    const minute = Math.round(hour * 60);
    if (minute !== L.minute) {
      L.minute = minute;
      const text = clockText(hour);
      const phase = phaseAt(hour, sunAt(hour, scratchSun).elevation);
      if (timeRef.current) timeRef.current.textContent = text;
      if (phaseRef.current && phase !== L.phase) phaseRef.current.textContent = phase;
      L.phase = phase;
      if (handle) {
        handle.setAttribute("aria-valuenow", (minute / 60).toFixed(2));
        handle.setAttribute("aria-valuetext", `${text}, ${phase.toLowerCase()}`);
      }
    }
    const isNight = sunAt(L.hour.value, scratchSun).elevation < -0.6;
    if (isNight !== L.night) {
      L.night = isNight;
      setNight(isNight);
    }
  };

  // the slider's value and the readout are written by syncDom (every change,
  // straight to the DOM); fill them in before the first paint
  useIsoLayoutEffect(() => {
    L.minute = NaN;
    L.phase = "";
    L.handleX = NaN;
    syncDom();
  });

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const { width } = sizeRef.current;
    if (!renderer || width < 2) return false;
    const reduced = L.reduced;
    const now = performance.now() / 1000;
    const idle = !L.drag && now - L.lastInput > 4 && L.hour.settled && L.held.settled && L.lampLevel % 1 === 0;

    // tiles (and an idle stage) run at 30 fps
    if (!stage || idle) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }
    if (!reduced) L.clock += dt;

    // a stage that runs slow for a sustained stretch renders a step smaller
    if (stage && !idle && L.renderStep < RENDER_STEPS.length - 1) {
      const perf = L.perf;
      perf.time += dt;
      if (dt > 1 / 42) perf.slow += dt;
      if (perf.time >= 1.6) {
        if (perf.slow > perf.time * 0.7) {
          L.renderStep += 1;
          applySize();
        }
        perf.time = 0;
        perf.slow = 0;
      }
    }

    // the hour
    if (stage) {
      if (L.introPending) {
        // the first frame on screen: play the last three hours up to the rest
        L.introPending = false;
        L.hour.configure(SPRING_SLOW);
        L.goal = REST[L.theme];
        L.hour.to(L.goal);
      }
      if (reduced) L.hour.set(L.hour.target);
      else L.hour.step(dt);
      L.held.to(L.drag && L.drag.kind === "grab" ? 1 : 0);
      if (reduced) L.held.set(L.held.target);
      else L.held.step(dt);
    } else {
      L.hover = reduced ? (L.hovering ? 1 : 0) : damp(L.hover, L.hovering ? 1 : 0, 10, dt);
      if (reduced) {
        L.hour.set(REST[L.theme]);
      } else if (L.hovering) {
        L.hour.configure(SPRING_GLIDE);
        L.hour.to(HOVER_HOUR + Math.floor((L.hour.value - HOVER_HOUR + 12) / 24) * 24);
        L.hour.step(dt);
        L.tileHour = L.hour.value;
      } else {
        L.tileHour += tileRate(L.tileHour) * dt;
        if (L.tileHour >= 28) {
          L.tileHour -= 24;
          L.prevHour -= 24;
        }
        L.hour.set(L.tileHour);
      }
    }

    // how fast the sun is moving stirs the dust
    const speed = Math.abs(L.hour.value - L.prevHour) / Math.max(1e-3, dt);
    L.stir = reduced ? 0 : damp(L.stir, clamp(speed / 5, 0, 1), speed / 5 > L.stir ? 8 : 1.6, dt);

    // the lamp and the screen follow the dusk
    const el = sunAt(L.hour.value, L.light.sun).elevation;
    const sound = stage;
    if (L.prevEl >= LAMP_ON && el < LAMP_ON) switchLamp(true, sound);
    if (L.prevEl <= LAMP_OFF && el > LAMP_OFF) switchLamp(false, sound);
    if (L.prevEl >= SCREEN_ON && el < SCREEN_ON) switchScreen(true, sound);
    if (L.prevEl <= SCREEN_OFF && el > SCREEN_OFF) switchScreen(false, sound);
    L.prevEl = el;
    L.lampT += dt;
    L.screenT += dt;
    if (reduced) {
      L.lampLevel = L.lampOn ? 1 : 0;
      L.screenLevel = L.screenOn ? 1 : 0;
    } else {
      L.lampLevel = L.lampOn ? ignition(L.lampT) : L.lampLevel * Math.exp(-dt / 0.09);
      if (!L.lampOn && L.lampLevel < 0.002) L.lampLevel = 0;
      if (L.lampOn && L.lampT > 1.2) L.lampLevel = 1;
      L.screenLevel = L.screenOn ? wakeCurve(L.screenT) : L.screenLevel * Math.exp(-dt / 0.12);
      if (!L.screenOn && L.screenLevel < 0.002) L.screenLevel = 0;
    }

    // the clock ticks as the sun passes each hour
    if (stage && now - L.lastInput < 3) {
      const a = Math.floor(L.prevHour);
      const b = Math.floor(L.hour.value);
      if (a !== b && speed > 0.05) {
        const pan = (L.sun.x / Math.max(1, width)) * 2 - 1;
        tick(Math.max(a, b), pan, speed);
      }
    }
    L.prevHour = L.hour.value;

    // the stage colours ease with the theme
    const target = STUDIO[L.theme];
    for (let c = 0; c < 3; c++) L.studio[c] = reduced ? target[c] : damp(L.studio[c], target[c], 4, dt);

    paint();
    syncDom();

    if (reduced && !L.drag && L.hour.settled && L.held.settled && L.lampLevel % 1 === 0 && L.screenLevel % 1 === 0 && (stage || L.hover % 1 === 0)) {
      return false;
    }
  });

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    attributes: { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: RoomRenderer | null = null;
      try {
        renderer = new RoomRenderer(gl, mode);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      applySize();
      buildPath();
      paint();
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => {
      applySize();
      buildPath();
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
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstTheme = useRef(true);
  useEffect(() => {
    L.theme = theme;
    readColours();
    if (firstTheme.current) {
      firstTheme.current = false;
      wake();
      return;
    }
    // switching the site's theme plays the evening through (or back)
    if (stage) {
      L.hour.configure(SPRING_SLOW);
      L.goal = REST[theme];
      L.hour.to(L.goal);
    }
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    L.reduced = reducedMotion;
    if (reducedMotion && L.introPending) {
      L.introPending = false;
      L.goal = REST[L.theme];
      L.hour.set(L.goal);
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
    if (!touched) setTouched(true);
    latestWake.current();
  };

  /** Set where the sun is heading while a hand holds it (with rubber banding past the ends). */
  const aim = (hour: number, spring = SPRING_DRAG) => {
    let goal = hour;
    if (goal < HOUR_MIN) goal = HOUR_MIN - rubber(HOUR_MIN - goal);
    if (goal > HOUR_MAX) goal = HOUR_MAX + rubber(goal - HOUR_MAX);
    L.goal = goal;
    L.hour.configure(spring);
    L.hour.to(goal);
  };

  const local = (event: ReactPointerEvent) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const record = (drag: Drag, hour: number, at: number) => {
    const i = drag.n % drag.ts.length;
    drag.ts[i] = at / 1000;
    drag.hs[i] = hour;
    drag.n += 1;
  };

  /** Hours per second over the last ~80 ms of the drag (event times, so a busy frame doesn't skew it). */
  const releaseVelocity = (drag: Drag, upAt: number): number => {
    const size = drag.ts.length;
    if (drag.n < 2) return 0;
    const last = (drag.n - 1) % size;
    const tEnd = drag.ts[last];
    if (upAt / 1000 - tEnd > 0.09) return 0; // the hand stopped before letting go
    let first = last;
    for (let j = 1; j < Math.min(drag.n, size); j++) {
      const idx = (drag.n - 1 - j) % size;
      first = idx;
      if (tEnd - drag.ts[idx] > 0.08) break;
    }
    const span = tEnd - drag.ts[first];
    if (span < 0.012) return 0;
    return (drag.hs[last] - drag.hs[first]) / span;
  };

  const scrubHour = (drag: Drag, x: number) => {
    const pxPerHour = Math.max(56, L.layout.rx * 0.27);
    return drag.hour0 - (x - drag.x0) / pxPerHour;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || !event.isPrimary || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    ensureAudio();
    const { x, y } = local(event);
    const onSun = Boolean((event.target as Element).closest("[data-sun]"));
    const picked = onSun ? null : pick(x, y, L.layout);
    const drag: Drag = {
      id: event.pointerId,
      kind: onSun ? "grab" : picked ? "pick" : "scrub",
      x0: x,
      y0: y,
      // start from where the sun is right now, so a moving sun is caught mid-flight
      hour0: L.hour.value,
      moved: false,
      pick: picked,
      ts: new Float64Array(8),
      hs: new Float64Array(8),
      n: 0,
    };
    L.drag = drag;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    if (drag.kind === "grab") {
      aim(hourForAngle(pathAngle(x, y, L.layout), L.hour.value));
    } else {
      aim(L.hour.value);
    }
    record(drag, L.goal, event.timeStamp);
    if (drag.kind !== "pick") pathRef.current?.setAttribute("data-dragging", "");
    if (surfaceRef.current) surfaceRef.current.style.cursor = drag.kind === "pick" ? "pointer" : "grabbing";
    noteInput();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage) return;
    const drag = L.drag;
    const { x, y } = local(event);
    if (!drag) {
      // hover: point at the lamp or the screen
      if (fine && surfaceRef.current) {
        const overSun = Boolean((event.target as Element).closest("[data-sun]"));
        surfaceRef.current.style.cursor = overSun ? "grab" : pick(x, y, L.layout) ? "pointer" : "grab";
      }
      return;
    }
    if (event.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) > 5) {
      drag.moved = true;
      if (drag.kind === "pick") {
        // a press on the lamp that turns into a drag scrubs like anywhere else
        drag.kind = "scrub";
        drag.x0 = x;
        drag.hour0 = L.hour.value;
        pathRef.current?.setAttribute("data-dragging", "");
        if (surfaceRef.current) surfaceRef.current.style.cursor = "grabbing";
      }
    }
    if (drag.kind === "grab") {
      aim(hourForAngle(pathAngle(x, y, L.layout), L.goal));
    } else if (drag.kind === "scrub" && drag.moved) {
      aim(scrubHour(drag, x));
    }
    record(drag, L.goal, event.timeStamp);
    noteInput();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = L.drag;
    if (!drag || event.pointerId !== drag.id) return;
    L.drag = null;
    pathRef.current?.removeAttribute("data-dragging");
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    if (surfaceRef.current) surfaceRef.current.style.cursor = fine ? "grab" : "";
    if (drag.kind === "pick" && !cancelled && drag.pick) {
      if (drag.pick === "lamp") switchLamp(!L.lampOn, true);
      else switchScreen(!L.screenOn, true);
      if (drag.pick === "screen" && !L.screenOn) lampClick(false, 0.2);
      noteInput();
      return;
    }
    // carry on with the hand's speed, then settle inside the day
    const v = cancelled || L.reduced ? 0 : releaseVelocity(drag, event.timeStamp);
    const fling = clamp(v, -10, 10);
    const projected = clamp(L.goal + fling * 0.2, HOUR_MIN, HOUR_MAX);
    L.goal = projected;
    L.hour.configure(SPRING_GLIDE);
    L.hour.to(projected, fling);
    noteInput();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    const step = event.shiftKey ? 1 : KEY_STEP;
    const from = L.goal;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = from + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = from - step;
        break;
      case "PageUp":
        next = from + 1;
        break;
      case "PageDown":
        next = from - 1;
        break;
      case "Home":
        next = HOUR_MIN;
        break;
      case "End":
        next = HOUR_MAX;
        break;
      default:
        return;
    }
    event.preventDefault();
    ensureAudio();
    // snap keyboard steps to the quarter hour
    const snapped = event.key === "Home" || event.key === "End" ? next : Math.round(next / KEY_STEP) * KEY_STEP;
    L.goal = clamp(snapped, HOUR_MIN, HOUR_MAX);
    L.hour.configure(SPRING_GLIDE);
    L.hour.to(L.goal);
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

  if (supported === false) return <Fallback mode={mode} theme={theme} />;

  if (!stage) {
    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />;
  }

  const hint = keyFocus
    ? wide
      ? "← → move the sun a quarter hour · Shift for an hour · Home and End jump to dawn and night"
      : "← → a quarter hour · Shift for an hour"
    : fine
      ? "Drag the sun across the sky · click the lamp or the screen"
      : "Drag sideways to move the sun · tap the lamp";

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
          aria-label="A small room seen as a cut-away model, lit through its window by the sun"
          className="absolute inset-0 block size-full"
        />
        {path ? (
          <svg
            ref={pathRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full overflow-visible opacity-70 transition-opacity duration-300 ease-out data-[dragging]:opacity-100 data-[dragging]:duration-150"
            viewBox={`0 0 ${path.w} ${path.h}`}
            preserveAspectRatio="none"
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={path.w} height={path.h}>
                <rect width={path.w} height={path.h} fill="white" />
                <circle ref={maskRef} r={L.layout.sunR + 7} fill="black" />
              </mask>
            </defs>
            <g mask={`url(#${maskId})`}>
            <path
              d={path.day}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeDasharray="0 7"
              className="text-[color-mix(in_oklab,var(--foreground)_22%,transparent)]"
            />
            <path
              d={path.night}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeDasharray="0 9"
              className="text-[color-mix(in_oklab,var(--foreground)_12%,transparent)]"
            />
            </g>
          </svg>
        ) : null}
        <div
          ref={handleRef}
          data-sun=""
          role="slider"
          tabIndex={0}
          aria-label="Time of day"
          aria-describedby={hintId}
          aria-orientation="horizontal"
          aria-valuemin={HOUR_MIN}
          aria-valuemax={HOUR_MAX}
          onKeyDown={onKeyDown}
          onFocus={(event) => setKeyFocus(event.currentTarget.matches(":focus-visible"))}
          onBlur={() => setKeyFocus(false)}
          className="group/sun absolute start-0 top-0 size-11 touch-none rounded-full outline-none will-change-transform"
          style={{ cursor: "grab" }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-1 rounded-full opacity-0 shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_38%,transparent)] transition-[opacity,scale] duration-200 ease-out group-hover/sun:scale-105 group-hover/sun:opacity-100 group-focus-visible/sun:opacity-100 group-focus-visible/sun:shadow-[0_0_0_2px_var(--foreground)] group-active/sun:scale-110"
          />
        </div>
      </div>

      <p id={hintId} className="sr-only">
        The sun moves along its path across the sky from six in the morning to half past eleven at night. Use the arrow
        keys to move it a quarter of an hour, with Shift or Page Up and Page Down an hour, and Home or End for the ends of
        the day. The lamp and the screen buttons switch them by hand.
      </p>

      <StageControls placement="bottom">
        <Tray label="Time and lights">
          <span className="flex h-10 items-center gap-2 ps-2.5 pe-2 text-[13px]" aria-hidden="true">
            <span className="text-secondary">{night ? <MoonIcon size={15} /> : <SunIcon size={15} />}</span>
            <span ref={timeRef} className="w-[38px] font-medium text-primary tabular-nums" />
            <span ref={phaseRef} className="w-[82px] whitespace-nowrap text-secondary" />
          </span>
          <TrayDivider />
          <IconButton label="Desk lamp" pressed={lampOn} onClick={() => { ensureAudio(); switchLamp(!L.lampOn, true); noteInput(); }}>
            <LampIcon />
          </IconButton>
          <IconButton
            label="Screen"
            pressed={screenIsOn}
            onClick={() => {
              ensureAudio();
              switchScreen(!L.screenOn, true);
              noteInput();
            }}
          >
            <ScreenIcon />
          </IconButton>
          <TrayDivider />
          <MuteButton />
        </Tray>
        <StageHint
          className={!touched || keyFocus ? "transition-opacity duration-300" : "opacity-0 transition-opacity duration-700"}
        >
          {hint}
        </StageHint>
      </StageControls>
    </div>
  );
}

/** Rubber band: the further past the end, the less further it goes (in hours). */
function rubber(over: number): number {
  const limit = 0.9;
  return (limit * over) / (limit + over);
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat drawing of the room for browsers without WebGL2: the two walls, the window and its patch of light. */
function Fallback({ mode, theme }: { mode: "tile" | "stage"; theme: PieceTheme }) {
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
      const layout = layoutFor(rect.width, rect.height, mode, mode === "stage" ? 100 : 0, newLayout());
      const p = { x: 0, y: 0 };
      const q: Vec3 = [0, 0, 0];
      const at = (x: number, y: number, z: number) => {
        q[0] = x;
        q[1] = y;
        q[2] = z;
        project(q, layout, p);
        return [p.x, p.y] as const;
      };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      const dark = theme === "dark";
      const poly = (pts: ReadonlyArray<readonly [number, number]>, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
      };
      poly([at(0, 0, 0), at(4.2, 0, 0), at(4.2, 0, 4.2), at(0, 0, 4.2)], dark ? "#3a3530" : "#cdb79c");
      poly([at(0, 0, 0), at(0, 2.7, 0), at(0, 2.7, 4.2), at(0, 0, 4.2)], dark ? "#2c2d30" : "#e4e2de");
      poly([at(0, 0, 0), at(0, 2.7, 0), at(4.2, 2.7, 0), at(4.2, 0, 0)], dark ? "#333437" : "#ecebe8");
      poly([at(0, 0.8, 1.42), at(0, 2.42, 1.42), at(0, 2.42, 3.12), at(0, 0.8, 3.12)], dark ? "#1b2236" : "#c9d7e8");
      poly([at(0.6, 0, 1.6), at(1.6, 0, 1.0), at(2.6, 0, 2.6), at(1.4, 0, 3.4)], dark ? "rgb(120 140 200 / 0.18)" : "rgb(255 196 120 / 0.55)");
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
      aria-label={mode === "stage" ? "A small room lit through its window" : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="absolute inset-0 block size-full"
    />
  );
}
