// Day and night for the city, as plain numbers so they can be blended while
// the site theme changes (the windows come on one by one as night falls).
//
// Day: a white architectural model on a grey plaster base. The base sits a
// step darker than the stage so the white card buildings stand off it, the
// key from the upper left is strong enough that every block has a lit face
// and a shaded one, unbuilt lots are recessed a shade darker than the
// streets, and the tallest roofs catch a slightly warmer light than the low
// ones, so the busy days lead. Almost no colour: the heights do the talking.
//
// Night: the same model in neutral graphite (it sits on the site's #232323
// tile, so no blue cast in the walls, base or sky), lit from above by a
// moon whose coolness lives only in the rim on the roof edges; warm windows
// come on floor by floor and a red beacon breathes on the tallest tower.

import { clamp, lerp } from "../../hooks";

export type RGB = readonly [number, number, number];
type MutableRGB = [number, number, number];

export type Look = {
  /** Walls (albedo, 0..255; may run a little past 255 before light is applied). */
  wall: RGB;
  /** Roofs of low buildings and of the tallest ones (blended by height). */
  roof: RGB;
  roofHigh: RGB;
  /** Plinth (the model's base): its top surface and its sides. */
  base: RGB;
  baseSide: RGB;
  /** Paving of a built lot, and an unbuilt lot. */
  pad: RGB;
  padEmpty: RGB;
  /** Light: a fill from the sky and a key from the upper left. */
  ambient: RGB;
  key: RGB;
  /** Light bouncing off the ground into the lower walls. */
  bounce: number;
  /** Window glass by day (and unlit windows by night). */
  glass: RGB;
  /** How much of the facade colour the glass keeps (0: pure glass colour). */
  glassMix: number;
  /** Sun shadow and contact shadow strength. */
  shadow: number;
  contact: number;
  shadowTint: RGB;
  /** Bright line along the roof edges facing you. */
  rim: RGB;
  rimAlpha: number;
  /** Month labels. */
  label: RGB;
  labelAlpha: number;
  /** Plinth drop shadow on the stage. */
  drop: number;
  /** Sky wash at the top of the stage (alpha 0..1 over the tile colour). */
  skyTop: RGB;
  skyAlpha: number;
  /** Haze around the light, upper left. */
  haze: RGB;
  hazeAlpha: number;
};

export const DAY: Look = {
  wall: [262, 261, 258],
  roof: [258, 258, 259],
  roofHigh: [266, 262, 254],
  base: [224, 223, 220],
  baseSide: [216, 214, 210],
  pad: [240, 239, 236],
  padEmpty: [206, 205, 201],
  ambient: [0.76, 0.77, 0.8],
  key: [0.25, 0.24, 0.21],
  bounce: 0.04,
  glass: [168, 180, 194],
  glassMix: 0.38,
  shadow: 0.34,
  contact: 0.24,
  shadowTint: [58, 56, 64],
  rim: [255, 255, 255],
  rimAlpha: 0.95,
  label: [110, 110, 110],
  labelAlpha: 0.95,
  drop: 0.2,
  skyTop: [255, 255, 255],
  skyAlpha: 0.5,
  haze: [255, 240, 218],
  hazeAlpha: 0.28,
};

export const NIGHT: Look = {
  wall: [76, 77, 80],
  roof: [104, 105, 108],
  roofHigh: [128, 129, 133],
  base: [62, 63, 65],
  baseSide: [56, 57, 59],
  pad: [74, 75, 77],
  padEmpty: [50, 51, 53],
  ambient: [0.47, 0.47, 0.48],
  key: [0.34, 0.34, 0.37],
  bounce: 0.04,
  glass: [22, 23, 27],
  glassMix: 0.22,
  shadow: 0.42,
  contact: 0.4,
  shadowTint: [4, 4, 6],
  rim: [178, 192, 232],
  rimAlpha: 0.36,
  label: [150, 150, 152],
  labelAlpha: 0.9,
  drop: 0.62,
  skyTop: [34, 35, 38],
  skyAlpha: 0.55,
  haze: [150, 155, 170],
  hazeAlpha: 0.045,
};

