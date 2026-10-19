// Day and night for the city, as plain numbers so they can be blended while
// the site theme changes (the windows come on one by one as night falls).
//
// Day: a white architectural model on a pale plaster base, lit by a soft
// key from the upper left with a cool sky fill; restrained, almost
// monochrome, so the heights do the talking. Night: the same model in slate
// under a low blue moon, with warm windows and a red beacon on the tallest
// tower.

import { clamp, lerp } from "../../hooks";

export type RGB = readonly [number, number, number];

export type Look = {
  /** Walls and roofs (albedo, 0..255). */
  wall: RGB;
  roof: RGB;
  /** Plinth (the model's base): its top surface and its sides. */
  base: RGB;
  baseSide: RGB;
  /** Paving of a lot, and of a lot with nothing built on it. */
  pad: RGB;
  padEmpty: RGB;
  /** Light: a coloured fill from the sky and a key from the upper left. */
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
  /** Month labels painted on the plinth. */
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
  wall: [250, 249, 246],
  roof: [252, 251, 249],
  base: [233, 231, 226],
  baseSide: [226, 223, 217],
  pad: [242, 240, 236],
  padEmpty: [226, 223, 216],
  ambient: [0.56, 0.58, 0.63],
  key: [0.47, 0.45, 0.41],
  bounce: 0.07,
  glass: [176, 188, 201],
  glassMix: 0.42,
  shadow: 0.27,
  contact: 0.17,
  shadowTint: [62, 58, 70],
  rim: [255, 255, 255],
  rimAlpha: 0.9,
  label: [120, 116, 110],
  labelAlpha: 0.75,
  drop: 0.16,
  skyTop: [255, 255, 255],
  skyAlpha: 0.55,
  haze: [255, 238, 212],
  hazeAlpha: 0.32,
};

export const NIGHT: Look = {
  wall: [88, 96, 116],
  roof: [104, 112, 134],
  base: [58, 62, 74],
  baseSide: [54, 58, 70],
  pad: [70, 75, 90],
  padEmpty: [52, 56, 68],
  ambient: [0.42, 0.46, 0.6],
  key: [0.36, 0.42, 0.62],
  bounce: 0.05,
  glass: [44, 50, 66],
  glassMix: 0.25,
  shadow: 0.34,
  contact: 0.3,
  shadowTint: [6, 8, 16],
  rim: [176, 196, 255],
  rimAlpha: 0.38,
  label: [150, 158, 182],
  labelAlpha: 0.7,
  drop: 0.5,
  skyTop: [27, 33, 52],
  skyAlpha: 0.8,
  haze: [96, 116, 170],
  hazeAlpha: 0.16,
};

/** Warm window lights (a few cooler ones mixed in). */
export const WINDOW_LIGHTS: readonly RGB[] = [
  [255, 206, 138],
  [255, 222, 168],
  [255, 190, 116],
  [255, 236, 196],
  [206, 222, 255],
];

const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** The look `t` of the way from day (0) to night (1). */
export function lookAt(t: number): Look {
  const n = clamp(t);
  if (n <= 0) return DAY;
  if (n >= 1) return NIGHT;
  const out = {} as Record<keyof Look, unknown>;
  for (const key of Object.keys(DAY) as Array<keyof Look>) {
    const a = DAY[key];
    const b = NIGHT[key];
    out[key] = typeof a === "number" ? lerp(a, b as number, n) : mix(a as RGB, b as RGB, n);
  }
  return out as Look;
}

/** "rgb(…)" with an optional alpha, channels clamped and rounded. */
export function css(color: RGB, alpha = 1): string {
  const r = Math.round(clamp(color[0], 0, 255));
  const g = Math.round(clamp(color[1], 0, 255));
  const b = Math.round(clamp(color[2], 0, 255));
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${Math.max(0, alpha).toFixed(3)})`;
}

/** albedo × (ambient + key × diffuse) + bounce. */
export function shade(albedo: RGB, look: Look, diffuse: number, extra = 0): RGB {
  const { ambient, key } = look;
  return [
    albedo[0] * (ambient[0] + key[0] * diffuse + extra),
    albedo[1] * (ambient[1] + key[1] * diffuse + extra),
    albedo[2] * (ambient[2] + key[2] * diffuse + extra),
  ];
}
