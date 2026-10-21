"use client";

// Last light: a small dithered print of a lighthouse on a headland, from
// afternoon to night under the sun you move.
//
// The look (what each part is for)
// - Object: a print in a mat, hung on the grey stage like the other
//   objects in the lab. Warm white board with a bevelled window (the cut
//   catches the light on its lower and right faces), a faint paper grain,
//   a soft contact shadow and a long ambient one. In the dark theme the
//   board is charcoal and the room light drops a little, so the print dims
//   with it. A pencil-style caption on the mat names the time of day.
// - Picture: drawn by a shader as one tone per dot, then ordered-dithered
//   (8×8 Bayer) into two to four colours. The sky follows the sun's height
//   (pale afternoon, a hot band along the horizon at golden hour, an
//   afterglow, then stars, a shooting star now and then, and the moon,
//   which was a pale disc in the sky all along and is lit from wherever the
//   sun is), clouds are thin streaks lit from below, the sea mirrors all of
//   it through layered waves, and the sun, the moon and the lamp each lay a
//   glitter path that twinkles dot by dot. On the right: a headland with
//   rocks off its point, a keeper's cottage, a shed and a white,
//   banded lighthouse shaded as a cylinder (its sun-side edge catches the
//   low light). The cottage windows come on one by one as the sun goes.
// - The lamp: it strikes once the sun is under LAMP_ON (and goes out above
//   LAMP_OFF, so a sun resting on the line never flickers it) with two
//   quick flickers and a warm rise (look.ts ignition()), run here from the
//   frame clock. Its two beams then turn, drawn in perspective in the
//   shader: long and level across the picture, narrowing toward the
//   horizon as they swing away, flaring as one swings through you.
// - Crispness: dots are whole device pixels at any DPR and the scene is
//   evaluated once per dot, so a 6 px dot costs a 36th of a 1 px one.
// - Motion: the sun follows a resting mouse over the sky on a heavy,
//   critically damped spring (no overshoot: it is the sun) and drifts back
//   to where you last left it when the pointer goes. Over the sea it waits
//   on the horizon, and sets only if the pointer rests there, so reaching
//   past the picture for the controls never drops the scene into night (a
//   quick pass, the first moments over the picture and its bottom edge are
//   ignored too). A press or drag reaches the whole range: drag the sun
//   down into the sea and the day runs into night under your hand, and
//   back. On touch, a tap places the sun and a sideways drag runs the clock
//   along a sun path at a middle latitude (it sets a little to the right),
//   while vertical swipes scroll the page. Waves roll toward the viewer,
//   gulls flap in bouts and glide, clouds creep, a boat drifts on the
//   horizon. Palette and dot-size changes come in dot by dot in Bayer
//   order, like a print being pulled. The site theme sets where the sun
//   rests: golden hour in the light theme, blue hour with the lamp turning
//   in the dark one, so switching themes plays the evening through.
// - Keyboard: the picture is a vertical slider for the sun's elevation
//   (↑ ↓, Page Up / Down, Home = lowest, End = highest); ← → move it along
//   the horizon.
// - Sound (stage, from a press or a key on the picture only, never from the
//   trays; lab mute respected): a stereo surf that rolls in over about
//   three seconds, with swells; a distant gull now and then while there is
//   light, a bell buoy after dark, and the lamp's thunk and ticks as it
//   strikes. The first time it starts, the caption says so and the speaker
//   button glows, so the source is obvious and one tap away.
// - Tile: the same print, smaller, at golden hour (blue hour in the dark
//   theme) with slow waves; under the mouse the sun dips toward the sea and
//   the lamp strikes. Half frame rate.
// - Lifetime: the frame loop allocates nothing; the page-pixel snap is
//   re-measured on layout events, not polled; the WebGL context is handed
//   back when the piece really unmounts (browsers keep only ~16 alive).
// - Reduced motion: one composed still (golden hour, or blue hour with a
//   beam reaching left; gulls placed, a frozen sparkle on the water); the
//   sun still moves when asked, without easing, and the lamp switches
//   without its flicker.
//
// Files: look.ts (palettes, geometry constants, the lamp's strike, times of
// day), shaders.ts + renderer.ts (WebGL2), sound.ts (Web Audio).

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import { ensureAudio, getAudio, useMuted } from "../../audio";
import {
  clamp,
  damp,
  smoothstep,
  Spring,
  useElementSize,
  useFinePointer,
  useFrame,
  useIsoLayoutEffect,
  useLatest,
  usePointer,
  useWebGL2,
  type PointerState,
} from "../../hooks";
import type { PieceMode, PieceProps, PieceTheme } from "../../types";
import { MuteButton, StageControls, StageHint, Stepper, Swatches, Toggle, Tray, TrayDivider, TrayRow } from "../../ui";
import {
  BEAM_TURN,
  ELEV_MAX,
  ELEV_MIN,
  elevationAt,
  formatElevation,
  heightOf,
  HORIZON,
  ignition,
  LAMP_OFF,
  LAMP_ON,
  PALETTES,
  paletteById,
  phaseFor,
  rgb01,
  STILL_BEAM,
  STILL_TIME,
  swatchFor,
  type PaletteId,
} from "./look";
import { DuskRenderer, type DuskFrame, type PaletteRGB } from "./renderer";
import { Shore } from "./sound";

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

type Box = { x: number; y: number; w: number; h: number };

type Layout = {
  card: Box;
  /** the picture window, relative to the card */
  win: Box;
  bevel: number;
  /** caption band under the window (0 on tiles) */
  caption: number;
  matSide: number;
};

/**
 * The smallest whole number of CSS px that is also a whole number of device
 * px (1 at DPR 1, 2 or 3; 2 at 1.5; 4 at 1.25). Sizes and positions in steps
 * of it are exact both for the browser's layout units and for the screen, so
 * the canvas is never resampled.
 */
function quantum(dpr: number): number {
  for (let k = 1; k <= 16; k++) if (Math.abs(k * dpr - Math.round(k * dpr)) < 1e-4) return k;
  return 1;
}
const snap = (v: number, dpr: number) => {
  const q = quantum(dpr);
  return Math.max(q, Math.floor(v / q + 1e-6) * q);
};

