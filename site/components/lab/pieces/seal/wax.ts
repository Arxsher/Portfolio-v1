// The wax: a height field shaded on the CPU into a small canvas.
//
// A seal is about a hundred CSS pixels across, so a few tens of thousands
// of device pixels; shading them in plain JS costs a few milliseconds and
// only happens while the wax is moving or cooling (the canvas is kept in
// between). No WebGL context needed, so nine tiles never compete for one.
//
// Shape (in seal units, 1 = the nominal outer radius):
//   - an irregular puddle: a few low harmonics and two or three lobes where
//     more wax squeezed out, a fine wiggle, and a rounded meniscus edge
//   - the pressed disc of the stamp face (radius 0.74), sunk below the wax
//     around it, with a soft rim of displaced wax just outside it
//   - the impression, in relief: a border ring, a ring of beads and the
//     arsher mark (the pixel arrowhead from components/logo.tsx) with
//     rounded bevels, as wax holds no sharp corners
//
// Light: one key light from the upper left (the same as the paper's), a
// soft sky from above, red-biased wrap lighting so the shadow side reads
// as translucent wax, cavity occlusion from a blurred copy of the height,
// and the key light's reflection as a soft rectangular "softbox", sharp
// and bright while the wax is molten, broad and satin once it has set.

import { clamp, seededRandom, smoothstep } from "../../hooks";

/** Half-size of the wax canvas in seal radii (room for the lobes). */
export const EXTENT = 1.24;
/** Radius of the stamp's face (and the pressed disc) in seal radii. */
export const FACE = 0.74;

const PLATEAU = 0.17; // wax thickness away from the edge
const RIM = 0.04; // displaced wax just outside the face
const FLOOR = PLATEAU - 0.06; // the pressed disc
const RELIEF = 0.052; // height of the impression
const MENISCUS = 0.15; // width of the rounded edge
const CAP = PLATEAU + RIM + 0.02;

// The arsher mark on a 16 × 16 grid: [x, y, w, h] blocks (mirrors components/logo.tsx).
const MARK: ReadonlyArray<readonly [number, number, number, number]> = [
  [7, 1, 2, 2],
  [5, 3, 2, 3],
  [9, 3, 2, 3],
  [3, 6, 2, 4],
  [11, 6, 2, 4],
  [1, 10, 2, 5],
  [13, 10, 2, 5],
  [7, 10, 2, 2],
];
const GRID = 0.05; // one mark cell in seal units (the mark spans 0.7)
const BEADS = 30;
const BEAD_RING = 0.6;
const BEAD_R = 0.021;

// Light (screen space, y down, z toward the viewer).
const L = normalize3(-0.42, -0.7, 0.62);
const HV = normalize3(L[0], L[1], L[2] + 1);

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

/** Linear (0..1, 4096 steps) → sRGB byte. */
const TO_SRGB = (() => {
  const table = new Uint8ClampedArray(4096);
  for (let i = 0; i < 4096; i++) {
    const c = i / 4095;
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    table[i] = Math.round(s * 255);
  }
  return table;
})();
const enc = (c: number) => TO_SRGB[c <= 0 ? 0 : c >= 1 ? 4095 : (c * 4095) | 0];

const toLinear = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)];
};

// Deep sealing-wax red: thick wax is darker and richer, the thin edge lets
// more light through and goes a little warmer.
const THICK = toLinear("#64080f");
const THIN = toLinear("#a2171f");

function sdRoundBox(px: number, py: number, bx: number, by: number, r: number) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/** Polynomial smooth minimum. */
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** The impression's relief at a point (0..1), in seal units. */
function impression(x: number, y: number): number {
  const r = Math.hypot(x, y);
  let e = 0;
  // border ring
  const ring = (r - 0.672) / 0.017;
  if (ring > -1.6 && ring < 1.6) e = Math.max(e, 0.8 * Math.exp(-ring * ring * 1.1));
  // beads
  if (Math.abs(r - BEAD_RING) < BEAD_R * 1.6) {
    const step = (Math.PI * 2) / BEADS;
    const a = Math.atan2(y, x) + Math.PI / 2;
    const k = Math.round(a / step);
    const ba = k * step - Math.PI / 2;
    const d = Math.hypot(x - Math.cos(ba) * BEAD_RING, y - Math.sin(ba) * BEAD_RING) / BEAD_R;
    if (d < 1) e = Math.max(e, 0.85 * Math.sqrt(1 - d * d));
  }
  // the mark
  if (r < 0.54) {
    let sd = Infinity;
    for (const [bx, by, bw, bh] of MARK) {
      const cx = (bx + bw / 2 - 8) * GRID;
      const cy = (by + bh / 2 - 8) * GRID;
      sd = Math.min(sd, sdRoundBox(x - cx, y - cy, (bw / 2) * GRID, (bh / 2) * GRID, GRID * 0.32));
    }
    const bevel = GRID * 0.42;
    const s = clamp(-sd / bevel + 0.15);
    e = Math.max(e, s * s * (3 - 2 * s));
  }
  return e;
}

