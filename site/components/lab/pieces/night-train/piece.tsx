"use client";

// Night train: a valley in the evening, a stone viaduct across it, and the
// trains that cross it. Drag the sky and the evening runs on under your hand;
// click and the next train comes out of the hill.
//
// The look
// - A real 3D valley seen from the river bank, low by the water (WebGL2,
//   rasterised, see renderer.ts): a curved viaduct of eleven arches between
//   two tunnel portals, a hamlet on the left bank, pines up the slopes,
//   three bands of far ranges fading into the haze, and the river coming
//   down a gap in them straight toward you as a still pool.
// - The light is the scene: the sky (gradient, glow around the sun, a cloud
//   deck lit from below at sunset, then stars and a moon lit from wherever
//   the sun has gone) is the same function the haze, the fog and the
//   reflections use, so everything belongs to one hour. Shadows come from a
//   shadow map of the sun (the moon after dark): the arches throw long
//   shadows down the meadows toward you at golden hour, and the train's own
//   shadow runs along with it. The river is a mirror (the scene drawn again
//   upside down) bent by flowing ripples, with a glitter path to the sun.
// - At night the coaches' windows glow (compartments lit warm, a few dark,
//   some blinds half down), the hamlet's windows come on one by one, the
//   headlight throws a cone through the mist that sweeps across the valley
//   as the train rounds the curve, its light lands on the trees and the far
//   portal, and all of it shimmers in the river.
//
// The motion model
// - One number drives the light: the hour, 16:00 to midnight. The sun's path
//   starts high on the left and sets straight up the valley, through the
//   middle arch. The hour shown is a spring chasing a goal:
//   * Grab the sun (on or near the disc): the goal is the point of its path
//     nearest your hand, on a stiff, critically damped spring, so the disc
//     trails the finger by a frame and never overshoots (it is the sun).
//     Past the day's ends the path gives with rubber banding.
//   * Drag anywhere else: the drag scrubs the hour (right, and with a mouse
//     down, is later: the way the sun goes). On touch only sideways drags
//     scrub; vertical ones scroll the page.
//   * Every grab starts from where the hour is right now, so a sun still
//     gliding is caught mid-flight, without a jump.
//   * Let go with speed and it carries on: the release velocity (last ~80 ms)
//     is projected a fifth of a second ahead and handed to a softer spring as
//     its starting velocity, so the evening keeps rolling, then settles.
// - A click or tap that doesn't drag sends the next train: a horn in the
//   tunnel, its light growing in the mouth, then the train glides out and
//   across in about ten seconds. Trains that follow keep a block apart; one
//   the other way waits for the line to clear. Space or Enter do the same.
// - A resting mouse shifts the eye a little (springs), so the pines slide
//   against the hills and the reflections swim: the scene reads as 3D.
// - The wow second: the stage opens an hour or two early and plays the
//   evening up to the rest (golden hour in the light theme; sunset into
//   night, lights coming on, in the dark one) while the first train, the
//   long sleeper, comes out of the hill.
// - Keyboard: the stage is a slider for the hour (← → a quarter hour, Shift
//   or Page Up / Down an hour, Home and End the ends of the evening).
// - Sound (stage, after a press or a key there; lab mute respected): the
//   river, the train's rumble while it is out on the viaduct, every wheel
//   over every rail joint (clack-clack, panned with the train), the horn
//   from the tunnel, crickets once it is dark.
// - Tile: opens with a train already out on the viaduct; the light swings
//   slowly around the theme's hour and trains keep running on their own;
//   under the mouse the evening glides to sunset (or deep night) and the eye
//   leans with the pointer. 30 fps, no sound, no controls.
// - Lifetime: the valley is built once per mode and uploaded once; the
//   frame loop allocates nothing; the stage steps its internal resolution
//   down on a slow machine and drops to 30 fps while nothing moves; the
//   loop stops offscreen and in a hidden tab; the WebGL context is handed
//   back on unmount (useWebGL2).
// - Reduced motion: a still: one train standing on the viaduct at the
//   theme's hour, water and clouds still. Dragging still changes the hour
//   (without easing) and a click brings the next train, in place.
//
// Files: world.ts (the valley, the line, the meshes), sky.ts (the hour's
// light), trains.ts (the timetable), view.ts (the camera), shaders.ts +
// renderer.ts (WebGL2), sound.ts, icons.tsx, math.ts.

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
import { clamp, smoothstep, Spring, useFinePointer, useFrame, useIsoLayoutEffect, useLatest, useWebGL2 } from "../../hooks";
import type { PieceMode, PieceProps, PieceTheme } from "../../types";
import { MuteButton, StageControls, StageHint, Tray, TrayButton, TrayDivider } from "../../ui";
import { MoonIcon, SunIcon, TrainIcon } from "./icons";
import type { Vec3 } from "./math";
import { TrainRenderer, type Frame } from "./renderer";
import { clockText, HOUR_MAX, HOUR_MIN, lightAt, newLight, phaseFor, sunElevation, type Light } from "./sky";
import { beat, horn, Valley } from "./sound";
import { Timetable } from "./trains";
import { frameView, hourNearest, newView, sunScreen, type View } from "./view";
import { DECK_Y, TRACK_LEN, trackPoint } from "./world";

