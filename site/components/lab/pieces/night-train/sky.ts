// The hour, and everything the light does with it. One number drives the
// scene: the hour from four in the afternoon to midnight. From it come
// the sun's place (a path that starts high on the left and sets straight
// up the valley, through the middle arch), the moon's light once it is
// dark, and a set of art-directed colours keyed to the sun's elevation:
// sky, haze, sunlight, ambient, cloud light, exposure. Nothing here
// allocates once a Light exists; lightAt() writes into it.

import { direction, monotone, type Vec3 } from "./math";

export const HOUR_MIN = 16;
export const HOUR_MAX = 24;

/** The sun's elevation and azimuth (degrees; azimuth 0 is straight up the valley, + to the right). */
const elevationAt = monotone(
  [16, 17.5, 19, 19.8, 20.35, 21, 22, 23, 24],
  [21, 14, 6.5, 3, 0, -3.1, -8, -13, -17],
);
const azimuthAt = monotone([16, 18, 19.2, 19.75, 20.35, 22, 24], [-28, -14, -4.5, -0.5, 1.4, 7, 12]);

/** Where the moon stands (it is up all evening, and only shows as the light goes). */
export const MOON_AZ = -19;
export const MOON_EL = 15.5;

export function sunElevation(hour: number): number {
  return elevationAt(hour);
}
export function sunAzimuth(hour: number): number {
  return azimuthAt(hour);
}

/* ---------------------------------------------------------------------- */
/* keyframes                                                               */
/* ---------------------------------------------------------------------- */

type Key = {
  el: number;
  zenith: Vec3;
  horizon: Vec3;
  /** the sky's glow around the sun (forward scattering), added on top */
  glow: Vec3;
  /** direct sunlight, linear radiance */
  sun: Vec3;
  /** ambient from the sky dome and bounced off the ground */
  skyAmb: Vec3;
  groundAmb: Vec3;
  /** the haze's colour and density (per unit) */
  haze: Vec3;
  density: number;
  /** cloud light: lit side, shaded side */
  cloudLit: Vec3;
  cloudShade: Vec3;
  exposure: number;
};

const K = (
  el: number,
  zenith: Vec3,
  horizon: Vec3,
  glow: Vec3,
  sun: Vec3,
  skyAmb: Vec3,
  groundAmb: Vec3,
  haze: Vec3,
  density: number,
  cloudLit: Vec3,
  cloudShade: Vec3,
  exposure: number,
): Key => ({ el, zenith, horizon, glow, sun, skyAmb, groundAmb, haze, density, cloudLit, cloudShade, exposure });

// Linear colours, keyed from the high afternoon down to deep night.
const KEYS: Key[] = [
  K(24, [0.1, 0.27, 0.72], [0.55, 0.7, 0.9], [0.5, 0.42, 0.3], [3.3, 3.05, 2.75], [0.3, 0.42, 0.66], [0.15, 0.16, 0.11], [0.56, 0.68, 0.86], 0.0012, [1.5, 1.48, 1.44], [0.5, 0.56, 0.7], 0.9),
  K(12, [0.1, 0.24, 0.62], [0.66, 0.72, 0.8], [0.95, 0.62, 0.34], [3.25, 2.8, 2.2], [0.27, 0.36, 0.55], [0.16, 0.14, 0.09], [0.66, 0.68, 0.72], 0.0013, [1.6, 1.45, 1.2], [0.48, 0.5, 0.62], 0.92),
  K(6, [0.1, 0.2, 0.48], [1.05, 0.66, 0.36], [1.9, 0.86, 0.32], [3.1, 2.05, 1.05], [0.23, 0.27, 0.42], [0.18, 0.12, 0.07], [0.9, 0.62, 0.42], 0.0015, [1.85, 1.2, 0.66], [0.42, 0.36, 0.44], 0.95),
  K(2.5, [0.09, 0.15, 0.38], [1.2, 0.52, 0.2], [2.5, 0.8, 0.2], [2.6, 1.25, 0.42], [0.19, 0.2, 0.33], [0.17, 0.09, 0.05], [0.95, 0.5, 0.3], 0.0017, [2.1, 0.92, 0.42], [0.4, 0.27, 0.32], 1.0),
  K(0, [0.08, 0.11, 0.3], [1.0, 0.36, 0.14], [1.8, 0.42, 0.12], [1.1, 0.4, 0.12], [0.15, 0.14, 0.26], [0.11, 0.06, 0.04], [0.72, 0.36, 0.26], 0.0018, [1.6, 0.52, 0.3], [0.3, 0.18, 0.26], 1.12),
  K(-2.5, [0.045, 0.065, 0.2], [0.55, 0.25, 0.2], [0.75, 0.25, 0.12], [0, 0, 0], [0.1, 0.1, 0.19], [0.045, 0.036, 0.042], [0.3, 0.22, 0.29], 0.0016, [0.85, 0.36, 0.32], [0.14, 0.1, 0.18], 1.3),
  K(-5, [0.026, 0.04, 0.14], [0.22, 0.14, 0.21], [0.28, 0.11, 0.1], [0, 0, 0], [0.065, 0.068, 0.14], [0.026, 0.024, 0.032], [0.13, 0.115, 0.19], 0.0015, [0.36, 0.19, 0.25], [0.07, 0.06, 0.12], 1.48),
  K(-8, [0.012, 0.021, 0.075], [0.075, 0.07, 0.15], [0.06, 0.04, 0.055], [0, 0, 0], [0.038, 0.043, 0.088], [0.014, 0.013, 0.02], [0.065, 0.065, 0.12], 0.0015, [0.1, 0.09, 0.14], [0.03, 0.03, 0.065], 1.8),
  K(-12, [0.005, 0.009, 0.034], [0.03, 0.035, 0.07], [0.01, 0.01, 0.015], [0, 0, 0], [0.024, 0.028, 0.056], [0.009, 0.009, 0.013], [0.03, 0.035, 0.062], 0.0015, [0.045, 0.05, 0.075], [0.015, 0.017, 0.035], 2.25),
  K(-17, [0.003, 0.0055, 0.02], [0.017, 0.022, 0.046], [0, 0, 0], [0, 0, 0], [0.019, 0.023, 0.046], [0.007, 0.007, 0.011], [0.019, 0.024, 0.045], 0.0014, [0.036, 0.04, 0.06], [0.012, 0.014, 0.028], 2.4),
];