export type WaxLook = {
  /** 0 set … 1 molten. */
  heat: number;
  /** Outer edge scale while the wax squeezes out (1 = at rest). */
  spread: number;
  /** Overall light level (dark theme sits in a dimmer room). */
  exposure: number;
};

/** One seal: its canvas and the fields it is shaded from. */
export class Wax {
  readonly canvas: HTMLCanvasElement;
  /** Canvas size in device px (square). */
  readonly size: number;
  /** Device px per seal radius. */
  readonly scale: number;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly image: ImageData | null;
  private readonly unit: number;
  private readonly radius: Float32Array;
  private readonly edge: Float32Array;
  private readonly relief: Float32Array;
  private readonly grain: Float32Array;
  private readonly height: Float32Array;
  private readonly blur: Float32Array;
  private readonly tmp: Float32Array;
  private readonly nx: Float32Array;
  private readonly ny: Float32Array;
  private readonly nz: Float32Array;
  private shapeSpread = -1;
  /** Edge radius by angle (for hit tests and shards). */
  private readonly edgeAt: (angle: number) => number;

  constructor(radiusDevicePx: number, seed: number) {
    this.scale = radiusDevicePx;
    this.size = Math.max(16, Math.ceil(radiusDevicePx * EXTENT * 2));
    const n = this.size;
    this.unit = (EXTENT * 2) / n;
    this.canvas = document.createElement("canvas");
    this.canvas.width = n;
    this.canvas.height = n;
    this.ctx = this.canvas.getContext("2d");
    this.image = this.ctx ? this.ctx.createImageData(n, n) : null;

    const random = seededRandom(seed);
    // Edge: low harmonics, two or three lobes, a fine wiggle.
    const harmonics = Array.from({ length: 6 }, (_, i) => ({
      k: i + 2,
      a: (0.026 / Math.pow(i + 2, 0.7)) * (0.5 + random()),
      p: random() * Math.PI * 2,
    }));
    const lobes = Array.from({ length: 2 + Math.floor(random() * 2) }, () => ({
      at: random() * Math.PI * 2,
      a: 0.045 + random() * 0.055,
      w: 0.22 + random() * 0.18,
    }));
    const wiggle = random() * Math.PI * 2;
    this.edgeAt = (angle: number) => {
      let r = 0.985;
      for (const h of harmonics) r += h.a * Math.cos(h.k * angle + h.p);
      for (const lobe of lobes) {
        let d = angle - lobe.at;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        r += lobe.a * Math.exp(-(d * d) / (lobe.w * lobe.w));
      }
      r += 0.0022 * Math.cos(17 * angle + wiggle) + 0.0012 * Math.cos(29 * angle + wiggle * 2);
      return r;
    };

    const count = n * n;
    this.radius = new Float32Array(count);
    this.edge = new Float32Array(count);
    this.relief = new Float32Array(count);
    this.grain = new Float32Array(count);
    this.height = new Float32Array(count);
    this.blur = new Float32Array(count);
    this.tmp = new Float32Array(count);
    this.nx = new Float32Array(count);
    this.ny = new Float32Array(count);
    this.nz = new Float32Array(count);

    // A cheap value noise for the surface grain (two octaves, seeded).
    const cells = 24;
    const lattice = new Float32Array((cells + 1) * (cells + 1));
    for (let i = 0; i < lattice.length; i++) lattice[i] = random() * 2 - 1;
    const wrapCell = (v: number) => ((v % cells) + cells) % cells;
    const noise = (x: number, y: number) => {
      const fx = wrapCell((x / (EXTENT * 2) + 0.5) * cells);
      const fy = wrapCell((y / (EXTENT * 2) + 0.5) * cells);
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = fx - ix;
      const ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const at = (cx: number, cy: number) => lattice[(cy % cells) * (cells + 1) + (cx % cells)];
      const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
      const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
      return a + (b - a) * sy;
    };

    for (let j = 0; j < n; j++) {
      const y = (j + 0.5) * this.unit - EXTENT;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * this.unit - EXTENT;
        const k = j * n + i;
        const r = Math.hypot(x, y);
        this.radius[k] = r;
        this.edge[k] = this.edgeAt(Math.atan2(y, x));
        this.relief[k] = r < FACE ? impression(x, y) : 0;
        this.grain[k] = noise(x * 0.9, y * 0.9) * 0.7 + noise(x * 2.3 + 3.1, y * 2.3 - 1.7) * 0.3;
      }
    }
  }

  /** Is this point (seal units from the centre) on the wax? */
  contains(x: number, y: number, spread = 1): boolean {
    return Math.hypot(x, y) <= this.edgeAt(Math.atan2(y, x)) * spread;
  }

  /** The wax outline as a polygon (seal units), for shadows and shard edges. */
  outline(points = 96, spread = 1): Array<[number, number]> {
    return Array.from({ length: points }, (_, i) => {
      const a = (i / points) * Math.PI * 2;
      const r = this.edgeAt(a) * spread;
      return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
    });
  }

  /** Re-shade the canvas for this state. */
  render({ heat, spread, exposure }: WaxLook) {
    const ctx = this.ctx;
    const image = this.image;
    if (!ctx || !image) return;
    const n = this.size;
    const u = this.unit;
    if (Math.abs(spread - this.shapeSpread) > 1e-4) {
      this.shape(spread);
      this.shapeSpread = spread;
    }

    const data = image.data;
    const { height, blur, nx, ny, nz, radius, edge } = this;
    const gloss = 0.3 + 0.7 * heat;
    // Highlight shape: a sharp softbox while molten, a broad sheen once set.
    const boxW = 0.2 + 0.1 * (1 - heat);
    const boxH = 0.12 + 0.08 * (1 - heat);
    const soft = 0.05 + 0.3 * (1 - heat);
    const boxGain = (0.55 + 1.9 * heat * heat) * exposure;
    const shin = 26 + 150 * heat;
    const blinnGain = (0.08 + 0.5 * heat) * exposure;
    const warm = heat * 0.55;
    const tR = THICK[0] * (1 + warm) + 0.05 * heat;
    const tG = THICK[1] * (1 + warm * 2) + 0.006 * heat;
    const tB = THICK[2] * (1 + warm);
    const sR = THIN[0] * (1 + warm * 0.6) + 0.06 * heat;
    const sG = THIN[1] * (1 + warm * 2) + 0.01 * heat;
    const sB = THIN[2] * (1 + warm * 0.6);
    const key = 1.05 * exposure;
    const lx = L[0];
    const ly = L[1];
    const lz = L[2];

    for (let k = 0; k < n * n; k++) {
      const o = k * 4;
      const delta = edge[k] * spread - radius[k];
      const alpha = delta / u + 0.5;
      if (alpha <= 0) {
        data[o + 3] = 0;
        continue;
      }
      const h = height[k];
      const x = nx[k];
      const y = ny[k];
      const z = nz[k];

      // Diffuse: red wraps further round than green and blue (translucency).
      const ndl = x * lx + y * ly + z * lz;
      const dR = Math.max(0, (ndl + 0.55) / 1.55);
      const dG = Math.max(0, (ndl + 0.15) / 1.15);
      const sky = 0.2 + 0.16 * z;
      const cavity = clamp(1 - (blur[k] - h) * 9, 0.35, 1);
      const t = clamp(h / PLATEAU);
      const thin = 1 - Math.sqrt(t);
      const aR = tR + (sR - tR) * thin;
      const aG = tG + (sG - tG) * thin;
      const aB = tB + (sB - tB) * thin;
      let r = aR * (key * dR + sky) * cavity;
      let g = aG * (key * dG + sky) * cavity;
      let b = aB * (key * dG + sky) * cavity;

      // Specular: the softbox reflection plus a small Blinn core.
      const rx = 2 * z * x;
      const ry = 2 * z * y;
      const bx = Math.abs(rx - lx * 0.95);
      const by = Math.abs(ry - ly * 0.95);
      const box = (1 - smoothstep(boxW, boxW + soft, bx)) * (1 - smoothstep(boxH, boxH + soft, by));
      const ndh = Math.max(0, x * HV[0] + y * HV[1] + z * HV[2]);
      const blinn = Math.pow(ndh, shin);
      const f = 1 - z;
      const fresnel = 0.05 + 0.95 * f * f * f * f * f;
      const spec = (box * boxGain + blinn * blinnGain) * (0.45 + fresnel) * cavity * gloss;
      // Grazing reflection of the warm room around the wax.
      const rim = fresnel * 0.16 * exposure * (0.5 + gloss);
      r += spec + rim * 0.95;
      g += spec * 0.96 + rim * 0.86;
      b += spec * 0.92 + rim * 0.78;

      data[o] = enc(r);
      data[o + 1] = enc(g);
      data[o + 2] = enc(b);
      data[o + 3] = alpha >= 1 ? 255 : (alpha * 255) | 0;
    }
    ctx.putImageData(image, 0, 0);
  }

  /** Height, cavity blur and normals for this spread. */
  private shape(spread: number) {
    const n = this.size;
    const u = this.unit;
    const { height, radius, edge, relief, grain } = this;
    for (let k = 0; k < n * n; k++) {
      const r = radius[k];
      const delta = edge[k] * spread - r;
      if (delta <= -u * 2) {
        height[k] = 0;
        continue;
      }
      const q = clamp(delta / MENISCUS);
      const cap = CAP * Math.sqrt(q * (2 - q));
      const g = grain[k];
      const wall = smoothstep(FACE - 0.012, FACE + 0.022, r);
      const floor = FLOOR + relief[k] * RELIEF + g * 0.0022;
      const rx = (r - (FACE + 0.06)) / 0.08;
      const rim = PLATEAU + RIM * Math.exp(-rx * rx) + g * 0.0028;
      const design = floor + (rim - floor) * wall;
      height[k] = Math.max(0, smin(design, cap, 0.03));
    }

    // Cavity: a box blur of the height (two passes, about 0.05 seal radii).
    const radiusPx = Math.max(1, Math.round(0.05 / u));
    boxBlur(height, this.tmp, n, radiusPx, true);
    boxBlur(this.tmp, this.blur, n, radiusPx, false);

    // Normals from central differences (height is in seal units too).
    const inv = 1 / (2 * u);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        const l = height[i > 0 ? k - 1 : k];
        const rr = height[i < n - 1 ? k + 1 : k];
        const t = height[j > 0 ? k - n : k];
        const b = height[j < n - 1 ? k + n : k];
        const dx = (rr - l) * inv;
        const dy = (b - t) * inv;
        const len = Math.sqrt(dx * dx + dy * dy + 1);
        this.nx[k] = -dx / len;
        this.ny[k] = -dy / len;
        this.nz[k] = 1 / len;
      }
    }
  }
}

