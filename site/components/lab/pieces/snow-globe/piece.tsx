"use client";

// Snow globe: a glass globe on a turned walnut base, with a log cabin and a
// few pines inside. Pick it up and shake it.
//
// The look
// - A product shot: the globe sits on the stage's own surface (the floor
//   is the stage colour, so it meets the card's edge seamlessly) with a
//   tight contact shadow under the foot and a pale, soft shadow from the
//   glass. The studio it reflects has a softbox up to the left, a strip
//   light behind on the right and two black flags at the sides, so the
//   glass shows a curved window highlight, a thin bright rim and dark
//   edges that draw its shape.
// - The glass is 4.5% thick and full of water: every pixel's ray is bent
//   going in (air → glass → water) and coming out, so the cabin is
//   magnified and swims toward the rim like it does in a real globe, and
//   the thin rim where light passes through glass alone shows greenish.
// - Inside (ray-marched distance fields): a snow dome with drifts, a log
//   cabin turned three-quarters to us (round logs, snow on the roof, a
//   stone chimney, two windows and a door, a trodden path), five pines
//   with scalloped tiers and snow on their boughs, and a sky painted on
//   the back of the glass (mountains, a band of forest; a moon and stars
//   at night). Daylight in the light theme; in the dark theme it is night,
//   moonlit, and the cabin's windows flicker on and glow: they light the
//   snow in front, the flakes drifting past, and hang a warm haze in the
//   water.
// - Snow: 1500 flakes on the stage (550 on a tile): small ones, big soft
//   ones, and glitter that turns and flashes. Each flake is drawn where it
//   would appear through the glass (solved per flake on the GPU), hidden
//   behind the cabin and trees, and flakes off the focal plane open into
//   soft discs, so it reads like a macro photograph.
//
// The motion model (globe.ts, snow.ts)
// - Grab anywhere on the stage and the globe is in your hand: a stiff,
//   critically damped spring carries it after the pointer (a frame or two
//   of weight, never a jump), rubber-banding past its reach. Its tilt is
//   three damped pendulums driven by the hand's acceleration: the top
//   trails, it twists, it nods, and the wobble rings out after you stop.
//   Grab it mid-wobble or mid-fall and it is caught where it is.
// - Let go: the hand's velocity over the last 80 ms is handed to a softer
//   spring that sets it back down in the middle of the table. It lands
//   with a small bounce and a wooden thunk (louder for a harder landing)
//   and, on the table, rocks on the rim of its foot.
// - The water is simulated (snow.ts): it keeps its spin while the glass
//   turns under it, rolls through the middle on a push, and churns in
//   proportion to the shake; the flakes lag behind the water, sink along
//   the globe's own down, flutter, and settle on the snow, the roof and
//   the boughs until the next shake lifts them again.
// - The "wow" second: a quick shake. The globe swings and twists, a
//   blizzard boils up through the water, the cabin swims in the lens, and
//   then the snow swirls on long after the globe has come to rest.
// - Keyboard: the globe is a button. Space or Enter shakes it, ← → tip it
//   on the table, ↑ lifts it and lets it drop, L switches the cabin light.
// - Sound (stage, after a gesture, lab mute respected): the water swishes
//   with the churn, the base thunks on the table, the light switch clicks.
// - Tile: a gentle shake every ten seconds or so (and one on hover), the
//   snow falling in between. 30 fps, no sound, no controls.
// - Lifetime: the expensive pass (the globe, the base, the floor) is drawn
//   only when the globe or the light changed; a still globe redraws only
//   its snow. The stage steps its internal resolution down if a machine
//   can't keep up, runs at 30 fps when idle and sleeps once everything has
//   settled. Nothing allocates per frame; the WebGL context is handed back
//   on unmount (useWebGL2).
// - Reduced motion: a still globe with snow hanging in the water; a shake
//   (button, key or press) lays out a new still arrangement, and the light
//   switches without flickering.
//
// Files: scene.ts (geometry, camera, height field, tone), globe.ts (the
// rigid body), snow.ts (water and flakes), shaders.ts + renderer.ts
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
import { ensureAudio } from "../../audio";
import { clamp, damp, useFinePointer, useFrame, useLatest, useWebGL2 } from "../../hooks";
import type { PieceProps, PieceTheme } from "../../types";
import { IconButton, MuteButton, StageControls, StageHint, Tray, TrayButton, TrayDivider } from "../../ui";
import { Globe, SHAKES } from "./globe";
import { ShakeIcon, WindowIcon } from "./icons";
import { GlobeRenderer, newFrame, type Frame } from "./renderer";
import { BASE, FLOOR_Y, KEY, PIVOT, layoutFor, newLayout, project, toLinear, untone, type Layout, type Vec3 } from "./scene";
import { Snow } from "./snow";
import { click, thunk, Water } from "./sound";

