// The wax: a height field shaded on the CPU into a small canvas.
//
// A seal is about a hundred CSS pixels across, so a few tens of thousands
// of device pixels; shading them in plain JS costs a few milliseconds and
// only happens while the wax is moving or cooling (the canvas is kept in
// between), and only over the square the wax actually covers. No WebGL
// context needed, so nine tiles never compete for one.
//
// Shape (in seal units, 1 = the nominal outer radius):
//   - poured (impress 0): a molten puddle, a plain glossy dome with a
//     round, barely lobed edge, growing with each drop
//   - pressed (impress 1): an irregular seal, a few low harmonics and two or
//     three lobes where more wax squeezed out, a fine wiggle and a rounded
//     meniscus edge; the pressed disc of the stamp face (radius 0.74) sunk
//     below the wax around it, with a soft rim of displaced wax just
//     outside it; the impression in relief: a border ring, a ring of beads
//     and the arsher mark (the pixel arrowhead from components/logo.tsx)
//     with rounded bevels, as wax holds no sharp corners
//
// Light: one key light from the upper left (the same as the paper's), a
// soft sky from above, red-biased wrap lighting so the shadow side reads
// as translucent wax, cavity occlusion from a blurred copy of the height,
// and the key light's reflection as a soft rectangular "softbox", sharp
// and bright while the wax is molten, broad and satin once it has set.
// Its drop shadow is baked into a second canvas whenever the outline
// changes, so a frame only composites two images.

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
// The molten puddle before the stamp: a taller, rounder dome.
const PUDDLE_CAP = 0.27;
const PUDDLE_MENISCUS = 0.22;

/** Far enough left that a shape drawn there never lands on the canvas (device px). */
const FAR = 20000;

// The arsher mark on a 16 × 16 grid: [x, y, w, h] blocks (mirrors components/logo.tsx).
export const MARK: ReadonlyArray<readonly [number, number, number, number]> = [
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
  /** Outer edge scale (a drop is about 0.3, a full puddle 0.6, the pressed seal 1). */
  spread: number;
  /** 0 a poured dome … 1 pressed by the stamp (the mark, the disc, the lobes). */
  impress: number;
  /** Overall light level (dark theme sits in a dimmer room). */
  exposure: number;
  /** Drop shadow colours (soft and contact), for the baked shadow. */
  shadow: { soft: string; contact: string };
};

/** One seal: its canvas, its baked shadow and the fields it is shaded from. */
export class Wax {
  readonly canvas: HTMLCanvasElement;
  /** The drop shadow, `shadowPad` device px larger on every side than `canvas`. */
  readonly shadow: HTMLCanvasElement;
  readonly shadowPad: number;
  /** Canvas size in device px (square). */
  readonly size: number;
  /** Device px per seal radius. */
  readonly scale: number;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly shadowCtx: CanvasRenderingContext2D | null;
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
  private readonly maxEdge: number;
  private shapeSpread = -1;
  private shapeImpress = -1;
  private lobe = 1;
  private box: [number, number] = [0, 0];
  private shadowKey = "";
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
    this.shadowPad = Math.ceil((radiusDevicePx / 54) * 14 + 4);
    this.shadow = document.createElement("canvas");
    this.shadow.width = n + this.shadowPad * 2;
    this.shadow.height = n + this.shadowPad * 2;
    this.shadowCtx = this.shadow.getContext("2d");

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
    let maxEdge = 0;
    for (let i = 0; i < 256; i++) maxEdge = Math.max(maxEdge, this.edgeAt((i / 256) * Math.PI * 2));
    this.maxEdge = maxEdge;

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

  /** Is this point (seal units from the centre) on the pressed wax? */
  contains(x: number, y: number, spread = 1): boolean {
    return Math.hypot(x, y) <= this.edgeAt(Math.atan2(y, x)) * spread;
  }

  /** The pressed wax outline as a polygon (seal units). */
  outline(points = 96, spread = 1): Array<[number, number]> {
    return Array.from({ length: points }, (_, i) => {
      const a = (i / points) * Math.PI * 2;
      const r = this.edgeAt(a) * spread;
      return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
    });
  }