/* ---------------------------------------------------------------------- */
/* the light at an hour                                                    */
/* ---------------------------------------------------------------------- */

export type Light = {
  hour: number;
  /** sun elevation and azimuth, degrees */
  el: number;
  az: number;
  sunDir: Vec3;
  moonDir: Vec3;
  zenith: Vec3;
  horizon: Vec3;
  glow: Vec3;
  sun: Vec3;
  /** moonlight (linear), fades in with the dark */
  moon: Vec3;
  skyAmb: Vec3;
  groundAmb: Vec3;
  haze: Vec3;
  density: number;
  cloudLit: Vec3;
  cloudShade: Vec3;
  exposure: number;
  /** 0 by day … 1 at night */
  night: number;
  /** how much the air shows lamp beams (dusk on) */
  dark: number;
  /** star visibility */
  stars: number;
  /** mist lying on the river after sundown */
  mist: number;
};

const v3 = (): Vec3 => [0, 0, 0];

export function newLight(): Light {
  return {
    hour: 0, el: 0, az: 0,
    sunDir: v3(), moonDir: v3(), zenith: v3(), horizon: v3(), glow: v3(), sun: v3(), moon: v3(),
    skyAmb: v3(), groundAmb: v3(), haze: v3(), density: 0, cloudLit: v3(), cloudShade: v3(), exposure: 1,
    night: 0, dark: 0, stars: 0, mist: 0,
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function blend(out: Vec3, a: Vec3, b: Vec3, t: number) {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
}

/**
 * Write the light for this hour into `out`. `sunScale` widens or narrows
 * the azimuth range so the sun's path stays inside narrow (phone) frames.
 */
export function lightAt(hour: number, out: Light, sunScale = 1): Light {
  const el = elevationAt(hour);
  const az = azimuthAt(hour) * sunScale;
  out.hour = hour;
  out.el = el;
  out.az = az;
  direction(out.sunDir, az, el);
  direction(out.moonDir, MOON_AZ * sunScale, MOON_EL);

  // the keys bracketing this elevation (they run high to low)
  let i = 0;
  while (i < KEYS.length - 2 && el < KEYS[i + 1].el) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  let t = (a.el - el) / (a.el - b.el);
  t = Math.min(1, Math.max(0, t));
  // ease within each step so the colours don't kink at the keys
  t = t * t * (3 - 2 * t) * 0.5 + t * 0.5;
  blend(out.zenith, a.zenith, b.zenith, t);
  blend(out.horizon, a.horizon, b.horizon, t);
  blend(out.glow, a.glow, b.glow, t);
  blend(out.sun, a.sun, b.sun, t);
  blend(out.skyAmb, a.skyAmb, b.skyAmb, t);
  blend(out.groundAmb, a.groundAmb, b.groundAmb, t);
  blend(out.haze, a.haze, b.haze, t);
  blend(out.cloudLit, a.cloudLit, b.cloudLit, t);
  blend(out.cloudShade, a.cloudShade, b.cloudShade, t);
  out.density = a.density + (b.density - a.density) * t;
  out.exposure = a.exposure + (b.exposure - a.exposure) * t;
  // the sun goes behind the far ranges a little before it reaches the horizon
  const behind = smooth(-0.6, 1.6, el);
  out.sun[0] *= behind;
  out.sun[1] *= behind;
  out.sun[2] *= behind;

  out.night = smooth(-3, -11, el);
  out.dark = smooth(2, -6, el);
  out.stars = smooth(-4.5, -11, el);
  out.mist = smooth(-1.5, -9, el);
  const moon = out.night;
  out.moon[0] = 0.15 * moon;
  out.moon[1] = 0.19 * moon;
  out.moon[2] = 0.3 * moon;
  return out;
}

/* ---------------------------------------------------------------------- */
/* words                                                                   */
/* ---------------------------------------------------------------------- */

/** A name for the light at this sun elevation. */
export function phaseFor(el: number): string {
  if (el >= 9) return "Afternoon";
  if (el >= 1) return "Golden hour";
  if (el >= -1.2) return "Sunset";
  if (el >= -5) return "Dusk";
  if (el >= -9.5) return "Blue hour";
  return "Night";
}

/** "19:42" (24 h); midnight reads 00:00. */
export function clockText(hour: number): string {
  const total = Math.round(hour * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
