// The valley, built once on the CPU: terrain, far ranges, the viaduct and
// its two tunnel portals, a hamlet by the river, the pines, and the train's
// car shapes. Everything here is plain numbers (no WebGL); renderer.ts
// uploads what these functions return.
//
// World units are about two metres. y is up, the camera stands near the
// water at the origin looking up the valley (+z). The river comes toward
// it from a gap in the far ranges; the viaduct crosses the valley ~90
// units away on a curve that bulges toward the camera, from a portal in
// the left hill to one in the right.

import { seededRandom } from "../../hooks";
import type { Vec3 } from "./math";

/* ---------------------------------------------------------------------- */
/* the line                                                                */
/* ---------------------------------------------------------------------- */

/** Rail level above the water. */
export const DECK_Y = 15;
/** The curve: radius, centre (x = 0, z = ARC_CZ) and half the angle it turns through. */
export const ARC_R = 95;
export const ARC_CZ = 185;
export const ARC_HALF = 0.52;
/** Length of the line between the two portals (s runs 0 … TRACK_LEN, left to right). */
export const TRACK_LEN = 2 * ARC_R * ARC_HALF;
/** How far into the portals a train still shows (the dark recess behind each mouth). */
export const RECESS = 2.6;
/** The viaduct's arches. */
export const SPANS = 11;
export const SPAN = TRACK_LEN / SPANS;
export const PIER_W = 1.8;
export const ARCH_R = (SPAN - PIER_W) / 2;
export const CROWN_Y = DECK_Y - 1.45;
export const SPRING_Y = CROWN_Y - ARCH_R;
/** Outer faces of the viaduct are ±HALF_W from the line. */
export const HALF_W = 2.1;
const PARAPET = 0.3;
const BALLAST_Y = DECK_Y - 0.14;

/** A car: length (the gap to the next one is CAR_PITCH − CAR_LEN). */
export const CAR_LEN = 9.8;
export const CAR_PITCH = 10.05;
/** The car meshes are drawn this much taller and wider (shaders.ts), so the train reads from the bank. */
export const CAR_SCALE_Y = 1.32;
export const CAR_SCALE_Z = 1.25;

const T0x = Math.cos(-ARC_HALF);
const T0z = Math.sin(-ARC_HALF);
const T1x = Math.cos(ARC_HALF);
const T1z = Math.sin(ARC_HALF);

/**
 * A point on the line at distance s (0 at the left portal), offset d
 * sideways (positive toward the camera, i.e. away from the curve's
 * centre). Past either portal it carries straight on into the hill.
 */
export function trackPoint(s: number, d: number, out: Vec3, y = DECK_Y): Vec3 {
  if (s < 0) {
    // the left end, then straight on along its tangent
    const th = -ARC_HALF;
    const bx = (ARC_R + d) * Math.sin(th);
    const bz = ARC_CZ - (ARC_R + d) * Math.cos(th);
    out[0] = bx + T0x * s;
    out[1] = y;
    out[2] = bz + T0z * s;
    return out;
  }
  if (s > TRACK_LEN) {
    const th = ARC_HALF;
    const bx = (ARC_R + d) * Math.sin(th);
    const bz = ARC_CZ - (ARC_R + d) * Math.cos(th);
    out[0] = bx + T1x * (s - TRACK_LEN);
    out[1] = y;
    out[2] = bz + T1z * (s - TRACK_LEN);
    return out;
  }
  const th = -ARC_HALF + s / ARC_R;
  out[0] = (ARC_R + d) * Math.sin(th);
  out[1] = y;
  out[2] = ARC_CZ - (ARC_R + d) * Math.cos(th);
  return out;
}

/** The direction of increasing s at s (unit, in the ground plane). */
export function trackTangent(s: number, out: Vec3): Vec3 {
  const th = s < 0 ? -ARC_HALF : s > TRACK_LEN ? ARC_HALF : -ARC_HALF + s / ARC_R;
  out[0] = Math.cos(th);
  out[1] = 0;
  out[2] = Math.sin(th);
  return out;
}

/** World (x, z) → line coordinates: out[0] = s, out[1] = d. */
export function toTrack(x: number, z: number, out: [number, number]): [number, number] {
  const r = Math.hypot(x, ARC_CZ - z);
  const th = Math.atan2(x, ARC_CZ - z);
  const s = (th + ARC_HALF) * ARC_R;
  if (s >= 0 && s <= TRACK_LEN) {
    out[0] = s;
    out[1] = r - ARC_R;
    return out;
  }
  const left = s < 0;
  const th0 = left ? -ARC_HALF : ARC_HALF;
  const bx = ARC_R * Math.sin(th0);
  const bz = ARC_CZ - ARC_R * Math.cos(th0);
  const tx = left ? T0x : T1x;
  const tz = left ? T0z : T1z;
  const vx = x - bx;
  const vz = z - bz;
  out[0] = (left ? 0 : TRACK_LEN) + vx * tx + vz * tz;
  // the outward normal there: (sin θ, −cos θ)
  out[1] = vx * Math.sin(th0) - vz * Math.cos(th0);
  return out;
}

/* ---------------------------------------------------------------------- */
/* noise                                                                   */
/* ---------------------------------------------------------------------- */

function hash(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 668265263) + Math.imul(seed | 0, 362437)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves: number, seed: number): number {
  let s = 0;
  let a = 0.5;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    s += a * vnoise(x, y, seed + i * 17);
    norm += a;
    x = x * 2.03 + 11.7;
    y = y * 2.03 - 5.3;
    a *= 0.5;
  }
  return s / norm;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------------------------------------------------------------------- */
/* terrain                                                                 */
/* ---------------------------------------------------------------------- */

/** The river's centre line (x at distance z). */
export function riverX(z: number): number {
  return 2.6 * Math.sin(z * 0.034 + 0.4) + 1.4 * Math.sin(z * 0.081 + 2.2) - 1.2 + Math.max(0, z - 120) * 0.012;
}

/** The river's half width: a wide still pool by the camera, a river under the arches and beyond. */
export function riverHalf(z: number): number {
  const pool = 21 * (1 - smooth(16, 50, z));
  return 6.2 + pool - 2.2 * smooth(110, 190, z);
}

const BANK = 2.6;
const scratchTrack: [number, number] = [0, 0];

/** Ground height (natural shape, before the line's cutting). */
function natural(x: number, z: number): number {
  const xr = riverX(z);
  const w = riverHalf(z);
  const dx = x - xr;
  const ad = Math.abs(dx);
  const left = dx < 0;
  let h: number;
  if (ad < w) {
    // the bed: deeper toward the middle
    const t = ad / w;
    h = -1.3 * (1 - t * t);
  } else {
    h = 0.55 * smooth(w, w + BANK, ad);
  }
  // the valley sides: gentle near the camera, rising to meet the viaduct's
  // ends, then steep toward the far ranges
  const amp = left
    ? lerp(lerp(6, 22.5, smooth(34, 92, z)), 44, smooth(110, 230, z))
    : lerp(lerp(7, 24, smooth(34, 92, z)), 50, smooth(115, 235, z));
  const spread = left ? lerp(30, 36, smooth(40, 100, z)) : lerp(32, 37, smooth(40, 100, z));
  const t = Math.min(1, Math.max(0, (ad - w - BANK) / spread));
  const rise = amp * Math.pow(t, 1.55) + Math.max(0, ad - w - BANK - spread) * (0.32 + 0.25 * smooth(100, 200, z));
  // folds and knolls, stronger up the slopes
  const n = fbm(x * 0.03 + 3.1, z * 0.03 - 1.7, 4, 7) - 0.5;
  const fine = fbm(x * 0.11, z * 0.11, 3, 23) - 0.5;
  h += rise + n * 9 * smooth(0.05, 0.5, t) + fine * 1.4 * smooth(0, 0.3, t);
  // a meadow terrace on the left bank for the hamlet
  const hamlet = Math.exp(-((x + 25) ** 2) / 90 - ((z - 58) ** 2) / 140);
  h = lerp(h, 1.4 + 0.08 * (z - 58), hamlet * 0.8 * smooth(0.5, 3, h));
  return h;
}

