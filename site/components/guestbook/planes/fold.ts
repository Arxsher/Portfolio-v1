// The origami behind every paper plane: one rectangular sheet, eight folds.
//
// Sheet coordinates: x runs along the plane (the nose is the middle of the
// right edge, x = +w/2), y runs across it (y < 0 is the top half of the
// note, where the doodle sits), and the written side faces −z, toward
// whoever is reading the flat note.
//
//   A  top and bottom corners to the centre line     (flat, toward the reader)
//   B  the new slanted edges to the centre line again (flat, toward the reader)
//   C  each half up about the centre line             (the keel, ~83°)
//   D  each wing back out about a line from the nose  (the wings, ~76°)
//
// buildSheet() runs the folds once as a flat-folding simulation in 2D:
// every fold line cuts the regions it crosses into two, and each piece
// remembers, per fold that moves it, where that fold's line lies in its own
// flat coordinates. foldSheet() then turns any set of fold angles (0 = flat,
// sheet.folded = a finished plane) into a rigid 3D transform per region by
// replaying those rotations in order, each about the fold line as it lies on
// that very piece. Because every piece turns about its own copy of the
// crease, the layers stay hinged together at any angle, even when the folds
// run at the same time with springy overshoot.

import { applyPoint, axisRotation, compose, rigid, setIdentity, type Rigid } from "./math";

type Point = [number, number];

export type FoldOp = {
  name: string;
  /** Two points on the fold line, in the 2D frame after the earlier flat folds. */
  p: Point;
  q: Point;
  /** A point on the side that stays put. */
  stay: Point;
  /** Only regions from this half of the sheet (−1 top, 1 bottom). */
  half?: -1 | 1;
  /** Flat folds go all the way over and change the frame later lines are given in. */
  flat: boolean;
  /** Valley: the moving part turns toward the reader (−z). Mountain: away. */
  valley: boolean;
};

export type Hinge = {
  op: number;
  /** The fold line on this piece, in flat sheet coordinates. */
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** +1 or −1: which way a positive fold angle turns this piece. */
  sign: number;
};

export type Region = {
  /** Flat sheet coordinates, x0 y0 x1 y1 …, counter-clockwise on screen. */
  poly: Float64Array;
  count: number;
  half: -1 | 1;
  hinges: Hinge[];
  /** Per edge (from vertex i to i+1): true where it is the sheet's cut edge. */
  outer: boolean[];
  cx: number;
  cy: number;
  /** Three vertex indices spanning the largest triangle (for texture mapping). */
  tri: [number, number, number];
};

export type Sheet = {
  width: number;
  height: number;
  ops: FoldOp[];
  regions: Region[];
  /** Fold angles of the finished plane, per op. */
  folded: Float64Array;
};

const EPS = 1e-6;

/** Affine 2D map x' = a·x + c·y + e, y' = b·x + d·y + f. */
type Affine = [number, number, number, number, number, number];

const applyAffine = (t: Affine, x: number, y: number): Point => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]];

/** Inverse of an isometry (the linear part is orthogonal). */
function invertIsometry(t: Affine, x: number, y: number): Point {
  const dx = x - t[4];
  const dy = y - t[5];
  return [t[0] * dx + t[1] * dy, t[2] * dx + t[3] * dy];
}

function reflectAcross(t: Affine, p: Point, q: Point): Affine {
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
  const ux = (q[0] - p[0]) / len;
  const uy = (q[1] - p[1]) / len;
  // R = 2uuᵀ − I, then x ↦ p + R(x − p)
  const r00 = 2 * ux * ux - 1;
  const r01 = 2 * ux * uy;
  const r11 = 2 * uy * uy - 1;
  const [a, b, c, d, e, f] = t;
  const ex = e - p[0];
  const fy = f - p[1];
  return [
    r00 * a + r01 * b,
    r01 * a + r11 * b,
    r00 * c + r01 * d,
    r01 * c + r11 * d,
    r00 * ex + r01 * fy + p[0],
    r01 * ex + r11 * fy + p[1],
  ];
}

type Working = { poly: Point[]; half: -1 | 1; t: Affine; hinges: Hinge[] };

function polygonArea(poly: Point[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    area += x0 * y1 - x1 * y0;
  }
  return area / 2;
}

