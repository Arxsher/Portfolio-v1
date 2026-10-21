// The room behind the glass: where everything in it sits, and its colours
// in the two themes. No GL here; engine.ts writes these into the frame and
// shaders.ts (SCENE_FN) draws them.
//
// One warm room at two hours. The wall is the same plaster in both themes
// and only the light on it changes:
// - light theme: early evening after rain. Low sun comes in through a
//   window just out of frame on the left and lays a golden patch on the
//   wall, cut by the window's bars and speckled with the shadows of the
//   raindrops still on its glass (each bead casts a dark ring with a
//   bright point in it, a few slide down in fits and starts). Fairy lights
//   are already on, faint against the daylight; soft honey bokeh from a
//   second string close to the lens.
// - dark theme: night. The window lets in only cool street light; a lamp
//   out of frame on the right fills the room with amber, the fairy lights
//   glow and light the wall around each bulb, and the near string turns
//   into big warm discs.
//
// Everything is placed in CSS px from the stage's size, in two
// arrangements: landscape (the desktop stage, full screen) and portrait
// (phones, tiles). The bokeh are hand placed in each so they frame the
// bar instead of landing on its icons.

import { lerp } from "../../hooks";
import type { PieceMode } from "../../types";

type Vec3 = readonly [number, number, number];

/* ---------------------------------------------------------------------- */
/* palette                                                                 */
/* ---------------------------------------------------------------------- */

/** Order of the colours in the shader's u_pal[] (shaders.ts defines P_* from this). */
export const PALETTE_KEYS = [
  "albedoTop",
  "albedoBottom",
  "ambient",
  "lamp",
  "window",
  "windowFar",
  "wire",
  "bulb",
  "bulbOff",
  "halo",
  "bokehA",
  "bokehB",
  "bokehC",
  "shadowTint",
  "caustic",
  "milk",
  "envLow",
  "envHigh",
  "envWindow",
  "envLamp",
  "rim",
  "plateInk",
  "plateWhite",
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];

type Look = Record<PaletteKey, Vec3> & {
  /** Bokeh: overall amount and blend (0 adds light, 1 lays a veil of it). */
  bokehAmount: number;
  bokehBlend: number;
  vignette: number;
  wireAlpha: number;
  shadow: number;
  caustic: number;
  /** Grain amplitude (display units). */
  grain: number;
};