/** Ground height at (x, z), including the cutting and slot that lead the line into each portal. */
export function terrainHeight(x: number, z: number): number {
  let h = natural(x, z);
  const [s, d] = toTrack(x, z, scratchTrack);
  const ad = Math.abs(d);
  // behind each portal the hill rises over the tunnel
  if (s < 0 || s > TRACK_LEN) {
    const inward = s < 0 ? -s : s - TRACK_LEN;
    const mound = DECK_Y + 8.2 - Math.max(0, ad - 7) * 0.55 - Math.max(0, inward - 10) * 0.12;
    h = Math.max(h, lerp(h, mound, smooth(26, 8, ad) * smooth(40, 4, inward)));
  }
  // the cutting in front of each portal: a level floor below the deck and
  // sloped sides, on the whole length of the line (it only bites where the
  // hill rises above the deck)
  const inside = smooth(-1.3, -0.25, s) * smooth(TRACK_LEN + 1.3, TRACK_LEN + 0.25, s);
  const cut = DECK_Y - 1.25 + Math.max(0, ad - 3.3) * 1.3;
  if (inside > 0) h = lerp(h, Math.min(h, cut), inside);
  // a narrow slot under the tunnel mouths (out of sight behind the facades),
  // so no ground shows inside the dark recess
  if (ad < 2.3 && (s < 0.5 || s > TRACK_LEN - 0.5) && s > -RECESS - 1.5 && s < TRACK_LEN + RECESS + 1.5) {
    h = Math.min(h, DECK_Y - 1.25);
  }
  return h;
}

/* ---------------------------------------------------------------------- */
/* mesh building                                                           */
/* ---------------------------------------------------------------------- */

/**
 * Static vertex layout (11 floats): position (3), normal (3), material,
 * ao, u, v, id. Materials are read by the shaders (MAT_* below).
 */
export const STATIC_STRIDE = 11;

export const MAT = {
  terrain: 0,
  ridge: 1,
  stone: 2,
  ballast: 3,
  recess: 4,
  wall: 5,
  roof: 6,
  rock: 7,
} as const;

class Builder {
  v: number[] = [];
  i: number[] = [];
  n = 0;
  vert(px: number, py: number, pz: number, nx: number, ny: number, nz: number, mat: number, ao: number, u: number, v: number, id: number): number {
    this.v.push(px, py, pz, nx, ny, nz, mat, ao, u, v, id);
    return this.n++;
  }
  tri(a: number, b: number, c: number) {
    this.i.push(a, b, c);
  }
  quad(a: number, b: number, c: number, d: number) {
    this.i.push(a, b, c, a, c, d);
  }
  /**
   * A flat quad from four corners (counter-clockwise seen from the front),
   * with its own face normal. uv per corner.
   */
  face(
    p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3,
    mat: number, ao: [number, number, number, number],
    uv: [number, number, number, number, number, number, number, number],
    id: number,
  ) {
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
    const vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
    // v × u: counter-clockwise as seen on screen (x right, y up, looking +z)
    let nx = vy * uz - vz * uy;
    let ny = vz * ux - vx * uz;
    let nz = vx * uy - vy * ux;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    const a = this.vert(p0[0], p0[1], p0[2], nx, ny, nz, mat, ao[0], uv[0], uv[1], id);
    const b = this.vert(p1[0], p1[1], p1[2], nx, ny, nz, mat, ao[1], uv[2], uv[3], id);
    const c = this.vert(p2[0], p2[1], p2[2], nx, ny, nz, mat, ao[2], uv[4], uv[5], id);
    const d = this.vert(p3[0], p3[1], p3[2], nx, ny, nz, mat, ao[3], uv[6], uv[7], id);
    this.quad(a, b, c, d);
  }
}

const P = (): Vec3 => [0, 0, 0];

/* ---------------------------------------------------------------------- */
/* terrain mesh                                                            */
/* ---------------------------------------------------------------------- */

/** The grid fans out with distance so its cells stay about the same size on screen. */
const GRID_Z0 = 0.5;
const GRID_Z1 = 255;
const gridHalfWidth = (z: number) => 14 + 0.76 * z;

function addTerrain(b: Builder, cols: number, rows: number, AS: number) {
  // a coarse regular height grid for ambient occlusion lookups
  const AX0 = -210, AX1 = 210, AZ0 = -10, AZ1 = 270;
  const aw = Math.ceil((AX1 - AX0) / AS) + 1;
  const ah = Math.ceil((AZ1 - AZ0) / AS) + 1;
  const grid = new Float32Array(aw * ah);
  for (let j = 0; j < ah; j++) {
    for (let i = 0; i < aw; i++) grid[j * aw + i] = terrainHeight(AX0 + i * AS, AZ0 + j * AS);
  }
  const sample = (x: number, z: number) => {
    const fx = Math.min(aw - 1.001, Math.max(0, (x - AX0) / AS));
    const fz = Math.min(ah - 1.001, Math.max(0, (z - AZ0) / AS));
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const a = grid[j * aw + i];
    const c = grid[j * aw + i + 1];
    const d = grid[(j + 1) * aw + i];
    const e = grid[(j + 1) * aw + i + 1];
    return a + (c - a) * tx + (d - a) * tz + (a - c - d + e) * tx * tz;
  };
  const DIRS = 7;
  const DISTS = [2, 6, 14, 30];
  const dirX = Array.from({ length: DIRS }, (_, k) => Math.cos((k / DIRS) * Math.PI * 2 + 0.3));
  const dirZ = Array.from({ length: DIRS }, (_, k) => Math.sin((k / DIRS) * Math.PI * 2 + 0.3));
  const start = b.n;
  // heights first; normals come from each vertex's neighbours on the grid
  const row = cols + 1;
  const xs = new Float32Array(row * (rows + 1));
  const zs = new Float32Array(row * (rows + 1));
  const hs = new Float32Array(row * (rows + 1));
  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    const z = GRID_Z0 + (GRID_Z1 - GRID_Z0) * (0.3 * v + 0.7 * v * v);
    const half = gridHalfWidth(z);
    for (let c = 0; c <= cols; c++) {
      const i = r * row + c;
      xs[i] = -half + (2 * half * c) / cols;
      zs[i] = z;
      hs[i] = terrainHeight(xs[i], z);
    }
  }
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const i = r * row + c;
      const x = xs[i];
      const z = zs[i];
      const h = hs[i];
      const l0 = r * row + Math.max(0, c - 1);
      const r0 = r * row + Math.min(cols, c + 1);
      const d0 = Math.max(0, r - 1) * row + c;
      const u0 = Math.min(rows, r + 1) * row + c;
      // tangents along the row and down the column, crossed
      const ax = xs[r0] - xs[l0], ay = hs[r0] - hs[l0], az = zs[r0] - zs[l0];
      const bx = xs[u0] - xs[d0], by = hs[u0] - hs[d0], bz = zs[u0] - zs[d0];
      let nx = by * az - bz * ay;
      let ny = bz * ax - bx * az;
      let nz = bx * ay - by * ax;
      if (ny < 0) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l;
      ny /= l;
      nz /= l;
      // horizon-based occlusion: how much of the sky the slopes around hide
      let occ = 0;
      for (let k = 0; k < DIRS; k++) {
        let best = 0;
        for (const dist of DISTS) {
          const rise = (sample(x + dirX[k] * dist, z + dirZ[k] * dist) - h) / dist;
          if (rise > best) best = rise;
        }
        occ += best / Math.sqrt(1 + best * best);
      }
      const ao = Math.max(0.35, 1 - (occ / DIRS) * 1.15);
      b.vert(x, h, z, nx, ny, nz, MAT.terrain, ao, x, z, 0);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = start + r * row + c;
      // counter-clockwise seen from above
      b.quad(a, a + row, a + row + 1, a + 1);
    }
  }
}