const HIDDEN: Layout = {
  card: { x: 0, y: 0, w: 0, h: 0 },
  win: { x: 0, y: 0, w: 0, h: 0 },
  bevel: 0,
  caption: 0,
  matSide: 0,
};

/** Where the root sits on the page (CSS px): the card snaps to the page's device pixels, not the root's. */
type Origin = { x: number; y: number };

/** Round a position inside the root so that it lands on a whole device pixel of the page. */
const snapAt = (v: number, origin: number, dpr: number) => {
  const q = quantum(dpr);
  return Math.round((origin + v) / q) * q - origin;
};

function frame(cardW: number, cardH: number, W: number, top: number, bottom: number, dpr: number, o: Origin) {
  const x = snapAt((W - cardW) / 2, o.x, dpr);
  const y = snapAt(top + (bottom - top - cardH) / 2, o.y, dpr);
  return { x, y, w: snap(cardW, dpr), h: snap(cardH, dpr) };
}

/** Where the print sits on the stage, above the controls. */
function stageLayout(W: number, controlsTop: number, dpr: number, o: Origin): Layout | null {
  const narrow = W < 640;
  const top = narrow ? 14 : 30;
  const bottom = Math.max(top + 120, controlsTop - (narrow ? 14 : 24));
  const gutter = narrow ? 14 : 48;
  const availW = W - gutter * 2;
  const availH = bottom - top;
  if (availW < 80 || availH < 80) return null;
  const matSide = Math.round(clamp(Math.min(availW, availH * 1.6) * 0.038, 12, 24));
  const caption = narrow ? 30 : 36;
  const maxW = availW - matSide * 2;
  const maxH = availH - matSide - caption;
  const aspect = clamp(maxW / maxH, 1.12, 1.72);
  // On the page's stage the height decides. On a big or full-screen stage
  // the print may grow to most of the room instead of sitting as a small
  // card in a large field (the scene is worked out per dot, so this costs
  // little at the same dot size).
  let picW = Math.min(maxW, Math.max(720, availW * 0.86));
  let picH = picW / aspect;
  if (picH > maxH) {
    picH = maxH;
    picW = picH * aspect;
  }
  picW = snap(picW, dpr);
  picH = snap(picH, dpr);
  const inset = snap(matSide, dpr);
  const band = snap(caption, dpr);
  const card = frame(picW + inset * 2, picH + inset + band, W, top, bottom, dpr, o);
  return { card, win: { x: inset, y: inset, w: picW, h: picH }, bevel: narrow ? 2 : 3, caption: band, matSide: inset };
}

/** The print centred on the tile, with room around it. */
function tileLayout(W: number, H: number, dpr: number, o: Origin): Layout | null {
  if (W < 40 || H < 30) return null;
  const matSide = W >= 190 ? 5 : 4;
  const bottomMat = matSide + 2;
  let picW = W * 0.76 - matSide * 2;
  let picH = H * 0.74 - matSide - bottomMat;
  const aspect = clamp(picW / picH, 1.4, 2.0);
  if (picW / picH > aspect) picW = picH * aspect;
  else picH = picW / aspect;
  picW = snap(picW, dpr);
  picH = snap(picH, dpr);
  const inset = snap(matSide, dpr);
  const card = frame(picW + inset * 2, picH + inset + snap(bottomMat, dpr), W, 0, H, dpr, o);
  return { card, win: { x: inset, y: inset, w: picW, h: picH }, bevel: 1, caption: 0, matSide: inset };
}

/* ---------------------------------------------------------------------- */
/* the sun                                                                 */
/* ---------------------------------------------------------------------- */

type Sun = { x: number; e: number };
/** A point on the picture: the sun there, and v, its height up the picture (0 bottom … 1 top). */
type Probe = Sun & { v: number };

/**
 * Where the sun rests until it is moved: golden hour in the light theme;
 * in the dark one, the lamp turning and the cottage lit (on the stage
 * blue hour, the moon bright and the first stars; on the small tile a
 * little earlier, while the afterglow still shows the scene).
 */
const REST: Record<PieceMode, Record<PieceTheme, Readonly<Sun>>> = {
  tile: { light: { x: 0.3, e: 4.6 }, dark: { x: 0.3, e: -4.2 } },
  stage: { light: { x: 0.3, e: 4.2 }, dark: { x: 0.31, e: -6 } },
};

const SUN_SPRING = { stiffness: 34, damping: 11.7 };

/** When a hovering mouse moves the sun (stage). */
const HOVER = {
  /** ms over the picture before the sun follows (a pass on the way somewhere is not a request) */
  dwell: 200,
  /** px/s: moving faster than this is a reach, and the sun holds where it is … */
  fast: 600,
  /** … until the pointer slows below this */
  slow: 380,
  /** ms without a move counts as still (the pointer's velocity only updates on moves) */
  idle: 90,
  /** the bottom share of the picture, nearest the controls, is ignored */
  band: 0.12,
  /** over the sea the sun waits on the horizon; resting this long (ms) … */
  linger: 380,
  /** … below this speed (px/s) lets it set under the pointer */
  lingerSpeed: 160,
} as const;

/** A sideways drag on a touch screen: degrees of elevation per picture width (right is later). */
const SCRUB_DEG = 30;
/**
 * The sun's path meets the horizon at 90° minus the latitude; at a middle
 * latitude (36°) it sets a little to the right, toward the pole.
 */
const PATH_SLOPE = Math.tan(((90 - 36) * Math.PI) / 180);

/** A touch on the picture: none, pressed (a tap, a sideways drag or a scroll?), or scrubbing the clock. */
const TOUCH_NONE = 0;
const TOUCH_WAITING = 1;
const TOUCH_SCRUBBING = 2;

const DOTS = { min: 1, max: 6 };

const SWATCHES = PALETTES.map((p) => ({ value: p.id, label: p.label, swatch: swatchFor(p) }));

