// The macropad as geometry. Units are key pitches (1 = 19.05 mm), Y is up,
// the table is y = 0 and the pad faces +Z (towards you).
//
//            ┌──────────────────────────┐
//            │  ▲ arsher        ( knob ) │   top row: engraved mark, knob
//            │ ┌──────────────────────┐ │
//            │ │  [1]    [2]    [3]   │ │   the pocket: a 3 × 3 grid of
//            │ │  [4]    [5]    [6]   │ │   sculpted caps over a plate
//            │ │  [7]    [8]    [9]   │ │   that carries the under-glow
//            │ └──────────────────────┘ │
//            └──────────────────────────┘
//
// Every surface is a parametric patch S(u, v) sampled on a grid: u runs
// round a rounded rectangle (or a circle), v runs up the profile. Normals
// come from the patch's own derivatives, so shading is smooth inside a
// patch and creases (the diamond-cut chamfers) stay crisp between patches.

import type { Vec3 } from "./math";

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

export const CASE = {
  halfWidth: 1.83,
  front: 1.83,
  back: -2.73,
  radius: 0.34,
  height: 0.62,
  chamfer: 0.05,
};
export const CASE_CZ = (CASE.front + CASE.back) / 2;
export const CASE_HD = (CASE.front - CASE.back) / 2;

export const POCKET = { half: 1.535, radius: 0.14, chamfer: 0.03 };
export const PLATE_Y = 0.4;

/** Keycap: skirt footprint, top footprint, height at the top's corners, dish depth. */
export const CAP = {
  base: 0.455,
  baseRadius: 0.075,
  topX: 0.352,
  topZ: 0.338,
  topRadius: 0.11,
  topShift: -0.014,
  height: 0.4,
  dish: 0.054,
  fillet: 0.034,
};

/** Skirt height above the plate at rest; how far a press travels. */
export const SKIRT_REST = 0.28;
export const TRAVEL = 0.2;

export const KNOB = { x: 1, z: -2.09, radius: 0.355, height: 0.43, gap: 0.03 };
export const KNOB_BASE_Y = CASE.height + KNOB.gap;

/** The mark and wordmark engraved on the top row (centre, half size). */
export const ENGRAVING = { x: -0.62, z: -2.09, halfX: 0.9, halfZ: 0.225 };

export type KeySlot = { index: number; col: number; row: number; x: number; z: number };

/** Keys in reading order: 1 2 3 / 4 5 6 / 7 8 9. */
export const KEYS: readonly KeySlot[] = Array.from({ length: 9 }, (_, index) => {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { index, col, row, x: col - 1, z: row - 1 };
});

/** Surface tags (the shader picks a material per tag). */
export const TAG = {
  ground: 0,
  wall: 1,
  chamfer: 2,
  top: 3,
  pocketChamfer: 4,
  pocketWall: 5,
  plate: 6,
  cap: 7,
  knobSide: 8,
  knobChamfer: 9,
  knobTop: 10,
  shaft: 11,
} as const;

/* ---------------------------------------------------------------------- */
/* meshes                                                                  */
/* ---------------------------------------------------------------------- */

/** position (3), normal (3), tag (1) */
export const FLOATS_PER_VERTEX = 7;

export type Mesh = { vertices: Float32Array; indices: Uint32Array };