/* ---------------------------------------------------------------------- */
/* the far ranges                                                          */
/* ---------------------------------------------------------------------- */

/** Bands of mountains on rings around the camera, with a low gap where the river comes from. */
function addRidges(b: Builder, steps: number) {
  const layers = [
    { r: 300, depth: 70, base: 26, amp: 30, seed: 3, freq: 2.6 },
    { r: 430, depth: 110, base: 46, amp: 44, seed: 9, freq: 1.9 },
    { r: 640, depth: 160, base: 70, amp: 70, seed: 15, freq: 1.4 },
  ];
  const AZ = 1.32; // ± radians
  const radial = 9;
  for (let li = 0; li < layers.length; li++) {
    const L = layers[li];
    const start = b.n;
    const heightAt = (az: number, rr: number) => {
      const t = az / AZ;
      const n = fbm(az * L.freq * 3 + L.seed, L.seed * 0.7, 5, 31 + L.seed);
      const peaks = Math.pow(n, 1.4) * 1.7;
      // the gap the river comes through (slightly left of straight ahead)
      const gap = 1 - 0.78 * Math.exp(-(((az - 0.02) / (0.09 + li * 0.025)) ** 2));
      const rise = 1 + 0.35 * Math.abs(t);
      const top = (L.base + L.amp * peaks) * gap * rise;
      // across the band: a rounded ridge
      const k = (rr - L.r) / L.depth;
      const across = Math.max(0, 1 - k * k * 0.9) ;
      const shoulder = fbm(az * 9 + L.seed, rr * 0.02, 3, 77 + li) - 0.5;
      return top * across + shoulder * 6 * across - 8 * (1 - across);
    };
    for (let j = 0; j <= radial; j++) {
      const rr = L.r - L.depth + (2 * L.depth * j) / radial;
      for (let i = 0; i <= steps; i++) {
        const az = -AZ + (2 * AZ * i) / steps;
        const y = heightAt(az, rr);
        const e = 0.002;
        const dAz = (heightAt(az + e, rr) - heightAt(az - e, rr)) / (2 * e * rr);
        const dR = (heightAt(az, rr + 2) - heightAt(az, rr - 2)) / 4;
        // gradient in the local (tangent, radial) frame → world normal
        const tx = Math.cos(az), tz = -Math.sin(az); // tangent (increasing az)
        const rx = Math.sin(az), rz = Math.cos(az); // radial (outward)
        let nx = -(dAz * tx + dR * rx);
        let ny = 1;
        let nz = -(dAz * tz + dR * rz);
        const l = Math.hypot(nx, ny, nz);
        nx /= l;
        ny /= l;
        nz /= l;
        b.vert(rr * Math.sin(az), y, rr * Math.cos(az), nx, ny, nz, MAT.ridge, 1, li, az, 0);
      }
    }
    const row = steps + 1;
    for (let j = 0; j < radial; j++) {
      for (let i = 0; i < steps; i++) {
        const a = start + j * row + i;
        b.quad(a, a + 1, a + row + 1, a + row);
      }
    }
  }
}

/* ---------------------------------------------------------------------- */
/* the viaduct                                                             */
/* ---------------------------------------------------------------------- */

/** Bottom of the viaduct's wall at s: the arch soffit within a span, the spring line over a pier. */
function soffit(s: number): number {
  const k = Math.floor(s / SPAN);
  const c = (k + 0.5) * SPAN;
  const off = Math.abs(s - c);
  if (off >= ARCH_R) return SPRING_Y;
  return SPRING_Y + Math.sqrt(ARCH_R * ARCH_R - off * off);
}

/** Samples along the line: dense on each arch (cosine spaced), exact at the pier faces. */
function viaductSamples(): number[] {
  const out: number[] = [];
  for (let k = 0; k < SPANS; k++) {
    const c = (k + 0.5) * SPAN;
    const a = k * SPAN;
    out.push(a);
    out.push(c - ARCH_R);
    const n = 18;
    for (let i = 1; i < n; i++) {
      const t = -Math.cos((i / n) * Math.PI);
      out.push(c + t * ARCH_R);
    }
    out.push(c + ARCH_R);
  }
  out.push(TRACK_LEN);
  return out;
}

/** A box along the line: s0…s1, d0…d1, y0…y1 (faces get their own normals). */
function lineBox(
  b: Builder, s0: number, s1: number, d0: number, d1: number, y0: number, y1: number, mat: number, faces = 0b111111,
  segments = 1,
) {
  const p = [P(), P(), P(), P()];
  const ao4: [number, number, number, number] = [1, 1, 1, 1];
  const seg = Math.max(1, segments);
  for (let i = 0; i < seg; i++) {
    const a = s0 + ((s1 - s0) * i) / seg;
    const c = s0 + ((s1 - s0) * (i + 1)) / seg;
    // outer face (d1, toward camera)
    if (faces & 1) {
      trackPoint(a, d1, p[0], y0); trackPoint(c, d1, p[1], y0); trackPoint(c, d1, p[2], y1); trackPoint(a, d1, p[3], y1);
      b.face(p[0], p[1], p[2], p[3], mat, ao4, [a, y0, c, y0, c, y1, a, y1], 0);
    }
    // inner face (d0)
    if (faces & 2) {
      trackPoint(c, d0, p[0], y0); trackPoint(a, d0, p[1], y0); trackPoint(a, d0, p[2], y1); trackPoint(c, d0, p[3], y1);
      b.face(p[0], p[1], p[2], p[3], mat, ao4, [c, y0, a, y0, a, y1, c, y1], 0);
    }
    // top
    if (faces & 4) {
      trackPoint(a, d1, p[0], y1); trackPoint(c, d1, p[1], y1); trackPoint(c, d0, p[2], y1); trackPoint(a, d0, p[3], y1);
      b.face(p[0], p[1], p[2], p[3], mat, ao4, [a, d1, c, d1, c, d0, a, d0], 0);
    }
    // bottom
    if (faces & 8) {
      trackPoint(a, d0, p[0], y0); trackPoint(c, d0, p[1], y0); trackPoint(c, d1, p[2], y0); trackPoint(a, d1, p[3], y0);
      b.face(p[0], p[1], p[2], p[3], mat, [0.6, 0.6, 0.6, 0.6], [a, d0, c, d0, c, d1, a, d1], 0);
    }
  }
  // the two ends
  if (faces & 16) {
    trackPoint(s0, d0, p[0], y0); trackPoint(s0, d1, p[1], y0); trackPoint(s0, d1, p[2], y1); trackPoint(s0, d0, p[3], y1);
    b.face(p[0], p[1], p[2], p[3], mat, ao4, [d0, y0, d1, y0, d1, y1, d0, y1], 0);
  }
  if (faces & 32) {
    trackPoint(s1, d1, p[0], y0); trackPoint(s1, d0, p[1], y0); trackPoint(s1, d0, p[2], y1); trackPoint(s1, d1, p[3], y1);
    b.face(p[0], p[1], p[2], p[3], mat, ao4, [d1, y0, d0, y0, d0, y1, d1, y1], 0);
  }
}