const toRGB = (id: PaletteId): PaletteRGB => paletteById(id).colors.map(rgb01);

const valueText = (e: number) => `${phaseFor(e)}, sun ${formatElevation(e)}`;

/* ---------------------------------------------------------------------- */
/* styles                                                                  */
/* ---------------------------------------------------------------------- */

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32 0 0 0 0 0.27 0 0 0 0 0.2 0 0 0 0.11 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>",
)}")`;

const css = `
.dusk-card {
  position: absolute;
  border-radius: 3px;
  background: #fbfaf6;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.95),
    inset 0 -1px 0 rgb(120 100 70 / 0.06),
    0 0 0 0.5px rgb(60 44 28 / 0.12),
    0 1px 1.5px rgb(52 36 24 / 0.12),
    0 4px 9px -2px rgb(52 36 24 / 0.1),
    0 16px 30px -10px rgb(52 36 24 / 0.17),
    0 38px 64px -26px rgb(52 36 24 / 0.24);
  transition: background-color 500ms var(--ease-out), box-shadow 300ms var(--ease-out);
}
.dusk-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background-image: ${GRAIN};
  background-size: 180px 180px;
  opacity: 0.55;
}
.dusk-card[data-tile] {
  border-radius: 2px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.9),
    0 0 0 0.5px rgb(60 44 28 / 0.12),
    0 1px 1.5px rgb(52 36 24 / 0.14),
    0 3px 7px -1px rgb(52 36 24 / 0.1),
    0 10px 20px -8px rgb(52 36 24 / 0.2);
}
.group:hover .dusk-card[data-tile] {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.9),
    0 0 0 0.5px rgb(60 44 28 / 0.12),
    0 1px 2px rgb(52 36 24 / 0.14),
    0 5px 10px -2px rgb(52 36 24 / 0.12),
    0 14px 26px -8px rgb(52 36 24 / 0.24);
}
.dusk-bevel {
  position: absolute;
  border-style: solid;
  /* light from the upper left: the top and left faces of the cut look down
     and away, the bottom and right faces catch it */
  border-color: #e3ded3 #fdfcf9 #ffffff #ebe7de;
}
.dusk-window {
  position: absolute;
  overflow: hidden;
  background: var(--dusk-ground, #8a7f74);
}
.dusk-window::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 1px 1.5px rgb(30 20 10 / 0.28), inset 1px 0 1px rgb(30 20 10 / 0.12);
}
.dusk-caption { color: #8a8478; }
.dark .dusk-card {
  background: #2b2a28;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 0 0 0.5px rgb(0 0 0 / 0.6),
    0 1px 2px rgb(0 0 0 / 0.45),
    0 5px 12px -3px rgb(0 0 0 / 0.4),
    0 18px 36px -12px rgb(0 0 0 / 0.55),
    0 40px 70px -28px rgb(0 0 0 / 0.6);
}
.dark .dusk-card::before { opacity: 0.35; mix-blend-mode: overlay; }
.dark .dusk-card[data-tile] {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 0 0 0.5px rgb(0 0 0 / 0.6),
    0 2px 4px rgb(0 0 0 / 0.4),
    0 10px 22px -8px rgb(0 0 0 / 0.6);
}
.dark .group:hover .dusk-card[data-tile] {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    0 0 0 0.5px rgb(0 0 0 / 0.6),
    0 3px 6px rgb(0 0 0 / 0.45),
    0 14px 28px -8px rgb(0 0 0 / 0.65);
}
.dark .dusk-bevel { border-color: #1d1c1b #3a3936 #45433f #22211f; }
.dark .dusk-window::after { box-shadow: inset 0 1px 1.5px rgb(0 0 0 / 0.5), inset 1px 0 1px rgb(0 0 0 / 0.25); }
.dark .dusk-caption { color: #8f8a82; }
.dusk-canvas { image-rendering: pixelated; }
/* the speaker glows twice when the sea first comes in */
.dusk-sound::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  pointer-events: none;
  opacity: 0;
  background: var(--well);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 20%, transparent);
}
.dusk-sound[data-note]::before { animation: dusk-note 1.4s var(--ease-out) 2; }
@keyframes dusk-note {
  0%, 100% { opacity: 0; }
  32% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .dusk-card { transition: none; }
  .dusk-sound[data-note]::before { animation: none; opacity: 1; }
}
`;

