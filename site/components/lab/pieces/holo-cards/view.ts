// The camera for the holo cards: a perspective view onto the deck, the
// projection the shaders use, picking (which card is under the pointer and
// where on it), and the maths that lays DOM stand-ins exactly over a card
// as it sits in perspective (a CSS matrix3d homography) and draws the focus
// ring round it.
//
// World units: a card is 1 tall (63 × 88 mm, so 0.716 wide), x right,
// y up, z toward the viewer. The eye sits at (0, yc, D) looking down -z;
// `scale` CSS px per unit at z = 0 places the deck in the stage.

import { CARD_H, CARD_R, CARD_W, type Card } from "./deck";

const HALF_W = CARD_W / 2;
const HALF_H = CARD_H / 2;

/** Rounded-rectangle signed distance (card-local units, negative inside). */
export function cardDistance(x: number, y: number, inset = 0): number {
  const qx = Math.abs(x) - (HALF_W - inset) + CARD_R;
  const qy = Math.abs(y) - (HALF_H - inset) + CARD_R;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - CARD_R;
}

export class View {
  /** Canvas size, CSS px. */
  width = 1;
  height = 1;
  /** Where the eye's axis meets the screen (CSS px). */
  cx = 0.5;
  cy = 0.5;
  /** CSS px per world unit at z = 0. */
  scale = 100;
  /** Eye distance (world units): the strength of the perspective. */
  depth = 3.3;
  /** The eye's height (world units). */
  yc = 0;
  /** Column-major view-projection for WebGL. */
  readonly viewProj = new Float32Array(16);
  readonly eye = new Float32Array(3);
  /** Bumped whenever the camera changes (DOM overlays re-place on it). */
  version = 0;

  set(width: number, height: number, cx: number, cy: number, scale: number, yc: number) {
    if (
      width === this.width &&
      height === this.height &&
      Math.abs(cx - this.cx) < 1e-4 &&
      Math.abs(cy - this.cy) < 1e-4 &&
      Math.abs(scale - this.scale) < 1e-4 &&
      Math.abs(yc - this.yc) < 1e-6
    )
      return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.cx = cx;
    this.cy = cy;
    this.scale = scale;
    this.yc = yc;
    this.version++;
    const D = this.depth;
    const F = scale * D;
    const w = this.width;
    const h = this.height;
    const ox = (2 * cx) / w - 1;
    const oy = 1 - (2 * cy) / h;
    const m = this.viewProj;
    m[0] = (2 * F) / w;
    m[1] = 0;
    m[2] = 0;
    m[3] = 0;
    m[4] = 0;
    m[5] = (2 * F) / h;
    m[6] = 0;
    m[7] = 0;
    m[8] = -ox;
    m[9] = -oy;
    m[10] = -0.05;
    m[11] = -1;
    m[12] = ox * D;
    m[13] = oy * D - ((2 * F) / h) * yc;
    m[14] = 0;
    m[15] = D;
    this.eye[0] = 0;
    this.eye[1] = yc;
    this.eye[2] = D;
  }

  /** World → CSS px. Writes [x, y] into `out`; returns false behind the eye. */
  project(x: number, y: number, z: number, out: Float64Array | number[]): boolean {
    const depth = this.depth - z;
    if (depth <= 1e-4) return false;
    const k = (this.scale * this.depth) / depth;
    out[0] = this.cx + x * k;
    out[1] = this.cy - (y - this.yc) * k;
    return true;
  }

  /** CSS px → the world point on the plane z = `z`. */
  unproject(sx: number, sy: number, z: number, out: Float64Array | number[]) {
    const k = (this.depth - z) / (this.scale * this.depth);
    out[0] = (sx - this.cx) * k;
    out[1] = this.yc + (this.cy - sy) * k;
  }