function addViaduct(b: Builder) {
  const samples = viaductSamples();
  const p = [P(), P(), P(), P()];
  const top = DECK_Y + PARAPET;
  // the two long faces, from the soffit up to the parapet's top
  for (const side of [1, -1]) {
    const d = side * HALF_W;
    for (let i = 0; i < samples.length - 1; i++) {
      const a = samples[i];
      const c = samples[i + 1];
      if (c - a < 1e-5) continue;
      const ya = soffit(a + 1e-4);
      const yc = soffit(c - 1e-4);
      trackPoint(a, d, p[0], ya);
      trackPoint(c, d, p[1], yc);
      trackPoint(c, d, p[2], top);
      trackPoint(a, d, p[3], top);
      // darker low on the spandrels, by the arch
      const aoA = 0.82 + 0.18 * smooth(ya, ya + 2.5, ya + 0.4);
      if (side > 0) b.face(p[0], p[1], p[2], p[3], MAT.stone, [aoA, aoA, 1, 1], [a, ya, c, yc, c, top, a, top], 0);
      else b.face(p[1], p[0], p[3], p[2], MAT.stone, [aoA, aoA, 1, 1], [c, yc, a, ya, a, top, c, top], 0);
    }
  }
  // the arch soffits (the barrel under each arch), from outer face to inner
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const c = samples[i + 1];
    if (c - a < 1e-5) continue;
    const ya = soffit(a + 1e-4);
    const yc = soffit(c - 1e-4);
    if (ya <= SPRING_Y + 1e-3 && yc <= SPRING_Y + 1e-3) continue; // over a pier: covered by its top
    trackPoint(c, HALF_W, p[0], yc);
    trackPoint(a, HALF_W, p[1], ya);
    trackPoint(a, -HALF_W, p[2], ya);
    trackPoint(c, -HALF_W, p[3], yc);
    b.face(p[0], p[1], p[2], p[3], MAT.stone, [0.5, 0.5, 0.5, 0.5], [c, HALF_W, a, HALF_W, a, -HALF_W, c, -HALF_W], 1);
  }
  // the piers, with a pilaster on each face and a wider footing where they stand in the river
  for (let k = 0; k <= SPANS; k++) {
    const s = k * SPAN;
    const pt = trackPoint(s, 0, P());
    const ground = Math.min(terrainHeight(pt[0], pt[2]), SPRING_Y) - 1.5;
    const s0 = Math.max(-0.5, s - PIER_W / 2);
    const s1 = Math.min(TRACK_LEN + 0.5, s + PIER_W / 2);
    lineBox(b, s0, s1, -HALF_W, HALF_W, ground, SPRING_Y + 0.02, MAT.stone, 0b110011);
    // pilasters on both faces, up to the string course
    lineBox(b, s0 - 0.18, s1 + 0.18, HALF_W - 0.05, HALF_W + 0.28, ground, DECK_Y - 0.95, MAT.stone, 0b110101);
    lineBox(b, s0 - 0.18, s1 + 0.18, -HALF_W - 0.28, -HALF_W + 0.05, ground, DECK_Y - 0.95, MAT.stone, 0b110110);
    const water = terrainHeight(pt[0], pt[2]) < 0.6;
    if (water) {
      lineBox(b, s0 - 0.45, s1 + 0.45, -HALF_W - 0.6, HALF_W + 0.6, ground, 1.0, MAT.stone, 0b111111);
    }
  }
  // the string course under the parapet, both faces
  lineBox(b, -0.3, TRACK_LEN + 0.3, HALF_W - 0.05, HALF_W + 0.17, DECK_Y - 0.95, DECK_Y - 0.62, MAT.stone, 0b001101, 48);
  lineBox(b, -0.3, TRACK_LEN + 0.3, -HALF_W - 0.17, -HALF_W + 0.05, DECK_Y - 0.95, DECK_Y - 0.62, MAT.stone, 0b001110, 48);
  // parapet tops and inner faces, and the ballast between
  const inner = HALF_W - 0.3;
  for (let i = 0; i < 64; i++) {
    const a = (TRACK_LEN * i) / 64;
    const c = (TRACK_LEN * (i + 1)) / 64;
    for (const side of [1, -1]) {
      const dOut = side * HALF_W;
      const dIn = side * inner;
      // coping
      trackPoint(a, dOut, p[0], top + 0.06);
      trackPoint(c, dOut, p[1], top + 0.06);
      trackPoint(c, dIn, p[2], top + 0.06);
      trackPoint(a, dIn, p[3], top + 0.06);
      if (side > 0) b.face(p[0], p[1], p[2], p[3], MAT.stone, [1, 1, 1, 1], [a, 0, c, 0, c, 0.3, a, 0.3], 2);
      else b.face(p[1], p[0], p[3], p[2], MAT.stone, [1, 1, 1, 1], [c, 0, a, 0, a, 0.3, c, 0.3], 2);
      // inner face of the parapet
      trackPoint(a, dIn, p[0], BALLAST_Y);
      trackPoint(c, dIn, p[1], BALLAST_Y);
      trackPoint(c, dIn, p[2], top + 0.06);
      trackPoint(a, dIn, p[3], top + 0.06);
      if (side > 0) b.face(p[1], p[0], p[3], p[2], MAT.stone, [0.7, 0.7, 1, 1], [c, BALLAST_Y, a, BALLAST_Y, a, top, c, top], 0);
      else b.face(p[0], p[1], p[2], p[3], MAT.stone, [0.7, 0.7, 1, 1], [a, BALLAST_Y, c, BALLAST_Y, c, top, a, top], 0);
      // the coping's lip over the outer face
      trackPoint(a, dOut + side * 0.08, p[0], top - 0.05);
      trackPoint(c, dOut + side * 0.08, p[1], top - 0.05);
      trackPoint(c, dOut + side * 0.08, p[2], top + 0.06);
      trackPoint(a, dOut + side * 0.08, p[3], top + 0.06);
      if (side > 0) b.face(p[0], p[1], p[2], p[3], MAT.stone, [1, 1, 1, 1], [a, top, c, top, c, top + 0.1, a, top + 0.1], 2);
      else b.face(p[1], p[0], p[3], p[2], MAT.stone, [1, 1, 1, 1], [c, top, a, top, a, top + 0.1, c, top + 0.1], 2);
    }
    trackPoint(a, inner, p[0], BALLAST_Y);
    trackPoint(c, inner, p[1], BALLAST_Y);
    trackPoint(c, -inner, p[2], BALLAST_Y);
    trackPoint(a, -inner, p[3], BALLAST_Y);
    b.face(p[0], p[1], p[2], p[3], MAT.ballast, [0.8, 0.8, 0.8, 0.8], [a, inner, c, inner, c, -inner, a, -inner], 0);
  }
}