/** Split a convex polygon by signed distances: [positive side, negative side]. */
function splitPolygon(poly: Point[], dist: number[]): [Point[], Point[]] {
  const pos: Point[] = [];
  const neg: Point[] = [];
  const tol = 1e-7;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    const di = dist[i];
    const dj = dist[j];
    if (di >= -tol) pos.push(poly[i]);
    if (di <= tol) neg.push(poly[i]);
    if ((di > tol && dj < -tol) || (di < -tol && dj > tol)) {
      const s = di / (di - dj);
      const point: Point = [poly[i][0] + (poly[j][0] - poly[i][0]) * s, poly[i][1] + (poly[j][1] - poly[i][1]) * s];
      pos.push(point);
      neg.push(point);
    }
  }
  return [pos, neg];
}

/** The fold sequence for a w × h sheet. `keel` is the keel depth at the tail, as a share of h. */
export function dartOps(w: number, h: number, keel = 0.11): FoldOp[] {
  const nose: Point = [w / 2, 0];
  const tail: Point = [-w / 2, 0];
  const h2 = h / 2;
  const reach = Math.hypot(w, h) * 2;
  const b = (22.5 * Math.PI) / 180;
  const k = h * keel;
  return [
    { name: "A-top", p: nose, q: [w / 2 - h2, -h2], stay: tail, half: -1, flat: true, valley: true },
    { name: "A-bottom", p: nose, q: [w / 2 - h2, h2], stay: tail, half: 1, flat: true, valley: true },
    { name: "B-top", p: nose, q: [w / 2 - Math.cos(b) * reach, -Math.sin(b) * reach], stay: tail, half: -1, flat: true, valley: true },
    { name: "B-bottom", p: nose, q: [w / 2 - Math.cos(b) * reach, Math.sin(b) * reach], stay: tail, half: 1, flat: true, valley: true },
    { name: "C-top", p: nose, q: tail, stay: [0, 1], half: -1, flat: false, valley: true },
    { name: "C-bottom", p: nose, q: tail, stay: [0, -1], half: 1, flat: false, valley: true },
    { name: "D-top", p: nose, q: [-w / 2, -k], stay: tail, half: -1, flat: false, valley: false },
    { name: "D-bottom", p: nose, q: [-w / 2, k], stay: tail, half: 1, flat: false, valley: false },
  ];
}

/** Fold angles of a finished plane, one per op of dartOps. */
export const DART_ANGLES = (() => {
  const deg = Math.PI / 180;
  // Flat folds stop a hair short of 180° so the layers stand a little
  // proud of each other, like real paper.
  return [177.5 * deg, 177.5 * deg, 176 * deg, 176 * deg, 83 * deg, 83 * deg, 75 * deg, 75 * deg];
})();

const cache = new Map<string, Sheet>();

