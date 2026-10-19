// Materials and light for each site theme, and the keycap colourways.
//
// Day: bead-blasted silver anodised aluminium with diamond-cut edges, in a
// bright studio. Night: graphite anodised aluminium (the cut edges show
// bare metal, so they stay bright) in a dim room where the glow carries.
// All colours are linear RGB.

import { linearHex, type Vec3 } from "./math";
import type { Caps, Look } from "./renderer";

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

export const DAY: Look = {
  keyDir: norm([-0.5, 0.84, -0.3]),
  keyColor: [1, 0.985, 0.96],
  sky: [0.78, 0.79, 0.81],
  horizon: [0.56, 0.57, 0.59],
  floor: [0.5, 0.5, 0.51],
  softbox: [1.9, 1.9, 1.86],
  strip: [1.4, 1.4, 1.42],
  ambient: 0.6,
  exposure: 1,
  caseAlbedo: [0.3, 0.305, 0.32],
  caseF0: [0.4, 0.405, 0.42],
  caseRough: 0.34,
  caseMetal: 0.55,
  edgeF0: [0.94, 0.94, 0.95],
  plateAlbedo: [0.2, 0.2, 0.21],
  knobF0: [0.82, 0.83, 0.85],
  engrave: [0.07, 0.07, 0.075],
  shadow: [0.3, 0.2],
  glowGain: 1.2,
  bloom: 0.3,
};

export const NIGHT: Look = {
  keyDir: norm([-0.5, 0.84, -0.3]),
  keyColor: [0.82, 0.83, 0.88],
  sky: [0.16, 0.165, 0.18],
  horizon: [0.055, 0.056, 0.062],
  floor: [0.012, 0.012, 0.013],
  softbox: [1.25, 1.25, 1.32],
  strip: [0.7, 0.7, 0.76],
  ambient: 0.55,
  exposure: 1,
  caseAlbedo: [0.022, 0.023, 0.026],
  caseF0: [0.1, 0.104, 0.112],
  caseRough: 0.4,
  caseMetal: 0.6,
  edgeF0: [0.78, 0.79, 0.81],
  plateAlbedo: [0.025, 0.025, 0.028],
  knobF0: [0.18, 0.18, 0.19],
  engrave: [0.2, 0.2, 0.21],
  shadow: [0.5, 0.36],
  glowGain: 1,
  bloom: 0.75,
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/** The look between day (0) and night (1). */
export function lookAt(t: number, out?: Look): Look {
  if (t <= 0 && !out) return DAY;
  if (t >= 1 && !out) return NIGHT;
  return {
    keyDir: norm(mix3(DAY.keyDir, NIGHT.keyDir, t)),
    keyColor: mix3(DAY.keyColor, NIGHT.keyColor, t),
    sky: mix3(DAY.sky, NIGHT.sky, t),
    horizon: mix3(DAY.horizon, NIGHT.horizon, t),
    floor: mix3(DAY.floor, NIGHT.floor, t),
    softbox: mix3(DAY.softbox, NIGHT.softbox, t),
    strip: mix3(DAY.strip, NIGHT.strip, t),
    ambient: mix(DAY.ambient, NIGHT.ambient, t),
    exposure: mix(DAY.exposure, NIGHT.exposure, t),
    caseAlbedo: mix3(DAY.caseAlbedo, NIGHT.caseAlbedo, t),
    caseF0: mix3(DAY.caseF0, NIGHT.caseF0, t),
    caseRough: mix(DAY.caseRough, NIGHT.caseRough, t),
    caseMetal: mix(DAY.caseMetal, NIGHT.caseMetal, t),
    edgeF0: mix3(DAY.edgeF0, NIGHT.edgeF0, t),
    plateAlbedo: mix3(DAY.plateAlbedo, NIGHT.plateAlbedo, t),
    knobF0: mix3(DAY.knobF0, NIGHT.knobF0, t),
    engrave: mix3(DAY.engrave, NIGHT.engrave, t),
    shadow: [mix(DAY.shadow[0], NIGHT.shadow[0], t), mix(DAY.shadow[1], NIGHT.shadow[1], t)],
    glowGain: mix(DAY.glowGain, NIGHT.glowGain, t),
    bloom: mix(DAY.bloom, NIGHT.bloom, t),
  };
}

/* ---------------------------------------------------------------------- */
/* keycaps                                                                 */
/* ---------------------------------------------------------------------- */

export type ColourwayId = "chalk" | "graphite" | "sage" | "clay";

export type Colourway = { id: ColourwayId; label: string; cap: string; legend: string };

export const COLOURWAYS: readonly Colourway[] = [
  { id: "chalk", label: "Chalk keycaps", cap: "#e8e5de", legend: "#3b3b3d" },
  { id: "graphite", label: "Graphite keycaps", cap: "#2f3034", legend: "#c4c4c6" },
  { id: "sage", label: "Sage keycaps", cap: "#a7b19c", legend: "#2c3629" },
  { id: "clay", label: "Clay keycaps", cap: "#c4876a", legend: "#fbefe4" },
];

/** The default caps for each theme until you pick a set. */
export const THEME_CAPS: Record<"light" | "dark", ColourwayId> = { light: "chalk", dark: "graphite" };

export function capsFor(id: ColourwayId): Caps {
  const way = COLOURWAYS.find((c) => c.id === id) ?? COLOURWAYS[0];
  return { albedo: linearHex(way.cap), legend: linearHex(way.legend) };
}

export function mixCaps(a: Caps, b: Caps, t: number): Caps {
  return { albedo: mix3(a.albedo, b.albedo, t), legend: mix3(a.legend, b.legend, t) };
}

/** A swatch background: the cap colour with a soft top light. */
export function swatchFor(way: Colourway): string {
  return `linear-gradient(180deg, color-mix(in oklab, ${way.cap} 82%, #fff) 0%, ${way.cap} 55%, color-mix(in oklab, ${way.cap} 88%, #000) 100%)`;
}