/* ---------------------------------------------------------------------- */
/* the portals                                                             */
/* ---------------------------------------------------------------------- */

const MOUTH_HALF = 1.45;
const MOUTH_WALL = DECK_Y + 2.35;

function addPortal(b: Builder, end: 0 | 1) {
  // s at the facade, and which way is "into the hill"
  const sF = end === 0 ? 0 : TRACK_LEN;
  const inward = end === 0 ? -1 : 1;
  const FW = 8.2;
  const y0 = DECK_Y - 2.4;
  const y1 = DECK_Y + 6.4;
  const p = [P(), P(), P(), P()];
  const at = (s: number, d: number, y: number, out: Vec3) => trackPoint(s, d, out, y);
  // the facade: a slab a little proud of the hill, faces out of the tunnel
  const sFront = sF - inward * 0.35;
  const add = (d0: number, d1: number, ya0: number, ya1: number, yb0: number, yb1: number) => {
    // corners at d0 (heights ya0..ya1) and d1 (yb0..yb1), wound to face out
    if (inward > 0) {
      at(sFront, d0, ya0, p[0]); at(sFront, d1, yb0, p[1]); at(sFront, d1, yb1, p[2]); at(sFront, d0, ya1, p[3]);
      b.face(p[0], p[1], p[2], p[3], MAT.stone, [0.9, 0.9, 1, 1], [d0, ya0, d1, yb0, d1, yb1, d0, ya1], 3);
    } else {
      at(sFront, d1, yb0, p[0]); at(sFront, d0, ya0, p[1]); at(sFront, d0, ya1, p[2]); at(sFront, d1, yb1, p[3]);
      b.face(p[0], p[1], p[2], p[3], MAT.stone, [0.9, 0.9, 1, 1], [d1, yb0, d0, ya0, d0, ya1, d1, yb1], 3);
    }
  };
  // left and right of the mouth
  add(-FW, -MOUTH_HALF, y0, y1, y0, y1);
  add(MOUTH_HALF, FW, y0, y1, y0, y1);
  // over the mouth: strips down to the arch
  const N = 10;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI - (Math.PI * i) / N;
    const a1 = Math.PI - (Math.PI * (i + 1)) / N;
    const d0 = Math.cos(a0) * MOUTH_HALF;
    const d1 = Math.cos(a1) * MOUTH_HALF;
    const ya = MOUTH_WALL + Math.sin(a0) * MOUTH_HALF;
    const yb = MOUTH_WALL + Math.sin(a1) * MOUTH_HALF;
    add(d0, d1, ya, y1, yb, y1);
  }
  // below the rails inside the mouth (the facade's foot)
  add(-MOUTH_HALF, MOUTH_HALF, y0, BALLAST_Y - 0.02, y0, BALLAST_Y - 0.02);
  // coping along the top, and the facade's two ends (the slab's thickness)
  const sBack = sF + inward * 0.4;
  const s0 = Math.min(sFront, sBack);
  const s1 = Math.max(sFront, sBack);
  lineBox(b, s0 - 0.12, s1 + 0.12, -FW - 0.15, FW + 0.15, y1, y1 + 0.32, MAT.stone, 0b111111);
  lineBox(b, s0, s1, FW - 0.01, FW, y0, y1, MAT.stone, 0b000001);
  lineBox(b, s0, s1, -FW, -FW + 0.01, y0, y1, MAT.stone, 0b000010);
  // the recess: two walls, a vault, a floor and a black back
  const sIn = sF + inward * (RECESS + 0.6);
  const ss0 = Math.min(sFront, sIn);
  const ss1 = Math.max(sFront, sIn);
  for (const side of [-1, 1]) {
    const d = side * MOUTH_HALF;
    // a wall seen from inside the tunnel
    at(ss0, d, BALLAST_Y, p[0]); at(ss1, d, BALLAST_Y, p[1]); at(ss1, d, MOUTH_WALL, p[2]); at(ss0, d, MOUTH_WALL, p[3]);
    if (side > 0) b.face(p[1], p[0], p[3], p[2], MAT.recess, [0.4, 0.4, 0.4, 0.4], [ss1, BALLAST_Y, ss0, BALLAST_Y, ss0, MOUTH_WALL, ss1, MOUTH_WALL], 0);
    else b.face(p[0], p[1], p[2], p[3], MAT.recess, [0.4, 0.4, 0.4, 0.4], [ss0, BALLAST_Y, ss1, BALLAST_Y, ss1, MOUTH_WALL, ss0, MOUTH_WALL], 0);
  }
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI - (Math.PI * i) / N;
    const a1 = Math.PI - (Math.PI * (i + 1)) / N;
    const d0 = Math.cos(a0) * MOUTH_HALF;
    const d1 = Math.cos(a1) * MOUTH_HALF;
    const ya = MOUTH_WALL + Math.sin(a0) * MOUTH_HALF;
    const yb = MOUTH_WALL + Math.sin(a1) * MOUTH_HALF;
    // the vault, facing down and in
    at(ss0, d0, ya, p[0]); at(ss1, d0, ya, p[1]); at(ss1, d1, yb, p[2]); at(ss0, d1, yb, p[3]);
    b.face(p[0], p[1], p[2], p[3], MAT.recess, [0.35, 0.35, 0.35, 0.35], [ss0, yb, ss1, yb, ss1, ya, ss0, ya], 0);
  }
  at(ss0, MOUTH_HALF, BALLAST_Y, p[0]); at(ss1, MOUTH_HALF, BALLAST_Y, p[1]); at(ss1, -MOUTH_HALF, BALLAST_Y, p[2]); at(ss0, -MOUTH_HALF, BALLAST_Y, p[3]);
  b.face(p[0], p[1], p[2], p[3], MAT.recess, [0.4, 0.4, 0.4, 0.4], [ss0, 0, ss1, 0, ss1, 1, ss0, 1], 0);
  // the back: black
  at(sIn, -MOUTH_HALF - 0.1, BALLAST_Y - 0.1, p[0]); at(sIn, MOUTH_HALF + 0.1, BALLAST_Y - 0.1, p[1]); at(sIn, MOUTH_HALF + 0.1, MOUTH_WALL + MOUTH_HALF + 0.1, p[2]); at(sIn, -MOUTH_HALF - 0.1, MOUTH_WALL + MOUTH_HALF + 0.1, p[3]);
  if (inward < 0) b.face(p[1], p[0], p[3], p[2], MAT.recess, [0, 0, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], 9);
  else b.face(p[0], p[1], p[2], p[3], MAT.recess, [0, 0, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], 9);
}

/** Where a train's light shows in a portal before the train does (the mouth's middle). */
export function portalMouth(end: 0 | 1, out: Vec3): Vec3 {
  return trackPoint(end === 0 ? -0.2 : TRACK_LEN + 0.2, 0, out, DECK_Y + 1.2);
}

/* ---------------------------------------------------------------------- */
/* the hamlet                                                              */
/* ---------------------------------------------------------------------- */

export type House = { x: number; z: number; w: number; d: number; h: number; yaw: number; id: number };

