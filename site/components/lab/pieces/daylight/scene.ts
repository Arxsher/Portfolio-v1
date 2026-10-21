// The landscape in the track, as numbers: where things are for a given hour.
// Positions are fractions of the track (x of its width, y of its height,
// y down), so the header switch and the big stage one are the same place at
// different sizes. Nothing here draws or allocates per frame: `updateScene`
// fills a preallocated object.

import { clamp, lerp, seededRandom, smoothstep } from "../../hooks";

export type Lod = "compact" | "tile" | "stage";

/* ---------------------------------------------------------------------- */
/* the track                                                               */
/* ---------------------------------------------------------------------- */

export type Track = {
  /** CSS px */
  w: number;
  h: number;
  /** gap between knob and track edge */
  pad: number;
  /** knob diameter */
  d: number;
  /** distance the knob's centre travels */
  travel: number;
};

/** Track metrics for a pill of w × h CSS px. */
export function trackFor(w: number, h: number, lod: Lod): Track {
  const pad = lod === "compact" ? Math.max(2.5, Math.round(h * 0.11 * 2) / 2) : h * (lod === "tile" ? 0.09 : 0.1);
  const d = h - pad * 2;
  return { w, h, pad, d, travel: Math.max(1, w - pad * 2 - d) };
}

/* ---------------------------------------------------------------------- */
/* hills                                                                   */
/* ---------------------------------------------------------------------- */

/**
 * Hill crests as heights (fraction of the track, from the top) at x = -0.1,
 * 0, 0.1 … 1.1, joined by a Catmull-Rom curve. Far ridges are low and soft,
 * near ones taller and rounder. The mid ridge has a crest at 0.4 for the
 * cabin; the near one dips at 0.2 and 0.75–0.8 where the lake shows.
 */
export const HILLS = {
  far: [0.6, 0.565, 0.585, 0.55, 0.53, 0.565, 0.585, 0.55, 0.52, 0.545, 0.575, 0.55, 0.57],
  mid: [0.72, 0.7, 0.685, 0.705, 0.68, 0.655, 0.69, 0.705, 0.665, 0.675, 0.71, 0.685, 0.7],
  near: [0.84, 0.81, 0.83, 0.87, 0.85, 0.815, 0.82, 0.845, 0.88, 0.885, 0.835, 0.815, 0.84],
} as const;

export type HillLayer = keyof typeof HILLS;

/** Parallax: how far each layer slides (fraction of the width) across the whole travel. */
export const PARALLAX: Record<HillLayer, number> = { far: 0.014, mid: 0.026, near: 0.042 };

/** Height of a layer at x (fraction), before parallax. */
export function hillY(layer: HillLayer, x: number): number {
  const ys = HILLS[layer];
  const f = clamp((x + 0.1) / 0.1, 0, ys.length - 1.0001);
  const i = Math.floor(f);
  const s = f - i;
  const p0 = ys[Math.max(0, i - 1)];
  const p1 = ys[i];
  const p2 = ys[Math.min(ys.length - 1, i + 1)];
  const p3 = ys[Math.min(ys.length - 1, i + 2)];
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s)
  );
}

/** Horizontal shift of a layer at hour t (fraction of the width). */
export const shiftAt = (layer: HillLayer, t: number) => (0.5 - t) * PARALLAX[layer];

/* ---------------------------------------------------------------------- */
/* stars                                                                   */
/* ---------------------------------------------------------------------- */

/** Per star: x, y, radius (fraction of height), threshold, twinkle speed, phase, bright. */
export const STAR_FIELDS = 7;

/**
 * Hand-placed stars for the compact switch (it has room for a few, so each
 * one is placed where it reads), and a seeded field for the bigger ones.
 * The first star is the evening star low over the sunset, out before the
 * others.
 */
export function makeStars(lod: Lod): Float32Array {
  if (lod === "compact") {
    const hand = [
      // x, y, r, threshold, speed, phase, bright
      [0.71, 0.36, 0.04, 0.6, 1.3, 0.2, 1],
      [0.12, 0.3, 0.03, 0.7, 1.9, 1.1, 0],
      [0.2, 0.15, 0.036, 0.72, 2.3, 2.3, 1],
      [0.36, 0.2, 0.026, 0.76, 1.7, 0.7, 0],
      [0.45, 0.42, 0.022, 0.8, 2.6, 3.1, 0],
      [0.53, 0.13, 0.03, 0.74, 1.5, 4.2, 0],
      [0.06, 0.52, 0.022, 0.84, 2.1, 5.0, 0],
      [0.27, 0.46, 0.02, 0.86, 2.9, 1.9, 0],
      [0.42, 0.07, 0.024, 0.82, 1.2, 2.8, 0],
    ];
    const out = new Float32Array(hand.length * STAR_FIELDS);
    hand.forEach((star, i) => out.set(star, i * STAR_FIELDS));
    return out;
  }
  const count = lod === "stage" ? 230 : 46;
  const random = seededRandom(lod === "stage" ? 20261020 : 7);
  const out = new Float32Array((count + 1) * STAR_FIELDS);
  // the evening star
  out.set([0.73, 0.38, lod === "stage" ? 0.012 : 0.022, 0.58, 1.1, 0.4, 1], 0);
  for (let i = 1; i <= count; i++) {
    const x = random();
    // more stars higher up; none in the haze just over the hills
    const y = 0.03 + Math.pow(random(), 1.35) * 0.56;
    const big = random();
    const bright = big > (lod === "stage" ? 0.955 : 0.9) ? 1 : 0;
    const r = (lod === "stage" ? 0.0028 : 0.006) + Math.pow(big, 3) * (lod === "stage" ? 0.0062 : 0.012);
    // brighter stars come out first; those near the horizon last
    const threshold = 0.64 + (1 - big) * 0.18 + y * 0.12 + random() * 0.04;
    out.set([x, y, r, threshold, 0.8 + random() * 2.6, random() * 6.283, bright], i * STAR_FIELDS);
  }
  return out;
}

