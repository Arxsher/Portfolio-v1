// Glazes for the wall: five palettes, each a family of five tones, and five
// colourings that say which tone every piece takes. A click moves to the
// next colouring (the ripple), a swatch changes the family.
//
// Tones are named by their part in a colouring, not by hue:
//   main    the glaze most stars take
//   second  its companion (a lighter or neighbouring glaze)
//   deep    the darkest tone (frames, gap stars)
//   light   the white or cream ground
//   accent  the small surprise (triangles, axis pieces, the odd star)
//
// Every piece's glaze is nudged a little from its tone (lighter, darker,
// warmer, cooler, from a stable hash of where it sits), with now and then a
// piece from a visibly different firing, so no two pieces match.

import type { Fold } from "./geometry";
import type { WallPiece } from "./mesh";

export type PaletteId = "fes" | "terracotta" | "chefchaouen" | "emerald" | "mono";

type Tone = "main" | "second" | "deep" | "light" | "accent";

export type GlazePalette = {
  id: PaletteId;
  label: string;
  /** sRGB hex per tone. */
  tones: Record<Tone, string>;
  /** CSS background for the swatch. */
  swatch: string;
};

const P = (id: PaletteId, label: string, tones: Record<Tone, string>): GlazePalette => ({
  id,
  label,
  tones,
  swatch: `conic-gradient(from 210deg, ${tones.main} 0 50%, ${tones.light} 0 76%, ${tones.second} 0 88%, ${tones.accent} 0)`,
});

export const PALETTES: readonly GlazePalette[] = [
  P("fes", "Fes blue", { main: "#1d3f95", second: "#3767bd", deep: "#11265a", light: "#ede5d3", accent: "#1c6a4d" }),
  P("terracotta", "Terracotta", { main: "#ad4a27", second: "#c98a33", deep: "#5e2516", light: "#ebdcc1", accent: "#2a2321" }),
  // the blue town: powder blues and lime-wash, lighter and chalkier than Fes
  P("chefchaouen", "Chefchaouen", { main: "#4a7cc2", second: "#8db5e2", deep: "#24427f", light: "#f3f1ea", accent: "#c9dcef" }),
  P("emerald", "Emerald", { main: "#156647", second: "#3d8b63", deep: "#0c4231", light: "#ece3cd", accent: "#c3892b" }),
  P("mono", "Monochrome", { main: "#1a1b22", second: "#4b4b52", deep: "#0e0f13", light: "#efebe3", accent: "#8f8b83" }),
];

export function paletteById(id: PaletteId): GlazePalette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/* ---------------------------------------------------------------------- */
/* colourings                                                              */
/* ---------------------------------------------------------------------- */

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * For each fold, the shape classes (from geometry.ts, largest first) and a
 * colouring as a function of shape, lattice cell (i, j) and place in the
 * repeat (k). Colourings come in the same order for every fold: classic,
 * inverse, frames, checker, scatter.
 */
type Colouring = (shape: number, i: number, j: number, k: number, r: number, ring: number) => Tone;

/**
 * Rings for the "frames" colouring: how many repeats out from the centre
 * the piece sits (Chebyshev on the square lattices, hexagonal on the
 * twelve), from its real position, so all the pieces around one star share
 * a ring.
 */
function ringOf(fold: Fold, x: number, y: number): number {
  if (fold === 12) {
    const v = y / (Math.sqrt(3) / 2);
    const u = x - v / 2;
    return Math.round(Math.max(Math.abs(u), Math.abs(v), Math.abs(u + v)));
  }
  return Math.round(Math.max(Math.abs(x), Math.abs(y)) - 0.001);
}

// 8: 0 star · 1 cross
const KHATAM: Colouring[] = [
  // stars in the main glaze with a slow diagonal run of the companion, crosses white
  (s, i, j) => (s === 0 ? (mod(i - j, 5) === 0 ? "second" : "main") : "light"),
  // white stars, glazed crosses, every fourth a deep one
  (s, i, j) => (s === 0 ? "light" : mod(i + j, 4) === 0 ? "deep" : "main"),
  // square frames around the centre star
  (s, i, j, k, r, ring) => {
    if (s === 1) return ring === 0 ? "main" : "light";
    return (["accent", "second", "deep", "main", "second", "main"] as const)[ring % 6];
  },
  // a checker of main and deep stars on white
  (s, i, j) => (s === 0 ? (mod(i + j, 2) === 0 ? "main" : "deep") : "light"),
  // hand-laid scatter
  (s, i, j, k, r) => (s === 0 ? (r < 0.68 ? "main" : r < 0.9 ? "second" : "accent") : r < 0.86 ? "light" : "second"),
];