export const HOUSES: readonly House[] = [
  { x: -23.5, z: 55, w: 3.4, d: 2.4, h: 2.3, yaw: 0.25, id: 1 },
  { x: -28.5, z: 60.5, w: 2.8, d: 2.2, h: 2.0, yaw: 0.5, id: 2 },
  { x: -20.8, z: 63, w: 2.6, d: 2.3, h: 2.6, yaw: 0.1, id: 3 },
  { x: -31.5, z: 53.5, w: 2.4, d: 2.0, h: 1.8, yaw: -0.15, id: 4 },
  { x: -26, z: 68.5, w: 3.0, d: 2.2, h: 2.1, yaw: 0.35, id: 5 },
  // a cottage alone on the right bank, by the water
  { x: 17.5, z: 47, w: 2.9, d: 2.2, h: 2.0, yaw: -0.35, id: 6 },
];

function addHouse(b: Builder, house: House) {
  const { x, z, w, d, h, yaw, id } = house;
  const base = Math.min(
    terrainHeight(x - w / 2, z - d / 2),
    terrainHeight(x + w / 2, z - d / 2),
    terrainHeight(x - w / 2, z + d / 2),
    terrainHeight(x + w / 2, z + d / 2),
  ) - 0.3;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const W = (lx: number, ly: number, lz: number, out: Vec3): Vec3 => {
    out[0] = x + lx * c + lz * s;
    out[1] = base + ly;
    out[2] = z - lx * s + lz * c;
    return out;
  };
  const p = [P(), P(), P(), P()];
  const hw = w / 2;
  const hd = d / 2;
  const top = h + 0.3;
  const ridge = top + w * 0.36;
  // four walls (u along the wall in units, v height above the ground line)
  const walls: Array<[number, number, number, number, number]> = [
    // lx0, lz0, lx1, lz1, face index
    [-hw, -hd, hw, -hd, 0],
    [hw, -hd, hw, hd, 1],
    [hw, hd, -hw, hd, 2],
    [-hw, hd, -hw, -hd, 3],
  ];
  // window layout code for the shader: house, storeys, long wall, face
  const two = h >= 2.25 ? 16 : 0;
  for (const [ax, az, cx, cz, f] of walls) {
    const len = Math.hypot(cx - ax, cz - az);
    const wide = len >= 2.6 ? 8 : 0;
    W(ax, 0, az, p[0]); W(cx, 0, cz, p[1]); W(cx, top, cz, p[2]); W(ax, top, az, p[3]);
    b.face(p[0], p[1], p[2], p[3], MAT.wall, [0.75, 0.75, 1, 1], [-len / 2, 0.3, len / 2, 0.3, len / 2, top, -len / 2, top], id * 32 + two + wide + f);
  }
  // gables on the short (x) ends
  for (const side of [1, -1]) {
    const gx = side * hw;
    const a = W(gx, top, -hd * side, P());
    const bb = W(gx, top, hd * side, P());
    const cpt = W(gx, ridge, 0, P());
    const nx = side * c;
    const nz = -side * s;
    const i0 = b.vert(a[0], a[1], a[2], nx, 0, nz, MAT.wall, 1, -hd, 0, id * 32 + 4);
    const i1 = b.vert(bb[0], bb[1], bb[2], nx, 0, nz, MAT.wall, 1, hd, 0, id * 32 + 4);
    const i2 = b.vert(cpt[0], cpt[1], cpt[2], nx, 0, nz, MAT.wall, 1, 0, ridge - top, id * 32 + 4);
    b.tri(i0, i1, i2);
  }
  // the roof: two slopes with a little overhang
  const o = 0.22;
  for (const side of [1, -1]) {
    W(-hw - o, top - 0.12, side * (hd + o), p[0]);
    W(hw + o, top - 0.12, side * (hd + o), p[1]);
    W(hw + o, ridge, 0, p[2]);
    W(-hw - o, ridge, 0, p[3]);
    if (side < 0) b.face(p[0], p[1], p[2], p[3], MAT.roof, [0.8, 0.8, 1, 1], [0, 0, 1, 0, 1, 1, 0, 1], id);
    else b.face(p[1], p[0], p[3], p[2], MAT.roof, [0.8, 0.8, 1, 1], [0, 0, 1, 0, 1, 1, 0, 1], id);
  }
  // a chimney
  const cxl = hw * 0.55;
  const cz0 = -0.18;
  const ch = [P(), P(), P(), P()];
  const cy0 = ridge - 0.5;
  const cy1 = ridge + 0.55;
  const box = [
    [cxl - 0.18, cz0 - 0.18], [cxl + 0.18, cz0 - 0.18], [cxl + 0.18, cz0 + 0.18], [cxl - 0.18, cz0 + 0.18],
  ];
  for (let k = 0; k < 4; k++) {
    const [ax, az] = box[k];
    const [bx, bz] = box[(k + 1) % 4];
    W(ax, cy0, az, ch[0]); W(bx, cy0, bz, ch[1]); W(bx, cy1, bz, ch[2]); W(ax, cy1, az, ch[3]);
    b.face(ch[0], ch[1], ch[2], ch[3], MAT.roof, [1, 1, 1, 1], [0, 0, 1, 0, 1, 1, 0, 1], id);
  }
}

/* ---------------------------------------------------------------------- */
/* rocks along the banks                                                   */
/* ---------------------------------------------------------------------- */

function addRocks(b: Builder, count: number) {
  const random = seededRandom(0x0c4e);
  let made = 0;
  for (let tries = 0; tries < count * 30 && made < count; tries++) {
    const z = 10 + random() * 95;
    const side = random() < 0.5 ? -1 : 1;
    const x = riverX(z) + side * (riverHalf(z) + (random() - 0.35) * 3.2);
    const h = terrainHeight(x, z);
    if (h > 1.2 || h < -0.9) continue;
    const r = 0.35 + random() * random() * 1.2;
    // a squashed low-poly lump
    const rings = 3;
    const segs = 6;
    const start = b.n;
    const rot = random() * Math.PI;
    const sq = 0.55 + random() * 0.25;
    const ring: number[] = [];
    for (let j = 0; j <= rings; j++) {
      const phi = (j / rings) * (Math.PI / 2);
      for (let i = 0; i < segs; i++) {
        const th = rot + (i / segs) * Math.PI * 2;
        const jag = 0.8 + 0.4 * hash(i, j, made);
        const rr = r * Math.cos(phi) * jag;
        const px = x + Math.cos(th) * rr;
        const pz = z + Math.sin(th) * rr * 0.85;
        const py = h - 0.25 + Math.sin(phi) * r * sq;
        const nx = Math.cos(th) * Math.cos(phi);
        const ny = Math.sin(phi) + 0.2;
        const nz = Math.sin(th) * Math.cos(phi);
        const l = Math.hypot(nx, ny, nz);
        ring.push(b.vert(px, py, pz, nx / l, ny / l, nz / l, MAT.rock, 0.65 + 0.35 * (j / rings), x, z, made));
      }
    }
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < segs; i++) {
        const a = start + j * segs + i;
        const nb = start + j * segs + ((i + 1) % segs);
        b.quad(a, nb, nb + segs, a + segs);
      }
    }
    made++;
    void ring;
  }
}

/* ---------------------------------------------------------------------- */
/* everything static                                                       */
/* ---------------------------------------------------------------------- */

export type StaticMesh = { vertices: Float32Array; indices: Uint32Array };