const hex = (value: string): Vec3 => {
  const n = parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const scale = (c: Vec3, k: number): Vec3 => [c[0] * k, c[1] * k, c[2] * k];

/** The plaster, the same in both themes. */
const PAINT_TOP = hex("#efe5d8");
const PAINT_BOTTOM = hex("#e8dac9");

export const LIGHT: Look = {
  albedoTop: PAINT_TOP,
  albedoBottom: PAINT_BOTTOM,
  ambient: [0.955, 0.93, 0.905],
  lamp: [0.1, 0.06, 0.025],
  // low sun: gold near the window, deeper toward the far end of the patch
  window: [0.34, 0.255, 0.13],
  windowFar: [0.36, 0.21, 0.085],
  wire: hex("#4a3a2f"),
  bulb: [1.55, 1.24, 0.82],
  bulbOff: hex("#f3e7d6"),
  halo: [0.15, 0.085, 0.03],
  // the bokeh lay soft light over the wall
  bokehA: hex("#fff1d8"),
  bokehB: hex("#ffe2b8"),
  bokehC: hex("#ffd9c6"),
  shadowTint: hex("#8a6f5c"),
  caustic: [0.34, 0.25, 0.11],
  milk: hex("#fbf6ef"),
  envLow: hex("#a08a78"),
  envHigh: hex("#fffaf2"),
  envWindow: [1.05, 0.96, 0.8],
  envLamp: [0.16, 0.1, 0.04],
  rim: [1, 0.97, 0.92],
  plateInk: hex("#fcf8f2"),
  plateWhite: hex("#2a221d"),
  bokehAmount: 0.42,
  bokehBlend: 1,
  vignette: 0.13,
  wireAlpha: 0.7,
  shadow: 0.2,
  caustic: 1,
  grain: 3.4 / 255,
};

export const DARK: Look = {
  albedoTop: PAINT_TOP,
  albedoBottom: PAINT_BOTTOM,
  ambient: [0.072, 0.06, 0.056],
  // a lamp out of frame on the right
  lamp: [1.05, 0.52, 0.2],
  // cool street light through the wet glass
  window: [0.11, 0.15, 0.24],
  windowFar: [0.09, 0.12, 0.21],
  wire: hex("#0b0806"),
  bulb: scale([1.25, 0.86, 0.44], 2.6),
  bulbOff: hex("#3a2f27"),
  halo: [0.5, 0.25, 0.07],
  bokehA: [0.95, 0.52, 0.17],
  bokehB: [1, 0.7, 0.32],
  bokehC: [0.95, 0.42, 0.26],
  shadowTint: hex("#3b2a20"),
  caustic: [0.22, 0.16, 0.12],
  milk: hex("#2a211c"),
  envLow: hex("#0c0908"),
  envHigh: hex("#4a382c"),
  envWindow: [0.42, 0.52, 0.72],
  envLamp: [1.1, 0.6, 0.24],
  rim: [0.95, 0.8, 0.64],
  plateInk: hex("#f4ede4"),
  plateWhite: hex("#1c1613"),
  bokehAmount: 0.62,
  bokehBlend: 0,
  vignette: 0.34,
  wireAlpha: 0.85,
  shadow: 0.5,
  caustic: 1,
  grain: 3 / 255,
};

/** Mixes the two looks' colours into `out` (u_pal layout), allocation free. */
export function writePalette(out: Float32Array, dark: number) {
  for (let i = 0; i < PALETTE_KEYS.length; i++) {
    const a = LIGHT[PALETTE_KEYS[i]];
    const b = DARK[PALETTE_KEYS[i]];
    out[i * 3] = lerp(a[0], b[0], dark);
    out[i * 3 + 1] = lerp(a[1], b[1], dark);
    out[i * 3 + 2] = lerp(a[2], b[2], dark);
  }
}

export function mixLook(key: "bokehAmount" | "bokehBlend" | "vignette" | "wireAlpha" | "shadow" | "caustic" | "grain", dark: number) {
  return lerp(LIGHT[key], DARK[key], dark);
}

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

export type Swag = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** How far the middle hangs below the straight line (CSS px). */
  sag: number;
  /** Bulb pitch along x, and where along it the first bulb sits (0..1). */
  spacing: number;
  phase: number;
  /** Sideways sway of the low point (CSS px). */
  sway: number;
};

export type SceneLayout = {
  landscape: boolean;
  /** The lamp's glow: centre and radius. */
  lamp: { x: number; y: number; r: number };
  /**
   * The window's light on the wall: a parallelogram with vertical sides
   * (x, w) and top and bottom edges falling to the right by `slope`, so the
   * bars of a window on the left wall land as they would. `mullion` and
   * `transom` are where the bars are (0..1 across and down), `bar` their
   * half width; edges are crisp near the window and soften away from it.
   */
  win: {
    x: number;
    y: number;
    w: number;
    h: number;
    slope: number;
    mullion: number;
    transom: number;
    bar: number;
    softNear: number;
    softFar: number;
  };
  /** The sun's shadow offset of the glass on the wall (CSS px). */
  sun: { x: number; y: number };
  /** Raindrop cell on the window glass (CSS px). */
  rain: number;
  swags: readonly [Swag, Swag];
  bulb: { r: number; hang: number; halo: number; wire: number };
  /** x, y, radius, seed for each disc (unused slots have radius 0). */
  bokeh: Float32Array;
  shadow: { x: number; y: number; blur: number };
};

export const BOKEH_SLOTS = 14;

// x, y (fractions of the stage), radius (fraction of the height), seed
const LANDSCAPE_BOKEH: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.86, 0.17, 0.085, 0.13],
  [0.955, 0.36, 0.06, 0.71],
  [0.755, 0.3, 0.048, 0.42],
  [0.67, 0.12, 0.036, 0.9],
  [0.81, 0.84, 0.1, 0.27],
  [0.935, 0.68, 0.07, 0.58],
  [0.69, 0.96, 0.062, 0.36],
  [0.995, 0.95, 0.09, 0.05],
  [0.11, 0.9, 0.07, 0.83],
  [0.265, 0.975, 0.05, 0.19],
  [0.035, 0.7, 0.055, 0.64],
  [0.6, 0.66, 0.048, 0.48],
  [0.405, 0.73, 0.036, 0.95],
  [0.355, 0.115, 0.032, 0.31],
];

