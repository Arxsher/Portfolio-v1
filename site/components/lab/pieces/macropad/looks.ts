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
  // with the long tonemap shoulder, a hair under 1 keeps the cap tops (and
  // their colour) off the top of the curve
  exposure: 0.9,
  caseAlbedo: [0.3, 0.305, 0.32],
  caseF0: [0.4, 0.405, 0.42],
  caseRough: 0.34,
  caseMetal: 0.55,
  edgeF0: [0.94, 0.94, 0.95],
  plateAlbedo: [0.2, 0.2, 0.21],
  knobF0: [0.82, 0.83, 0.85],
  engrave: [0.07, 0.07, 0.075],
  shadow: [0.3, 0.2],
  // daylight washes LEDs out; less of it, with more bloom, reads as light
  // pooling under the caps rather than paint between them
  glowGain: 0.9,
  emitKnee: 0.85,
  bloom: 0.42,
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
  emitKnee: 1.7,
  bloom: 0.75,
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 => {
  out[0] = mix(a[0], b[0], t);
  out[1] = mix(a[1], b[1], t);
  out[2] = mix(a[2], b[2], t);
  return out;
};

/** A Look to write into (one per piece instance, reused every frame). */
export function blankLook(): Look {
  const v = (): Vec3 => [0, 0, 0];
  return {
    keyDir: v(),
    keyColor: v(),
    sky: v(),
    horizon: v(),
    floor: v(),
    softbox: v(),
    strip: v(),
    ambient: 0,
    exposure: 1,
    caseAlbedo: v(),
    caseF0: v(),
    caseRough: 0,
    caseMetal: 0,
    edgeF0: v(),
    plateAlbedo: v(),
    knobF0: v(),
    engrave: v(),
    shadow: [0, 0],
    glowGain: 1,
    emitKnee: 1,
    bloom: 0,
  };
}

/** The look between day (0) and night (1), written into `out` (no allocation). */
export function lookInto(t: number, out: Look): Look {
  const k = Math.min(1, Math.max(0, t));
  mix3(out.keyDir, DAY.keyDir, NIGHT.keyDir, k);
  const l = Math.hypot(out.keyDir[0], out.keyDir[1], out.keyDir[2]) || 1;
  out.keyDir[0] /= l;
  out.keyDir[1] /= l;
  out.keyDir[2] /= l;
  mix3(out.keyColor, DAY.keyColor, NIGHT.keyColor, k);
  mix3(out.sky, DAY.sky, NIGHT.sky, k);
  mix3(out.horizon, DAY.horizon, NIGHT.horizon, k);
  mix3(out.floor, DAY.floor, NIGHT.floor, k);
  mix3(out.softbox, DAY.softbox, NIGHT.softbox, k);
  mix3(out.strip, DAY.strip, NIGHT.strip, k);
  out.ambient = mix(DAY.ambient, NIGHT.ambient, k);
  out.exposure = mix(DAY.exposure, NIGHT.exposure, k);
  mix3(out.caseAlbedo, DAY.caseAlbedo, NIGHT.caseAlbedo, k);
  mix3(out.caseF0, DAY.caseF0, NIGHT.caseF0, k);
  out.caseRough = mix(DAY.caseRough, NIGHT.caseRough, k);
  out.caseMetal = mix(DAY.caseMetal, NIGHT.caseMetal, k);
  mix3(out.edgeF0, DAY.edgeF0, NIGHT.edgeF0, k);
  mix3(out.plateAlbedo, DAY.plateAlbedo, NIGHT.plateAlbedo, k);
  mix3(out.knobF0, DAY.knobF0, NIGHT.knobF0, k);
  mix3(out.engrave, DAY.engrave, NIGHT.engrave, k);
  out.shadow[0] = mix(DAY.shadow[0], NIGHT.shadow[0], k);
  out.shadow[1] = mix(DAY.shadow[1], NIGHT.shadow[1], k);
  out.glowGain = mix(DAY.glowGain, NIGHT.glowGain, k);
  out.emitKnee = mix(DAY.emitKnee, NIGHT.emitKnee, k);
  out.bloom = mix(DAY.bloom, NIGHT.bloom, k);
  return out;
}

/** The look between day (0) and night (1). Allocates only between the two. */
export function lookAt(t: number): Look {
  if (t <= 0) return DAY;
  if (t >= 1) return NIGHT;
  return lookInto(t, blankLook());
}

/* ---------------------------------------------------------------------- */
/* keycaps                                                                 */
/* ---------------------------------------------------------------------- */

export type ColourwayId = "chalk" | "graphite" | "sage" | "clay";

export type Colourway = { id: ColourwayId; label: string; cap: string; legend: string };

export const COLOURWAYS: readonly Colourway[] = [
  { id: "chalk", label: "Chalk keycaps", cap: "#e8e5de", legend: "#3b3b3d" },
  { id: "graphite", label: "Graphite keycaps", cap: "#2f3034", legend: "#c4c4c6" },
  // the ink takes the cap's lighting, so it has to start deep to stay crisp
  { id: "sage", label: "Sage keycaps", cap: "#a7b19c", legend: "#1f271d" },
  // cream on clay can't reach 3:1 once lit: a deep cocoa ink does, in both themes
  { id: "clay", label: "Clay keycaps", cap: "#c4876a", legend: "#3a2219" },
];

/** The default caps for each theme until you pick a set. */
export const THEME_CAPS: Record<"light" | "dark", ColourwayId> = { light: "chalk", dark: "graphite" };

/** Every colourway in linear RGB, worked out once. Read-only: copy before mixing into one. */
const CAPS = Object.fromEntries(
  COLOURWAYS.map((way) => [way.id, { albedo: linearHex(way.cap), legend: linearHex(way.legend) }]),
) as Record<ColourwayId, Caps>;

export function capsFor(id: ColourwayId): Readonly<Caps> {
  return CAPS[id] ?? CAPS.chalk;
}

export const copyCaps = (c: Readonly<Caps>): Caps => ({ albedo: [...c.albedo], legend: [...c.legend] });

/**
 * Eases `out` toward `target` by t, in place. Returns how far it still is;
 * once that is tiny it snaps, so callers can skip the work afterwards.
 */
export function mixCapsInto(out: Caps, target: Readonly<Caps>, t: number): number {
  let gap = 0;
  for (let i = 0; i < 3; i++) {
    out.albedo[i] = mix(out.albedo[i], target.albedo[i], t);
    out.legend[i] = mix(out.legend[i], target.legend[i], t);
    gap += Math.abs(out.albedo[i] - target.albedo[i]) + Math.abs(out.legend[i] - target.legend[i]);
  }
  if (gap < 0.002) {
    for (let i = 0; i < 3; i++) {
      out.albedo[i] = target.albedo[i];
      out.legend[i] = target.legend[i];
    }
    return 0;
  }
  return gap;
}

/** A swatch background: the cap colour with a soft top light. */
export function swatchFor(way: Colourway): string {
  return `linear-gradient(180deg, color-mix(in oklab, ${way.cap} 82%, #fff) 0%, ${way.cap} 55%, color-mix(in oklab, ${way.cap} 88%, #000) 100%)`;
}
