// The camera: where it stands, how wide it sees for the frame it fills,
// and the projections the piece needs (the sun's place on screen, the
// hour nearest a point on screen). The eye stands low by the water so the
// viaduct and its reflection both fit; wide frames see the whole curve
// from portal to portal, narrow (phone) frames crop to the arches and get
// more sky and more river.

import { sunAzimuth, sunElevation } from "./sky";
import { direction, invert, lookAt, multiply, perspective, project, type Mat4, type Vec3 } from "./math";

export type View = {
  viewProj: Mat4;
  invViewProj: Mat4;
  view: Mat4;
  proj: Mat4;
  eye: Vec3;
  target: Vec3;
  /** half the vertical field of view (radians) */
  vHalf: number;
  /** how much of the sun's sideways path to keep (narrow frames squeeze it in) */
  sunScale: number;
  /** CSS px of the frame */
  width: number;
  height: number;
};

export function newView(): View {
  return {
    viewProj: new Float32Array(16),
    invViewProj: new Float32Array(16),
    view: new Float32Array(16),
    proj: new Float32Array(16),
    eye: [0, 2, 12],
    target: [0, 12, 100],
    vHalf: 0.3,
    sunScale: 1,
    width: 1,
    height: 1,
  };
}

const UP: Vec3 = [0, 1, 0];
/** How far up the river the eye stands (the viaduct's middle is 90 from the origin). */
export const EYE_Z = 12;
const DEG = Math.PI / 180;

/**
 * Frame the valley for a width × height (CSS px) view. px, py (−1..1) nudge
 * the eye for parallax. `tile` frames a little tighter on the arches.
 */
export function frameView(out: View, width: number, height: number, px: number, py: number, tile: boolean): View {
  const aspect = Math.max(0.4, width / Math.max(1, height));
  // 0 for a phone in portrait … 1 for the wide stage
  const wide = Math.min(1, Math.max(0, (aspect - 0.75) / (1.65 - 0.75)));
  // narrow frames crop to the arches (the portals fall outside)
  const hHalf = (tile ? 20 + 7 * wide : 20 + 12.5 * wide) * DEG;
  const vHalf = Math.atan(Math.tan(hHalf) / aspect);
  // wide: the bottom edge just takes in the train's reflection; narrow: the
  // eye looks level, so the reflection sits above the controls and the sky
  // keeps a third of the frame
  const pitch = (1 - wide) * 1.0 * DEG + wide * (vHalf - (tile ? 16.5 : 15) * DEG);
  out.vHalf = vHalf;
  out.width = width;
  out.height = height;
  out.sunScale = Math.min(1, Math.tan(hHalf * 0.86) / Math.tan(32 * DEG));

  const eye = out.eye;
  eye[0] = px * 1.4;
  eye[1] = 2.0 + py * 0.45;
  eye[2] = EYE_Z;
  const dist = 100;
  out.target[0] = 0;
  out.target[1] = eye[1] + Math.tan(pitch) * dist;
  out.target[2] = EYE_Z + dist;
  lookAt(out.view, eye, out.target, UP);
  perspective(out.proj, vHalf * 2, aspect, 0.5, 2400);
  // mirror x so +x is to the right on screen (the world is built that way)
  out.proj[0] = -out.proj[0];
  multiply(out.viewProj, out.proj, out.view);
  invert(out.invViewProj, out.viewProj);
  return out;
}

const scratchDir: Vec3 = [0, 0, 0];
const scratchNdc: Vec3 = [0, 0, 0];

/** Where a direction (unit, from the eye) lands on screen, in CSS px; false if behind. */
export function screenOf(v: View, dir: Vec3, out: { x: number; y: number }): boolean {
  const far = 1000;
  const w = project(scratchNdc, v.viewProj, v.eye[0] + dir[0] * far, v.eye[1] + dir[1] * far, v.eye[2] + dir[2] * far);
  out.x = (scratchNdc[0] * 0.5 + 0.5) * v.width;
  out.y = (0.5 - scratchNdc[1] * 0.5) * v.height;
  return w > 0;
}

/** The sun's place on screen at this hour (CSS px). */
export function sunScreen(v: View, hour: number, out: { x: number; y: number }): boolean {
  direction(scratchDir, sunAzimuth(hour) * v.sunScale, sunElevation(hour));
  return screenOf(v, scratchDir, out);
}

const probe = { x: 0, y: 0 };

/**
 * The hour whose sun is nearest (x, y) on screen, searched from lo to hi
 * (past the day's ends the path carries on, for rubber banding).
 */
export function hourNearest(v: View, x: number, y: number, lo: number, hi: number): number {
  let best = lo;
  let bestD = Infinity;
  // coarse, then fine around the best
  for (let h = lo; h <= hi + 1e-6; h += 0.05) {
    sunScreen(v, h, probe);
    const d = (probe.x - x) ** 2 + (probe.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  const a = Math.max(lo, best - 0.06);
  const b = Math.min(hi, best + 0.06);
  for (let h = a; h <= b + 1e-6; h += 0.004) {
    sunScreen(v, h, probe);
    const d = (probe.x - x) ** 2 + (probe.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  return best;
}

/** Radians per CSS px down the frame (stars are drawn about a pixel wide). */
export function pixelAngle(v: View): number {
  return (2 * v.vHalf) / Math.max(1, v.height);
}