/* ---------------------------------------------------------------------- */
/* the hour → the scene                                                    */
/* ---------------------------------------------------------------------- */

export type Scene = {
  t: number;
  /** sun centre (fractions) and radius (fraction of the height) */
  sunX: number;
  sunY: number;
  sunR: number;
  /** vertical squash of the sun near the horizon (1 = round) */
  sunFlat: number;
  /** how much the sun lights the land (0 once it is down) */
  sunLight: number;
  moonX: number;
  moonY: number;
  moonR: number;
  /** how much the moon lights the land */
  moonLight: number;
  /** 0 … 1 golden-hour warmth */
  golden: number;
  /** the glow along the horizon around sunset */
  glow: number;
  /** the pink band opposite the sunset in the blue hour */
  belt: number;
  /** overall star visibility */
  night: number;
  /** windows and fireflies */
  lamps: number;
  /** birds in the day sky */
  birds: number;
  /** where the light on the knob comes from (fractions) and how strong / warm it is */
  lightX: number;
  lightY: number;
  light: number;
  warm: number;
};

export function createScene(): Scene {
  return {
    t: 0,
    sunX: 0,
    sunY: 0,
    sunR: 0,
    sunFlat: 1,
    sunLight: 1,
    moonX: 0,
    moonY: 0,
    moonR: 0,
    moonLight: 0,
    golden: 0,
    glow: 0,
    belt: 0,
    night: 0,
    lamps: 0,
    birds: 1,
    lightX: 0,
    lightY: 0,
    light: 1,
    warm: 0,
  };
}

const SUN_R: Record<Lod, number> = { compact: 0.135, tile: 0.1, stage: 0.072 };
const MOON_R: Record<Lod, number> = { compact: 0.14, tile: 0.1, stage: 0.07 };

/** Sun position at hour t (fractions). */
export function sunAt(t: number): [number, number] {
  const u = clamp(t / 0.7);
  return [0.675 + 0.22 * Math.pow(u, 1.1), 0.2 + 0.6 * Math.pow(u, 1.9)];
}

/** Moon position at hour t (fractions). */
export function moonAt(t: number): [number, number] {
  const v = smoothstep(0.5, 1, t);
  return [0.14 + 0.15 * v, 0.95 - 0.63 * Math.pow(v, 0.8)];
}

export function updateScene(s: Scene, t: number, lod: Lod) {
  s.t = t;
  const [sx, sy] = sunAt(t);
  s.sunX = sx;
  s.sunY = sy;
  s.sunR = SUN_R[lod];
  s.sunFlat = lerp(1, 0.9, smoothstep(0.45, 0.6, t));
  s.sunLight = 1 - smoothstep(0.48, 0.62, t);
  const [mx, my] = moonAt(t);
  s.moonX = mx;
  s.moonY = my;
  s.moonR = MOON_R[lod];
  s.moonLight = smoothstep(0.7, 0.95, t);
  s.golden = smoothstep(0.1, 0.38, t) * (1 - smoothstep(0.58, 0.72, t));
  s.glow = smoothstep(0.28, 0.55, t) * (1 - smoothstep(0.64, 0.86, t));
  s.belt = smoothstep(0.52, 0.66, t) * (1 - smoothstep(0.74, 0.9, t));
  s.night = smoothstep(0.58, 0.92, t);
  s.lamps = smoothstep(0.5, 0.68, t);
  s.birds = 1 - smoothstep(0.38, 0.56, t);

  // light on the knob: the sun while it is up, the moon later, a dim gap between
  const sunW = s.sunLight;
  const moonW = s.moonLight * 0.55;
  const total = sunW + moonW;
  if (total > 0.001) {
    s.lightX = (sx * sunW + mx * moonW) / total;
    s.lightY = (sy * sunW + my * moonW) / total;
  } else {
    s.lightX = 0.5;
    s.lightY = 0.2;
  }
  s.light = Math.max(sunW, moonW, 0.18);
  s.warm = s.golden;
}