/** One pass of a box blur along rows (horizontal) or columns. */
function boxBlur(src: Float32Array, dst: Float32Array, n: number, radius: number, horizontal: boolean) {
  const span = radius * 2 + 1;
  for (let line = 0; line < n; line++) {
    let sum = 0;
    const at = (p: number) => {
      const c = p < 0 ? 0 : p >= n ? n - 1 : p;
      return horizontal ? src[line * n + c] : src[c * n + line];
    };
    for (let p = -radius; p <= radius; p++) sum += at(p);
    for (let p = 0; p < n; p++) {
      const out = horizontal ? line * n + p : p * n + line;
      dst[out] = sum / span;
      sum += at(p + radius + 1) - at(p - radius);
    }
  }
}

/* ---------------------------------------------------------------------- */
/* breaking                                                                */
/* ---------------------------------------------------------------------- */

export type ShardShape = {
  /** Polygon in seal units, relative to the seal centre. */
  polygon: Array<[number, number]>;
  /** Centroid in seal units. */
  cx: number;
  cy: number;
  /** The shard cut out of the wax canvas, with its fracture edges drawn in (device px). */
  canvas: HTMLCanvasElement;
  /** Where the shard canvas's top-left sits relative to the centroid (device px). */
  ox: number;
  oy: number;
};