export function buildStatic(mode: "tile" | "stage"): StaticMesh {
  const b = new Builder();
  const tile = mode === "tile";
  addTerrain(b, tile ? 124 : 214, tile ? 108 : 196, tile ? 3 : 2);
  addRidges(b, tile ? 110 : 200);
  addViaduct(b);
  addPortal(b, 0);
  addPortal(b, 1);
  for (const house of HOUSES) addHouse(b, house);
  addRocks(b, tile ? 14 : 30);
  return { vertices: new Float32Array(b.v), indices: new Uint32Array(b.i) };
}

/** The water: one quad over the river's reach (the terrain hides it everywhere else). */
export function buildWater(): Float32Array {
  const z0 = 1;
  const z1 = 262;
  const x0 = -gridHalfWidth(z1);
  const x1 = gridHalfWidth(z1);
  return new Float32Array([x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z0, x1, 0, z1, x0, 0, z1]);
}

/* ---------------------------------------------------------------------- */
/* pines                                                                   */
/* ---------------------------------------------------------------------- */

/** Pine vertex layout: position (3), normal (3), part (0 needles, 1 trunk), height share (0..1). */
export const TREE_STRIDE = 8;
/** Per pine: x, y, z, scale, yaw, hue, lean, darkness. */
export const TREE_INSTANCE = 8;

export function buildPine(): StaticMesh {
  const v: number[] = [];
  const idx: number[] = [];
  let n = 0;
  const H = 6.4;
  const push = (x: number, y: number, z: number, nx: number, ny: number, nz: number, part: number) => {
    const l = Math.hypot(nx, ny, nz) || 1;
    v.push(x, y, z, nx / l, ny / l, nz / l, part, y / H);
    return n++;
  };
  // trunk
  const TS = 5;
  for (let i = 0; i < TS; i++) {
    const a0 = (i / TS) * Math.PI * 2;
    const a1 = ((i + 1) / TS) * Math.PI * 2;
    const r = 0.17;
    const p0 = push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a0), 0, Math.sin(a0), 1);
    const p1 = push(Math.cos(a1) * r, 0, Math.sin(a1) * r, Math.cos(a1), 0, Math.sin(a1), 1);
    const p2 = push(Math.cos(a1) * r * 0.7, 1.9, Math.sin(a1) * r * 0.7, Math.cos(a1), 0, Math.sin(a1), 1);
    const p3 = push(Math.cos(a0) * r * 0.7, 1.9, Math.sin(a0) * r * 0.7, Math.cos(a0), 0, Math.sin(a0), 1);
    idx.push(p0, p2, p1, p0, p3, p2);
  }
  // tiers of needles: [base y, apex y, radius]
  const tiers: Array<[number, number, number]> = [
    [0.85, 3.0, 1.2],
    [1.85, 3.85, 0.98],
    [2.8, 4.7, 0.76],
    [3.7, 5.55, 0.54],
    [4.55, 6.4, 0.33],
  ];
  const S = 7;
  for (let t = 0; t < tiers.length; t++) {
    const [y0, y1, r] = tiers[t];
    const twist = t * 0.45;
    for (let i = 0; i < S; i++) {
      const a0 = twist + (i / S) * Math.PI * 2;
      const a1 = twist + ((i + 1) / S) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      // the rim droops a little between branch tips
      const tip0 = y0 - 0.12;
      const tip1 = y0 - 0.12;
      const slope = r / (y1 - y0);
      const ny = slope * 0.9 + 0.35;
      const e0 = push(Math.cos(a0) * r, tip0, Math.sin(a0) * r, Math.cos(a0), ny, Math.sin(a0), 0);
      const e1 = push(Math.cos(a1) * r, tip1, Math.sin(a1) * r, Math.cos(a1), ny, Math.sin(a1), 0);
      const ap = push(0, y1, 0, Math.cos(am), ny + 0.6, Math.sin(am), 0);
      idx.push(e0, ap, e1);
      // underside, toward the trunk
      const u0 = push(Math.cos(a0) * r, tip0, Math.sin(a0) * r, Math.cos(a0) * 0.3, -1, Math.sin(a0) * 0.3, 0);
      const u1 = push(Math.cos(a1) * r, tip1, Math.sin(a1) * r, Math.cos(a1) * 0.3, -1, Math.sin(a1) * 0.3, 0);
      const uc = push(0, y0 + 0.45, 0, 0, -1, 0, 0);
      idx.push(u0, u1, uc);
    }
  }
  return { vertices: new Float32Array(v), indices: new Uint32Array(idx) };
}

/** Is (x, z) kept clear of trees (the line, the hamlet, the river, the open valley floor)? */
function clearOfTrees(x: number, z: number, h: number, random: () => number): boolean {
  if (h < 0.75) return true;
  const [s, d] = toTrack(x, z, scratchTrack);
  if (s > -6 && s < TRACK_LEN + 6 && Math.abs(d) < 7) return true;
  // the tunnel mouths' surroundings stay open so the portals read
  if ((Math.abs(s) < 10 || Math.abs(s - TRACK_LEN) < 10) && Math.abs(d) < 11) return true;
  for (const house of HOUSES) {
    if (Math.hypot(x - house.x, z - house.z) < 3.6) return true;
  }
  // the open floor in front of the arches: meadow with the odd tree
  const off = Math.abs(x - riverX(z));
  if (z > 30 && z < 100 && off < 24 && random() > 0.06) return true;
  return false;
}

export function buildTrees(mode: "tile" | "stage"): { data: Float32Array; count: number } {
  const random = seededRandom(0x9e11);
  const out: number[] = [];
  const cell = mode === "tile" ? 4.6 : 3.3;
  for (let z = 12; z < 245; z += cell * (1 + z / 260)) {
    const half = gridHalfWidth(z) - 2;
    for (let x = -half; x < half; x += cell * (1 + z / 260)) {
      const px = x + (random() - 0.5) * cell * 1.1;
      const pz = z + (random() - 0.5) * cell * 1.1;
      const h = terrainHeight(px, pz);
      if (clearOfTrees(px, pz, h, random)) continue;
      const slope = Math.hypot(terrainHeight(px + 1, pz) - terrainHeight(px - 1, pz), terrainHeight(px, pz + 1) - terrainHeight(px, pz - 1)) / 2;
      if (slope > 1.25) continue;
      // forest on the valley sides, thinning near the bank and toward the tops
      const off = Math.abs(px - riverX(pz)) - riverHalf(pz);
      const n = fbm(px * 0.045, pz * 0.045, 3, 101);
      let p = smooth(4, 16, off) * (0.3 + 0.85 * smooth(0.38, 0.62, n));
      p *= 1 - 0.75 * smooth(30, 52, h);
      // thinner near the camera, so the near slopes frame rather than wall in
      p *= 0.35 + 0.65 * smooth(28, 70, pz);
      if (random() > p) continue;
      const scale = (0.5 + random() * 0.42) * (0.9 + 0.2 * smooth(0, 30, off));
      out.push(px, h - 0.25, pz, scale, random() * Math.PI * 2, random(), (random() - 0.5) * 0.08, random());
    }
  }
  // a few big ones framing the near corners
  const framers: Array<[number, number, number]> = [
    [-36, 47, 1.1], [-31, 52, 0.8],
    [37.5, 50, 1.15], [32.5, 55, 0.78],
  ];
  for (const [fx, fz, sc] of framers) {
    const h = terrainHeight(fx, fz);
    if (h < 0.6) continue;
    out.push(fx, h - 0.25, fz, sc, random() * Math.PI * 2, random(), (random() - 0.5) * 0.05, random());
  }
  return { data: new Float32Array(out), count: out.length / TREE_INSTANCE };
}