type Patch = {
  /** Position for u in [0, 1) round the outline and v along the profile. */
  at: (u: number, v: number) => Vec3;
  us: readonly number[];
  vs: readonly number[];
  /** u wraps round (closed outline). */
  wrap: boolean;
  tag: number;
  /** Rough direction the surface faces at p (to orient normals). */
  facing: (p: Vec3) => Vec3;
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

function build(patches: readonly Patch[]): Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  const e = 1e-4;
  for (const patch of patches) {
    const base = vertices.length / FLOATS_PER_VERTEX;
    const { us, vs, at } = patch;
    const vMin = vs[0];
    const vMax = vs[vs.length - 1];
    for (const v of vs) {
      for (const u of us) {
        const p = at(u, v);
        const du = sub(at(patch.wrap ? (u + e) % 1 : Math.min(1, u + e), v), at(patch.wrap ? (u - e + 1) % 1 : Math.max(0, u - e), v));
        const v0 = Math.max(vMin, v - e);
        const v1 = Math.min(vMax, v + e);
        const dv = sub(at(u, v1), at(u, v0));
        let n = cross(du, dv);
        const facing = patch.facing(p);
        if (Math.hypot(n[0], n[1], n[2]) < 1e-12) n = facing;
        n = norm(n);
        if (dot(n, facing) < 0) n = [-n[0], -n[1], -n[2]];
        vertices.push(p[0], p[1], p[2], n[0], n[1], n[2], patch.tag);
      }
    }
    const cols = us.length;
    const segs = patch.wrap ? cols : cols - 1;
    for (let j = 0; j < vs.length - 1; j++) {
      for (let i = 0; i < segs; i++) {
        const a = base + j * cols + i;
        const b = base + j * cols + ((i + 1) % cols);
        const c = base + (j + 1) * cols + i;
        const d = base + (j + 1) * cols + ((i + 1) % cols);
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  return { vertices: new Float32Array(vertices), indices: new Uint32Array(indices) };
}

/**
 * A point on a rounded rectangle centred on (cx, cz). u in [0, 1) is split
 * into eight equal pieces (four corners, four sides) so that outlines of
 * different sizes line up corner to corner.
 */
function roundRect(u: number, hw: number, hd: number, r: number, cx = 0, cz = 0): [number, number] {
  const rr = Math.max(0.0005, Math.min(r, hw, hd));
  const ix = hw - rr;
  const iz = hd - rr;
  const t = ((u % 1) + 1) % 1;
  const piece = Math.min(7, Math.floor(t * 8));
  const f = t * 8 - piece;
  let x: number;
  let z: number;
  switch (piece) {
    case 0: {
      const a = f * (Math.PI / 2);
      x = ix + rr * Math.cos(a);
      z = iz + rr * Math.sin(a);
      break;
    }
    case 1:
      x = ix - 2 * ix * f;
      z = hd;
      break;
    case 2: {
      const a = Math.PI / 2 + f * (Math.PI / 2);
      x = -ix + rr * Math.cos(a);
      z = iz + rr * Math.sin(a);
      break;
    }
    case 3:
      x = -hw;
      z = iz - 2 * iz * f;
      break;
    case 4: {
      const a = Math.PI + f * (Math.PI / 2);
      x = -ix + rr * Math.cos(a);
      z = -iz + rr * Math.sin(a);
      break;
    }
    case 5:
      x = -ix + 2 * ix * f;
      z = -hd;
      break;
    case 6: {
      const a = 1.5 * Math.PI + f * (Math.PI / 2);
      x = ix + rr * Math.cos(a);
      z = -iz + rr * Math.sin(a);
      break;
    }
    default:
      x = hw;
      z = -iz + 2 * iz * f;
  }
  return [cx + x, cz + z];
}

/** u samples round a rounded rectangle: `arc` steps per corner, `side` per side. */
function outlineSamples(arc: number, side: number): number[] {
  const out: number[] = [];
  for (let piece = 0; piece < 8; piece++) {
    const steps = piece % 2 === 0 ? arc : side;
    for (let i = 0; i < steps; i++) out.push((piece + i / steps) / 8);
  }
  return out;
}

const range = (from: number, to: number, steps: number, ease: (t: number) => number = (t) => t) =>
  Array.from({ length: steps + 1 }, (_, i) => from + (to - from) * ease(i / steps));

/* ---------------------------------------------------------------------- */
/* keycap                                                                  */
/* ---------------------------------------------------------------------- */

/** Height of the cap's top surface (local, skirt at y = 0): a spherical dish. */
export function capTopY(x: number, z: number): number {
  const nx = x / CAP.topX;
  const nz = (z - CAP.topShift) / CAP.topZ;
  return CAP.height - CAP.dish * (1 - (nx * nx + nz * nz) / 2);
}

export function buildCap(): Mesh {
  const { base, baseRadius, topX, topZ, topRadius, topShift, fillet } = CAP;
  // v: [0, 1] wall, [1, 2] rounded top edge, [2, 3] dished top to the centre
  const at = (u: number, v: number): Vec3 => {
    if (v <= 1) {
      const t = v;
      const bulge = 0.014 * Math.sin(Math.PI * t) ** 1.2;
      const hw = base + (topX - base) * t + bulge;
      const hd = base + (topZ - base) * t + bulge;
      const r = baseRadius + (topRadius - baseRadius) * t;
      const [x, z] = roundRect(u, hw, hd, r, 0, topShift * t);
      const y = t * (capTopY(x, z) - fillet) - 0.0;
      return [x, y, z];
    }
    if (v <= 2) {
      const a = (v - 1) * (Math.PI / 2);
      const inset = fillet * (1 - Math.cos(a));
      const [x, z] = roundRect(u, topX - inset, topZ - inset, topRadius - inset * 0.6, 0, topShift);
      const y = capTopY(x, z) - fillet + fillet * Math.sin(a);
      return [x, y, z];
    }
    const s = 3 - v;
    const [x, z] = roundRect(u, (topX - fillet) * s, (topZ - fillet) * s, (topRadius - fillet * 0.6) * s, 0, topShift);
    return [x, capTopY(x, z), z];
  };
  const centre: Vec3 = [0, CAP.height * 0.45, CAP.topShift];
  return build([
    {
      at,
      us: outlineSamples(7, 8),
      vs: [
        ...range(0, 1, 9, (t) => t ** 1.15).slice(0, -1),
        ...range(1, 2, 6).slice(0, -1),
        ...range(2, 3, 9, (t) => 1 - (1 - t) ** 1.4),
      ],
      wrap: true,
      tag: TAG.cap,
      facing: (p) => norm(sub(p, centre)),
    },
  ]);
}

/* ---------------------------------------------------------------------- */
/* case, pocket and plate                                                  */
/* ---------------------------------------------------------------------- */

export function buildCase(): Mesh {
  const { halfWidth: hw, radius: r, height: H, chamfer: c } = CASE;
  const cz = CASE_CZ;
  const hd = CASE_HD;
  const P = POCKET;
  const out = (u: number, inset: number) => roundRect(u, hw - inset, hd - inset, r - inset, 0, cz);
  const pocket = (u: number, grow: number) => roundRect(u, P.half + grow, P.half + grow, P.radius + grow, 0, 0);
  const outward = (p: Vec3): Vec3 => norm([p[0], 0, p[2] - cz]);
  const inward = (p: Vec3): Vec3 => norm([-p[0], 0.0001, -p[2]]);
  const caseU = outlineSamples(10, 2);
  const pocketU = outlineSamples(8, 2);

  return build([
    // the foot: a small radius into the table
    {
      at: (u, v) => {
        const a = v * (Math.PI / 2);
        const inset = 0.03 * (1 - Math.sin(a));
        const [x, z] = out(u, inset);
        return [x, 0.03 * (1 - Math.cos(a)), z];
      },
      us: caseU,
      vs: range(0, 1, 3),
      wrap: true,
      tag: TAG.wall,
      facing: (p) => norm([p[0], -0.3, p[2] - cz]),
    },
    // the outer wall
    {
      at: (u, v) => {
        const [x, z] = out(u, 0);
        return [x, 0.03 + v * (H - c - 0.03), z];
      },
      us: caseU,
      vs: [0, 1],
      wrap: true,
      tag: TAG.wall,
      facing: outward,
    },
    // the diamond-cut chamfer round the top
    {
      at: (u, v) => {
        const [x, z] = out(u, v * c);
        return [x, H - c + v * c, z];
      },
      us: caseU,
      vs: [0, 1],
      wrap: true,
      tag: TAG.chamfer,
      facing: (p) => norm([p[0], 1.6, p[2] - cz]),
    },
    // the top face, from the chamfer in to the pocket
    {
      at: (u, v) => {
        const [ax, az] = out(u, c);
        const [bx, bz] = pocket(u, P.chamfer);
        return [ax + (bx - ax) * v, H, az + (bz - az) * v];
      },
      us: caseU,
      vs: range(0, 1, 6),
      wrap: true,
      tag: TAG.top,
      facing: () => [0, 1, 0],
    },
    // the pocket's chamfer
    {
      at: (u, v) => {
        const [x, z] = pocket(u, P.chamfer * (1 - v));
        return [x, H - P.chamfer * v, z];
      },
      us: caseU,
      vs: [0, 1],
      wrap: true,
      tag: TAG.pocketChamfer,
      facing: (p) => norm([-p[0], 1.6, -p[2]]),
    },
    // the pocket wall down to the plate
    {
      at: (u, v) => {
        const [x, z] = pocket(u, 0);
        return [x, H - P.chamfer - v * (H - P.chamfer - PLATE_Y), z];
      },
      us: caseU,
      vs: [0, 1],
      wrap: true,
      tag: TAG.pocketWall,
      facing: inward,
    },
    // the plate
    {
      at: (u, v) => {
        const s = 1 - v;
        const [x, z] = roundRect(u, P.half * s, P.half * s, P.radius * s, 0, 0);
        return [x, PLATE_Y, z];
      },
      us: pocketU,
      vs: range(0, 1, 8),
      wrap: true,
      tag: TAG.plate,
      facing: () => [0, 1, 0],
    },
  ]);
}

/* ---------------------------------------------------------------------- */
/* knob                                                                    */
/* ---------------------------------------------------------------------- */

/** The knob in its own frame: axis along +Y, base at y = 0. */
export function buildKnob(): Mesh {
  const R = KNOB.radius;
  const Hk = KNOB.height;
  const ch = 0.03;
  const segs = 144;
  const us = Array.from({ length: segs }, (_, i) => i / segs);
  const ring = (u: number, r: number, y: number): Vec3 => {
    const a = u * Math.PI * 2;
    return [r * Math.cos(a), y, r * Math.sin(a)];
  };
  const side = (p: Vec3): Vec3 => norm([p[0], 0, p[2]]);
  return build([
    // a dark shaft under the knob (seen through the gap above the case)
    {
      at: (u, v) => ring(u, R * 0.86, -KNOB.gap + v * (KNOB.gap + 0.02)),
      us,
      vs: [0, 1],
      wrap: true,
      tag: TAG.shaft,
      facing: side,
    },
    // the knurled side, very slightly tapered, with a soft bottom edge
    {
      at: (u, v) => {
        if (v < 0.12) {
          const a = (v / 0.12) * (Math.PI / 2);
          return ring(u, R - 0.012 * (1 - Math.sin(a)), 0.012 * (1 - Math.cos(a)));
        }
        const t = (v - 0.12) / 0.88;
        return ring(u, R - 0.008 * t, 0.012 + t * (Hk - ch - 0.012));
      },
      us,
      vs: [0, 0.04, 0.08, 0.12, 0.5, 1],
      wrap: true,
      tag: TAG.knobSide,
      facing: side,
    },
    // the polished chamfer
    {
      at: (u, v) => ring(u, R - 0.008 - v * ch, Hk - ch + v * ch),
      us,
      vs: [0, 1],
      wrap: true,
      tag: TAG.knobChamfer,
      facing: (p) => norm([p[0], 1.2, p[2]]),
    },
    // the machined top, a touch concave
    {
      at: (u, v) => {
        const r = (R - 0.008 - ch) * (1 - v);
        const rn = r / (R - 0.008 - ch);
        return ring(u, r, Hk - 0.006 * (1 - rn * rn));
      },
      us,
      vs: range(0, 1, 10),
      wrap: true,
      tag: TAG.knobTop,
      facing: () => [0, 1, 0],
    },
  ]);
}

/* ---------------------------------------------------------------------- */
/* ground                                                                  */
/* ---------------------------------------------------------------------- */

export function buildGround(): Mesh {
  const x0 = -CASE.halfWidth - 1.6;
  const x1 = CASE.halfWidth + 1.6;
  const z0 = CASE.back - 1.4;
  const z1 = CASE.front + 1.8;
  const vertices = new Float32Array([
    x0, 0, z0, 0, 1, 0, TAG.ground,
    x1, 0, z0, 0, 1, 0, TAG.ground,
    x0, 0, z1, 0, 1, 0, TAG.ground,
    x1, 0, z1, 0, 1, 0, TAG.ground,
  ]);
  return { vertices, indices: new Uint32Array([0, 1, 2, 1, 3, 2]) };
}

/** Points that bound the pad (for fitting it to the view). */
export function boundPoints(): Vec3[] {
  const pts: Vec3[] = [];
  const { halfWidth: hw, front, back, height } = CASE;
  for (const x of [-hw, hw]) {
    for (const z of [back, front]) {
      pts.push([x, 0, z], [x, height, z]);
    }
  }
  const capTop = PLATE_Y + SKIRT_REST + CAP.height;
  for (const k of KEYS) pts.push([k.x - CAP.base, capTop, k.z - CAP.base], [k.x + CAP.base, capTop, k.z + CAP.base]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pts.push([KNOB.x + KNOB.radius * Math.cos(a), KNOB_BASE_Y + KNOB.height, KNOB.z + KNOB.radius * Math.sin(a)]);
  }
  return pts;
}