/* ---------------------------------------------------------------------- */
/* tuning                                                                  */
/* ---------------------------------------------------------------------- */

const FLAKES = { stage: 1500, tile: 550 } as const;

/** If a machine can't hold the frame rate, the stage renders a step below (×). */
const RENDER_STEPS = [1, 0.8, 0.64, 0.5] as const;

/** The tile shakes itself every this many seconds (a little random). */
const TILE_EVERY = 10;

/** Seconds from turning dark to the cabin's light catching. */
const WINDOW_DELAY = 0.55;

/** The window catching: nothing, a flash, a dip, a second catch, then a warm rise. */
function ignition(t: number): number {
  if (t < 0) return 0;
  if (t < 0.04) return 0;
  if (t < 0.09) return 0.75;
  if (t < 0.16) return 0.08;
  if (t < 0.21) return 0.55;
  if (t < 0.27) return 0.2;
  return 1 - 0.8 * Math.exp(-(t - 0.27) / 0.12);
}

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

type Drag = {
  id: number;
  x0: number;
  y0: number;
  gx: number;
  gy: number;
  /** Recent (time, hand x, hand y) for the release velocity. */
  ts: Float64Array;
  xs: Float64Array;
  ys: Float64Array;
  n: number;
};

type Live = {
  globe: Globe;
  snow: Snow;
  frame: Frame;
  layout: Layout;
  water: Water;
  theme: PieceTheme;
  reduced: boolean;
  stage: boolean;
  /** 0 day … 1 night, eased. */
  night: number;
  winOn: boolean;
  winT: number;
  winLevel: number;
  flicker: number;
  flickerT: number;
  bg: Vec3;
  bgHover: Vec3;
  hovering: boolean;
  hover: number;
  clock: number;
  acc: number;
  renderStep: number;
  perf: { time: number; slow: number };
  k: number;
  sig: Float32Array;
  sceneDirty: boolean;
  drag: Drag | null;
  lastInput: number;
  tileNext: number;
  /** Object-frame scratch vectors. */
  down: Vec3;
  accO: Vec3;
  wO: Vec3;
  /** Hand's offset from the globe's centre on screen, for the hover lean. */
  leanX: number;
  flakesDirty: boolean;
};

function makeLive(theme: PieceTheme, reduced: boolean, stage: boolean): Live {
  const snow = new Snow(stage ? FLAKES.stage : FLAKES.tile, stage ? 0x5a0b : 0x71e);
  if (reduced) snow.scatter(0.42, 0.82);
  else {
    // open on snow already falling, still turning from the last shake
    snow.scatter(0.22, 0.92);
    snow.stir(stage ? 0.9 : 0.6, 0.3);
  }
  const dark = theme === "dark";
  const frame = newFrame();
  return {
    globe: new Globe(),
    snow,
    frame,
    layout: newLayout(),
    water: new Water(),
    theme,
    reduced,
    stage,
    night: dark ? 1 : 0,
    winOn: dark,
    winT: dark ? (reduced ? 10 : -WINDOW_DELAY) : 10,
    winLevel: dark && reduced ? 1 : 0,
    flicker: 1,
    flickerT: 0,
    bg: dark ? [0.055, 0.02, 0.024] : [0.949, 0.949, 0.949],
    bgHover: dark ? [0.03, 0.012, 0.012] : [0.922, 0.922, 0.922],
    hovering: false,
    hover: 0,
    clock: 0,
    acc: 0,
    renderStep: 0,
    perf: { time: 0, slow: 0 },
    k: 1,
    sig: new Float32Array(20).fill(NaN),
    sceneDirty: true,
    drag: null,
    lastInput: -10,
    tileNext: 1.4,
    down: [0, -1, 0],
    accO: [0, 0, 0],
    wO: [0, 0, 0],
    leanX: 0,
    flakesDirty: true,
  };
}