/** Warm window lights, from amber to soft white (one cooler, like a screen left on). */
export const WINDOW_LIGHTS: readonly RGB[] = [
  [255, 198, 124],
  [255, 214, 158],
  [255, 184, 106],
  [255, 228, 188],
  [255, 206, 140],
  [200, 216, 255],
];

const KEYS = Object.keys(DAY) as Array<keyof Look>;

/** One Look object reused for every blended frame (no garbage while the theme turns). */
const blended: Record<keyof Look, number | MutableRGB> = (() => {
  const out = {} as Record<keyof Look, number | MutableRGB>;
  for (const key of KEYS) {
    const value = DAY[key];
    out[key] = typeof value === "number" ? value : [value[0], value[1], value[2]];
  }
  return out;
})();

/**
 * The look `t` of the way from day (0) to night (1). Mid-blend it returns
 * the same shared object each time, rewritten in place: read it, don't keep it.
 */
export function lookAt(t: number): Look {
  const n = clamp(t);
  if (n <= 0) return DAY;
  if (n >= 1) return NIGHT;
  for (const key of KEYS) {
    const a = DAY[key];
    const b = NIGHT[key];
    if (typeof a === "number") blended[key] = lerp(a, b as number, n);
    else {
      const out = blended[key] as MutableRGB;
      const c = b as RGB;
      out[0] = lerp(a[0], c[0], n);
      out[1] = lerp(a[1], c[1], n);
      out[2] = lerp(a[2], c[2], n);
    }
  }
  return blended as unknown as Look;
}

/* ---------------------------------------------------------------------- */
/* colour strings                                                          */
/* ---------------------------------------------------------------------- */

// Canvas wants colours as strings, and building one per wall, roof and
// window every frame makes a lot of garbage. Colours are quantised to whole
// channels (and alpha to 1/255) and their strings kept in a small cache.
const cache = new Map<number, string>();

/** "rgb(…)" for channels 0..255 (clamped, rounded) and alpha 0..1. */
export function rgb(r: number, g: number, b: number, alpha = 1): string {
  const R = r <= 0 ? 0 : r >= 255 ? 255 : Math.round(r);
  const G = g <= 0 ? 0 : g >= 255 ? 255 : Math.round(g);
  const B = b <= 0 ? 0 : b >= 255 ? 255 : Math.round(b);
  const A = alpha >= 1 ? 255 : alpha <= 0 ? 0 : Math.round(alpha * 255);
  const key = ((R << 16) | (G << 8) | B) * 256 + A;
  let value = cache.get(key);
  if (value === undefined) {
    if (cache.size > 6000) cache.clear();
    value = A === 255 ? `rgb(${R} ${G} ${B})` : `rgb(${R} ${G} ${B} / ${(A / 255).toFixed(3)})`;
    cache.set(key, value);
  }
  return value;
}

/** "rgb(…)" with an optional alpha. */
export function css(color: RGB, alpha = 1): string {
  return rgb(color[0], color[1], color[2], alpha);
}

/** Scratch colour for shadeInto() callers. */
export function rgbScratch(): MutableRGB {
  return [0, 0, 0];
}

/** out = albedo × (ambient + key × diffuse + extra). Returns `out`. */
export function shadeInto(out: MutableRGB, albedo: RGB, look: Look, diffuse: number, extra = 0): MutableRGB {
  const { ambient, key } = look;
  out[0] = albedo[0] * (ambient[0] + key[0] * diffuse + extra);
  out[1] = albedo[1] * (ambient[1] + key[1] * diffuse + extra);
  out[2] = albedo[2] * (ambient[2] + key[2] * diffuse + extra);
  return out;
}

/** albedo × (ambient + key × diffuse) + bounce, as a new colour (for one-off use). */
export function shade(albedo: RGB, look: Look, diffuse: number, extra = 0): RGB {
  return shadeInto([0, 0, 0], albedo, look, diffuse, extra);
}