// x, y (fractions of the stage), radius (fraction of the width), seed
const PORTRAIT_BOKEH: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.85, 0.13, 0.13, 0.13],
  [0.6, 0.24, 0.07, 0.71],
  [0.97, 0.36, 0.085, 0.42],
  [0.79, 0.84, 0.15, 0.27],
  [0.985, 0.64, 0.08, 0.58],
  [0.53, 0.955, 0.09, 0.36],
  [0.1, 0.87, 0.1, 0.83],
  [0.3, 0.99, 0.07, 0.19],
  [0.035, 0.6, 0.065, 0.64],
  [0.68, 0.7, 0.06, 0.48],
  [0.24, 0.72, 0.05, 0.95],
  [0.2, 0.06, 0.05, 0.9],
];

export function computeScene(width: number, height: number, mode: PieceMode, compact: boolean): SceneLayout {
  const W = width;
  const H = height;
  const landscape = mode === "stage" && !compact && W / H > 1.15;
  const bokeh = new Float32Array(BOKEH_SLOTS * 4);
  const tile = mode === "tile";

  if (landscape) {
    LANDSCAPE_BOKEH.forEach(([x, y, r, seed], i) => {
      bokeh.set([x * W, y * H, r * H, seed], i * 4);
    });
    // the bulbs and rain keep their real size on big screens
    const u = Math.min(H, 640);
    return {
      landscape,
      lamp: { x: W * 1.0, y: H * 1.08, r: H * 0.95 },
      win: {
        x: W * 0.1,
        y: -H * 0.1,
        w: W * 0.4,
        h: H * 0.84,
        slope: 0.36,
        mullion: 0.5,
        transom: 0.38,
        bar: u * 0.0105,
        softNear: 1.2,
        softFar: u * 0.014,
      },
      sun: { x: u * 0.03, y: u * 0.03 * 0.36 + u * 0.006 },
      rain: u * 0.023,
      swags: [
        { x0: -W * 0.04, y0: H * 0.085, x1: W * 0.55, y1: H * 0.05, sag: H * 0.215, spacing: u * 0.068, phase: 0.3, sway: u * 0.01 },
        { x0: W * 0.47, y0: H * 0.06, x1: W * 1.04, y1: H * 0.15, sag: H * 0.165, spacing: u * 0.068, phase: 0.7, sway: u * 0.012 },
      ],
      bulb: { r: u * 0.0058, hang: u * 0.012, halo: u * 0.034, wire: 0.42 },
      bokeh,
      shadow: { x: 0, y: 12, blur: 26 },
    };
  }

  PORTRAIT_BOKEH.forEach(([x, y, r, seed], i) => {
    bokeh.set([x * W, y * H, r * W, seed], i * 4);
  });
  const u = Math.min(W, 520);
  return {
    landscape,
    lamp: { x: W * 1.02, y: H * 1.0, r: W * 0.95 },
    win: {
      x: -W * 0.05,
      y: -H * 0.06,
      w: W * 0.78,
      h: H * 0.68,
      slope: 0.38,
      mullion: 0.52,
      transom: 0.4,
      bar: u * (tile ? 0.02 : 0.016),
      softNear: tile ? 0.8 : 1.1,
      softFar: u * 0.022,
    },
    sun: { x: u * 0.045, y: u * 0.045 * 0.38 + u * 0.008 },
    rain: u * (tile ? 0.05 : 0.036),
    swags: [
      { x0: -W * 0.06, y0: H * 0.1, x1: W * 0.62, y1: H * 0.05, sag: H * 0.1, spacing: u * (tile ? 0.1 : 0.085), phase: 0.3, sway: u * 0.012 },
      { x0: W * 0.52, y0: H * 0.05, x1: W * 1.06, y1: H * 0.11, sag: H * 0.085, spacing: u * (tile ? 0.1 : 0.085), phase: 0.6, sway: u * 0.014 },
    ],
    bulb: { r: u * (tile ? 0.011 : 0.0092), hang: u * 0.018, halo: u * 0.05, wire: tile ? 0.36 : 0.42 },
    bokeh,
    shadow: tile ? { x: 0, y: 4.5, blur: 10 } : { x: 0, y: 9, blur: 20 },
  };
}