/* ---------------------------------------------------------------------- */
/* tuning                                                                  */
/* ---------------------------------------------------------------------- */

/** Where the evening rests: golden hour, or night with the lights on. */
const REST: Record<PieceTheme, number> = { light: 19.72, dark: 22.55 };
/** The stage opens here and plays up to the rest. */
const INTRO_FROM: Record<PieceTheme, number> = { light: 18.25, dark: 20.2 };
/** The tile swings between these. */
const TILE_SWING: Record<PieceTheme, readonly [number, number]> = { light: [19.05, 20.75], dark: [22.05, 23.4] };
/** Under the mouse the tile glides here. */
const HOVER_HOUR: Record<PieceTheme, number> = { light: 20.15, dark: 22.9 };

const SPRING_DRAG = { stiffness: 260, damping: 31 };
const SPRING_GLIDE = { stiffness: 40, damping: 12.6 };
const SPRING_INTRO = { stiffness: 4.4, damping: 4.2 };
const SPRING_EYE = { stiffness: 36, damping: 11 };

/** If a machine can't hold the frame rate, the stage renders a step below. */
const RENDER_STEPS = [1, 0.8, 0.64] as const;

const KEY_STEP = 0.25;
/** How near the disc (CSS px) a press counts as grabbing the sun. */
const GRAB_RADIUS = 46;
/** A stage left alone sends a train now and then (seconds of a clear line). */
const AUTO_GAP = { stage: 16, tile: 3.2 } as const;

type Drag = {
  id: number;
  kind: "grab" | "press" | "scrub";
  pointer: string;
  x0: number;
  y0: number;
  hour0: number;
  /** recent (time, goal) samples for the release velocity */
  ts: Float64Array;
  hs: Float64Array;
  n: number;
};

type Live = {
  hour: Spring;
  goal: number;
  held: Spring;
  eyeX: Spring;
  eyeY: Spring;
  drag: Drag | null;
  timetable: Timetable;
  light: Light;
  view: View;
  frame: Frame;
  clock: number;
  drift: number;
  acc: number;
  tilePhase: number;
  hovering: boolean;
  lastInput: number;
  /** seconds the line has been clear (auto trains) */
  clear: number;
  introPending: boolean;
  parked: boolean;
  /** the tile's first train has been placed */
  started: boolean;
  renderStep: number;
  perf: { time: number; slow: number };
  scale: number;
  sun: { x: number; y: number };
  sunVisible: boolean;
  /** what the DOM shows now (syncDom writes only changes) */
  minute: number;
  phase: string;
  night: boolean;
  handleX: number;
  handleY: number;
  handleOn: boolean;
  theme: PieceTheme;
  reduced: boolean;
  scratch: Vec3;
};