export default function Piece(props: PieceProps) {
  return <SnowGlobe {...props} />;
}

function SnowGlobe({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [live] = useState(() => makeLive(theme, reducedMotion, stage));
  const L = live;
  const rendererRef = useRef<GlobeRenderer | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const hintId = useId();
  const [grip, setGrip] = useState<{ x: number; y: number; w: number; h: number; r: number } | null>(null);
  const [winOn, setWinOn] = useState(L.winOn);
  const [touched, setTouched] = useState(false);
  const [keyFocus, setKeyFocus] = useState(false);

  const bottomFor = (width: number) => (width < 560 ? 92 : 104);

  /* -------------------------------------------------------------------- */
  /* sizes                                                                 */
  /* -------------------------------------------------------------------- */

  const applySize = useCallback(() => {
    const renderer = rendererRef.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || width < 2 || height < 2) return;
    const base = Math.min(dpr, 1.5);
    const scale = base * (stage ? RENDER_STEPS[L.renderStep] : 1);
    renderer.setSize(width * scale, height * scale);
    L.k = renderer.width / width;
    layoutFor(width, height, stage, bottomFor(width), L.layout);
    L.sceneDirty = true;
    if (stage) {
      // the grip: the globe and its base at rest (touch drags here never scroll the page)
      const c = { x: 0, y: 0 };
      const b = { x: 0, y: 0 };
      project([0, 0, 0], L.layout, c);
      project([0, FLOOR_Y, BASE.footR], L.layout, b);
      const r = L.layout.ppu * 1.04;
      setGrip((prev) => {
        const next = { x: c.x - r, y: c.y - r, w: r * 2, h: b.y - (c.y - r), r };
        return prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5 && Math.abs(prev.w - next.w) < 0.5 && Math.abs(prev.h - next.h) < 0.5
          ? prev
          : next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  /* -------------------------------------------------------------------- */
  /* the cabin's light                                                     */
  /* -------------------------------------------------------------------- */

  const switchWindow = useCallback(
    (on: boolean, delay: number, sound: boolean) => {
      if (L.winOn === on && !(on && L.winT < 0)) return;
      L.winOn = on;
      L.winT = on ? -delay : 0;
      setWinOn(on);
      if (sound && stage) click(on);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage],
  );

  /* -------------------------------------------------------------------- */
  /* drawing                                                               */
  /* -------------------------------------------------------------------- */

  const fillFrame = () => {
    const { height } = sizeRef.current;
    const f = L.frame;
    const lay = L.layout;
    const g = L.globe;
    const k = L.k;
    const m = g.rot;
    f.centerX = lay.cx * k;
    f.centerY = (height - lay.cy) * k;
    f.focal = lay.focal * k;
    f.cam = lay.cam;
    f.fwd = lay.fwd;
    f.right = lay.right;
    f.up = lay.up;
    f.rot = m;
    f.offset = g.offset;
    f.key = KEY;
    // object-space: key light and camera (Rᵀ)
    f.keyO[0] = m[0] * KEY[0] + m[1] * KEY[1] + m[2] * KEY[2];
    f.keyO[1] = m[3] * KEY[0] + m[4] * KEY[1] + m[5] * KEY[2];
    f.keyO[2] = m[6] * KEY[0] + m[7] * KEY[1] + m[8] * KEY[2];
    const cx = lay.cam[0] - PIVOT[0] - g.offset[0];
    const cy = lay.cam[1] - PIVOT[1] - g.offset[1];
    const cz = lay.cam[2] - PIVOT[2] - g.offset[2];
    f.camO[0] = m[0] * cx + m[1] * cy + m[2] * cz + PIVOT[0];
    f.camO[1] = m[3] * cx + m[4] * cy + m[5] * cz + PIVOT[1];
    f.camO[2] = m[6] * cx + m[7] * cy + m[8] * cz + PIVOT[2];
    // the stage colour, as the value that comes out of the tone curve as itself
    const hover = L.hover;
    for (let c = 0; c < 3; c++) f.bg[c] = untone(toLinear(L.bg[c] + (L.bgHover[c] - L.bg[c]) * hover));
    f.night = L.night;
    f.dark = L.night;
    f.win = L.winLevel * L.flicker;
    // world: the foot's underside, the globe's centre, the base's up axis
    const up = g.up;
    const depth = PIVOT[1] - FLOOR_Y;
    f.foot[0] = PIVOT[0] + g.offset[0] - depth * up[0];
    f.foot[1] = PIVOT[1] + g.offset[1] - depth * up[1];
    f.foot[2] = PIVOT[2] + g.offset[2] - depth * up[2];
    f.globe[0] = PIVOT[0] + g.offset[0] - PIVOT[1] * up[0];
    f.globe[1] = PIVOT[1] + g.offset[1] - PIVOT[1] * up[1];
    f.globe[2] = PIVOT[2] + g.offset[2] - PIVOT[1] * up[2];
    f.footUp = up;
    f.time = L.clock;
    f.stir = L.snow.activity;
    const gx = f.globe[0] - lay.cam[0];
    const gy = f.globe[1] - lay.cam[1];
    const gz = f.globe[2] - lay.cam[2];
    f.focus = Math.hypot(gx, gy, gz) - 0.15;
    f.dof = (stage ? 0.024 : 0.012) * lay.ppu * k;
    f.minPx = (stage ? 0.8 : 0.75) * k;
    f.flakes = L.snow.count;
  };

  /** True when the globe, the light or the size changed since the scene pass last ran. */
  const sceneChanged = (): boolean => {
    const f = L.frame;
    const s = L.sig;
    let changed = L.sceneDirty;
    const put = (i: number, v: number) => {
      if (!(Math.abs(s[i] - v) < 1e-5)) {
        s[i] = v;
        changed = true;
      }
    };
    for (let i = 0; i < 9; i++) put(i, f.rot[i]);
    put(9, f.offset[0]);
    put(10, f.offset[1]);
    put(11, f.night);
    put(12, f.win);
    put(13, f.bg[0]);
    put(14, f.bg[1]);
    put(15, f.bg[2]);
    L.sceneDirty = false;
    return changed;
  };

  const paint = (): boolean => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!renderer || !canvas || width < 2 || height < 2) return false;
    fillFrame();
    if (sceneChanged()) renderer.drawScene(L.frame);
    if (L.flakesDirty) {
      renderer.setFlakes(L.snow.pos, L.snow.count);
      L.flakesDirty = !!L.reduced ? false : true;
    }
    renderer.drawFrame(L.frame, canvas.width, canvas.height);
    return true;
  };

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const { width } = sizeRef.current;
    if (!renderer || width < 2) return false;
    const reduced = L.reduced;
    const g = L.globe;
    const snow = L.snow;
    const now = performance.now() / 1000;
    const idle =
      !L.drag && !g.scripted && g.settled && snow.activity < 0.05 && now - L.lastInput > 2 && L.winT > 1.5 && Math.abs(L.night - (L.theme === "dark" ? 1 : 0)) < 1e-3;

    // tiles (and an idle stage) run at 30 fps
    if (!stage || idle) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }
    L.clock += dt;

    // a stage that keeps running slow renders a step smaller
    if (stage && !idle && L.renderStep < RENDER_STEPS.length - 1) {
      const perf = L.perf;
      perf.time += dt;
      if (dt > 1 / 40) perf.slow += dt;
      if (perf.time >= 1.5) {
        if (perf.slow > perf.time * 0.7) {
          L.renderStep += 1;
          applySize();
        }
        perf.time = 0;
        perf.slow = 0;
      }
    }

    // the tile shakes itself now and then
    if (!stage && !reduced) {
      L.hover = damp(L.hover, L.hovering ? 1 : 0, 10, dt);
      L.tileNext -= dt;
      if (L.tileNext <= 0 && !g.scripted) {
        g.play(SHAKES.tile);
        L.tileNext = TILE_EVERY * (0.85 + Math.random() * 0.3);
      }
    } else if (!stage) {
      L.hover = L.hovering ? 1 : 0;
    }

    // the globe and the water
    if (!reduced) {
      if (stage && !L.drag && fine) g.lean = clamp(-L.leanX * 0.012, -0.016, 0.016);
      else g.lean = 0;
      g.step(dt);
      const m = g.rot;
      // the globe's down, acceleration and turning, in its own frame (Rᵀ)
      L.down[0] = -m[1];
      L.down[1] = -m[4];
      L.down[2] = -m[7];
      const ax = g.ax;
      const ay = g.ay;
      L.accO[0] = m[0] * ax + m[1] * ay;
      L.accO[1] = m[3] * ax + m[4] * ay;
      L.accO[2] = m[6] * ax + m[7] * ay;
      const w = g.omega;
      L.wO[0] = m[0] * w[0] + m[1] * w[1] + m[2] * w[2];
      L.wO[1] = m[3] * w[0] + m[4] * w[1] + m[5] * w[2];
      L.wO[2] = m[6] * w[0] + m[7] * w[1] + m[8] * w[2];
      snow.step(dt, L.down, L.accO, L.wO);
      L.flakesDirty = true;
      if (stage && g.impact > 0.5) {
        const pan = (L.layout.cx + g.offset[0] * L.layout.ppu) / Math.max(1, width) * 2 - 1;
        thunk(g.impact, pan);
      }
    }

    // day and night follow the theme; the cabin's light catches after dark
    const nightTarget = L.theme === "dark" ? 1 : 0;
    L.night = reduced ? nightTarget : damp(L.night, nightTarget, 3.2, dt);
    if (Math.abs(L.night - nightTarget) < 1e-3) L.night = nightTarget;
    L.winT += dt;
    if (reduced) {
      L.winLevel = L.winOn ? 1 : 0;
      L.flicker = 1;
    } else {
      if (L.winOn) L.winLevel = ignition(L.winT);
      else {
        L.winLevel *= Math.exp(-dt / 0.14);
        if (L.winLevel < 0.003) L.winLevel = 0;
      }
      // a fire inside: the light breathes a little, a dozen times a second
      L.flickerT -= dt;
      if (L.winOn && L.winT > 1.2 && L.flickerT <= 0) {
        L.flickerT = 1 / 12;
        const t = L.clock;
        L.flicker = 0.94 + 0.04 * Math.sin(t * 7.1) * Math.sin(t * 2.3 + 1) + 0.03 * Math.sin(t * 17.3 + Math.sin(t * 3.1));
      }
    }

    if (stage) L.water.update(reduced ? 0 : snow.activity, dt);

    paint();

    // sleep once everything has come to rest
    if (reduced && !L.drag && L.hover % 1 === 0 && Math.abs(L.night - nightTarget) < 1e-3 && L.winLevel % 1 === 0) return false;
    if (stage && idle && snow.free === 0 && !(L.winOn && L.winLevel > 0)) return false;
  });

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    attributes: { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: GlobeRenderer | null = null;
      try {
        renderer = new GlobeRenderer(gl, mode, L.snow.count);
      } catch (error) {
        console.error(error);
        return;
      }
      renderer.setAttributes(L.snow.attr);
      rendererRef.current = renderer;
      L.sceneDirty = true;
      L.flakesDirty = true;
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
      L.flakesDirty = true;
      paint();
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
    L.sceneDirty = true;
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
    // the light follows the evening: on a little after dark, off with the day
    switchWindow(theme === "dark", L.reduced ? 0 : WINDOW_DELAY, false);
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // the palette (a second dark palette) can change without the theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      readColours();
      latestWake.current();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "style"] });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    L.reduced = reducedMotion;
    L.flakesDirty = true;
    if (reducedMotion) {
      L.snow.scatter(0.42, 0.82);
      L.globe.release(0, 0);
    }
    wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    const water = L.water;
    return () => water.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active) L.water.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const latestWake = useLatest(wake);
  const noteInput = () => {
    L.lastInput = performance.now() / 1000;
    if (!touched) setTouched(true);
    latestWake.current();
  };

  /** A shake from the button or the keyboard (a new still arrangement under reduced motion). */
  const shake = () => {
    ensureAudio();
    if (L.reduced) {
      L.snow.scatter(0.42, 0.82);
      L.flakesDirty = true;
    } else {
      L.globe.play(SHAKES.hand);
    }
    noteInput();
  };

  const local = (event: ReactPointerEvent) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const record = (drag: Drag, x: number, y: number, at: number) => {
    const i = drag.n % drag.ts.length;
    drag.ts[i] = at / 1000;
    drag.xs[i] = x;
    drag.ys[i] = y;
    drag.n += 1;
  };

  /** The hand's velocity over the last ~80 ms (world units / s), from event times. */
  const releaseVelocity = (drag: Drag, upAt: number): [number, number] => {
    const size = drag.ts.length;
    if (drag.n < 2) return [0, 0];
    const last = (drag.n - 1) % size;
    const tEnd = drag.ts[last];
    if (upAt / 1000 - tEnd > 0.09) return [0, 0];
    let first = last;
    for (let j = 1; j < Math.min(drag.n, size); j++) {
      const idx = (drag.n - 1 - j) % size;
      first = idx;
      if (tEnd - drag.ts[idx] > 0.08) break;
    }
    const span = tEnd - drag.ts[first];
    if (span < 0.012) return [0, 0];
    return [(drag.xs[last] - drag.xs[first]) / span, (drag.ys[last] - drag.ys[first]) / span];
  };

  const handAt = (drag: Drag, x: number, y: number): [number, number] => {
    const ppu = Math.max(1, L.layout.ppu);
    return [drag.gx + (x - drag.x0) / ppu, drag.gy - (y - drag.y0) / ppu];
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || !event.isPrimary || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    ensureAudio();
    const { x, y } = local(event);
    const g = L.globe;
    if (L.reduced) {
      L.drag = null;
      noteInput();
      return;
    }
    // caught wherever it is, moving or not
    g.grab();
    const drag: Drag = {
      id: event.pointerId,
      x0: x,
      y0: y,
      gx: g.x,
      gy: g.y,
      ts: new Float64Array(10),
      xs: new Float64Array(10),
      ys: new Float64Array(10),
      n: 0,
    };
    L.drag = drag;
    record(drag, g.x, g.y, event.timeStamp);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    if (surfaceRef.current) surfaceRef.current.style.cursor = "grabbing";
    noteInput();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage) return;
    const drag = L.drag;
    const { x, y } = local(event);
    if (!drag) {
      L.leanX = (x - L.layout.cx) / Math.max(1, L.layout.ppu);
      if (fine) latestWake.current();
      return;
    }
    if (event.pointerId !== drag.id) return;
    const [hx, hy] = handAt(drag, x, y);
    L.globe.setHand(hx, hy);
    record(drag, hx, hy, event.timeStamp);
    noteInput();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (L.reduced && stage && !cancelled && !L.drag) {
      // reduced motion: a press is a shake, shown as a new still arrangement
      shake();
      return;
    }
    const drag = L.drag;
    if (!drag || event.pointerId !== drag.id) return;
    L.drag = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    if (surfaceRef.current) surfaceRef.current.style.cursor = fine ? "grab" : "";
    const [vx, vy] = cancelled ? [0, 0] : releaseVelocity(drag, event.timeStamp);
    L.globe.release(vx, vy);
    noteInput();
  };

  const onPointerLeave = () => {
    L.leanX = 0;
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const g = L.globe;
    switch (event.key) {
      case " ":
      case "Enter":
        event.preventDefault();
        if (!event.repeat) shake();
        return;
      case "ArrowLeft":
      case "ArrowRight":
        event.preventDefault();
        ensureAudio();
        if (L.reduced) shake();
        else if (!L.drag) g.nudge(event.key === "ArrowLeft" ? -1 : 1);
        noteInput();
        return;
      case "ArrowUp":
        event.preventDefault();
        ensureAudio();
        if (L.reduced) shake();
        else if (!L.drag && !g.scripted) g.play(SHAKES.hop);
        noteInput();
        return;
      case "l":
      case "L":
        event.preventDefault();
        ensureAudio();
        switchWindow(!L.winOn, 0, true);
        noteInput();
        return;
      default:
    }
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
      // a little shake to say hello, if it isn't already moving
      if (!L.reduced && !L.globe.scripted && L.globe.settled) {
        L.globe.play(SHAKES.tile);
        L.tileNext = TILE_EVERY;
      }
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
    ? "Space shakes it · ← → tip it · ↑ lifts it · L for the light"
    : fine
      ? "Pick up the globe and shake it · Space shakes it"
      : "Drag the globe to shake it";

  return (
    <div className="absolute inset-0 select-none">
      <div
        ref={surfaceRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
        onPointerLeave={onPointerLeave}
        className="absolute inset-0 touch-pan-y [-webkit-tap-highlight-color:transparent]"
        style={{ cursor: fine ? "grab" : undefined }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 block size-full"
        />
        {grip ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={`Snow globe with a cabin in the pines${winOn ? ", its window lit" : ""}. Press to shake it.`}
            aria-describedby={hintId}
            onKeyDown={onKeyDown}
            onFocus={(event) => setKeyFocus(event.currentTarget.matches(":focus-visible"))}
            onBlur={() => setKeyFocus(false)}
            className="absolute touch-none rounded-[999px] outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]"
            style={{ left: grip.x, top: grip.y, width: grip.w, height: grip.h, borderRadius: `${grip.r}px ${grip.r}px ${grip.r * 0.6}px ${grip.r * 0.6}px` }}
          />
        ) : null}
      </div>

      <p id={hintId} className="sr-only">
        A glass snow globe on a wooden base, with a log cabin and pine trees inside. Space or Enter shakes it, the left
        and right arrow keys tip it on the table, the up arrow lifts it and lets it drop, and L switches the light in the
        cabin.
      </p>

      <StageControls placement="bottom">
        <Tray label="Snow globe">
          <TrayButton icon={<ShakeIcon size={15} />} onClick={shake}>
            Shake
          </TrayButton>
          <TrayDivider />
          <IconButton
            label="Cabin light"
            pressed={winOn}
            onClick={() => {
              ensureAudio();
              switchWindow(!L.winOn, 0, true);
              noteInput();
            }}
          >
            <WindowIcon size={16} />
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

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat drawing of the globe for browsers without WebGL2. */
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
      const layout = layoutFor(rect.width, rect.height, mode === "stage", mode === "stage" ? 104 : 0, newLayout());
      const dark = theme === "dark";
      const p = { x: 0, y: 0 };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      project([0, 0, 0], layout, p);
      const cx = p.x;
      const cy = p.y;
      const r = layout.ppu;
      // base
      const top = { x: 0, y: 0 };
      const bottom = { x: 0, y: 0 };
      project([0, BASE.collarY1, BASE.collarR], layout, top);
      project([0, FLOOR_Y, BASE.footR], layout, bottom);
      const wood = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
      wood.addColorStop(0, dark ? "#1b0f09" : "#3a2414");
      wood.addColorStop(0.4, dark ? "#3a2213" : "#6a4226");
      wood.addColorStop(1, dark ? "#120a06" : "#2a190e");
      ctx.fillStyle = wood;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.72, top.y);
      ctx.lineTo(cx + r * 0.72, top.y);
      ctx.lineTo(cx + r * 0.94, bottom.y);
      ctx.lineTo(cx - r * 0.94, bottom.y);
      ctx.closePath();
      ctx.fill();
      // globe
      const sky = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      sky.addColorStop(0, dark ? "#0b1430" : "#8fb2e6");
      sky.addColorStop(0.6, dark ? "#1a2550" : "#dfe8f5");
      ctx.fillStyle = sky;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.97, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = dark ? "#c9d3ea" : "#f6f8fc";
      ctx.fillRect(cx - r, cy + r * 0.45, r * 2, r);
      // cabin and pines
      ctx.fillStyle = dark ? "#2a160c" : "#4a2a17";
      ctx.fillRect(cx - r * 0.2, cy + r * 0.2, r * 0.4, r * 0.25);
      ctx.fillStyle = dark ? "#e8edf8" : "#ffffff";
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.27, cy + r * 0.22);
      ctx.lineTo(cx, cy + r * 0.02);
      ctx.lineTo(cx + r * 0.27, cy + r * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = dark ? "#ffb35c" : "#1b2230";
      ctx.fillRect(cx - r * 0.12, cy + r * 0.27, r * 0.08, r * 0.07);
      ctx.fillStyle = dark ? "#0d2a1a" : "#1d4a2e";
      for (const [tx, h] of [[-0.55, 0.62], [0.5, 0.56], [0.45, 0.32]] as const) {
        ctx.beginPath();
        ctx.moveTo(cx + tx * r - r * 0.17, cy + r * 0.48);
        ctx.lineTo(cx + tx * r, cy + r * (0.48 - h));
        ctx.lineTo(cx + tx * r + r * 0.17, cy + r * 0.48);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      // highlight
      ctx.strokeStyle = dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.7)";
      ctx.lineWidth = Math.max(1, r * 0.04);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.82, Math.PI * 1.08, Math.PI * 1.38);
      ctx.stroke();
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
      aria-label={mode === "stage" ? "A snow globe with a cabin in the pines" : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="absolute inset-0 block size-full"
    />
  );
}