/* ---------------------------------------------------------------------- */
/* the piece                                                               */
/* ---------------------------------------------------------------------- */

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const hintId = useId();
  const root = useElementSize(rootRef);
  const fine = useFinePointer();
  const muted = useMuted();

  const [palette, setPalette] = useState<PaletteId>("sunset");
  // phones start finer: 1 CSS px is already 2–3 device px there
  const [dot, setDot] = useState(() => (stage && window.innerWidth < 640 ? 1 : 2));
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const motion = stage ? (motionChoice ?? !reducedMotion) : !reducedMotion;
  const [touched, setTouched] = useState(false);
  const [announce, setAnnounce] = useState("");
  /** "Sound on": shown for a few seconds the first time the sea comes in */
  const [soundNote, setSoundNote] = useState(false);
  const [noted, setNoted] = useState(false);
  /** the elevation the sun was left at (slider value); null while it rests */
  const [pinnedE, setPinnedE] = useState<number | null>(null);
  const [controlsTop, setControlsTop] = useState(0);
  /**
   * False until the first WebGL frame has been drawn: until then the window
   * shows the flat print of the same view (FallbackArt), never the bare
   * ground colour, so a lazily mounted tile doesn't flash a solid block.
   */
  const [presented, setPresented] = useState(false);
  const presentedRef = useRef(false);
  const cap = stage ? 3 : 2;
  // read at render: a zoom changes it and resizes the root, which renders again
  const dpr = Math.max(1, Math.min(cap, window.devicePixelRatio || 1));

  // the stage controls' top edge, so the print centres in the room above them
  useIsoLayoutEffect(() => {
    if (!stage) return;
    const el = rootRef.current?.querySelector<HTMLElement>(".dusk-controls");
    if (!el) return;
    const measure = () => {
      const rootRect = rootRef.current?.getBoundingClientRect();
      if (!rootRect) return;
      let top = rootRect.height;
      for (const child of Array.from(el.children)) {
        const r = child.getBoundingClientRect();
        if (r.height > 0) top = Math.min(top, r.top - rootRect.top);
      }
      setControlsTop(top);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [stage]);

  // The root's place on the page, so the canvas lands on whole device pixels
  // (the stage column itself can start half a pixel in). Measured when the
  // root resizes and after anything that can move it without resizing it:
  // the window, the page's height, a finished transition (the masonry
  // re-flowing its tiles) and the web font arriving. Never from the frame loop.
  const [origin, setOrigin] = useState<Origin>({ x: 0, y: 0 });
  const measureOrigin = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = r.left + window.scrollX;
    const y = r.top + window.scrollY;
    setOrigin((prev) => (Math.abs(prev.x - x) < 0.01 && Math.abs(prev.y - y) < 0.01 ? prev : { x, y }));
  }, []);
  useIsoLayoutEffect(() => {
    measureOrigin();
  }, [measureOrigin, root.width, root.height]);
  useEffect(() => {
    let raf = 0;
    let alive = true;
    const schedule = () => {
      if (!raf && alive) raf = requestAnimationFrame(() => ((raf = 0), measureOrigin()));
    };
    const page = new ResizeObserver(schedule);
    page.observe(document.body);
    window.addEventListener("resize", schedule);
    document.addEventListener("transitionend", schedule, true);
    document.addEventListener("animationend", schedule, true);
    void document.fonts?.ready.then(schedule);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      page.disconnect();
      window.removeEventListener("resize", schedule);
      document.removeEventListener("transitionend", schedule, true);
      document.removeEventListener("animationend", schedule, true);
    };
  }, [measureOrigin]);

  const layout = useMemo(() => {
    if (!root.width || !root.height) return null;
    return stage
      ? stageLayout(root.width, controlsTop || root.height - 96, dpr, origin)
      : tileLayout(root.width, root.height, dpr, origin);
  }, [stage, root.width, root.height, controlsTop, dpr, origin]);
  const layoutRef = useLatest(layout);

  /* -------------------------------------------------------------------- */
  /* state the frame loop reads (allocated once, mutated in place)         */
  /* -------------------------------------------------------------------- */

  const [S] = useState(() => {
    const rest = REST[mode][theme];
    const colors = toRGB("sunset");
    const levels = paletteById("sunset").levels;
    const lampOn = rest.e < LAMP_ON;
    const frame: DuskFrame = {
      time: STILL_TIME,
      sunX: rest.x,
      elevation: rest.e,
      lamp: lampOn ? 1 : 0,
      beam: STILL_BEAM,
      tile: mode === "tile",
      palette: colors,
      previousPalette: colors,
      levels,
      previousLevels: levels,
      paletteMix: 1,
      dotMix: 1,
      dim: 1,
    };
    return {
      x: new Spring(rest.x, SUN_SPRING),
      e: new Spring(rest.e, SUN_SPRING),
      /** where the sun was left (a click, a tap, a drag or the keys); until then it rests */
      pin: { x: rest.x, e: rest.e } as Sun,
      pinned: false,
      /** what drives the sun: the resting place, the pointer, or the keys */
      input: "rest" as "rest" | "pointer" | "keys",
      /** a mouse press that started on the picture is moving the sun */
      dragging: false,
      /** scratch for hit tests */
      probe: { x: 0, e: 0, v: 0 } as Probe,
      // the hover preview (see hover())
      preview: { x: rest.x, e: rest.e } as Sun,
      previewing: false,
      enteredAt: -1,
      fast: false,
      lingerSince: -1,
      sunk: false,
      /** the hover is waiting on a timer: keep the loop awake */
      pending: false,
      touch: { mode: TOUCH_NONE as number, x0: 0, y0: 0, e0: 0, sx: 0 },
      clock: STILL_TIME,
      acc: 0,
      palette: "sunset" as PaletteId,
      colors,
      previous: colors,
      levels,
      previousLevels: levels,
      paletteMix: 1,
      dotMix: 1,
      dotChanged: false,
      dim: theme === "dark" ? 0.86 : 1,
      /** the lamp: whether it is on, its brightness, seconds since it last switched, and its level then */
      lampOn,
      lamp: lampOn ? 1 : 0,
      lampT: 10,
      lampFrom: 0,
      /** the beams' turn (radians) */
      beam: STILL_BEAM,
      /** what the caption shows: the rounded elevation and the phase */
      capE: NaN,
      capPhase: "",
      noted: false,
      frame,
    };
  });
  const rendererRef = useRef<DuskRenderer | null>(null);
  const contextRef = useRef<WebGL2RenderingContext | null>(null);
  const mountedRef = useRef(false);
  const shoreRef = useRef<Shore | null>(null);
  const heard = useRef(false);
  const noteTimer = useRef(0);

  const settings = useLatest({ dot: stage ? dot : 1, motion, reducedMotion, theme, mode, active, muted });

  /**
   * Is (x, y) on the picture, within `margin` px (Infinity: anywhere)? If so
   * `out` gets the sun under it.
   */
  const probe = useCallback(
    (x: number, y: number, margin: number, out: Probe): boolean => {
      const l = layoutRef.current;
      if (!l || !l.win.w || !l.win.h) return false;
      const left = l.card.x + l.win.x;
      const top = l.card.y + l.win.y;
      if (x < left - margin || x > left + l.win.w + margin || y < top - margin || y > top + l.win.h + margin) {
        return false;
      }
      out.v = 1 - (y - top) / l.win.h;
      out.x = clamp((x - left) / l.win.w, 0.03, 0.97);
      out.e = clamp(elevationAt(out.v), ELEV_MIN, ELEV_MAX);
      return true;
    },
    [layoutRef],
  );

  /**
   * The hover preview on the stage. True while a mouse resting over the
   * picture is moving the sun (to S.preview); false sends it back to where
   * it was left. A reach for the controls must not drag the scene into the
   * night and back, so the sun ignores the first moments over the picture,
   * holds while the pointer moves fast, ignores the bottom edge, and over
   * the sea waits on the horizon unless the pointer rests there. Leaving the
   * picture returns it at once, never through the low reading.
   */
  const hover = (p: PointerState, leftAt: number, now: number): boolean => {
    const at = S.probe;
    if (p.pressed || !p.inside || p.type !== "mouse" || S.input !== "pointer" || !probe(p.x, p.y, 0, at)) {
      S.previewing = false;
      S.enteredAt = -1;
      S.fast = false;
      S.lingerSince = -1;
      S.sunk = false;
      S.pending = false;
      return false;
    }
    if (S.enteredAt < 0) S.enteredAt = now;
    const speed = now - p.time > HOVER.idle ? 0 : Math.hypot(p.vx, p.vy);
    if (speed > HOVER.fast) S.fast = true;
    else if (speed < HOVER.slow) S.fast = false;
    const dwelt = now - S.enteredAt >= HOVER.dwell;
    S.pending = !dwelt || S.fast;
    // hold (the preview so far, or the resting sun)
    if (!dwelt || S.fast || at.v < HOVER.band) return S.previewing;
    let e = at.e;
    // over the sea the sun sits on the horizon (or as low as it was left)
    const floor = Math.min(0, leftAt);
    if (e < floor) {
      if (speed < HOVER.lingerSpeed) {
        if (S.lingerSince < 0) S.lingerSince = now;
      } else if (!S.sunk) {
        S.lingerSince = -1;
      }
      if (!S.sunk && S.lingerSince >= 0 && now - S.lingerSince >= HOVER.linger) S.sunk = true;
      if (!S.sunk) {
        e = floor;
        S.pending = true;
      }
    } else {
      S.sunk = false;
      S.lingerSince = -1;
    }
    S.preview.x = at.x;
    S.preview.e = e;
    S.previewing = true;
    return true;
  };

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const s = settings.current;
    if (!renderer || !canvas || !glRef.current) return;
    const W = canvas.width;
    const H = canvas.height;
    if (W < 4 || H < 4) return;

    // tiles run at half rate
    if (s.mode === "tile") {
      S.acc += dt;
      if (S.acc < 1 / 30 - 0.002) return;
      dt = S.acc;
      S.acc = 0;
    }

    const cellPx = Math.max(1, Math.round(s.dot * sizeRef.current.dpr));
    if (renderer.needsGrid(W, H, cellPx)) {
      const dissolve = S.dotChanged && !s.reducedMotion;
      renderer.setGrid(W, H, cellPx, dissolve);
      S.dotMix = dissolve ? 0 : 1;
      S.dotChanged = false;
    }

    // where the sun wants to be
    const rest = REST[s.mode][s.theme];
    const left = S.pinned ? S.pin : rest;
    let tx = left.x;
    let te = left.e;
    const p = pointer.current;
    if (s.mode === "stage") {
      if (hover(p, left.e, performance.now())) {
        tx = S.preview.x;
        te = S.preview.e;
      }
    } else if (p.inside && p.type === "mouse" && !s.reducedMotion) {
      tx = rest.x + (p.nx - 0.5) * 0.12;
      te = rest.e - 3.6;
    }
    S.x.to(tx);
    S.e.to(te);
    if (s.reducedMotion) {
      S.x.set(tx);
      S.e.set(te);
    } else {
      S.x.step(dt);
      S.e.step(dt);
    }

    if (s.motion) S.clock += dt * (s.mode === "stage" ? 1 : 0.6);

    // the lamp: strikes below LAMP_ON, goes out above LAMP_OFF
    const lampWanted = S.lampOn ? S.e.value < LAMP_OFF : S.e.value < LAMP_ON;
    if (lampWanted !== S.lampOn) {
      S.lampOn = lampWanted;
      S.lampFrom = S.lamp;
      S.lampT = 0;
      if (lampWanted && s.mode === "stage" && !s.reducedMotion) shoreRef.current?.strike();
    }
    S.lampT += dt;
    if (s.reducedMotion) {
      S.lamp = S.lampOn ? 1 : 0;
    } else {
      // from wherever it was, without a jump: a lamp struck again while it
      // is still dimming flickers back from that level
      const left = S.lampFrom * Math.exp(-S.lampT * 7);
      S.lamp = S.lampOn ? Math.max(ignition(S.lampT), left) : left < 0.002 ? 0 : left;
    }
    if (s.motion) S.beam = (S.beam + (dt * 2 * Math.PI) / BEAM_TURN) % (2 * Math.PI);
    else if (s.reducedMotion) S.beam = STILL_BEAM;
    const lampSettled = S.lampOn ? S.lampT > 1.1 || s.reducedMotion : S.lamp === 0;

    const fade = s.reducedMotion ? 1 : dt;
    S.paletteMix = Math.min(1, S.paletteMix + fade / 0.6);
    S.dotMix = Math.min(1, S.dotMix + fade / 0.55);
    if (S.dotMix >= 1 && renderer.hasPrevious) renderer.dropPrevious();
    const dimTarget = s.theme === "dark" ? 0.86 : 1;
    S.dim = s.reducedMotion ? dimTarget : damp(S.dim, dimTarget, 5, dt);

    const f = S.frame;
    f.time = S.clock;
    f.sunX = S.x.value;
    f.elevation = S.e.value;
    f.lamp = S.lamp;
    f.beam = S.beam;
    f.tile = s.mode === "tile";
    f.palette = S.colors;
    f.previousPalette = S.previous;
    f.levels = S.levels;
    f.previousLevels = S.previousLevels;
    f.paletteMix = S.paletteMix;
    f.dotMix = S.dotMix;
    f.dim = S.dim;
    renderer.draw(f);
    if (!presentedRef.current) {
      presentedRef.current = true;
      setPresented(true);
    }

    // the caption on the mat: rebuilt only when what it says changes
    const caption = captionRef.current;
    if (caption) {
      const e = S.e.value;
      const rounded = Math.round(e);
      const phase = phaseFor(e);
      if (rounded !== S.capE || phase !== S.capPhase) {
        S.capE = rounded;
        S.capPhase = phase;
        caption.textContent = `${phase} · sun ${formatElevation(e)}`;
      }
    }
    if (shoreRef.current) {
      shoreRef.current.daylight = smoothstep(-6, 2, S.e.value);
      shoreRef.current.night = smoothstep(-3, -9, S.e.value);
    }

    // sleep once nothing moves
    const settled =
      S.x.settled && S.e.settled && S.paletteMix >= 1 && S.dotMix >= 1 && Math.abs(S.dim - dimTarget) < 0.002;
    if (!s.motion && settled && lampSettled && !p.pressed && !S.pending) return false;
  });

  const { canvasRef, glRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: cap,
    attributes: { alpha: true, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false },
    onContext: (gl) => {
      contextRef.current = gl;
      let renderer: DuskRenderer | null = null;
      try {
        renderer = new DuskRenderer(gl);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
        // a lost context leaves a blank canvas: the print stands in again
        presentedRef.current = false;
        setPresented(false);
      };
    },
    onResize: () => wake(),
  });

  // Hand the WebGL context back when the piece really goes away: home and
  // /lab/ run several pieces at once and browsers keep only ~16 contexts,
  // force-losing the oldest (possibly another piece's live canvas) past
  // that. It runs a tick later because StrictMode's rehearsal unmount
  // remounts at once on the same canvas; onContext's own cleanup also runs
  // on a context loss, so it can't do this.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const gl = contextRef.current;
      if (!gl) return;
      window.setTimeout(() => {
        const canvas = gl.canvas;
        const connected = canvas instanceof HTMLCanvasElement && canvas.isConnected;
        if (mountedRef.current || connected || gl.isContextLost()) return;
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        // and free the backing store now rather than at the next GC
        if (canvas instanceof HTMLCanvasElement) {
          canvas.width = 0;
          canvas.height = 0;
        }
        if (contextRef.current === gl) contextRef.current = null;
      }, 0);
    };
  }, []);

  /* -------------------------------------------------------------------- */
  /* sound                                                                 */
  /* -------------------------------------------------------------------- */

  const syncSound = useCallback(() => {
    const s = settings.current;
    const want = s.mode === "stage" && heard.current && s.active && s.motion && !s.muted;
    const shore = (shoreRef.current ??= new Shore());
    if (want) {
      const kit = getAudio();
      if (kit && !shore.playing) {
        shore.start(kit);
        // the first time, say where the sound comes from (and where it stops)
        if (!S.noted) {
          S.noted = true;
          setNoted(true);
          setSoundNote(true);
          setAnnounce("Sound on: the surf. The mute button turns it off.");
          window.clearTimeout(noteTimer.current);
          noteTimer.current = window.setTimeout(() => setSoundNote(false), 4200);
        }
      }
    } else if (shore.playing) {
      shore.stop();
    }
  }, [settings, S]);

  useEffect(() => {
    syncSound();
  }, [syncSound, active, motion, muted]);

  useEffect(
    () => () => {
      shoreRef.current?.stop();
      window.clearTimeout(noteTimer.current);
    },
    [],
  );

  /** A press, tap or key on the picture: the first one may start the sea. The trays never do. */
  const gesture = useCallback(() => {
    if (!stage) return;
    heard.current = true;
    ensureAudio();
    syncSound();
  }, [stage, syncSound]);

  /* -------------------------------------------------------------------- */
  /* pointer and keys                                                      */
  /* -------------------------------------------------------------------- */

  /** Leave the sun here (the slider's value follows, per whole degree or phase). */
  const pinTo = (x: number, e: number) => {
    S.pin.x = clamp(x, 0.03, 0.97);
    S.pin.e = clamp(e, ELEV_MIN, ELEV_MAX);
    S.pinned = true;
    const next = S.pin.e;
    setPinnedE((prev) =>
      prev !== null && Math.round(prev) === Math.round(next) && phaseFor(prev) === phaseFor(next) ? prev : next,
    );
  };

  /** After a pointer leaves the sun somewhere: say where (a focused slider announces its own value). */
  const announcePin = () => {
    if (document.activeElement !== surfaceRef.current) setAnnounce(valueText(S.pin.e));
  };

  const pointer = usePointer(stage ? surfaceRef : rootRef, {
    capture: stage,
    onDown: (state) => {
      if (!stage) return;
      // only a press on the picture moves the sun
      if (!probe(state.x, state.y, 6, S.probe)) {
        state.pressed = false;
        return;
      }
      if (state.type === "mouse") {
        S.input = "pointer";
        S.dragging = true;
        pinTo(S.probe.x, S.probe.e);
        setTouched(true);
        gesture();
      } else {
        // a finger or pen: wait to see whether it taps, drags sideways or
        // scrolls the page (touch-action: pan-y hands vertical swipes to the
        // browser, which then cancels this pointer)
        const s = settings.current;
        const left = S.pinned ? S.pin : REST[s.mode][s.theme];
        S.touch.mode = TOUCH_WAITING;
        S.touch.x0 = state.x;
        S.touch.y0 = state.y;
        S.touch.e0 = left.e;
        S.touch.sx = left.x;
      }
      wake();
    },
    onMove: (state) => {
      if (stage) {
        if (state.type === "mouse") {
          S.input = "pointer";
          if (S.dragging && probe(state.x, state.y, Infinity, S.probe)) pinTo(S.probe.x, S.probe.e);
        } else if (S.touch.mode !== TOUCH_NONE && state.pressed) {
          const t = S.touch;
          if (t.mode === TOUCH_WAITING) {
            const dx = state.x - t.x0;
            const dy = state.y - t.y0;
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
              t.mode = TOUCH_SCRUBBING;
              t.x0 = state.x; // start from here, so the sun doesn't jump
              S.input = "pointer";
              setTouched(true);
            }
          }
          if (t.mode === TOUCH_SCRUBBING) {
            const l = layoutRef.current;
            const w = l?.win.w || 300;
            const aspect = l && l.win.h ? l.win.w / l.win.h : 1.6;
            const e = clamp(t.e0 - ((state.x - t.x0) / w) * SCRUB_DEG, ELEV_MIN, ELEV_MAX);
            // along the sun's real path: lower is further right
            const x = t.sx - (heightOf(e) - heightOf(t.e0)) / (PATH_SLOPE * aspect);
            pinTo(x, e);
          }
        }
      }
      wake();
    },
    onUp: (state, event) => {
      if (S.dragging) {
        if (probe(state.x, state.y, Infinity, S.probe)) pinTo(S.probe.x, S.probe.e);
        S.dragging = false;
        announcePin();
      } else if (S.touch.mode !== TOUCH_NONE) {
        const t = S.touch;
        const cancelled = event.type === "pointercancel";
        const still = Math.hypot(state.x - t.x0, state.y - t.y0) < 12;
        if (t.mode === TOUCH_WAITING && !cancelled && still && probe(state.x, state.y, 12, S.probe)) {
          // a tap: the sun goes there (pointerup is the gesture that may start the sea)
          S.input = "pointer";
          pinTo(S.probe.x, S.probe.e);
          setTouched(true);
          gesture();
          announcePin();
        } else if (t.mode === TOUCH_SCRUBBING) {
          if (!cancelled) gesture();
          announcePin();
        }
        t.mode = TOUCH_NONE;
      }
      wake();
    },
    onLeave: () => wake(),
  });

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!stage || event.altKey || event.ctrlKey || event.metaKey) return;
    // from where the sun is heading (the keys may take over from the pointer)
    const fromX = S.input === "keys" ? S.pin.x : S.x.target;
    const fromE = S.input === "keys" ? S.pin.e : S.e.target;
    const big = event.shiftKey;
    let x = fromX;
    let e = fromE;
    switch (event.key) {
      case "ArrowUp":
        e += big ? 5 : 1;
        break;
      case "ArrowDown":
        e -= big ? 5 : 1;
        break;
      case "PageUp":
        e += 5;
        break;
      case "PageDown":
        e -= 5;
        break;
      // a slider's ends: Home the lowest, End the highest
      case "Home":
        e = ELEV_MIN;
        break;
      case "End":
        e = ELEV_MAX;
        break;
      // along the horizon
      case "ArrowLeft":
        x -= big ? 0.12 : 0.04;
        break;
      case "ArrowRight":
        x += big ? 0.12 : 0.04;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    // whole degrees, so the value reads cleanly
    if (e !== fromE && event.key !== "Home" && event.key !== "End") e = Math.round(e);
    pinTo(x, e);
    S.input = "keys";
    setTouched(true);
    gesture();
    wake();
  };

  /* -------------------------------------------------------------------- */
  /* controls                                                              */
  /* -------------------------------------------------------------------- */

  const choosePalette = (id: PaletteId) => {
    if (id === S.palette) return;
    S.previous = S.colors;
    S.previousLevels = S.levels;
    S.palette = id;
    S.colors = toRGB(id);
    S.levels = paletteById(id).levels;
    S.paletteMix = settings.current.reducedMotion ? 1 : 0;
    setPalette(id);
    wake();
  };

  const chooseDot = (value: number) => {
    S.dotChanged = true;
    setDot(value);
    wake();
  };

  // redraw when a setting, the size or the theme changes while the loop sleeps
  useEffect(() => {
    wake();
  }, [dot, motion, theme, reducedMotion, layout, wake]);

  // without WebGL2 the same card shows a flat still (see FallbackArt)
  const fallback = supported === false;
  const sliderE = pinnedE ?? REST[mode][theme].e;

  // The card (and its canvas) is always in the tree: the WebGL hook binds
  // to the canvas on the first commit, before the root has been measured.
  const l = layout ?? HIDDEN;
  const card = (
    <div
      className="dusk-card"
      data-tile={stage ? undefined : ""}
      style={{
        left: l.card.x,
        top: l.card.y,
        width: l.card.w,
        height: l.card.h,
        visibility: layout ? undefined : "hidden",
      }}
    >
      <span
        aria-hidden="true"
        className="dusk-bevel"
        style={{
          left: l.win.x - l.bevel,
          top: l.win.y - l.bevel,
          width: l.win.w,
          height: l.win.h,
          borderWidth: l.bevel,
        }}
      />
      <div
        // vertical swipes scroll the page; taps and sideways drags are ours
        className={cn("dusk-window", stage && "cursor-crosshair touch-pan-y")}
        style={
          {
            left: l.win.x,
            top: l.win.y,
            width: l.win.w,
            height: l.win.h,
            "--dusk-ground": paletteById(palette).colors[1],
          } as CSSProperties
        }
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn("dusk-canvas absolute top-0 left-0", fallback ? "hidden" : "block")}
          style={{ width: l.win.w, height: l.win.h }}
        />
        {fallback || !presented ? <FallbackArt palette={palette} /> : null}
      </div>
      {l.caption ? (
        <div
          aria-hidden="true"
          className="dusk-caption absolute flex items-center justify-between gap-3 text-[11.5px] leading-none tracking-[0.01em] whitespace-nowrap select-none"
          style={{
            left: l.win.x + 1,
            right: l.matSide + 1,
            top: l.win.y + l.win.h,
            height: l.caption,
          }}
        >
          <span>{l.card.w < 440 ? "Last light" : "Last light, the lighthouse on the point"}</span>
          {/* written by the frame loop (no re-render per frame); the still states its own */}
          <span ref={captionRef} className="tabular-nums">
            {fallback ? `${phaseFor(4)} · sun ${formatElevation(4)}` : null}
          </span>
        </div>
      ) : null}
      {stage ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[5px] rounded-[7px] opacity-0 shadow-[0_0_0_2px_var(--foreground)] transition-opacity duration-150 group-focus-visible/surface:opacity-100"
        />
      ) : null}
    </div>
  );

  const style = (
    <style href="lab-dusk" precedence="default">
      {css}
    </style>
  );

  if (!stage) {
    return (
      <div ref={rootRef} aria-hidden="true" className="absolute inset-0">
        {style}
        {card}
      </div>
    );
  }

  const hint = fallback
    ? "A still: this browser can't run the live scene"
    : noted
      ? "Sound on: the surf · the speaker mutes it"
      : fine
        ? "Move over the sky to move the sun · drag it down into the sea for night · click to keep it"
        : "Tap to place the sun · drag sideways to run the day into night";

  return (
    <div ref={rootRef} className="absolute inset-0 select-none">
      {style}
      <div
        ref={surfaceRef}
        tabIndex={fallback ? undefined : 0}
        {...(fallback
          ? { role: "img", "aria-label": "Last light: the sun low over the sea, a lighthouse on the headland" }
          : {
              role: "slider",
              "aria-label": "Time of day: the sun over the sea by the lighthouse",
              "aria-orientation": "vertical" as const,
              "aria-valuemin": ELEV_MIN,
              "aria-valuemax": ELEV_MAX,
              "aria-valuenow": Math.round(sliderE),
              "aria-valuetext": valueText(sliderE),
              "aria-describedby": hintId,
            })}
        onKeyDown={fallback ? undefined : onKeyDown}
        className={cn(
          "group/surface absolute inset-0 outline-none [-webkit-tap-highlight-color:transparent]",
          fine ? "cursor-default" : "",
        )}
      >
        {card}
      </div>

      <p id={hintId} className="sr-only">
        A dithered print of the sea with a lighthouse on a headland. Lower the sun past the horizon and night falls:
        the lamp comes on and turns its beams, the cottage windows light up, the moon and the stars come out. The up
        and down arrows raise and lower the sun, Page Up and Page Down by five degrees, Home and End take it to the
        lowest and the highest. The left and right arrows move it along the horizon. With a mouse, move over the sky to
        move the sun, drag it into the sea for night, and click to keep it there; on a touch screen, tap to place it
        and drag sideways to change the hour.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="bottom" className="dusk-controls">
        <TrayRow>
          <Tray label="Palette">
            <Swatches label="Palette" options={SWATCHES} value={palette} onChange={choosePalette} />
          </Tray>
          {fallback ? null : (
            <Tray label="Dither, motion and sound">
              <Stepper
                label="Dot"
                value={dot}
                min={DOTS.min}
                max={DOTS.max}
                onChange={chooseDot}
                format={(v) => `${v}px`}
              />
              <TrayDivider />
              <Toggle label="Motion" checked={motion} onChange={(value) => setMotionChoice(value)} />
              <TrayDivider />
              <span className="dusk-sound relative inline-flex shrink-0" data-note={soundNote ? "" : undefined}>
                <MuteButton />
              </span>
            </Tray>
          )}
        </TrayRow>
        <StageHint className={cn("transition-opacity duration-700", touched && !soundNote && "opacity-0")}>
          {hint}
        </StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/**
 * A flat, screen-printed version of the view for browsers without WebGL2
 * (and for the moment before the first frame): bands of the palette for the
 * sky and sea, the sun and its path, the headland with its rocks,
 * cottage and lighthouse, in the shader's proportions.
 */
function FallbackArt({ palette }: { palette: PaletteId }) {
  const c = paletteById(palette).colors;
  const n = c.length;
  const light = c[n - 1];
  const dark = c[0];
  const sky = n > 2 ? [c[1], c[n - 2], c[n - 2]] : [dark, dark, light];
  const H = (1 - HORIZON) * 100; // the horizon, from the top
  const sunY = (1 - heightOf(4)) * 100;
  // the headland's brow and the ground under the lighthouse (100 units = the picture's height)
  const g = H - 7.3;
  return (
    <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
      <rect width="160" height={H} fill={sky[0]} />
      <rect y={H * 0.45} width="160" height={H * 0.55} fill={sky[1]} opacity={n > 2 ? 1 : 0.0} />
      <rect y={H * 0.8} width="160" height={H * 0.2} fill={n > 2 ? light : sky[2]} opacity={n > 2 ? 0.55 : 0} />
      <circle cx="48" cy={sunY} r="5.2" fill={light} />
      <rect y={H} width="160" height={100 - H} fill={n > 2 ? c[1] : dark} />
      <rect x="45" y={H + 1.5} width="6" height="1.4" fill={light} />
      <rect x="46" y={H + 5} width="4" height="1.2" fill={light} />
      <rect x="44" y={H + 9.5} width="8" height="1.4" fill={light} />
      {/* the rocks, the headland, the shed and the cottage */}
      <path fill={dark} d={`M91.55 ${H} q0.85 -1.45 1.7 0 Z M93.7 ${H} q1.9 -2.5 3.8 0 Z`} />
      <path fill={dark} d={`M95.6 ${H} C99 ${H} 101 ${H - 6} 108.5 ${H - 6.4} L160 ${H - 7.7} V${H} Z`} />
      <path fill={dark} d={`M119.3 ${g + 0.4} v-1.6 h2.1 v1.2 Z`} />
      <path fill={dark} d={`M130 ${g + 0.4} v-2 l-0.35 0 l2.55 -1.6 l2.55 1.6 l-0.35 0 v2 Z`} />
      {/* the lighthouse: tapered tower, gallery, lantern, dome and vent */}
      <path fill={dark} d={`M122.9 ${g + 0.6} L123.58 ${g - 17} h2.44 L126.7 ${g + 0.6} Z`} />
      <rect x="122.98" y={g - 17.72} width="3.64" height="0.72" fill={dark} />
      <rect x="123.84" y={g - 20.75} width="1.92" height="3.05" fill={dark} />
      <path fill={dark} d={`M123.67 ${g - 20.7} a1.13 1 0 0 1 2.26 0 Z`} />
      <circle cx="124.8" cy={g - 22.1} r="0.31" fill={dark} />
    </svg>
  );
}
