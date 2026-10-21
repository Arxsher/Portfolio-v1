// The colours of the hour. Every colour in the switch is a channel with five
// keyframes along the knob's travel (afternoon, golden hour, sunset, blue
// hour, night). They are mixed in OKLab, so the sky passes through warm
// golds and violets instead of the grey an sRGB blend gives, and baked once
// per channel into a 256-step table, so drawing a frame looks colours up
// instead of building them (no per-frame colour maths or string churn).

/** Where the five keyframes sit along t (0 = afternoon, 1 = night). */
export const STOPS = [0, 0.34, 0.58, 0.75, 1] as const;

const CHANNELS = {
  // sky, top to bottom
  zenith: ["#80aedb", "#879fcc", "#56659b", "#252f59", "#0b1020"],
  upper: ["#a2c5e6", "#b4bbd6", "#8f80a6", "#394273", "#121932"],
  lower: ["#c7ddee", "#ecc6a6", "#de9886", "#666290", "#19223f"],
  horizon: ["#e3edf0", "#f7d89f", "#f3aa74", "#9c7c9c", "#232e4d"],
  // the sun and the glow it lays along the horizon
  sun: ["#fffcf2", "#fff0cb", "#ffc07c", "#ff9a66", "#ff9a66"],
  sunGlow: ["#fff8e2", "#ffd897", "#ffa56e", "#e07f6c", "#e07f6c"],
  // hills, far to near (atmospheric perspective: far ones lean to the sky)
  far: ["#b2c6d1", "#c5b3ab", "#94808f", "#3d3f5d", "#1b2238"],
  mid: ["#97b2a2", "#988d77", "#675b69", "#2c2e48", "#141a2c"],
  near: ["#789884", "#706d57", "#473f4d", "#1f2139", "#0d111d"],
  fore: ["#5e7f6b", "#565541", "#342d39", "#16182b", "#080b14"],
  // light caught on hill crests and cloud undersides
  rim: ["#ffffff", "#ffe1a6", "#ffb27e", "#b98a9e", "#6a76a3"],
  cloud: ["#ffffff", "#fff1dd", "#f6c4a8", "#8a85a8", "#4a5374"],
  cloudShade: ["#dde8f1", "#dcc3c1", "#a98199", "#4a4b6d", "#212943"],
  // still water: the sky turned over, a touch deeper
  lake: ["#b4cfe2", "#e9c59c", "#da9478", "#5b5882", "#18203c"],
  lakeDeep: ["#8db0cb", "#ab9ba1", "#8b6f87", "#2d3257", "#0e1427"],
  // the knob: white in daylight, warm at golden hour, moonlit at night
  knob: ["#ffffff", "#fffaf3", "#fff3ec", "#e4e6ef", "#d3d8e3"],
  knobShade: ["#e3e7eb", "#eee1d5", "#ecd8d1", "#b5bacb", "#959eb3"],
} as const;

export type Channel = keyof typeof CHANNELS;

const STEPS = 256;

/* ---------------------------------------------------------------------- */
/* OKLab                                                                   */
/* ---------------------------------------------------------------------- */

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const toByte = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

function hexToOklab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = toLinear((n >> 16) & 255);
  const g = toLinear((n >> 8) & 255);
  const b = toLinear(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb(L: number, A: number, B: number, out: Uint8ClampedArray, at: number) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  out[at] = toByte(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  out[at + 1] = toByte(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  out[at + 2] = toByte(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
}

/* ---------------------------------------------------------------------- */
/* tables                                                                  */
/* ---------------------------------------------------------------------- */

type Table = { rgb: Uint8ClampedArray; css: string[] };
const tables = new Map<Channel, Table>();

/** Eased position between two keyframes (smoothstep: no kinks at the stops). */
function segment(t: number): [number, number] {
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t <= STOPS[i + 1] || i === STOPS.length - 2) {
      const u = Math.max(0, Math.min(1, (t - STOPS[i]) / (STOPS[i + 1] - STOPS[i])));
      return [i, u * u * (3 - 2 * u)];
    }
  }
  return [0, 0];
}

function table(channel: Channel): Table {
  let entry = tables.get(channel);
  if (entry) return entry;
  const keys = CHANNELS[channel].map(hexToOklab);
  const rgb = new Uint8ClampedArray(STEPS * 3);
  const css: string[] = new Array(STEPS);
  for (let i = 0; i < STEPS; i++) {
    const [k, u] = segment(i / (STEPS - 1));
    const a = keys[k];
    const b = keys[k + 1];
    oklabToRgb(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, rgb, i * 3);
    css[i] = `rgb(${rgb[i * 3]},${rgb[i * 3 + 1]},${rgb[i * 3 + 2]})`;
  }
  entry = { rgb, css };
  tables.set(channel, entry);
  return entry;
}

const index = (t: number) => Math.max(0, Math.min(STEPS - 1, Math.round(t * (STEPS - 1))));

/** The channel's colour at t as a CSS string (cached; no allocation). */
export function color(channel: Channel, t: number): string {
  return table(channel).css[index(t)];
}

/**
 * The channel's colour at t with an alpha, as a CSS string. Builds a string,
 * so keep it to gradient stops (a few per frame), never per-particle loops.
 */
export function rgba(channel: Channel, t: number, alpha: number): string {
  const { rgb } = table(channel);
  const i = index(t) * 3;
  return `rgba(${rgb[i]},${rgb[i + 1]},${rgb[i + 2]},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

/** The channel's colour at t as 0–255 numbers written into `out`. */
export function rgbInto(channel: Channel, t: number, out: Uint8ClampedArray | number[], at = 0) {
  const { rgb } = table(channel);
  const i = index(t) * 3;
  out[at] = rgb[i];
  out[at + 1] = rgb[i + 1];
  out[at + 2] = rgb[i + 2];
}

/** A keyframe's colour exactly (for the static, pre-hydration art). */
export function keyColor(channel: Channel, stop: number): string {
  return CHANNELS[channel][stop];
}

/* ---------------------------------------------------------------------- */
/* the hour                                                                */
/* ---------------------------------------------------------------------- */

/** Clock minutes at the keyframes: 14:00 … 18:20 … 19:40 … 20:25 … 22:30. */
const CLOCK = [840, 1100, 1180, 1225, 1350] as const;

/** Minutes after midnight shown for t. */
export function minutesAt(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (c <= STOPS[i + 1]) {
      const u = (c - STOPS[i]) / (STOPS[i + 1] - STOPS[i]);
      return CLOCK[i] + (CLOCK[i + 1] - CLOCK[i]) * u;
    }
  }
  return CLOCK[CLOCK.length - 1];
}

export function formatClock(minutes: number): string {
  const m = Math.floor(minutes) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h < 10 ? "0" : ""}${h}:${mm < 10 ? "0" : ""}${mm}`;
}

/** The name of the part of the day at t. */
export function phaseAt(t: number): string {
  if (t < 0.18) return "Afternoon";
  if (t < 0.48) return "Golden hour";
  if (t < 0.64) return "Sunset";
  if (t < 0.84) return "Blue hour";
  return "Night";
}
