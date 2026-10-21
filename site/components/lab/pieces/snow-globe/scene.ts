// The snow globe's world: one set of numbers that the shaders (baked in as
// GLSL constants), the snow simulation (a height field of everything snow
// can land on) and the camera all share.
//
// Object space: the glass sphere's centre is the origin, its outer radius
// 1, y up, the camera in front on +z. The wooden base hangs below the
// sphere; its underside sits on the stage's floor at FLOOR_Y. The globe
// moves as a rigid body about PIVOT (the collar, where a hand would hold it).

export type Vec3 = [number, number, number];

/* ---------------------------------------------------------------------- */
/* glass and water                                                         */
/* ---------------------------------------------------------------------- */

export const R_OUT = 1;
/** Inner surface of the glass: the water inside is a sphere this big. */
export const R_IN = 0.955;
export const IOR_GLASS = 1.5;
export const IOR_WATER = 1.33;

/* ---------------------------------------------------------------------- */
/* inside: snowy ground, a cabin, pines                                     */
/* ---------------------------------------------------------------------- */

/** The snow mound: a low dome with drifts. */
export const GROUND = { base: -0.55, dome: 0.12, r2: 0.95 } as const;

export function groundHeight(x: number, z: number): number {
  const r2 = x * x + z * z;
  let h = GROUND.base + GROUND.dome * (1 - Math.min(1, r2 / GROUND.r2));
  h += 0.01 * Math.sin(x * 7.1 + 1.3) * Math.sin(z * 6.3 + 0.4) + 0.006 * Math.sin(x * 13.7 - z * 11.1 + 2.0);
  return h;
}

/**
 * The cabin, in its own frame (x along the ridge, z out of the front, y up
 * from the sill of the walls), turned by `yaw` so the front and the left
 * gable both face the camera.
 */
export const CABIN = {
  x: 0.03,
  z: -0.07,
  yaw: 0.42,
  /** Half extents of the walls. */
  wx: 0.19,
  wz: 0.145,
  /** Walls' height at the eaves. */
  eave: 0.165,
  /** Roof pitch (radians), overhangs and slab thickness. */
  pitch: 0.66,
  overZ: 0.05,
  overX: 0.035,
  roofT: 0.03,
  /** Chimney (local x, z, half size, top above the ridge). */
  chimX: 0.085,
  chimZ: -0.045,
  chimH: 0.028,
  chimTop: 0.07,
} as const;

/** The cabin's sill height (sunk a little into the snow). */
export const CABIN_Y = groundHeight(CABIN.x, CABIN.z) - 0.018;
/** Height of the ridge line above the sill. */
export const CABIN_RIDGE = CABIN.eave + CABIN.wz * Math.tan(CABIN.pitch);

/** Front window, door and side window on the cabin (local x / z, y above the sill, half sizes). */
export const OPENINGS = {
  front: { x: -0.075, y: 0.085, hw: 0.045, hh: 0.038 },
  door: { x: 0.085, y: 0.06, hw: 0.032, hh: 0.06 },
  side: { z: 0.0, y: 0.085, hw: 0.04, hh: 0.035 },
} as const;

/** Where the warm light sits inside the cabin (local). */
export const HEARTH: Vec3 = [-0.05, 0.08, 0.06];

export type Tree = { x: number; z: number; h: number; r: number; y: number };

function tree(x: number, z: number, h: number, r: number): Tree {
  return { x, z, h, r, y: groundHeight(x, z) - 0.012 };
}

/** Pines: two tall ones behind, one to the right, two small ones in front. */
export const TREES: readonly Tree[] = [
  tree(-0.5, -0.31, 0.62, 0.19),
  tree(-0.22, -0.58, 0.5, 0.155),
  tree(0.52, -0.37, 0.56, 0.17),
  tree(0.47, 0.27, 0.33, 0.115),
  tree(-0.47, 0.3, 0.27, 0.095),
];

/** The three tiers of each pine: bottom, apex (fractions of its height) and radius (fraction). */
export const TIERS: readonly (readonly [number, number, number])[] = [
  [0.13, 0.6, 1.0],
  [0.36, 0.82, 0.74],
  [0.58, 1.0, 0.5],
];