  /** The pixel square [from, to) that can hold wax at this spread, with room for the blur. */
  private span(spread: number): [number, number] {
    const n = this.size;
    const half = (this.maxEdge * spread + 0.08) / this.unit + Math.max(1, Math.round(0.05 / this.unit)) * 2 + 3;
    return [Math.max(0, Math.floor(n / 2 - half)), Math.min(n, Math.ceil(n / 2 + half))];
  }

  /** Re-shade the canvas for this state. Returns true when the outline changed (the shadow was re-baked). */
  render({ heat, spread, impress, exposure, shadow }: WaxLook): boolean {
    const ctx = this.ctx;
    const image = this.image;
    if (!ctx || !image) return false;
    const n = this.size;
    const u = this.unit;
    let reshaped = false;
    if (Math.abs(spread - this.shapeSpread) > 1e-4 || Math.abs(impress - this.shapeImpress) > 1e-4) {
      this.shape(spread, impress);
      this.shapeSpread = spread;
      this.shapeImpress = impress;
      reshaped = true;
    }

    const data = image.data;
    data.fill(0);
    const { height, blur, nx, ny, nz, radius, edge } = this;
    const lobe = this.lobe;
    const [from, to] = this.box;
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

    for (let j = from; j < to; j++) {
      for (let i = from; i < to; i++) {
        const k = j * n + i;
        const delta = (0.985 + (edge[k] - 0.985) * lobe) * spread - radius[k];
        const alpha = delta / u + 0.5;
        if (alpha <= 0) continue;
        const o = k * 4;
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
        const ndh = x * HV[0] + y * HV[1] + z * HV[2];
        const blinn = ndh > 0.72 ? Math.pow(ndh, shin) : 0;
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
    }
    ctx.putImageData(image, 0, 0);

    const key2 = `${shadow.soft}|${shadow.contact}`;
    if (reshaped || key2 !== this.shadowKey) {
      this.shadowKey = key2;
      this.bakeShadow(shadow);
    }
    return reshaped;
  }

  /** The drop shadow: a wide soft one and a close contact one, of the current outline. */
  private bakeShadow(colors: { soft: string; contact: string }) {
    const ctx = this.shadowCtx;
    if (!ctx) return;
    const pad = this.shadowPad;
    const k = this.scale / 54;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.shadow.width, this.shadow.height);
    ctx.save();
    ctx.shadowColor = colors.soft;
    ctx.shadowBlur = 6 * k;
    ctx.shadowOffsetX = FAR + 1.5 * k;
    ctx.shadowOffsetY = 3 * k;
    ctx.drawImage(this.canvas, pad - FAR, pad);
    ctx.shadowColor = colors.contact;
    ctx.shadowBlur = 1.6 * k;
    ctx.shadowOffsetX = FAR + 0.4 * k;
    ctx.shadowOffsetY = 1 * k;
    ctx.drawImage(this.canvas, pad - FAR, pad);
    ctx.restore();
  }