  /**
   * Where the ray through (sx, sy) meets `card` (its flat plane): card-local
   * x, y into `out` and the distance along the ray as the return value
   * (Infinity when it misses the plane).
   */
  hitCard(sx: number, sy: number, card: Card, out: Float64Array | number[]): number {
    const D = this.depth;
    // ray from the eye through the point under the pointer on z = 0
    const dx = (sx - this.cx) / this.scale;
    const dy = (this.cy - sy) / this.scale;
    const dz = -D;
    const ex = 0;
    const ey = this.yc;
    const ez = D;
    const n = card.axes;
    const nx = n[6];
    const ny = n[7];
    const nz = n[8];
    const denom = dx * nx + dy * ny + dz * nz;
    if (Math.abs(denom) < 1e-6) return Infinity;
    const t = ((card.x - ex) * nx + (card.y - ey) * ny + (card.z - ez) * nz) / denom;
    if (t <= 0) return Infinity;
    const hx = ex + dx * t - card.x;
    const hy = ey + dy * t - card.y;
    const hz = ez + dz * t - card.z;
    out[0] = hx * n[0] + hy * n[1] + hz * n[2];
    out[1] = hx * n[3] + hy * n[4] + hz * n[5];
    return t;
  }

  /** A card-local point → CSS px (flat card, ignoring bend). */
  projectLocal(card: Card, lx: number, ly: number, out: Float64Array | number[]): boolean {
    const a = card.axes;
    return this.project(
      card.x + a[0] * lx + a[3] * ly,
      card.y + a[1] * lx + a[4] * ly,
      card.z + a[2] * lx + a[5] * ly,
      out,
    );
  }
}

const corner = new Float64Array(2);
const quad = new Float64Array(8);

/**
 * The CSS transform that maps a `w` × `h` px box (transform-origin 0 0)
 * exactly onto the card as projected: a homography (unit square → the
 * projected quad, after Heckbert), written as matrix3d. Null when the card
 * is edge-on or behind the eye.
 */
export function cardTransform(view: View, card: Card, w: number, h: number): string | null {
  // top-left, top-right, bottom-right, bottom-left of the card's face as seen
  const signs = [-1, 1, 1, 1, 1, -1, -1, -1];
  for (let i = 0; i < 4; i++) {
    if (!view.projectLocal(card, signs[i * 2] * HALF_W, signs[i * 2 + 1] * HALF_H, corner)) return null;
    quad[i * 2] = corner[0];
    quad[i * 2 + 1] = corner[1];
  }
  const [x0, y0, x1, y1, x2, y2, x3, y3] = quad;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, hh: number;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) {
    a = x1 - x0;
    b = x3 - x0;
    c = x0;
    d = y1 - y0;
    e = y3 - y0;
    f = y0;
    g = 0;
    hh = 0;
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(den) < 1e-9) return null;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    hh = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + hh * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + hh * y3;
    f = y0;
  }
  // a box w × h px instead of the unit square
  a /= w;
  d /= w;
  g /= w;
  b /= h;
  e /= h;
  hh /= h;
  const r = (v: number) => (Math.abs(v) < 1e-12 ? "0" : v.toPrecision(7));
  return `matrix3d(${r(a)},${r(d)},0,${r(g)},${r(b)},${r(e)},0,${r(hh)},0,0,1,0,${r(c)},${r(f)},0,1)`;
}

/**
 * The outline of the card as seen, `gap` CSS px outside its edge, as an SVG
 * path (the corners are followed as arcs, sampled).
 */
export function cardOutline(view: View, card: Card, gap: number): string {
  const grow = gap / Math.max(1, view.scale);
  const hw = HALF_W + grow;
  const hh = HALF_H + grow;
  const r = CARD_R + grow;
  const steps = 6;
  let d = "";
  // corners: top-right, bottom-right, bottom-left, top-left (local y up)
  const centres = [
    [hw - r, hh - r, 0],
    [hw - r, -(hh - r), -Math.PI / 2],
    [-(hw - r), -(hh - r), -Math.PI],
    [-(hw - r), hh - r, Math.PI / 2],
  ];
  for (let c = 0; c < 4; c++) {
    const [ox, oy, start] = centres[c];
    for (let i = 0; i <= steps; i++) {
      const angle = start + Math.PI / 2 - (i / steps) * (Math.PI / 2);
      if (!view.projectLocal(card, ox + Math.cos(angle) * r, oy + Math.sin(angle) * r, corner)) return "";
      d += `${d ? "L" : "M"}${corner[0].toFixed(1)} ${corner[1].toFixed(1)}`;
    }
  }
  return d + "Z";
}