/* ---------------------------------------------------------------------- */
/* the turned base                                                         */
/* ---------------------------------------------------------------------- */

/** Profile of the walnut base, bottom to top (y, radius), and its brass band. */
export const BASE = {
  floor: -1.32,
  footTop: -1.235,
  footR: 0.92,
  beadY: -1.225,
  beadR: 0.875,
  beadT: 0.022,
  bodyY0: -1.215,
  bodyY1: -0.845,
  bodyR0: 0.862,
  bodyR1: 0.718,
  bandY0: -0.845,
  bandY1: -0.792,
  bandR: 0.734,
  collarY0: -0.792,
  collarY1: -0.732,
  collarR: 0.71,
} as const;

export const FLOOR_Y = BASE.floor;
/** The collar: what the globe turns about. */
export const PIVOT: Vec3 = [0, -0.79, 0];

/* ---------------------------------------------------------------------- */
/* camera and light                                                        */
/* ---------------------------------------------------------------------- */

/** The camera looks at this point, from this far, this many radians above level. */
export const CAMERA = { target: [0, -0.2, 0] as Vec3, distance: 7.4, elevation: 0.16 } as const;

/** Toward the key light (world): upper left, in front. */
export const KEY: Vec3 = normalize([-0.5, 0.86, 0.4]);

export function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

export type Layout = {
  /** Internal px per CSS px. */
  k: number;
  /** CSS px of the camera target on screen (y down). */
  cx: number;
  cy: number;
  /** CSS px per world unit at the target. */
  ppu: number;
  /** Focal length in CSS px. */
  focal: number;
  cam: Vec3;
  fwd: Vec3;
  right: Vec3;
  up: Vec3;
};

export function newLayout(): Layout {
  return { k: 1, cx: 0, cy: 0, ppu: 100, focal: 740, cam: [0, 0, 7], fwd: [0, 0, -1], right: [1, 0, 0], up: [0, 1, 0] };
}

/**
 * Fit the globe to a stage or tile: as big as it goes inside the padding,
 * centred in the space left above the controls. Perspective scales every
 * offset from the target with the focal length, so the object is measured
 * once at a unit scale (top of the glass, front of the foot, the sides)
 * and scaled to fit.
 */
export function layoutFor(width: number, height: number, stage: boolean, bottomPad: number, out: Layout): Layout {
  const top = stage ? (height < 520 ? 20 : 28) : height * 0.05;
  const bottom = stage ? bottomPad : height * 0.05;
  const side = stage ? 20 : width * 0.055;
  const availH = Math.max(40, height - top - bottom);
  const availW = Math.max(40, width - side * 2);
  const t = CAMERA.target;
  const d = CAMERA.distance;
  const e = CAMERA.elevation;
  out.cam = [t[0], t[1] + d * Math.sin(e), t[2] + d * Math.cos(e)];
  out.fwd = [0, -Math.sin(e), -Math.cos(e)];
  out.right = [1, 0, 0];
  out.up = [0, Math.cos(e), -Math.sin(e)];
  // measure at 1 px per unit around (0, 0)
  out.ppu = 1;
  out.focal = d;
  out.cx = 0;
  out.cy = 0;
  const p = { x: 0, y: 0 };
  project([0, 1.0, -0.17], out, p);
  const y0 = p.y - 0.02;
  project([0, BASE.floor, BASE.footR], out, p);
  const y1 = p.y + 0.01;
  project([1.0, 0, 0], out, p);
  const halfW = p.x + 0.06;
  const ppu = Math.min(availH / (y1 - y0), availW / (2 * halfW));
  out.ppu = ppu;
  out.focal = ppu * d;
  out.cx = width / 2;
  // the object's span sits centred in the band
  const spanPx = (y1 - y0) * ppu;
  out.cy = top + (availH - spanPx) / 2 - y0 * ppu;
  return out;
}

/** World point → CSS px (y down). Returns false behind the camera. */
export function project(p: Vec3, layout: Layout, out: { x: number; y: number }): boolean {
  const c = layout.cam;
  const vx = p[0] - c[0];
  const vy = p[1] - c[1];
  const vz = p[2] - c[2];
  const z = vx * layout.fwd[0] + vy * layout.fwd[1] + vz * layout.fwd[2];
  if (z < 1e-3) return false;
  const x = vx * layout.right[0] + vy * layout.right[1] + vz * layout.right[2];
  const y = vx * layout.up[0] + vy * layout.up[1] + vz * layout.up[2];
  out.x = layout.cx + (layout.focal * x) / z;
  out.y = layout.cy - (layout.focal * y) / z;
  return true;
}