function makeLive(mode: PieceMode, theme: PieceTheme, reduced: boolean): Live {
  const stage = mode === "stage";
  const start = reduced ? REST[theme] : stage ? INTRO_FROM[theme] : TILE_SWING[theme][0];
  const light = newLight();
  const view = newView();
  const timetable = new Timetable(stage ? 7 : 11);
  return {
    hour: new Spring(start, SPRING_GLIDE),
    goal: start,
    held: new Spring(0, { stiffness: 380, damping: 24 }),
    eyeX: new Spring(0, SPRING_EYE),
    eyeY: new Spring(0, SPRING_EYE),
    drag: null,
    timetable,
    light,
    view,
    frame: {
      viewProj: view.viewProj,
      invViewProj: view.invViewProj,
      eye: view.eye,
      light,
      timetable,
      time: 0,
      motion: reduced ? 0 : 1,
      drift: 37,
      sunScale: 1,
      windows: 0,
      trainGlow: 1,
      pixelAngle: 0.001,
      bloom: 0.5,
      grain: stage ? 0.022 : 0.014,
    },
    clock: 0,
    drift: 37,
    acc: 0,
    tilePhase: 0,
    hovering: false,
    lastInput: -10,
    clear: stage ? AUTO_GAP.stage - 0.7 : AUTO_GAP.tile - 0.4,
    introPending: stage && !reduced,
    parked: false,
    started: false,
    renderStep: 0,
    perf: { time: 0, slow: 0 },
    scale: 1,
    sun: { x: 0, y: 0 },
    sunVisible: false,
    minute: NaN,
    phase: "",
    night: sunElevation(start) < -1,
    handleX: NaN,
    handleY: NaN,
    handleOn: false,
    theme,
    reduced,
    scratch: [0, 0, 0],
  };
}

/** Rubber band: the further past the end, the less further it goes (hours). */
function rubber(over: number): number {
  const limit = 0.7;
  return (limit * over) / (limit + over);
}