// 12: 0 star · 1 field piece · 2 petal · 3 triangle
const TWELVE: Colouring[] = [
  (s) => (["main", "second", "light", "accent"] as const)[s],
  (s) => (["light", "deep", "main", "accent"] as const)[s],
  (s, i, j, k, r, ring) => {
    if (s === 0) return (["accent", "main", "deep"] as const)[ring % 3];
    return (["", "second", "light", "main"] as const)[s] as Tone;
  },
  (s, i, j) => (s === 0 ? (mod(i - j, 3) === 0 ? "deep" : "main") : (["", "light", "second", "accent"] as const)[s] as Tone),
  (s, i, j, k, r) => {
    if (s === 0) return r < 0.7 ? "main" : "second";
    if (s === 2) return "light";
    return s === 1 ? (r < 0.8 ? "deep" : "accent") : "accent";
  },
];

// 16: 0 star · 1 gap star · 2 axis piece · 3 kite · 4 petal
// The big star always takes a mid glaze or the accent (a deep one reads as
// a hole at this size), ringed by light petals or set off by deep kites.
const SIXTEEN: Colouring[] = [
  (s) => (["second", "deep", "accent", "main", "light"] as const)[s],
  (s) => (["light", "main", "deep", "deep", "main"] as const)[s],
  // the medallion: an accent rosette at the centre in square frames of stars
  (s, i, j, k, r, ring) => {
    if (s === 0) return ring === 0 ? "accent" : ring % 2 ? "second" : "main";
    return (["", "light", "accent", "deep", "light"] as const)[s] as Tone;
  },
  (s, i, j) => (s === 0 ? (mod(i + j, 2) === 0 ? "accent" : "second") : (["", "main", "light", "deep", "light"] as const)[s] as Tone),
  (s, i, j, k, r) => {
    if (s === 0) return r < 0.6 ? "main" : "second";
    if (s === 4) return "light";
    if (s === 1) return "deep";
    return s === 2 ? "accent" : r < 0.75 ? "second" : "main";
  },
];

const COLOURINGS: Record<Fold, Colouring[]> = { 8: KHATAM, 12: TWELVE, 16: SIXTEEN };
export const COLOURING_COUNT = 5;

/* ---------------------------------------------------------------------- */
/* colour                                                                  */
/* ---------------------------------------------------------------------- */

/** Stable 0..1 hash of a few integers. */
export function hashInts(a: number, b: number, c: number, d: number): number {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1) ^ Math.imul(d | 0, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** sRGB hex → linear RGB. */
export function linear(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [toLinear(r), toLinear(g), toLinear(b)];
}

/**
 * Linear RGB glaze for every piece of the wall, written into `out` at
 * `stride` floats per piece (starting at `offset`).
 */
export function glazeWall(
  pieces: readonly WallPiece[],
  fold: Fold,
  palette: GlazePalette,
  colouring: number,
  seed: number,
  out: Float32Array,
  stride: number,
  offset: number,
  /** Where the pattern's centre sits and its scale (to find each piece's ring). */
  origin: { x: number; y: number },
  scale: number,
) {
  const rule = COLOURINGS[fold][mod(colouring, COLOURING_COUNT)];
  const tones = Object.fromEntries(
    (Object.keys(palette.tones) as Tone[]).map((tone) => [tone, linear(palette.tones[tone])]),
  ) as Record<Tone, [number, number, number]>;
  for (const piece of pieces) {
    const r0 = hashInts(piece.i, piece.j, piece.k, 911);
    const ring = ringOf(fold, (piece.centre.x - origin.x) / scale, (piece.centre.y - origin.y) / scale);
    const tone = rule(piece.shape, piece.i, piece.j, piece.k, r0, ring);
    const [r, g, b] = tones[tone];
    // the firing: how far this piece strays from its tone
    const h1 = hashInts(piece.i, piece.j, piece.k, seed);
    const h2 = hashInts(piece.i, piece.j, piece.k, seed + 1);
    const h3 = hashInts(piece.i, piece.j, piece.k, seed + 2);
    const odd = h3 > 0.95 ? 2.2 : 1; // a piece from another batch
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const light = lum > 0.45;
    const value = 1 + (h1 - 0.5) * (light ? 0.07 : 0.3) * odd;
    const warm = (h2 - 0.5) * (light ? 0.05 : 0.08) * odd;
    const sat = 1 + (h3 - 0.5) * 0.2;
    let cr = lum + (r - lum) * sat;
    let cg = lum + (g - lum) * sat;
    let cb = lum + (b - lum) * sat;
    cr = Math.max(0, cr * value * (1 + warm));
    cg = Math.max(0, cg * value * (1 + warm * 0.25));
    cb = Math.max(0, cb * value * (1 - warm * 0.9));
    const o = piece.index * stride + offset;
    out[o] = Math.min(cr, 1);
    out[o + 1] = Math.min(cg, 1);
    out[o + 2] = Math.min(cb, 1);
  }
}