/* ---------------------------------------------------------------------- */
/* where snow can settle                                                    */
/* ---------------------------------------------------------------------- */

/** Height field over the globe's floor plan: the top of whatever is there. */
export const FIELD_N = 112;
const FIELD_EXTENT = R_IN;

function cabinTop(x: number, z: number): number {
  const c = Math.cos(CABIN.yaw);
  const s = Math.sin(CABIN.yaw);
  const dx = x - CABIN.x;
  const dz = z - CABIN.z;
  // world → local (inverse of the yaw used in the shader)
  const lx = c * dx - s * dz;
  const lz = s * dx + c * dz;
  let top = -Infinity;
  if (Math.abs(lx) <= CABIN.wx + CABIN.overX && Math.abs(lz) <= CABIN.wz + CABIN.overZ) {
    const roof = CABIN_RIDGE - Math.abs(lz) * Math.tan(CABIN.pitch) + CABIN.roofT / Math.cos(CABIN.pitch);
    top = CABIN_Y + roof;
  }
  if (Math.abs(lx - CABIN.chimX) <= CABIN.chimH + 0.006 && Math.abs(lz - CABIN.chimZ) <= CABIN.chimH + 0.006) {
    top = Math.max(top, CABIN_Y + CABIN_RIDGE + CABIN.chimTop + 0.012);
  }
  return top;
}

function treeTop(x: number, z: number): number {
  let top = -Infinity;
  for (const t of TREES) {
    const r = Math.hypot(x - t.x, z - t.z);
    if (r > t.r * 1.02) continue;
    for (const [b, a, rf] of TIERS) {
      const rb = t.r * rf;
      if (r > rb) continue;
      const apex = t.y + a * t.h;
      const base = t.y + b * t.h;
      const y = apex - (r / rb) * (apex - base);
      if (y > top) top = y;
    }
  }
  return top;
}

export function buildField(): Float32Array {
  const n = FIELD_N;
  const field = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * 2 * FIELD_EXTENT - FIELD_EXTENT;
      const z = ((j + 0.5) / n) * 2 * FIELD_EXTENT - FIELD_EXTENT;
      field[j * n + i] = Math.max(groundHeight(x, z), cabinTop(x, z), treeTop(x, z));
    }
  }
  return field;
}

/** The surface height at (x, z), bilinear. */
export function fieldHeight(field: Float32Array, x: number, z: number): number {
  const n = FIELD_N;
  const fx = ((x + FIELD_EXTENT) / (2 * FIELD_EXTENT)) * n - 0.5;
  const fz = ((z + FIELD_EXTENT) / (2 * FIELD_EXTENT)) * n - 0.5;
  const i0 = Math.max(0, Math.min(n - 2, Math.floor(fx)));
  const j0 = Math.max(0, Math.min(n - 2, Math.floor(fz)));
  const tx = Math.max(0, Math.min(1, fx - i0));
  const tz = Math.max(0, Math.min(1, fz - j0));
  const a = field[j0 * n + i0];
  const b = field[j0 * n + i0 + 1];
  const c = field[(j0 + 1) * n + i0];
  const d = field[(j0 + 1) * n + i0 + 1];
  return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
}

/* ---------------------------------------------------------------------- */
/* colours                                                                 */
/* ---------------------------------------------------------------------- */

/** sRGB 0..1 → linear. */
export function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** The tone curve the composite applies (linear in, linear out): straight up to a knee, then a soft shoulder. */
export const KNEE = 0.72;
export const EXPOSURE = 0.62;

/** The HDR value that comes out of the composite as `linear` (so the floor meets the stage exactly). */
export function untone(linear: number): number {
  const y = Math.min(0.9995, Math.max(0, linear));
  const x = y <= KNEE ? y : KNEE - (1 - KNEE) * Math.log(1 - (y - KNEE) / (1 - KNEE));
  return x / EXPOSURE;
}