  /** Height, cavity blur and normals for this spread and impression, inside the wax's square. */
  private shape(spread: number, impress: number) {
    const n = this.size;
    const u = this.unit;
    const { height, radius, edge, relief, grain } = this;
    // A poured puddle is rounder; the lobes come as the stamp squeezes it out.
    const lobe = 0.25 + 0.75 * impress;
    this.lobe = lobe;
    const men = PUDDLE_MENISCUS + (MENISCUS - PUDDLE_MENISCUS) * impress;
    const [from, to] = this.span(spread);
    this.box = [from, to];
    height.fill(0);
    for (let j = from; j < to; j++) {
      for (let i = from; i < to; i++) {
        const k = j * n + i;
        const r = radius[k];
        const delta = (0.985 + (edge[k] - 0.985) * lobe) * spread - r;
        if (delta <= -u * 2) continue;
        const q = clamp(delta / men);
        const dome = PUDDLE_CAP * Math.sqrt(q * (2 - q));
        if (impress <= 0) {
          height[k] = dome;
          continue;
        }
        const qs = clamp(delta / MENISCUS);
        const cap = CAP * Math.sqrt(qs * (2 - qs));
        const g = grain[k];
        const wall = smoothstep(FACE - 0.012, FACE + 0.022, r);
        const floor = FLOOR + relief[k] * RELIEF + g * 0.0022;
        const rx = (r - (FACE + 0.06)) / 0.08;
        const rim = PLATEAU + RIM * Math.exp(-rx * rx) + g * 0.0028;
        const design = floor + (rim - floor) * wall;
        const pressed = Math.max(0, smin(design, cap, 0.03));
        height[k] = dome + (pressed - dome) * impress;
      }
    }

    // Cavity: a box blur of the height (two passes, about 0.05 seal radii).
    const radiusPx = Math.max(1, Math.round(0.05 / u));
    boxBlur(height, this.tmp, n, radiusPx, true, from, to);
    boxBlur(this.tmp, this.blur, n, radiusPx, false, from, to);

    // Normals from central differences (height is in seal units too).
    const inv = 1 / (2 * u);
    for (let j = from; j < to; j++) {
      for (let i = from; i < to; i++) {
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

/** One pass of a box blur along rows (horizontal) or columns, over the square [from, to). */
function boxBlur(src: Float32Array, dst: Float32Array, n: number, radius: number, horizontal: boolean, from: number, to: number) {
  const span = radius * 2 + 1;
  const at = (line: number, p: number) => {
    const c = p < 0 ? 0 : p >= n ? n - 1 : p;
    return horizontal ? src[line * n + c] : src[c * n + line];
  };
  for (let line = from; line < to; line++) {
    let sum = 0;
    for (let p = from - radius; p <= from + radius; p++) sum += at(line, p);
    for (let p = from; p < to; p++) {
      dst[horizontal ? line * n + p : p * n + line] = sum / span;
      sum += at(line, p + radius + 1) - at(line, p - radius);
    }
  }
}

/* ---------------------------------------------------------------------- */
/* breaking                                                                */
/* ---------------------------------------------------------------------- */

type Point = [number, number];

export type ShardShape = {
  /** Which side of the flap's edge the piece sits on. */
  side: "flap" | "pocket";
  /** A chip knocked out right where it was struck (it pops off). */
  chip: boolean;
  /** Wax area (seal units²) and centroid (seal units, from the seal centre). */
  area: number;
  cx: number;
  cy: number;
  /** The piece cut out of the wax canvas, its fracture faces drawn in (device px). */
  canvas: HTMLCanvasElement;
  /** Where the canvas's top-left sits relative to the centroid (device px). */
  ox: number;
  oy: number;
  /** Its soft shadow, `shadowPad` device px larger on every side than `canvas`. */
  shadow: HTMLCanvasElement;
  shadowPad: number;
};

/** A crack to draw before the pieces part: from (x0, y0) toward (x1, y1); `d` is how far it starts from the blow. */
export type CrackLine = [number, number, number, number, number];

/** Keep the part of a convex polygon where (p − a) · n ≤ 0. */
function clipHalfPlane(poly: Point[], ax: number, ay: number, nx: number, ny: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = (p[0] - ax) * nx + (p[1] - ay) * ny;
    const sq = (q[0] - ax) * nx + (q[1] - ay) * ny;
    if (sp <= 0) out.push(p);
    if ((sp <= 0) !== (sq <= 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/** Clip by the half-plane on the side of `a` of the bisector between a and b (one Voronoi wall). */
function clipBisector(poly: Point[], ax: number, ay: number, bx: number, by: number) {
  return clipHalfPlane(poly, (ax + bx) / 2, (ay + by) / 2, bx - ax, by - ay);
}

type HalfPlane = [number, number, number, number];

/**
 * The flap's edge (a polyline running left to right, lowest at the tip, in
 * seal units) as convex regions: the flap above it (one region), and the
 * pocket below it as one strip per segment.
 */
function flapRegions(edge: Point[]): { flap: HalfPlane[]; pocket: HalfPlane[][] } {
  const flap: HalfPlane[] = [];
  const pocket: HalfPlane[][] = [];
  for (let i = 0; i < edge.length - 1; i++) {
    const [x0, y0] = edge[i];
    const [x1, y1] = edge[i + 1];
    // A normal pointing down the screen (toward the pocket).
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    flap.push([x0, y0, nx, ny]);
    const strip: HalfPlane[] = [[x0, y0, -nx, -ny]];
    if (i > 0) strip.push([x0, 0, -1, 0]);
    if (i < edge.length - 2) strip.push([x1, 0, 1, 0]);
    pocket.push(strip);
  }
  return { flap, pocket };
}

const clipAll = (poly: Point[], planes: HalfPlane[]) =>
  planes.reduce((p, [ax, ay, nx, ny]) => (p.length ? clipHalfPlane(p, ax, ay, nx, ny) : p), poly);

/**
 * Crack the seal. The main break runs along the flap's edge (`edge`, in
 * seal units), because that is where the paper pulls the wax apart; a
 * Voronoi split seeded around the point it was struck adds the smaller
 * cracks (small pieces near the blow, larger ones at the rim). Each piece
 * gets its own little canvas, cut from the wax with the light, fracture
 * faces drawn along its broken edges, and a soft shadow.
 */
export function crack(
  wax: Wax,
  hitX: number,
  hitY: number,
  seed: number,
  edge: Point[],
  shadowColor: string,
): { shards: ShardShape[]; cracks: CrackLine[] } {
  const random = seededRandom(seed);
  const hx = clamp(hitX, -0.45, 0.45);
  const hy = clamp(hitY, -0.45, 0.45);
  const seeds: Point[] = [[hx + (random() - 0.5) * 0.04, hy + (random() - 0.5) * 0.04]];
  const turn = random() * Math.PI * 2;
  // Right where it was struck: two or three small chips knocked clean out (the crumbs).
  const chipCount = 2 + (random() < 0.5 ? 1 : 0);
  const chips: Point[][] = [];
  for (let c = 0; c < chipCount; c++) {
    const a0 = turn + 0.9 + c * 2.25 + (random() - 0.5) * 0.5;
    const d = c === 0 ? 0.02 : 0.17 + random() * 0.03;
    const ccx = hx + Math.cos(a0) * d;
    const ccy = hy + Math.sin(a0) * d;
    const corners = 5 + Math.floor(random() * 2);
    const spin = random() * Math.PI * 2;
    const chip: Point[] = [];
    for (let i = 0; i < corners; i++) {
      const a = spin + ((i + (random() - 0.5) * 0.5) / corners) * Math.PI * 2;
      const r = (c === 0 ? 0.09 : 0.075) + random() * 0.035;
      chip.push([ccx + Math.cos(a) * r, ccy + Math.sin(a) * r]);
    }
    chips.push(chip);
  }
  const inner = 3;
  for (let i = 0; i < inner; i++) {
    const a = turn + (i / inner) * Math.PI * 2 + (random() - 0.5) * 0.6;
    const r = 0.36 + random() * 0.08;
    seeds.push([hx * 0.6 + Math.cos(a) * r, hy * 0.6 + Math.sin(a) * r]);
  }
  const outer = 3;
  for (let i = 0; i < outer; i++) {
    const a = turn + 0.5 + (i / outer) * Math.PI * 2 + (random() - 0.5) * 0.5;
    const r = 1.0 + random() * 0.12;
    seeds.push([Math.cos(a) * r, Math.sin(a) * r]);
  }

  const bound: Point[] = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return [Math.cos(a) * 1.3, Math.sin(a) * 1.3];
  });
  const regions = flapRegions(edge);

  const scale = wax.scale;
  const half = wax.size / 2;
  const k = scale / 54;
  const shards: ShardShape[] = [];
  const cracks: CrackLine[] = [];
  const toPx = ([x, y]: Point): Point => [half + x * scale, half + y * scale];
  const orient = (x0: number, y0: number, x1: number, y1: number) => {
    const d0 = Math.hypot(x0 - hx, y0 - hy);
    const d1 = Math.hypot(x1 - hx, y1 - hy);
    if (d0 <= d1) cracks.push([x0, y0, x1, y1, d0]);
    else cracks.push([x1, y1, x0, y0, d1]);
  };

  // The flap's edge, in short steps so the crack can run along it.
  for (let i = 0; i < edge.length - 1; i++) {
    const [x0, y0] = edge[i];
    const [x1, y1] = edge[i + 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.08));
    for (let s = 0; s < steps; s++) {
      const ax = x0 + ((x1 - x0) * s) / steps;
      const ay = y0 + ((y1 - y0) * s) / steps;
      const bx = x0 + ((x1 - x0) * (s + 1)) / steps;
      const by = y0 + ((y1 - y0) * (s + 1)) / steps;
      if (Math.hypot((ax + bx) / 2, (ay + by) / 2) > 1.15) continue;
      orient(ax, ay, bx, by);
    }
  }

  // The crater's outline cracks first.
  for (const chip of chips) {
    for (let i = 0; i < chip.length; i++) {
      const [x0, y0] = chip[i];
      const [x1, y1] = chip[(i + 1) % chip.length];
      orient(x0, y0, x1, y1);
    }
  }

  const tracePath = (path: Path2D, poly: Point[]) => {
    poly.forEach((p, i) => {
      const [px, py] = toPx(p);
      if (i === 0) path.moveTo(px, py);
      else path.lineTo(px, py);
    });
    path.closePath();
  };

  seeds.forEach(([sx, sy], index) => {
    let cell = bound;
    seeds.forEach(([tx, ty], other) => {
      if (other !== index && cell.length) cell = clipBisector(cell, sx, sy, tx, ty);
    });
    if (cell.length < 3) return;

    // Voronoi walls (each once, from the lower index).
    for (let i = 0; i < cell.length; i++) {
      const p = cell[i];
      const q = cell[(i + 1) % cell.length];
      const mx = (p[0] + q[0]) / 2;
      const my = (p[1] + q[1]) / 2;
      if (Math.hypot(mx, my) > 1.12) continue;
      const own = Math.hypot(mx - sx, my - sy);
      const later = seeds.some(([tx, ty], other) => other > index && Math.abs(Math.hypot(mx - tx, my - ty) - own) < 1e-3);
      if (later) orient(p[0], p[1], q[0], q[1]);
    }

    const parts: Array<{ side: "flap" | "pocket"; polys: Point[][] }> = [
      { side: "flap", polys: [clipAll(cell, regions.flap)] },
      { side: "pocket", polys: regions.pocket.map((strip) => clipAll(cell, strip)) },
    ];
    for (const part of parts) {
      const polys = part.polys.filter((p) => p.length >= 3);
      if (!polys.length) continue;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const poly of polys) {
        for (const [x, y] of poly) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      const left = Math.max(0, Math.floor(half + minX * scale) - 2);
      const top = Math.max(0, Math.floor(half + minY * scale) - 2);
      const right = Math.min(wax.size, Math.ceil(half + maxX * scale) + 2);
      const bottom = Math.min(wax.size, Math.ceil(half + maxY * scale) + 2);
      const w = right - left;
      const h = bottom - top;
      if (w < 2 || h < 2) continue;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) continue;
      ctx.translate(-left, -top);
      const clip = new Path2D();
      for (const poly of polys) tracePath(clip, poly);
      ctx.save();
      ctx.clip(clip);
      ctx.drawImage(wax.canvas, 0, 0);
      ctx.restore();
      // Where the chips came out: a shallow pit in the thick wax, its far wall catching the light.
      const crater = new Path2D();
      for (const chip of chips) tracePath(crater, chip);
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(34, 0, 5, 0.46)";
      ctx.fill(crater);
      ctx.clip(crater);
      ctx.lineWidth = Math.max(1, scale * 0.03);
      ctx.strokeStyle = "rgba(255, 150, 140, 0.28)";
      ctx.translate(scale * 0.014, scale * 0.02);
      ctx.stroke(crater);
      ctx.restore();

      // How much wax landed in it, and where its middle is.
      const pixels = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      let mx = 0;
      let my = 0;
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const a = pixels[(j * w + i) * 4 + 3];
          if (!a) continue;
          sum += a;
          mx += a * i;
          my += a * j;
        }
      }
      const area = sum / 255 / (scale * scale);
      if (area < 0.0025) continue;
      const pcx = (left + mx / sum - half) / scale;
      const pcy = (top + my / sum - half) / scale;

      // Fracture faces along the broken edges only.
      const breaks = new Path2D();
      tracePath(breaks, cell);
      edge.forEach((p, i) => {
        const [px, py] = toPx(p);
        if (i === 0) breaks.moveTo(px, py);
        else breaks.lineTo(px, py);
      });
      breaks.addPath(crater);
      fracture(ctx, breaks, scale);

      shards.push({
        side: part.side,
        chip: false,
        area,
        cx: pcx,
        cy: pcy,
        canvas,
        ox: left - (half + pcx * scale),
        oy: top - (half + pcy * scale),
        ...bakeShadow(canvas, k, shadowColor),
      });
    }
  });

  // The chips themselves.
  for (const chip of chips) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of chip) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const left = Math.max(0, Math.floor(half + minX * scale) - 2);
    const top = Math.max(0, Math.floor(half + minY * scale) - 2);
    const w = Math.min(wax.size, Math.ceil(half + maxX * scale) + 2) - left;
    const h = Math.min(wax.size, Math.ceil(half + maxY * scale) + 2) - top;
    if (w < 2 || h < 2) continue;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.translate(-left, -top);
    const path = new Path2D();
    tracePath(path, chip);
    ctx.save();
    ctx.clip(path);
    ctx.drawImage(wax.canvas, 0, 0);
    ctx.restore();
    fracture(ctx, path, scale);
    let cx = 0;
    let cy = 0;
    for (const [x, y] of chip) {
      cx += x / chip.length;
      cy += y / chip.length;
    }
    shards.push({
      side: cy < 0 ? "flap" : "pocket",
      chip: true,
      area: 0.02,
      cx,
      cy,
      canvas,
      ox: left - (half + cx * scale),
      oy: top - (half + cy * scale),
      ...bakeShadow(canvas, k, shadowColor),
    });
  }

  cracks.sort((a, b) => a[4] - b[4]);
  return { shards, cracks };
}