/* ---------------------------------------------------------------------- */
/* the piece                                                               */
/* ---------------------------------------------------------------------- */

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [L] = useState(() => makeLive(mode, theme, reducedMotion));
  const rendererRef = useRef<TrainRenderer | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const valleyRef = useRef<Valley | null>(null);
  const heard = useRef(false);
  const hintId = useId();
  const fine = useFinePointer();
  const muted = useMuted();
  const [night, setNight] = useState(L.night);
  const [touched, setTouched] = useState(false);
  const [keyFocus, setKeyFocus] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [wide, setWide] = useState(true);
  const settings = useLatest({ active, muted, stage });

  /* -------------------------------------------------------------------- */
  /* sizes                                                                 */
  /* -------------------------------------------------------------------- */

  const applySize = useCallback(() => {
    const renderer = rendererRef.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || width < 2 || height < 2) return;
    const base = Math.min(dpr, stage ? 1.5 : 1.35);
    const scale = base * (stage ? RENDER_STEPS[L.renderStep] : 1);
    renderer.setSize(width * scale, height * scale);
    L.scale = renderer.width / width;
    if (stage) setWide(width >= 560);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* -------------------------------------------------------------------- */
  /* trains                                                                */
  /* -------------------------------------------------------------------- */

  /** Send the next train (or, in the still, bring it on in place). */
  const sendTrain = useCallback(
    (byHand: boolean) => {
      const T = L.timetable;
      if (L.reduced) {
        const dir = T.park();
        if (byHand) setAnnounce(dir > 0 ? "The next train stands on the viaduct, bound right." : "The next train stands on the viaduct, bound left.");
        latestWake.current();
        return;
      }
      const waiting = T.pending > 0 || T.visible;
      const dir = T.request();
      L.clear = 0;
      // the horn (silent until a gesture has started the sound)
      if (stage && heard.current) horn(dir > 0 ? -1 : 1, waiting ? 0.9 : 0.35);
      if (stage && byHand) {
        setAnnounce(
          waiting
            ? "Another train is on its way; it will follow when the line is clear."
            : dir > 0
              ? "A train is coming out of the tunnel on the left."
              : "A train is coming out of the tunnel on the right.",
        );
      }
      latestWake.current();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage],
  );

  /* -------------------------------------------------------------------- */
  /* sound                                                                 */
  /* -------------------------------------------------------------------- */

  const syncSound = useCallback(() => {
    const s = settings.current;
    const want = s.stage && heard.current && s.active && !s.muted;
    const valley = (valleyRef.current ??= new Valley());
    if (want) {
      const kit = getAudio();
      if (kit && kit.ctx.state !== "closed" && !valley.playing) valley.start(kit);
    } else if (valley.playing) {
      valley.stop();
    }
  }, [settings]);

  useEffect(() => {
    syncSound();
  }, [syncSound, active, muted]);

  useEffect(() => () => valleyRef.current?.stop(), []);

  /** A press or key on the stage: the first one may start the sound. */
  const gesture = () => {
    if (!stage) return;
    heard.current = true;
    ensureAudio();
    syncSound();
  };

  /** Wheel beats and rumble for this frame. */
  const soundFrame = (dt: number) => {
    const valley = valleyRef.current;
    const kit = getAudio();
    if (!stage || !valley?.playing || !kit) return;
    const T = L.timetable;
    const v = L.view;
    const p = L.scratch;
    const now = kit.ctx.currentTime;
    for (let i = 0; i < T.beatCount; i++) {
      const b = T.beats[i];
      trackPoint(b.s, 0, p, DECK_Y);
      const dist = Math.hypot(p[0] - v.eye[0], p[1] - v.eye[1], p[2] - v.eye[2]);
      const inside = b.s < 0 ? -b.s : b.s > TRACK_LEN ? b.s - TRACK_LEN : 0;
      const muffle = clamp(inside / 14);
      const level = clamp(95 / dist) * 0.85 * (1 - 0.75 * muffle);
      const pan = clamp((p[0] / 60) * 0.9, -0.9, 0.9);
      beat(now + 0.04 - (1 - b.frac) * dt, pan, level, muffle, b.lead);
    }
    // the rumble: nearest train out in the open
    let rumble = 0;
    let pan = 0;
    for (const t of T.trains) {
      if (!t.live) continue;
      const mid = t.head - t.dir * T.length(t) * 0.5;
      const out = clamp(Math.min(mid + 10, TRACK_LEN + 10 - mid) / 25);
      if (out <= rumble) continue;
      rumble = out;
      trackPoint(clamp(mid, 0, TRACK_LEN), 0, p);
      pan = clamp(p[0] / 55, -0.9, 0.9);
    }
    valley.update(rumble, pan, L.light.night);
  };

  /* -------------------------------------------------------------------- */
  /* the DOM: readout, slider value, the sun's handle                     */
  /* -------------------------------------------------------------------- */

  const syncDom = () => {
    if (!stage) return;
    const hour = L.drag ? L.goal : L.hour.value;
    const minute = Math.round(clamp(hour, HOUR_MIN, HOUR_MAX) * 60);
    if (minute !== L.minute) {
      L.minute = minute;
      const h = minute / 60;
      const text = clockText(h);
      const phase = phaseFor(sunElevation(h));
      if (timeRef.current) timeRef.current.textContent = text;
      if (phaseRef.current && phase !== L.phase) phaseRef.current.textContent = phase;
      L.phase = phase;
      const surface = surfaceRef.current;
      if (surface) {
        surface.setAttribute("aria-valuenow", h.toFixed(2));
        surface.setAttribute("aria-valuetext", `${text}, ${phase.toLowerCase()}`);
      }
    }
    const isNight = sunElevation(L.hour.value) < -1;
    if (isNight !== L.night) {
      L.night = isNight;
      setNight(isNight);
    }
    const handle = handleRef.current;
    if (handle) {
      const on = L.sunVisible;
      if (on !== L.handleOn) {
        L.handleOn = on;
        handle.style.visibility = on ? "visible" : "hidden";
      }
      const x = Math.round(L.sun.x * 4) / 4;
      const y = Math.round(L.sun.y * 4) / 4;
      if (on && (x !== L.handleX || y !== L.handleY)) {
        L.handleX = x;
        L.handleY = y;
        handle.style.transform = `translate3d(${x - 26}px, ${y - 26}px, 0)`;
      }
    }
  };

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
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!renderer || !canvas || width < 2 || height < 2) return false;
    const reduced = L.reduced;
    const T = L.timetable;
    const now = performance.now() / 1000;
    const trainsOut = T.visible || T.pending > 0;
    const idle = stage && !L.drag && now - L.lastInput > 4 && L.hour.settled && !trainsOut;

    // tiles, and a stage where nothing is happening, run at 30 fps
    if (!stage || idle) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }

    // a stage that runs slow for a sustained stretch renders a step smaller
    // (window.__labFullRes, set by screenshot scripts on software GL, keeps full size)
    const noStep = (window as unknown as { __labFullRes?: boolean }).__labFullRes === true;
    if (stage && !idle && !noStep && L.renderStep < RENDER_STEPS.length - 1) {
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

    if (!reduced) {
      L.clock += dt;
      L.drift += dt;
    }

    // the hour
    if (stage) {
      if (L.introPending) {
        L.introPending = false;
        L.hour.configure(SPRING_INTRO);
        L.goal = REST[L.theme];
        L.hour.to(L.goal);
      }
      if (reduced) L.hour.set(L.hour.target);
      else L.hour.step(dt);
      L.held.to(L.drag && L.drag.kind === "grab" ? 1 : 0);
      if (reduced) L.held.set(L.held.target);
      else L.held.step(dt);
    } else if (reduced) {
      L.hour.set(REST[L.theme]);
    } else if (L.hovering) {
      L.hour.configure(SPRING_GLIDE);
      L.hour.to(HOVER_HOUR[L.theme]);
      L.hour.step(dt);
    } else {
      // a slow swing between the two hours, eased at each end
      L.tilePhase += dt / 26;
      const [a, b] = TILE_SWING[L.theme];
      const k = 0.5 - 0.5 * Math.cos(L.tilePhase * Math.PI * 2);
      L.hour.configure(SPRING_GLIDE);
      L.hour.to(a + (b - a) * k);
      L.hour.step(dt);
    }

    // the eye drifts toward the resting mouse
    if (!reduced) {
      L.eyeX.step(dt);
      L.eyeY.step(dt);
    }

    // the trains
    if (reduced) {
      if (!L.parked) {
        T.park();
        L.parked = true;
      }
      T.step(0, true);
    } else {
      if (L.parked) {
        T.clear();
        L.parked = false;
      }
      // a tile opens with its first train already out on the viaduct
      if (!stage && !L.started) {
        L.started = true;
        T.request();
        T.step(4.4, false);
        L.clear = 0;
      }
      if (!T.busy) {
        L.clear += dt;
        const gap = stage ? AUTO_GAP.stage : AUTO_GAP.tile;
        if (L.clear > gap || (!stage && L.hovering && L.clear > 0.4)) sendTrain(false);
      }
      T.step(dt, false);
    }

    // the light, the camera
    const hour = L.hour.value;
    frameView(L.view, width, height, L.eyeX.value, L.eyeY.value, !stage);
    const light = lightAt(hour, L.light, L.view.sunScale);
    const f = L.frame;
    f.time = L.clock;
    f.drift = L.drift;
    f.motion = reduced ? 0 : 1;
    f.sunScale = 1 + 0.18 * L.held.value;
    f.windows = smoothstep(3.5, -7, light.el);
    f.trainGlow = (0.28 + 0.72 * light.dark) * 2.3;
    f.pixelAngle = (2 * L.view.vHalf) / Math.max(1, renderer.height);
    f.bloom = 0.32 + 0.4 * light.dark;
    renderer.draw(f, canvas.width, canvas.height, true);

    // where the sun is on screen (the handle sits over it)
    L.sunVisible = sunScreen(L.view, hour, L.sun) && light.el > -0.4 && L.sun.y > -20 && L.sun.y < height;
    soundFrame(dt);
    syncDom();

    if (reduced && !L.drag && L.hour.settled && L.held.settled) return false;
  });

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    attributes: { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: TrainRenderer | null = null;
      try {
        renderer = new TrainRenderer(gl, mode);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      applySize();
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => {
      applySize();
      wake();
    },
  });

  const latestWake = useLatest(wake);

  /* -------------------------------------------------------------------- */
  /* theme, reduced motion                                                 */
  /* -------------------------------------------------------------------- */

  const firstTheme = useRef(true);
  useEffect(() => {
    L.theme = theme;
    if (firstTheme.current) {
      firstTheme.current = false;
      wake();
      return;
    }
    // switching the site's theme plays the evening through (or back)
    if (stage) {
      L.introPending = false;
      L.hour.configure(SPRING_INTRO);
      L.goal = REST[theme];
      L.hour.to(L.goal);
    }
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    L.reduced = reducedMotion;
    if (reducedMotion) {
      L.introPending = false;
      if (!L.drag) L.hour.set(stage ? L.hour.target : REST[L.theme]);
    }
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const noteInput = () => {
    L.lastInput = performance.now() / 1000;
    if (!touched) setTouched(true);
    latestWake.current();
  };

  /** Where the sun is heading while a hand holds it (rubber banding past the ends). */
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

  /** Hours per second over the last ~80 ms of the drag (event times, so a slow frame doesn't skew it). */
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

  const pxPerHour = () => clamp(L.view.width * 0.115, 62, 150);

  const scrubHour = (drag: Drag, x: number, y: number) => {
    const dx = x - drag.x0;
    const dy = drag.pointer === "mouse" ? y - drag.y0 : 0;
    return drag.hour0 + (dx + dy * 0.6) / pxPerHour();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || !event.isPrimary || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    gesture();
    const { x, y } = local(event);
    const nearSun = L.sunVisible && Math.hypot(x - L.sun.x, y - L.sun.y) < GRAB_RADIUS;
    const drag: Drag = {
      id: event.pointerId,
      kind: nearSun ? "grab" : "press",
      pointer: event.pointerType,
      x0: x,
      y0: y,
      // from where the hour is right now: a gliding sun is caught mid-flight
      hour0: L.hour.value,
      ts: new Float64Array(8),
      hs: new Float64Array(8),
      n: 0,
    };
    L.drag = drag;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    if (nearSun) {
      aim(L.hour.value);
      surfaceRef.current?.setAttribute("data-dragging", "");
    }
    record(drag, L.goal, event.timeStamp);
    noteInput();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage) return;
    const { x, y } = local(event);
    const drag = L.drag;
    if (!drag) {
      // a resting mouse: the eye drifts a little, the cursor says what a press does
      if (event.pointerType === "mouse" && !L.reduced) {
        const w = L.view.width || 1;
        const h = L.view.height || 1;
        L.eyeX.to(clamp((x / w) * 2 - 1, -1, 1));
        L.eyeY.to(clamp(1 - (y / h) * 2, -1, 1));
        const overSun = L.sunVisible && Math.hypot(x - L.sun.x, y - L.sun.y) < GRAB_RADIUS;
        if (surfaceRef.current) surfaceRef.current.style.cursor = overSun ? "grab" : "pointer";
        latestWake.current();
      }
      return;
    }
    if (event.pointerId !== drag.id) return;
    if (drag.kind === "press") {
      const dx = x - drag.x0;
      const dy = y - drag.y0;
      const far = drag.pointer === "mouse" ? Math.hypot(dx, dy) > 6 : Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.1;
      if (!far) return;
      drag.kind = "scrub";
      drag.x0 = x;
      drag.y0 = y;
      drag.hour0 = L.hour.value;
      surfaceRef.current?.setAttribute("data-dragging", "");
    }
    if (drag.kind === "grab") {
      aim(hourNearest(L.view, x, y, HOUR_MIN - 1.2, HOUR_MAX + 1.2));
    } else {
      aim(scrubHour(drag, x, y));
    }
    if (surfaceRef.current) surfaceRef.current.style.cursor = "grabbing";
    record(drag, L.goal, event.timeStamp);
    noteInput();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = L.drag;
    if (!drag || event.pointerId !== drag.id) return;
    L.drag = null;
    surfaceRef.current?.removeAttribute("data-dragging");
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    if (surfaceRef.current) surfaceRef.current.style.cursor = fine ? "pointer" : "";
    if (drag.kind === "press") {
      // a click or a tap: the next train
      if (!cancelled) sendTrain(true);
      noteInput();
      return;
    }
    // carry on with the hand's speed, then settle inside the evening
    const v = cancelled || L.reduced ? 0 : releaseVelocity(drag, event.timeStamp);
    const fling = clamp(v, -9, 9);
    const projected = clamp(L.goal + fling * 0.2, HOUR_MIN, HOUR_MAX);
    L.goal = projected;
    L.hour.configure(SPRING_GLIDE);
    L.hour.to(projected, fling);
    setAnnounce(`${clockText(projected)}, ${phaseFor(sunElevation(projected)).toLowerCase()}`);
    noteInput();
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || L.drag) return;
    L.eyeX.to(0);
    L.eyeY.to(0);
    latestWake.current();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      gesture();
      sendTrain(true);
      noteInput();
      return;
    }
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
    gesture();
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
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || L.reduced) return;
      const r = canvas.getBoundingClientRect();
      L.eyeX.to(clamp(((event.clientX - r.left) / r.width) * 2 - 1, -1, 1) * 0.7);
      L.eyeY.to(clamp(1 - ((event.clientY - r.top) / r.height) * 2, -1, 1) * 0.7);
    };
    const leave = () => {
      L.hovering = false;
      L.eyeX.to(0);
      L.eyeY.to(0);
      latestWake.current();
    };
    canvas.addEventListener("pointerenter", enter);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    return () => {
      canvas.removeEventListener("pointerenter", enter);
      canvas.removeEventListener("pointermove", move);
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
      ? "← → move the hour · Shift for a whole hour · Enter sends a train"
      : "← → the hour · Enter sends a train"
    : fine
      ? "Drag the sky to change the time · click to send the next train"
      : "Drag sideways to change the time · tap to send a train";

  return (
    <div className="absolute inset-0 select-none">
      <div
        ref={surfaceRef}
        role="slider"
        tabIndex={0}
        aria-label="Time of day in the valley"
        aria-describedby={hintId}
        aria-orientation="horizontal"
        aria-valuemin={HOUR_MIN}
        aria-valuemax={HOUR_MAX}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        onFocus={(event) => setKeyFocus(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setKeyFocus(false)}
        className="group/surface absolute inset-0 touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]"
        style={{ cursor: fine ? "pointer" : undefined }}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />
        {/* a soft ring over the sun: it can be grabbed (a finger on it moves the sun, not the page) */}
        <div
          ref={handleRef}
          aria-hidden="true"
          className="absolute start-0 top-0 size-[52px] touch-none rounded-full will-change-transform"
          style={{ visibility: "hidden", cursor: "grab" }}
        >
          <span className="absolute inset-[7px] rounded-full opacity-0 shadow-[0_0_0_1.5px_rgb(255_255_255/0.55)] transition-[opacity,scale] duration-200 ease-out group-hover/surface:opacity-60 group-data-[dragging]/surface:scale-110 group-data-[dragging]/surface:opacity-90 group-focus-visible/surface:opacity-90" />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-[inset_0_0_0_2px_var(--foreground)] transition-opacity duration-150 group-focus-visible/surface:opacity-100"
        />
      </div>

      <p id={hintId} className="sr-only">
        A valley in the evening, seen from the river: a stone viaduct of eleven arches crosses it between two tunnels.
        The arrow keys move the time of day a quarter of an hour, with Shift or Page Up and Page Down a whole hour; Home
        and End go to the afternoon and to midnight. Enter or Space sends the next train across. With a mouse, drag the
        sun or the sky to change the time and click to send a train; on a touch screen, drag sideways and tap.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="bottom">
        <Tray label="Time and trains">
          <span className="flex h-10 items-center gap-2 ps-2.5 pe-2 text-[13px]" aria-hidden="true">
            <span className="text-secondary">{night ? <MoonIcon size={15} /> : <SunIcon size={15} />}</span>
            <span ref={timeRef} className="w-[38px] font-medium text-primary tabular-nums" />
            <span ref={phaseRef} className={cn("whitespace-nowrap text-secondary", wide ? "w-[82px]" : "w-[74px]")} />
          </span>
          <TrayDivider />
          <TrayButton
            icon={<TrainIcon />}
            aria-label="Send a train"
            onClick={() => {
              gesture();
              sendTrain(true);
              noteInput();
            }}
          >
            {wide ? "Send a train" : "Train"}
          </TrayButton>
          <TrayDivider />
          <MuteButton />
        </Tray>
        {/* on a frosted pill: the hint sits over the water's glitter */}
        <StageHint
          className={cn(
            "rounded-full bg-[color-mix(in_oklab,var(--float)_74%,transparent)] px-2.5 py-0.5 text-secondary backdrop-blur-md",
            !touched || keyFocus ? "transition-opacity duration-300" : "opacity-0 transition-opacity duration-700",
          )}
        >
          {hint}
        </StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat drawing of the scene for browsers without WebGL2: sky, hills, the viaduct, a train, the river. */
function Fallback({ mode, theme }: { mode: PieceMode; theme: PieceTheme }) {
  const dark = theme === "dark";
  const c = dark
    ? { top: "#0a0f22", low: "#29304f", far: "#151a2e", hill: "#0b0e18", stone: "#1d2030", water: "#0c1020", body: "#0d1430", win: "#ffc56e" }
    : { top: "#6d8cc0", low: "#f3b37a", far: "#9a8aa0", hill: "#3a4232", stone: "#8c8174", water: "#a88e7c", body: "#1b2648", win: "#e7b46a" };
  // nine arches between x 12 and 188; deck from y 44, the water at 78
  const x0 = 12;
  const span = (188 - x0) / 9;
  const r = (span - 3.6) / 2;
  let openings = "";
  for (let i = 0; i < 9; i++) {
    const a = x0 + i * span + 1.8;
    const b = a + 2 * r;
    openings += `M${a.toFixed(2)} 78V${(50 + r).toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${b.toFixed(2)} ${(50 + r).toFixed(2)}V78Z`;
  }
  const viaduct = `M${x0} 44H188V78H${x0}Z${openings}`;
  const cars = [0, 1, 2, 3, 4];
  return (
    <svg
      role={mode === "stage" ? "img" : undefined}
      aria-label={mode === "stage" ? "A stone viaduct across a valley at evening, a train crossing it" : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="absolute inset-0 size-full"
      viewBox="0 0 200 120"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="nt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.top} />
          <stop offset="0.65" stopColor={c.low} />
        </linearGradient>
        <linearGradient id="nt-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.low} stopOpacity={dark ? 0.35 : 0.55} />
          <stop offset="1" stopColor={c.water} />
        </linearGradient>
      </defs>
      <rect width="200" height="78" fill="url(#nt-sky)" />
      {dark ? (
        <path d="M58 20a4.5 4.5 0 1 0 4.2 6.1A3.6 3.6 0 0 1 58 20Z" fill="#f2ead8" />
      ) : (
        <>
          <circle cx="100" cy="58.5" r="9" fill="#ffd9a0" opacity="0.35" />
          <circle cx="100" cy="58.5" r="4" fill="#fff4dc" />
        </>
      )}
      <path d="M0 64 L40 50 L70 58 L90 64.5 L110 64.5 L132 52 L170 46 L200 54 V78 H0 Z" fill={c.far} opacity="0.7" />
      <path d="M0 44 L22 52 L34 70 L44 78 H0 Z M200 40 L178 50 L166 70 L156 78 H200 Z" fill={c.hill} />
      <g>
        <path d={viaduct} fill={c.stone} fillRule="evenodd" />
        <rect x={x0 - 1} y="43" width={178} height="1.6" fill={c.stone} />
        {cars.map((i) => (
          <g key={i}>
            <rect x={58 + i * 17} y={38.6} width={16} height={4.6} rx={1} fill={c.body} />
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <rect key={j} x={59.6 + i * 17 + j * 2.4} y={39.7} width={1.5} height={1.5} rx={0.2} fill={c.win} opacity={dark ? 1 : 0.55} />
            ))}
          </g>
        ))}
      </g>
      <rect y="78" width="200" height="42" fill="url(#nt-water)" />
      <g transform="translate(0 156) scale(1 -1)" opacity={dark ? 0.32 : 0.25}>
        <path d={viaduct} fill={c.stone} fillRule="evenodd" />
        {dark ? cars.map((i) => <rect key={i} x={59 + i * 17} y={39.6} width={14} height={1.5} fill={c.win} />) : null}
      </g>
    </svg>
  );
}