/* ---------------------------------------------------------------------- */
/* the train                                                               */
/* ---------------------------------------------------------------------- */

/**
 * Car vertex layout (9 floats): position (3, local: x along the car, y up
 * from the rail, z across), normal (3), part, u, v. Parts: 0 side, 1 roof,
 * 2 underframe, 3 end, 4 windscreen, 5 nose.
 */
export const CAR_STRIDE = 9;
/** Per car: x, y, z, s; forward x, forward z, direction (±1), kind (0 engine, 1 coach); livery, rear (1: the train's last car), seed, light. */
export const CAR_INSTANCE = 12;

export const PART = { side: 0, roof: 1, under: 2, end: 3, screen: 4, nose: 5 } as const;

type Section = { x: number; top: number; half: number; sill: number };

/**
 * Loft a car body through sections (each a rounded box profile), plus caps
 * at both ends, bogies and the underframe.
 */
function loftCar(sections: Section[], v: number[], idx: number[], nose: boolean) {
  let n = v.length / CAR_STRIDE;
  const push = (x: number, y: number, z: number, nx: number, ny: number, nz: number, part: number, u: number, vv: number) => {
    const l = Math.hypot(nx, ny, nz) || 1;
    v.push(x, y, z, nx / l, ny / l, nz / l, part, u, vv);
    return n++;
  };
  // the profile around a section, from the bottom of one side over the roof
  // to the other: [y, z, ny, nz, part]
  const profile = (sec: Section) => {
    const { top, half, sill } = sec;
    const shoulder = top - 0.3;
    const pts: Array<[number, number, number, number, number]> = [];
    pts.push([0.58, half - 0.06, -0.4, 1, PART.side]);
    pts.push([0.95, half, 0, 1, PART.side]);
    pts.push([shoulder, half, 0, 1, PART.side]);
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI;
      const y = shoulder + Math.sin(a) * (top - shoulder);
      const z = Math.cos(a) * half;
      pts.push([y, z, Math.sin(a) * 1.4 + 0.2, Math.cos(a), PART.roof]);
    }
    pts.push([shoulder, -half, 0, -1, PART.side]);
    pts.push([0.95, -half, 0, -1, PART.side]);
    pts.push([0.58, -half + 0.06, -0.4, -1, PART.side]);
    void sill;
    return pts;
  };
  const rings: number[][] = [];
  for (let k = 0; k < sections.length; k++) {
    const sec = sections[k];
    const prev = sections[Math.max(0, k - 1)];
    const next = sections[Math.min(sections.length - 1, k + 1)];
    // where the top drops toward a nose, the upper surfaces lean forward
    const slope = next.x !== prev.x ? (next.top - prev.top) / (next.x - prev.x) : 0;
    const pts = profile(sec);
    const ring: number[] = [];
    for (const [y, z, ny, nz, part] of pts) {
      const up = Math.max(0, (y - 1.0) / (sec.top - 1.0));
      ring.push(push(sec.x, y, z, -slope * up * 1.2, ny, nz, part, sec.x, y));
    }
    rings.push(ring);
  }
  for (let k = 0; k < rings.length - 1; k++) {
    const a = rings[k];
    const c = rings[k + 1];
    for (let i = 0; i < a.length - 1; i++) {
      // side segments 0..1 and 1..2 are the side; skip the joint between the two roof halves? no: continuous
      idx.push(a[i], c[i], c[i + 1], a[i], c[i + 1], a[i + 1]);
    }
    // the underside
    const last = a.length - 1;
    idx.push(a[last], c[last], c[0], a[last], c[0], a[0]);
  }
  // fix normals for the sloped nose sections (the screen): recompute from geometry for sections after a change in top
  // caps
  const cap = (sec: Section, sign: number, part: number) => {
    const pts = profile(sec);
    const center = push(sec.x, (sec.top + 0.58) / 2, 0, sign, 0, 0, part, 0, (sec.top + 0.58) / 2);
    const ring = pts.map(([y, z]) => push(sec.x, y, z, sign, 0, 0, part, z, y));
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const c = ring[(i + 1) % ring.length];
      if (sign > 0) idx.push(center, a, c);
      else idx.push(center, c, a);
    }
  };
  cap(sections[0], -1, PART.end);
  cap(sections[sections.length - 1], 1, nose ? PART.nose : PART.end);
  // underframe and bogies: plain boxes
  const box = (x0: number, x1: number, y0: number, y1: number, hz: number) => {
    const faces: Array<[number, number, number, Array<[number, number, number]>]> = [
      [0, 0, 1, [[x0, y0, hz], [x1, y0, hz], [x1, y1, hz], [x0, y1, hz]]],
      [0, 0, -1, [[x1, y0, -hz], [x0, y0, -hz], [x0, y1, -hz], [x1, y1, -hz]]],
      [1, 0, 0, [[x1, y0, hz], [x1, y0, -hz], [x1, y1, -hz], [x1, y1, hz]]],
      [-1, 0, 0, [[x0, y0, -hz], [x0, y0, hz], [x0, y1, hz], [x0, y1, -hz]]],
      [0, -1, 0, [[x0, y0, -hz], [x1, y0, -hz], [x1, y0, hz], [x0, y0, hz]]],
    ];
    for (const [nx, ny, nz, quad] of faces) {
      const ids = quad.map(([x, y, z]) => push(x, y, z, nx, ny, nz, PART.under, x, y));
      idx.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
    }
  };
  const x0 = sections[0].x;
  const x1 = sections[sections.length - 1].x;
  box(x0 + 0.6, x1 - 0.6, 0.38, 0.6, 0.62);
  for (const bx of [x0 + 1.9, x1 - 1.9]) box(bx - 1.05, bx + 1.05, 0.05, 0.42, 0.68);
}

/** Coach and engine meshes in one buffer; returns index ranges for each. */
export function buildCars(): StaticMesh & { coach: [number, number]; engine: [number, number] } {
  const v: number[] = [];
  const idx: number[] = [];
  const H = CAR_LEN / 2;
  const body = (x: number): Section => ({ x, top: 2.12, half: 0.75, sill: 0.95 });
  loftCar([body(-H), body(-H * 0.5), body(0), body(H * 0.5), body(H)], v, idx, false);
  const coachEnd = idx.length;
  const coachVerts = v.length;
  // the engine: the same body with a raked nose at +x
  loftCar(
    [
      body(-H),
      body(0),
      body(H - 1.9),
      { x: H - 1.1, top: 2.02, half: 0.75, sill: 0.95 },
      { x: H - 0.55, top: 1.78, half: 0.72, sill: 0.95 },
      { x: H - 0.15, top: 1.48, half: 0.66, sill: 0.95 },
      { x: H, top: 1.3, half: 0.6, sill: 0.95 },
    ],
    v,
    idx,
    true,
  );
  // the windscreen: the sloped part of the engine's top, marked by height
  // (parts are per vertex; mark the nose sections' upper vertices)
  for (let i = coachVerts; i < v.length; i += CAR_STRIDE) {
    const x = v[i];
    const y = v[i + 1];
    const part = v[i + 6];
    if (x > H - 1.15 && x < H - 0.1 && y > 1.25 && (part === PART.roof || part === PART.side)) {
      v[i + 6] = PART.screen;
    }
  }
  return {
    vertices: new Float32Array(v),
    indices: new Uint32Array(idx),
    coach: [0, coachEnd],
    engine: [coachEnd, idx.length - coachEnd],
  };
}