/** A dark lip along broken edges, then a pale face nearer the light (drawn only over the wax). */
function fracture(ctx: CanvasRenderingContext2D, path: Path2D, scale: number) {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, scale * 0.05);
  ctx.strokeStyle = "rgba(40, 0, 4, 0.55)";
  ctx.stroke(path);
  ctx.lineWidth = Math.max(0.75, scale * 0.02);
  ctx.strokeStyle = "rgba(255, 160, 150, 0.24)";
  ctx.translate(-scale * 0.012, -scale * 0.018);
  ctx.stroke(path);
  ctx.restore();
}

/** A piece's soft shadow, baked once. */
function bakeShadow(canvas: HTMLCanvasElement, k: number, color: string): { shadow: HTMLCanvasElement; shadowPad: number } {
  const pad = Math.ceil(5 * k + 3);
  const shadow = document.createElement("canvas");
  shadow.width = canvas.width + pad * 2;
  shadow.height = canvas.height + pad * 2;
  const sctx = shadow.getContext("2d");
  if (sctx) {
    sctx.shadowColor = color;
    sctx.shadowBlur = 2.2 * k;
    sctx.shadowOffsetX = FAR;
    sctx.drawImage(canvas, pad - FAR, pad);
  }
  return { shadow, shadowPad: pad };
}