/** Clip a convex polygon by the half-plane on the side of `a` of the bisector between a and b. */
function clipBisector(poly: Array<[number, number]>, ax: number, ay: number, bx: number, by: number) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const side = (p: [number, number]) => (p[0] - mx) * dx + (p[1] - my) * dy; // <= 0 keeps
  const out: Array<[number, number]> = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp <= 0) !== (sq <= 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/**
 * Crack the seal: a Voronoi split seeded around the point it was struck,
 * small pieces near the blow and larger ones at the rim. Each shard gets
 * its own little canvas (cut from the wax with the light, fracture faces
 * drawn along its edges) so it can fly with an exact shadow.
 */
export function crack(wax: Wax, hitX: number, hitY: number, seed: number): { shards: ShardShape[]; cracks: Array<[number, number, number, number, number]> } {
  const random = seededRandom(seed);
  const hx = clamp(hitX, -0.45, 0.45);
  const hy = clamp(hitY, -0.45, 0.45);
  const seeds: Array<[number, number]> = [[hx + (random() - 0.5) * 0.08, hy + (random() - 0.5) * 0.08]];
  const inner = 3;
  const turn = random() * Math.PI * 2;
  for (let i = 0; i < inner; i++) {
    const a = turn + (i / inner) * Math.PI * 2 + (random() - 0.5) * 0.6;
    const r = 0.4 + random() * 0.12;
    seeds.push([hx * 0.5 + Math.cos(a) * r, hy * 0.5 + Math.sin(a) * r]);
  }
  const outer = 4 + Math.floor(random() * 2);
  for (let i = 0; i < outer; i++) {
    const a = turn + 0.5 + (i / outer) * Math.PI * 2 + (random() - 0.5) * 0.5;
    const r = 0.95 + random() * 0.12;
    seeds.push([Math.cos(a) * r, Math.sin(a) * r]);
  }

  const bound: Array<[number, number]> = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return [Math.cos(a) * 1.3, Math.sin(a) * 1.3];
  });

  const scale = wax.scale;
  const half = wax.size / 2;
  const shards: ShardShape[] = [];
  const cracks: Array<[number, number, number, number, number]> = [];

  seeds.forEach(([sx, sy], index) => {
    let poly = bound;
    seeds.forEach(([tx, ty], other) => {
      if (other !== index && poly.length) poly = clipBisector(poly, sx, sy, tx, ty);
    });
    if (poly.length < 3) return;

    // Cracks to draw before the pieces part: each edge once (from the lower index).
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const mx = (p[0] + q[0]) / 2;
      const my = (p[1] + q[1]) / 2;
      if (Math.hypot(mx, my) > 1.12) continue;
      // Is this edge shared with a later seed? (its midpoint is equidistant)
      const own = Math.hypot(mx - sx, my - sy);
      const later = seeds.some(([tx, ty], other) => other > index && Math.abs(Math.hypot(mx - tx, my - ty) - own) < 1e-3);
      if (!later) continue;
      cracks.push([p[0], p[1], q[0], q[1], Math.hypot(mx - hx, my - hy)]);
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let area = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[(i + 1) % poly.length];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      maxX = Math.max(maxX, x0);
      maxY = Math.max(maxY, y0);
    }
    if (Math.abs(area) < 1e-6) return;
    cx /= 3 * area;
    cy /= 3 * area;

    const left = Math.max(0, Math.floor(half + minX * scale) - 2);
    const top = Math.max(0, Math.floor(half + minY * scale) - 2);
    const right = Math.min(wax.size, Math.ceil(half + maxX * scale) + 2);
    const bottom = Math.min(wax.size, Math.ceil(half + maxY * scale) + 2);
    const w = right - left;
    const h = bottom - top;
    if (w < 2 || h < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const path = new Path2D();
    poly.forEach(([x, y], i) => {
      const px = half + x * scale - left;
      const py = half + y * scale - top;
      if (i === 0) path.moveTo(px, py);
      else path.lineTo(px, py);
    });
    path.closePath();
    ctx.save();
    ctx.clip(path);
    ctx.drawImage(wax.canvas, -left, -top);
    // Fracture faces: a dark lip on the shadow side and a pale broken face on the lit one.
    ctx.globalCompositeOperation = "source-atop";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1, scale * 0.05);
    ctx.strokeStyle = "rgba(40, 0, 4, 0.55)";
    ctx.stroke(path);
    ctx.lineWidth = Math.max(0.75, scale * 0.022);
    ctx.strokeStyle = "rgba(255, 170, 160, 0.38)";
    ctx.translate(-scale * 0.012, -scale * 0.018);
    ctx.stroke(path);
    ctx.restore();

    shards.push({
      polygon: poly,
      cx,
      cy,
      canvas,
      ox: left - (half + cx * scale),
      oy: top - (half + cy * scale),
    });
  });

  cracks.sort((a, b) => a[4] - b[4]);
  return { shards, cracks };
}