export function buildSheet(width: number, height: number, keel = 0.11): Sheet {
  const key = `${width}:${height}:${keel}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const ops = dartOps(width, height, keel);
  const w2 = width / 2;
  const h2 = height / 2;
  const identity: Affine = [1, 0, 0, 1, 0, 0];
  let work: Working[] = [
    { poly: [[-w2, -h2], [w2, -h2], [w2, 0], [-w2, 0]], half: -1, t: identity, hinges: [] },
    { poly: [[-w2, 0], [w2, 0], [w2, h2], [-w2, h2]], half: 1, t: identity, hinges: [] },
  ];

  ops.forEach((op, index) => {
    const dx = op.q[0] - op.p[0];
    const dy = op.q[1] - op.p[1];
    const len = Math.hypot(dx, dy);
    const side = (x: number, y: number) => (dx * (y - op.p[1]) - dy * (x - op.p[0])) / len;
    // Moving side is positive.
    const moving = -Math.sign(side(op.stay[0], op.stay[1]));
    // A positive angle turns pieces toward −z (valley) or +z (mountain);
    // in the reference frame every piece's axis runs from p to q.
    const sign = op.valley ? -moving : moving;

    const next: Working[] = [];
    for (const region of work) {
      if (op.half !== undefined && region.half !== op.half) {
        next.push(region);
        continue;
      }
      const dist = region.poly.map(([x, y]) => {
        const [fx, fy] = applyAffine(region.t, x, y);
        return moving * side(fx, fy);
      });
      const max = Math.max(...dist);
      const min = Math.min(...dist);
      const pieces: Array<{ poly: Point[]; moves: boolean }> = [];
      if (max <= 1e-7) pieces.push({ poly: region.poly, moves: false });
      else if (min >= -1e-7) pieces.push({ poly: region.poly, moves: true });
      else {
        const [pos, neg] = splitPolygon(region.poly, dist);
        if (pos.length >= 3 && Math.abs(polygonArea(pos)) > EPS) pieces.push({ poly: pos, moves: true });
        if (neg.length >= 3 && Math.abs(polygonArea(neg)) > EPS) pieces.push({ poly: neg, moves: false });
      }
      for (const piece of pieces) {
        if (!piece.moves) {
          next.push({ ...region, poly: piece.poly, hinges: [...region.hinges] });
          continue;
        }
        const [ax, ay] = invertIsometry(region.t, op.p[0], op.p[1]);
        const [bx, by] = invertIsometry(region.t, op.q[0], op.q[1]);
        next.push({
          poly: piece.poly,
          half: region.half,
          t: op.flat ? reflectAcross(region.t, op.p, op.q) : region.t,
          hinges: [...region.hinges, { op: index, ax, ay, bx, by, sign }],
        });
      }
    }
    work = next;
  });

  const onEdge = (a: Point, b: Point) =>
    (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(Math.abs(a[0]) - w2) < 1e-6) ||
    (Math.abs(a[1] - b[1]) < 1e-6 && Math.abs(Math.abs(a[1]) - h2) < 1e-6);

  const regions: Region[] = work.map((region) => {
    // Counter-clockwise on screen (y down) = positive area in these coords.
    const poly = polygonArea(region.poly) < 0 ? [...region.poly].reverse() : region.poly;
    const count = poly.length;
    const flat = new Float64Array(count * 2);
    poly.forEach(([x, y], i) => {
      flat[i * 2] = x;
      flat[i * 2 + 1] = y;
    });
    let cx = 0;
    let cy = 0;
    poly.forEach(([x, y]) => {
      cx += x / count;
      cy += y / count;
    });
    let tri: [number, number, number] = [0, 1, 2];
    let best = -1;
    for (let i = 0; i < count; i++)
      for (let j = i + 1; j < count; j++)
        for (let k = j + 1; k < count; k++) {
          const area = Math.abs(polygonArea([poly[i], poly[j], poly[k]]));
          if (area > best) {
            best = area;
            tri = [i, j, k];
          }
        }
    return {
      poly: flat,
      count,
      half: region.half,
      hinges: region.hinges,
      outer: poly.map((point, i) => onEdge(point, poly[(i + 1) % count])),
      cx,
      cy,
      tri,
    };
  });

  const sheet: Sheet = { width, height, ops, regions, folded: Float64Array.from(DART_ANGLES) };
  cache.set(key, sheet);
  return sheet;
}

/** Reusable output of foldSheet: one rigid transform per region. */
export type FoldPose = Rigid[];

export function createFoldPose(sheet: Sheet): FoldPose {
  return sheet.regions.map(() => rigid());
}

const scratchRot = rigid();
const scratchA = new Float64Array(3);
const scratchB = new Float64Array(3);

/** Region transforms (flat sheet coords → folded 3D) for these fold angles. */
export function foldSheet(sheet: Sheet, angles: ArrayLike<number>, out: FoldPose): FoldPose {
  const { regions } = sheet;
  for (let r = 0; r < regions.length; r++) {
    const m = setIdentity(out[r]);
    const hinges = regions[r].hinges;
    for (let h = 0; h < hinges.length; h++) {
      const hinge = hinges[h];
      const angle = angles[hinge.op];
      if (angle === 0) continue;
      applyPoint(m, hinge.ax, hinge.ay, 0, scratchA);
      applyPoint(m, hinge.bx, hinge.by, 0, scratchB);
      let ux = scratchB[0] - scratchA[0];
      let uy = scratchB[1] - scratchA[1];
      let uz = scratchB[2] - scratchA[2];
      const len = Math.hypot(ux, uy, uz) || 1;
      ux /= len;
      uy /= len;
      uz /= len;
      axisRotation(scratchRot, scratchA[0], scratchA[1], scratchA[2], ux, uy, uz, hinge.sign * angle);
      compose(m, scratchRot, m);
    }
  }
  return out;
}

/**
 * Fold angles for a 0…1 progress per step: fills `out` from per-op
 * progress values (A, B, C, D share one value per pair).
 */
export function anglesFrom(sheet: Sheet, a: number, b: number, c: number, d: number, out: Float64Array): Float64Array {
  const f = sheet.folded;
  out[0] = f[0] * a;
  out[1] = f[1] * a;
  out[2] = f[2] * b;
  out[3] = f[3] * b;
  out[4] = f[4] * c;
  out[5] = f[5] * c;
  out[6] = f[6] * d;
  out[7] = f[7] * d;
  return out;
}
