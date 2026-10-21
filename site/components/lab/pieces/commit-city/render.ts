// Draws the city with Canvas 2D in a turntable axonometric view.
//
// Projection: orthographic, the camera 30° above the ground and turned by
// `yaw` around the vertical (45° + k·90° are the classic isometric rests).
// For a world point (x, y, z), relative to the focus point F on the ground:
//   u = x cos(yaw) − z sin(yaw)          screen right
//   v = x sin(yaw) + z cos(yaw)          towards you
//   screen = centre + S · (u, v · sin(pitch) − y · cos(pitch))
// The ground plane maps affinely onto the screen, so flat things (the plinth
// top, the lots) are drawn with one setTransform, and each wall with another
// (its base edge and the vertical), which keeps windows and gradients crisp
// and cheap.
//
// Light stays with the camera, like a studio lamp over a model on a
// turntable: turn the city and its walls take their light from where they
// now face. Order of a frame: plinth (with its drop shadow), lots, sun
// shadows (one union, clipped to the plinth), contact shadows, then the
// buildings back to front (painter's order by depth), each tier wall →
// windows → roof → rim; then the month names, set like street names along
// the boulevards wherever the ground is clear; at night a bloom pass adds
// the window glow (the buildings drawn again in black so hidden windows
// don't shine through).
//
// The hot path allocates almost nothing: projections are inlined, picking
// polygons and hulls live in typed arrays that are reused frame to frame,
// and colour strings come from a cache (look.ts). The tile path uses no
// canvas filters at all: its plinth shadow is a sprite blurred once, and its
// sun shadow and glow are soft from being drawn small and scaled up.

import { clamp, hash2, smoothstep } from "../../hooks";
import { FOOTPRINT, LOT, type City, type Lot, type Tier } from "./city";
import { css, rgb, rgbScratch, shadeInto, WINDOW_LIGHTS, type Look, type RGB } from "./look";

export const PITCH = (30 * Math.PI) / 180;
const SIN_P = Math.sin(PITCH);
const COS_P = Math.cos(PITCH);

/** Key light direction in view space (u right, y up, v towards you): upper left, a little in front. */
const LIGHT = (() => {
  const u = -0.52;
  const y = 0.74;
  const v = 0.36;
  const n = Math.hypot(u, y, v);
  return { u: u / n, y: y / n, v: v / n };
})();

/** The four resting angles. */
export const REST = Math.PI / 4;
export const STEP = Math.PI / 2;

/** Plinth: corner radius and thickness (world units); its margins come with the city. */
const RADIUS = 0.62;
const THICKNESS = 0.4;
/** Lots stand this proud of the plinth (built ones only; empty lots stay flat). */
const PAD_RISE = 0.03;

/** Box sides: corner i → corner i+1, outward normals −z, +x, +z, −x. */
const CORNER_X = [-1, 1, 1, -1] as const;
const CORNER_Z = [-1, -1, 1, 1] as const;
const NORMAL_X = [0, 1, 0, -1] as const;
const NORMAL_Z = [-1, 0, 1, 0] as const;

/** Month names: size (CSS px) and the smallest scale at which a boulevard can carry them. */
const LABEL_SIZE = 11;
const LABEL_MIN_SCALE = 15;
/** Where along its district a name may slide to find clear ground (world units from the middle). */
const LABEL_SLIDES = [0, -0.55, 0.55, -1.1, 1.1, -1.65, 1.65, -2.2, 2.2];

export type View = {
  yaw: number;
  /** CSS px per world unit. */
  scale: number;
  /** Where the focus point sits on screen (CSS px). */
  cx: number;
  cy: number;
  /** Focus point on the ground (world units). */
  fx: number;
  fz: number;
};

type Frame = { a: number; b: number; c: number; d: number; e: number; f: number; up: number; sin: number; cos: number; S: number };

const newFrame = (): Frame => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, up: 1, sin: 0, cos: 1, S: 1 });

function frameInto(F: Frame, view: View): Frame {
  const { yaw, scale: S, cx, cy, fx, fz } = view;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  F.a = S * cos;
  F.c = -S * sin;
  F.b = S * SIN_P * sin;
  F.d = S * SIN_P * cos;
  F.e = cx - (F.a * fx + F.c * fz);
  F.f = cy - (F.b * fx + F.d * fz);
  F.up = S * COS_P;
  F.sin = sin;
  F.cos = cos;
  F.S = S;
  return F;
}

const scratchFrame = newFrame();

/** Screen point (CSS px) → the ground point under it (world x, z). */
export function screenToGround(view: View, sx: number, sy: number): { x: number; z: number } {
  const F = frameInto(scratchFrame, view);
  const det = F.a * F.d - F.b * F.c;
  const px = sx - F.e;
  const py = sy - F.f;
  return { x: (F.d * px - F.c * py) / det, z: (-F.b * px + F.a * py) / det };
}

/** World point → screen (CSS px). */
export function project(view: View, x: number, y: number, z: number): { x: number; y: number } {
  const F = frameInto(scratchFrame, view);
  return { x: F.a * x + F.c * z + F.e, y: F.b * x + F.d * z + F.f - F.up * y };
}

/** Screen directions (unit vectors) of world +x and +z in this view. */
export function axesOnScreen(yaw: number) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const xl = Math.hypot(cos, sin * SIN_P);
  const zl = Math.hypot(sin, cos * SIN_P);
  return { xx: cos / xl, xy: (sin * SIN_P) / xl, zx: -sin / zl, zy: (cos * SIN_P) / zl };
}

export type Bounds = { minU: number; maxU: number; minW: number; maxW: number };
export type Rect = { x0: number; x1: number; z0: number; z1: number };

type Geometry = { rect: Rect; built: Float64Array; count: number };
const geometries = new WeakMap<City, Geometry>();

function geometryOf(city: City): Geometry {
  let g = geometries.get(city);
  if (g) return g;
  const rect = {
    x0: city.minX - LOT / 2 - city.marginX,
    x1: city.maxX + LOT / 2 + city.marginX,
    z0: city.minZ - LOT / 2 - city.marginZ,
    z1: city.maxZ + LOT / 2 + city.marginZ,
  };
  const built = new Float64Array(city.lots.length * 3);
  let count = 0;
  for (const lot of city.lots) {
    if (lot.height <= 0) continue;
    built[count * 3] = lot.x;
    built[count * 3 + 1] = lot.z;
    built[count * 3 + 2] = lot.height + lot.mast + (lot.roofBox ? lot.roofBox.h : 0) + PAD_RISE;
    count++;
  }
  g = { rect, built, count };
  geometries.set(city, g);
  return g;
}

/** The plinth's rectangle (world units). */
export function plinthRect(city: City): Rect {
  return geometryOf(city).rect;
}

/**
 * The city's screen extent at unit scale, relative to the world origin:
 * u across, w down (heights included). Used to fit the city to the stage.
 */
export function boundsAt(city: City, yaw: number, out: Bounds = { minU: 0, maxU: 0, minW: 0, maxW: 0 }): Bounds {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const { rect, built, count } = geometryOf(city);
  let minU = Infinity;
  let maxU = -Infinity;
  let minW = Infinity;
  let maxW = -Infinity;
  for (let i = 0; i < 4; i++) {
    const x = i === 0 || i === 3 ? rect.x0 : rect.x1;
    const z = i < 2 ? rect.z0 : rect.z1;
    const u = x * cos - z * sin;
    const w = (x * sin + z * cos) * SIN_P;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (w < minW) minW = w;
    if (w + THICKNESS * COS_P > maxW) maxW = w + THICKNESS * COS_P;
  }
  const spread = (FOOTPRINT / 2) * (Math.abs(sin) + Math.abs(cos));
  for (let i = 0; i < count; i++) {
    const w = (built[i * 3] * sin + built[i * 3 + 1] * cos) * SIN_P - built[i * 3 + 2] * COS_P - spread * SIN_P;
    if (w < minW) minW = w;
  }
  out.minU = minU;
  out.maxU = maxU;
  out.minW = minW;
  out.maxW = maxW;
  return out;
}

/**
 * The ground point that lands on the centre of the bounds (so a view
 * focused on it, at the fitted scale, shows the whole city centred).
 */
export function centreOf(bounds: Bounds, yaw: number, out = { x: 0, z: 0 }): { x: number; z: number } {
  const u = (bounds.minU + bounds.maxU) / 2;
  const v = (bounds.minW + bounds.maxW) / 2 / SIN_P;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  out.x = u * cos + v * sin;
  out.z = -u * sin + v * cos;
  return out;
}

/* ---------------------------------------------------------------------- */
/* geometry helpers (scratch buffers, no allocation)                       */
/* ---------------------------------------------------------------------- */

const HULL_IN = new Float64Array(96);
const HULL_IDX = new Int32Array(48);
const HULL_STACK = new Int32Array(96);
/** The most points a building's hull can have (four boxes of eight corners and a mast tip). */
const HULL_MAX = 34;

function cross(p: Float64Array, o: number, a: number, b: number) {
  return (p[a * 2] - p[o * 2]) * (p[b * 2 + 1] - p[o * 2 + 1]) - (p[a * 2 + 1] - p[o * 2 + 1]) * (p[b * 2] - p[o * 2]);
}

/** Convex hull (monotone chain) of `n` points in HULL_IN, written to out[offset…]; returns its point count. */
function hullInto(n: number, out: Float64Array, offset: number): number {
  const p = HULL_IN;
  if (n < 3) {
    for (let i = 0; i < n * 2; i++) out[offset + i] = p[i];
    return n;
  }
  const idx = HULL_IDX;
  for (let i = 0; i < n; i++) idx[i] = i;
  for (let i = 1; i < n; i++) {
    const v = idx[i];
    const vx = p[v * 2];
    const vy = p[v * 2 + 1];
    let j = i - 1;
    while (j >= 0) {
      const w = idx[j];
      const wx = p[w * 2];
      if (wx > vx || (wx === vx && p[w * 2 + 1] > vy)) {
        idx[j + 1] = w;
        j--;
      } else break;
    }
    idx[j + 1] = v;
  }
  const st = HULL_STACK;
  let k = 0;
  for (let i = 0; i < n; i++) {
    while (k >= 2 && cross(p, st[k - 2], st[k - 1], idx[i]) <= 0) k--;
    st[k++] = idx[i];
  }
  const lower = k + 1;
  for (let i = n - 2; i >= 0; i--) {
    while (k >= lower && cross(p, st[k - 2], st[k - 1], idx[i]) <= 0) k--;
    st[k++] = idx[i];
  }
  k--;
  for (let i = 0; i < k; i++) {
    out[offset + i * 2] = p[st[i] * 2];
    out[offset + i * 2 + 1] = p[st[i] * 2 + 1];
  }
  return k;
}

function inConvex(poly: ArrayLike<number>, offset: number, n: number, x: number, y: number): boolean {
  if (n < 3) return false;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    const ax = poly[offset + i * 2];
    const ay = poly[offset + i * 2 + 1];
    const cr = (poly[offset + j * 2] - ax) * (y - ay) - (poly[offset + j * 2 + 1] - ay) * (x - ax);
    if (Math.abs(cr) < 1e-9) continue;
    const s = cr > 0 ? 1 : -1;
    if (!sign) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/** Distance from a point to a polygon's outline. */
function distanceToPoly(poly: ArrayLike<number>, offset: number, n: number, x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    const ax = poly[offset + i * 2];
    const ay = poly[offset + i * 2 + 1];
    const dx = poly[offset + j * 2] - ax;
    const dy = poly[offset + j * 2 + 1] - ay;
    const len = dx * dx + dy * dy;
    const t = len > 0 ? clamp(((x - ax) * dx + (y - ay) * dy) / len) : 0;
    const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
    if (d < best) best = d;
  }
  return best;
}

const CLIP_A = new Float64Array(512);
const CLIP_B = new Float64Array(512);

/** Clip a polygon to a rectangle (Sutherland–Hodgman); the result is in CLIP_A, returns its point count. */
function clipToRect(src: Float64Array, n: number, x0: number, y0: number, x1: number, y1: number): number {
  for (let i = 0; i < n * 2; i++) CLIP_A[i] = src[i];
  let input = CLIP_A;
  let output = CLIP_B;
  let count = n;
  for (let edge = 0; edge < 4 && count > 0; edge++) {
    let m = 0;
    const inside = (x: number, y: number) =>
      edge === 0 ? x >= x0 : edge === 1 ? x <= x1 : edge === 2 ? y >= y0 : y <= y1;
    for (let i = 0; i < count; i++) {
      const a = (i + count - 1) % count;
      const ax = input[a * 2];
      const ay = input[a * 2 + 1];
      const bx = input[i * 2];
      const by = input[i * 2 + 1];
      const aIn = inside(ax, ay);
      const bIn = inside(bx, by);
      if (aIn !== bIn && m < 254) {
        let cx: number;
        let cy: number;
        if (edge < 2) {
          const ex = edge === 0 ? x0 : x1;
          cx = ex;
          cy = ay + ((by - ay) * (ex - ax)) / (bx - ax);
        } else {
          const ey = edge === 2 ? y0 : y1;
          cy = ey;
          cx = ax + ((bx - ax) * (ey - ay)) / (by - ay);
        }
        output[m * 2] = cx;
        output[m * 2 + 1] = cy;
        m++;
      }
      if (bIn && m < 255) {
        output[m * 2] = bx;
        output[m * 2 + 1] = by;
        m++;
      }
    }
    count = m;
    const swap = input;
    input = output;
    output = swap;
  }
  if (input !== CLIP_A) for (let i = 0; i < count * 2; i++) CLIP_A[i] = input[i];
  return count;
}

type OutlinePoint = { x: number; z: number; nx: number; nz: number };

/** The rounded plinth outline in the ground plane: points and outward normals. */
function plinthOutline(city: City): OutlinePoint[] {
  const { x0, x1, z0, z1 } = plinthRect(city);
  const r = RADIUS;
  const corners: Array<[number, number, number]> = [
    // centre x, centre z, start angle (the arc sweeps 90°)
    [x1 - r, z0 + r, -Math.PI / 2],
    [x1 - r, z1 - r, 0],
    [x0 + r, z1 - r, Math.PI / 2],
    [x0 + r, z0 + r, Math.PI],
  ];
  const points: OutlinePoint[] = [];
  const segments = 8;
  for (const [cx, cz, start] of corners) {
    for (let i = 0; i <= segments; i++) {
      const angle = start + (i / segments) * (Math.PI / 2);
      const nx = Math.cos(angle);
      const nz = Math.sin(angle);
      points.push({ x: cx + nx * r, z: cz + nz * r, nx, nz });
    }
  }
  return points;
}

function traceFlat(target: CanvasRenderingContext2D, poly: ArrayLike<number>, offset: number, n: number) {
  target.moveTo(poly[offset], poly[offset + 1]);
  for (let i = 1; i < n; i++) target.lineTo(poly[offset + i * 2], poly[offset + i * 2 + 1]);
  target.closePath();
}

/* ---------------------------------------------------------------------- */
/* renderer                                                                */
/* ---------------------------------------------------------------------- */

export type RenderOptions = {
  look: Look;
  /** 0 day … 1 night (window lights follow it). */
  night: number;
  /** Slot (City.lots index) of the lot under the pointer / keyboard, or -1. */
  hover: number;
  /** Lift of a lot's building by slot, 0..1 (hover pops it up a little). */
  liftOf: (slot: number) => number;
  /** 0..1: how far the rest of the city steps back while one day is pointed at. */
  focus: number;
  /** 0..1: month names along the boulevards (0 hides them). */
  labels: number;
  /** "tile" draws lighter: thinner rims, no labels, no canvas filters. */
  quality: "tile" | "stage";
  fontFamily: string;
};

export type Point = { x: number; y: number };

export type RenderResult = {
  /** Screen point (CSS px) above the hovered building or lot, for the tooltip. */
  anchor: Point | null;
  /** Screen point (CSS px) just below the hovered lot's front edge (the tooltip's other place). */
  base: Point | null;
  /** Mast tip of the tallest tower (CSS px), for the night beacon. */
  beacon: Point | null;
};

type Canvas = HTMLCanvasElement;

function makeCanvas(): Canvas {
  return document.createElement("canvas");
}

function sizeCanvas(canvas: Canvas, width: number, height: number) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

const supportsFilter = (() => {
  if (typeof document === "undefined") return false;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    return Boolean(ctx && typeof ctx.filter === "string");
  } catch {
    return false;
  }
})();

/** Copy `src` into `dst` blurred by `radius` px (a plain copy where canvas filters are missing). */
function blurInto(src: Canvas, dst: Canvas, radius: number): Canvas {
  sizeCanvas(dst, src.width, src.height);
  const ctx = dst.getContext("2d");
  if (!ctx) return src;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, dst.width, dst.height);
  if (supportsFilter && radius > 0.25) ctx.filter = `blur(${radius.toFixed(2)}px)`;
  ctx.drawImage(src, 0, 0);
  if (supportsFilter) ctx.filter = "none";
  return dst;
}

/** A plinth-shaped shadow blurred once, in world units, for the tile (drawn through the ground transform). */
type DropSprite = { canvas: Canvas; ox: number; oz: number; ppu: number };

function makeDropSprite(city: City, blurUnits: number): DropSprite | null {
  const rect = plinthRect(city);
  const margin = blurUnits * 3 + 0.5;
  const ppu = 10;
  const canvas = makeCanvas();
  sizeCanvas(canvas, (rect.x1 - rect.x0 + margin * 2) * ppu, (rect.z1 - rect.z0 + margin * 2) * ppu);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const ox = rect.x0 - margin;
  const oz = rect.z0 - margin;
  const draw = () => {
    const x = (rect.x0 - ox) * ppu;
    const y = (rect.z0 - oz) * ppu;
    const w = (rect.x1 - rect.x0) * ppu;
    const h = (rect.z1 - rect.z0) * ppu;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, RADIUS * ppu);
    else ctx.rect(x, y, w, h);
    ctx.fillStyle = "#000";
    ctx.fill();
  };
  if (supportsFilter) {
    ctx.filter = `blur(${(blurUnits * ppu).toFixed(2)}px)`;
    draw();
    ctx.filter = "none";
  } else {
    // Draw the shape far off the canvas and keep only its blurred shadow.
    const shift = canvas.width + 100;
    ctx.translate(-shift, 0);
    ctx.shadowColor = "#000";
    ctx.shadowBlur = blurUnits * ppu * 2;
    ctx.shadowOffsetX = shift;
    draw();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = "transparent";
  }
  return { canvas, ox, oz, ppu };
}

export class CityRenderer {
  readonly city: City;
  private order: Lot[];
  private orderYaw = NaN;
  private outline: OutlinePoint[];
  private topPoints: Float64Array;
  private bottomPoints: Float64Array;
  private F = newFrame();
  private shadow = makeCanvas();
  private shadowSoft = makeCanvas();
  /** Plinth drop shadow on the stage: [sharp, blurred] canvases for the wide and the tight pass. */
  private drops = [
    [makeCanvas(), makeCanvas()],
    [makeCanvas(), makeCanvas()],
  ] as const;
  /** The tile's pre-blurred drop shadows (wide, tight), and the scale they were made for. */
  private dropSprites: [DropSprite | null, DropSprite | null] | null = null;
  private dropSpriteScale = 0;
  private glow = makeCanvas();
  private glowWide = makeCanvas();
  private glowTight = makeCanvas();
  /** Picking, by slot: each drawn building's screen hull and bounding box, nearest first. */
  private hitPoly: Float64Array;
  private hitLen: Int32Array;
  private hitBox: Float64Array;
  private hitOrder: Int32Array;
  private hitCount = 0;
  /** Each lot's paving quad (screen), nearest first. */
  private padPoly: Float64Array;
  private padOrder: Int32Array;
  private padCount = 0;
  private result: RenderResult = { anchor: null, base: null, beacon: null };
  private anchorPt: Point = { x: 0, y: 0 };
  private basePt: Point = { x: 0, y: 0 };
  private beaconPt: Point = { x: 0, y: 0 };
  private gradients: { ctx: CanvasRenderingContext2D | null; key: number; sideFade: CanvasGradient | null; aoBand: CanvasGradient | null } = {
    ctx: null,
    key: NaN,
    sideFade: null,
    aoBand: null,
  };
  private labelWidths = new Map<string, number>();
  private placedLabels = new Float64Array(4 * 48);
  private labelFont = "";
  private tmp = rgbScratch();
  private face = rgbScratch();
  private plinthTop = rgbScratch();
  private windowScratch = new Float64Array(4 * 64);

  constructor(city: City) {
    this.city = city;
    this.order = city.lots.slice();
    this.outline = plinthOutline(city);
    this.topPoints = new Float64Array(this.outline.length * 2);
    this.bottomPoints = new Float64Array(this.outline.length * 2);
    const slots = city.lots.length;
    this.hitPoly = new Float64Array(slots * HULL_MAX * 2);
    this.hitLen = new Int32Array(slots);
    this.hitBox = new Float64Array(slots * 4);
    this.hitOrder = new Int32Array(slots);
    this.padPoly = new Float64Array(slots * 8);
    this.padOrder = new Int32Array(slots);
  }

  /**
   * Lets go of the offscreen canvases' pixels at once (each shrinks to
   * 1 × 1) instead of waiting for the garbage collector. Rendering again
   * afterwards still works: every buffer is re-sized on use and the tile's
   * shadow sprites are made again.
   */
  dispose() {
    const release = (canvas: Canvas) => {
      canvas.width = 1;
      canvas.height = 1;
    };
    for (const canvas of [this.shadow, this.shadowSoft, this.glow, this.glowWide, this.glowTight]) release(canvas);
    for (const pair of this.drops) for (const canvas of pair) release(canvas);
    this.dropSprites = null;
    this.dropSpriteScale = 0;
    this.gradients.ctx = null;
  }

  /**
   * The lot under a screen point (CSS px) in the last frame drawn. With a
   * `radius`, a point that misses everything takes the nearest lot within
   * that many px (fingers are wider than buildings).
   */
  pick(x: number, y: number, radius = 0): Lot | null {
    const lots = this.city.lots;
    for (let i = 0; i < this.hitCount; i++) {
      const slot = this.hitOrder[i];
      const b = slot * 4;
      if (x < this.hitBox[b] || x > this.hitBox[b + 2] || y < this.hitBox[b + 1] || y > this.hitBox[b + 3]) continue;
      if (inConvex(this.hitPoly, slot * HULL_MAX * 2, this.hitLen[slot], x, y)) return lots[slot];
    }
    for (let i = 0; i < this.padCount; i++) {
      const slot = this.padOrder[i];
      if (inConvex(this.padPoly, slot * 8, 4, x, y)) return lots[slot];
    }
    if (radius <= 0) return null;
    let best: Lot | null = null;
    let bestDistance = radius;
    for (let i = 0; i < this.hitCount; i++) {
      const slot = this.hitOrder[i];
      const b = slot * 4;
      if (x < this.hitBox[b] - radius || x > this.hitBox[b + 2] + radius || y < this.hitBox[b + 1] - radius || y > this.hitBox[b + 3] + radius) continue;
      const d = distanceToPoly(this.hitPoly, slot * HULL_MAX * 2, this.hitLen[slot], x, y);
      if (d < bestDistance) {
        bestDistance = d;
        best = lots[slot];
      }
    }
    for (let i = 0; i < this.padCount; i++) {
      const slot = this.padOrder[i];
      // Buildings win ties: an empty lot has to be clearly nearer.
      const d = distanceToPoly(this.padPoly, slot * 8, 4, x, y) + 3;
      if (d < bestDistance) {
        bestDistance = d;
        best = lots[slot];
      }
    }
    return best;
  }

  private sortFor(F: Frame) {
    const yaw = Math.atan2(F.sin, F.cos);
    if (yaw === this.orderYaw) return;
    this.orderYaw = yaw;
    const { sin, cos } = F;
    this.order.sort((p, q) => p.x * sin + p.z * cos - (q.x * sin + q.z * cos));
  }

  /** Gradients that only depend on the look: made again when night moves (quantised) or the context changes. */
  private gradientsFor(ctx: CanvasRenderingContext2D, look: Look, night: number) {
    const g = this.gradients;
    const key = Math.round(night * 200);
    if (g.ctx === ctx && g.key === key && g.sideFade && g.aoBand) return g;
    g.ctx = ctx;
    g.key = key;
    const side = ctx.createLinearGradient(0, -THICKNESS, 0, 0);
    side.addColorStop(0, css(look.shadowTint, 0.28));
    side.addColorStop(0.6, css(look.shadowTint, 0.06));
    side.addColorStop(1, css(look.shadowTint, 0));
    const ao = ctx.createLinearGradient(0, 0, 0, 0.26);
    ao.addColorStop(0, css(look.shadowTint, look.contact * 1.25));
    ao.addColorStop(1, css(look.shadowTint, 0));
    g.sideFade = side;
    g.aoBand = ao;
    return g;
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number,
    view: View,
    options: RenderOptions,
  ): RenderResult {
    const F = frameInto(this.F, view);
    const { look, night, quality } = options;
    const tile = quality === "tile";
    const lots = this.city.lots;
    this.sortFor(F);
    const result = this.result;
    result.anchor = null;
    result.base = null;
    result.beacon = null;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    /** Ground-plane transform at height y (draw in world x, z). */
    const ground = (target: CanvasRenderingContext2D, y: number, k = dpr) =>
      target.setTransform(k * F.a, k * F.b, k * F.c, k * F.d, k * F.e, k * (F.f - F.up * y));
    /**
     * Wall transform: s runs 0..1 from (x0, z0) to (x1, z1), t is height in
     * world units from y0 (positive up).
     */
    const wall = (target: CanvasRenderingContext2D, x0: number, z0: number, x1: number, z1: number, y0: number, k = dpr) => {
      const ax = F.a * x0 + F.c * z0 + F.e;
      const ay = F.b * x0 + F.d * z0 + F.f - F.up * y0;
      const bx = F.a * x1 + F.c * z1 + F.e;
      const by = F.b * x1 + F.d * z1 + F.f - F.up * y0;
      target.setTransform(k * (bx - ax), k * (by - ay), 0, -k * F.up, k * ax, k * ay);
    };
    const sideDiffuse = (nx: number, nz: number) => {
      const nu = nx * F.cos - nz * F.sin;
      const nv = nx * F.sin + nz * F.cos;
      return Math.max(0, nu * LIGHT.u + nv * LIGHT.v);
    };
    const facing = (nx: number, nz: number) => nx * F.sin + nz * F.cos;
    const tmp = this.tmp;
    const gradients = this.gradientsFor(ctx, look, night);

    /* ---------------- plinth ---------------- */

    const outline = this.outline;
    const n = outline.length;
    const topPoints = this.topPoints;
    const bottomPoints = this.bottomPoints;
    for (let i = 0; i < n; i++) {
      const p = outline[i];
      const sx = F.a * p.x + F.c * p.z + F.e;
      const sy = F.b * p.x + F.d * p.z + F.f;
      topPoints[i * 2] = sx;
      topPoints[i * 2 + 1] = sy;
      bottomPoints[i * 2] = sx;
      bottomPoints[i * 2 + 1] = sy + THICKNESS * F.up;
    }

    // Drop shadow on the table: a wide soft one and a tight contact one,
    // cast by the plinth's footprint.
    if (look.drop > 0.001) {
      if (tile) this.tileDrop(ctx, F, dpr, look);
      else this.stageDrop(ctx, F, width, height, dpr, look);
    }
    // The plinth's side in its own colour under the facets (no hairline gaps).
    const margin = 160;
    const footprint = clipToRect(bottomPoints, n, -margin, -margin, width + margin, height + margin);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    if (footprint >= 3) traceFlat(ctx, CLIP_A, 0, footprint);
    shadeInto(tmp, look.baseSide, look, 0.2, look.bounce);
    ctx.fillStyle = rgb(tmp[0], tmp[1], tmp[2]);
    ctx.fill();

    // Sides, one facet per outline segment, each lit by its own normal,
    // darkening towards the table.
    for (let i = 0; i < n; i++) {
      const p = outline[i];
      const q = outline[(i + 1) % n];
      const nx = (p.nx + q.nx) / 2;
      const nz = (p.nz + q.nz) / 2;
      if (facing(nx, nz) <= 0) continue;
      shadeInto(tmp, look.baseSide, look, sideDiffuse(nx, nz), look.bounce * 0.5);
      // A hair of overlap (in world units) so neighbouring facets never show a seam.
      const seam = 0.012 / Math.max(1e-3, Math.hypot(q.x - p.x, q.z - p.z));
      wall(ctx, p.x, p.z, q.x, q.z, -THICKNESS);
      ctx.fillStyle = rgb(tmp[0], tmp[1], tmp[2]);
      ctx.fillRect(-seam, 0, 1 + seam * 2, THICKNESS);
      ctx.fillStyle = gradients.sideFade!;
      wall(ctx, p.x, p.z, q.x, q.z, 0);
      ctx.fillRect(-seam, -THICKNESS, 1 + seam * 2, THICKNESS);
    }

    // Top.
    const plinthTop = shadeInto(this.plinthTop, look.base, look, LIGHT.y);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    traceFlat(ctx, topPoints, 0, n);
    ctx.fillStyle = rgb(plinthTop[0], plinthTop[1], plinthTop[2]);
    ctx.fill();

    // Bevel: a bright line along the front of the top edge.
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = outline[i];
      const q = outline[(i + 1) % n];
      if (facing((p.nx + q.nx) / 2, (p.nz + q.nz) / 2) <= 0.05) continue;
      const j = (i + 1) % n;
      ctx.moveTo(topPoints[i * 2], topPoints[i * 2 + 1]);
      ctx.lineTo(topPoints[j * 2], topPoints[j * 2 + 1]);
    }
    ctx.strokeStyle = css(look.rim, look.rimAlpha * 0.8);
    ctx.lineWidth = tile ? 0.6 : 1;
    ctx.lineCap = "round";
    ctx.stroke();

    /* ---------------- lots ---------------- */

    const half = LOT / 2;
    const order = this.order;
    // Unbuilt lots: flat and recessed, a shade darker than the streets.
    ground(ctx, 0);
    ctx.beginPath();
    for (const lot of order) if (lot.count === 0) ctx.rect(lot.x - half, lot.z - half, LOT, LOT);
    shadeInto(tmp, look.padEmpty, look, LIGHT.y);
    ctx.fillStyle = rgb(tmp[0], tmp[1], tmp[2]);
    ctx.fill();
    // Built lots: a pavement standing a little proud.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rise = PAD_RISE * F.up;
    for (let side = 0; side < 4; side++) {
      const nx = NORMAL_X[side];
      const nz = NORMAL_Z[side];
      if (facing(nx, nz) <= 0) continue;
      ctx.beginPath();
      for (const lot of order) {
        if (lot.count === 0) continue;
        const x0 = lot.x + CORNER_X[side] * half;
        const z0 = lot.z + CORNER_Z[side] * half;
        const x1 = lot.x + CORNER_X[(side + 1) % 4] * half;
        const z1 = lot.z + CORNER_Z[(side + 1) % 4] * half;
        const ax = F.a * x0 + F.c * z0 + F.e;
        const ay = F.b * x0 + F.d * z0 + F.f;
        const bx = F.a * x1 + F.c * z1 + F.e;
        const by = F.b * x1 + F.d * z1 + F.f;
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by - rise);
        ctx.lineTo(ax, ay - rise);
        ctx.closePath();
      }
      shadeInto(tmp, look.pad, look, sideDiffuse(nx, nz) * 0.8);
      ctx.fillStyle = rgb(tmp[0], tmp[1], tmp[2]);
      ctx.fill();
    }
    ground(ctx, PAD_RISE);
    ctx.beginPath();
    for (const lot of order) if (lot.count > 0) ctx.rect(lot.x - half, lot.z - half, LOT, LOT);
    shadeInto(tmp, look.pad, look, LIGHT.y);
    ctx.fillStyle = rgb(tmp[0], tmp[1], tmp[2]);
    ctx.fill();

    // Pick quads for the lots (nearest first).
    this.padCount = 0;
    for (let i = order.length - 1; i >= 0; i--) {
      const lot = order[i];
      const y = lot.count > 0 ? PAD_RISE : 0;
      const o = lot.slot * 8;
      for (let k = 0; k < 4; k++) {
        const x = lot.x + CORNER_X[k] * half;
        const z = lot.z + CORNER_Z[k] * half;
        this.padPoly[o + k * 2] = F.a * x + F.c * z + F.e;
        this.padPoly[o + k * 2 + 1] = F.b * x + F.d * z + F.f - F.up * y;
      }
      this.padOrder[this.padCount++] = lot.slot;
    }

    // The hovered lot: a soft ring on the paving.
    const hovered = options.hover >= 0 && options.hover < lots.length ? lots[options.hover] : null;
    if (hovered) {
      ground(ctx, hovered.count > 0 ? PAD_RISE : 0);
      ctx.beginPath();
      ctx.rect(hovered.x - half + 0.03, hovered.z - half + 0.03, LOT - 0.06, LOT - 0.06);
      ctx.lineWidth = 0.05;
      ctx.strokeStyle = night > 0.5 ? rgb(255, 214, 150, 0.75) : rgb(23, 23, 23, 0.38);
      ctx.stroke();
      // The tooltip's second place: just under the lot's front corner.
      let lowest = -Infinity;
      const o = hovered.slot * 8;
      for (let k = 0; k < 4; k++) lowest = Math.max(lowest, this.padPoly[o + k * 2 + 1]);
      this.basePt.x = F.a * hovered.x + F.c * hovered.z + F.e;
      this.basePt.y = lowest;
      result.base = this.basePt;
    }

    /* ---------------- sun shadows ---------------- */

    // World-space ground offset of a shadow per unit of height.
    const lx = LIGHT.u * F.cos + LIGHT.v * F.sin;
    const lz = -LIGHT.u * F.sin + LIGHT.v * F.cos;
    const offX = -lx / LIGHT.y;
    const offZ = -lz / LIGHT.y;
    // Drawn at a quarter of the resolution (blurred there on the stage),
    // then scaled up over the plinth.
    const shadowScale = 0.25;
    sizeCanvas(this.shadow, ctx.canvas.width * shadowScale, ctx.canvas.height * shadowScale);
    const sctx = this.shadow.getContext("2d");
    if (sctx && look.shadow > 0.001) {
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, this.shadow.width, this.shadow.height);
      sctx.fillStyle = "#000";
      const k = shadowScale * dpr;
      sctx.setTransform(k, 0, 0, k, 0, 0);
      sctx.beginPath();
      const hullOut = HULL_STACK_OUT;
      for (const lot of order) {
        // A building still on its way up from an empty lot casts nothing yet.
        if (lot.height <= 0) continue;
        for (const tier of lot.tiers) {
          let m = 0;
          for (let level = 0; level < 2; level++) {
            const y = level === 0 ? tier.y0 : tier.y1;
            for (let c = 0; c < 4; c++) {
              const x = lot.x + CORNER_X[c] * tier.half + offX * y;
              const z = lot.z + CORNER_Z[c] * tier.half + offZ * y;
              HULL_IN[m * 2] = F.a * x + F.c * z + F.e;
              HULL_IN[m * 2 + 1] = F.b * x + F.d * z + F.f;
              m++;
            }
          }
          const count = hullInto(m, hullOut, 0);
          traceFlat(sctx, hullOut, 0, count);
        }
      }
      sctx.fill("nonzero");
      const soft = tile ? this.shadow : blurInto(this.shadow, this.shadowSoft, F.S * 0.06 * dpr * shadowScale);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.beginPath();
      traceFlat(ctx, topPoints, 0, n);
      ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = look.shadow;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(soft, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    // Contact shadows: two soft rings hugging each footprint.
    ground(ctx, PAD_RISE);
    for (let ring = 0; ring < 2; ring++) {
      const grow = ring === 0 ? 0.11 : 0.05;
      const strength = ring === 0 ? 0.35 : 0.55;
      ctx.beginPath();
      for (const lot of order) {
        if (lot.height <= 0) continue;
        const h = FOOTPRINT / 2 + grow;
        ctx.rect(lot.x - h, lot.z - h, h * 2, h * 2);
      }
      ctx.fillStyle = css(look.shadowTint, look.contact * strength);
      ctx.fill();
    }

    /* ---------------- buildings ---------------- */

    const windowsVisible = F.S * 0.1 >= 0.6;
    const glowOn = night > 0.02;
    const glowScale = tile ? 1 / 5 : 1 / 3;
    let gctx: CanvasRenderingContext2D | null = null;
    if (glowOn) {
      sizeCanvas(this.glow, ctx.canvas.width * glowScale, ctx.canvas.height * glowScale);
      gctx = this.glow.getContext("2d");
      if (gctx) {
        gctx.setTransform(1, 0, 0, 1, 0, 0);
        gctx.clearRect(0, 0, this.glow.width, this.glow.height);
      }
    }
    const gk = glowScale * dpr;
    const rimWidth = tile ? 0.6 : 1;
    const face = this.face;
    const pt = plinthTop;
    let dim = 0;
    /** A colour stepped back towards the plinth by the current dim. */
    const dimmed = (r: number, g: number, b: number) =>
      dim > 0 ? rgb(r + (pt[0] - r) * dim, g + (pt[1] - g) * dim, b + (pt[2] - b) * dim) : rgb(r, g, b);

    this.hitCount = 0;
    const hullOut = this.hitPoly;
    // Roof albedo: low roofs, warming a touch towards the tallest.
    const tallestH = this.city.tallest ? this.city.peak : 1;

    for (const lot of order) {
      if (lot === hovered && lot.height <= 0) {
        this.anchorPt.x = F.a * lot.x + F.c * lot.z + F.e;
        this.anchorPt.y = F.b * lot.x + F.d * lot.z + F.f - F.S * 0.3;
        result.anchor = this.anchorPt;
      }
      if (lot.height <= 0) continue;
      const lift = options.liftOf(lot.slot) * 0.18;
      const isHover = lot === hovered;
      // While one day is pointed at, the rest of the city steps back a
      // little; its week and its weekday in the same band stay at full
      // strength so the neighbours still read.
      const kin = hovered !== null && (lot.col === hovered.col || (lot.row === hovered.row && lot.band === hovered.band));
      dim = isHover || kin ? 0 : options.focus * 0.2;
      const boost = isHover ? 1.035 : 1;
      let hullN = 0;
      const tierCount = lot.tiers.length + (lot.roofBox ? 1 : 0);
      const heightMix = smoothstep(0.6, Math.max(1.2, tallestH * 0.6), lot.height);

      for (let t = 0; t < tierCount; t++) {
        const isBox = t === lot.tiers.length;
        const tier: Tier | null = isBox ? null : lot.tiers[t];
        const hh = isBox ? lot.roofBox!.half : tier!.half;
        const cx = lot.x + (isBox ? lot.roofBox!.dx : 0);
        const cz = lot.z + (isBox ? lot.roofBox!.dz : 0);
        const y0 = (isBox ? lot.height : tier!.y0) + PAD_RISE + lift;
        const y1 = (isBox ? lot.height + lot.roofBox!.h : tier!.y1) + PAD_RISE + lift;
        const tierHeight = y1 - y0;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (let s = 0; s < 4; s++) {
          const nx = NORMAL_X[s];
          const nz = NORMAL_Z[s];
          if (facing(nx, nz) <= 1e-4) continue;
          const x0 = cx + CORNER_X[s] * hh;
          const z0 = cz + CORNER_Z[s] * hh;
          const x1 = cx + CORNER_X[(s + 1) % 4] * hh;
          const z1 = cz + CORNER_Z[(s + 1) % 4] * hh;
          const diffuse = sideDiffuse(nx, nz);
          shadeInto(face, look.wall, look, diffuse, look.bounce);
          face[0] *= boost;
          face[1] *= boost;
          face[2] *= boost;
          wall(ctx, x0, z0, x1, z1, y0);
          ctx.fillStyle = dimmed(face[0], face[1], face[2]);
          ctx.fillRect(-0.006 / (hh * 2), 0, 1 + 0.012 / (hh * 2), tierHeight);
          if (t === 0) {
            ctx.fillStyle = gradients.aoBand!;
            ctx.fillRect(0, 0, 1, Math.min(tierHeight, 0.26));
          }
          if (gctx) {
            wall(gctx, x0, z0, x1, z1, y0, gk);
            gctx.fillStyle = "#000";
            gctx.fillRect(-0.01, 0, 1.02, tierHeight);
          }
          if (tier && tier.windows && windowsVisible) {
            this.windows(ctx, gctx, lot, tier, s, diffuse, look, night, isHover, tierHeight, t === 0, 1 - dim * 1.2, x0, z0, x1, z1, y0, wall, gk, dim);
          }
        }
        // Roof.
        ground(ctx, y1);
        const roofR = look.roof[0] + (look.roofHigh[0] - look.roof[0]) * heightMix;
        const roofG = look.roof[1] + (look.roofHigh[1] - look.roof[1]) * heightMix;
        const roofB = look.roof[2] + (look.roofHigh[2] - look.roof[2]) * heightMix;
        const { ambient, key } = look;
        const ly = LIGHT.y;
        ctx.fillStyle = dimmed(
          roofR * (ambient[0] + key[0] * ly) * (isHover ? 1.03 : 1),
          roofG * (ambient[1] + key[1] * ly) * (isHover ? 1.03 : 1),
          roofB * (ambient[2] + key[2] * ly) * (isHover ? 1.03 : 1),
        );
        ctx.fillRect(cx - hh, cz - hh, hh * 2, hh * 2);
        if (gctx) {
          ground(gctx, y1, gk);
          gctx.fillStyle = "#000";
          gctx.fillRect(cx - hh, cz - hh, hh * 2, hh * 2);
        }
        // A thin parapet shadow inside the roof edge on taller tiers.
        if (!isBox && hh > 0.2 && F.S > 14) {
          ctx.strokeStyle = css(look.shadowTint, 0.07 + night * 0.08);
          ctx.lineWidth = 0.035;
          ctx.strokeRect(cx - hh + 0.035, cz - hh + 0.035, hh * 2 - 0.07, hh * 2 - 0.07);
        }
        // Rim light along the front roof edges.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        for (let s = 0; s < 4; s++) {
          if (facing(NORMAL_X[s], NORMAL_Z[s]) <= 1e-4) continue;
          const xa = cx + CORNER_X[s] * hh;
          const za = cz + CORNER_Z[s] * hh;
          const xb = cx + CORNER_X[(s + 1) % 4] * hh;
          const zb = cz + CORNER_Z[(s + 1) % 4] * hh;
          ctx.moveTo(F.a * xa + F.c * za + F.e, F.b * xa + F.d * za + F.f - F.up * y1);
          ctx.lineTo(F.a * xb + F.c * zb + F.e, F.b * xb + F.d * zb + F.f - F.up * y1);
        }
        ctx.strokeStyle = css(look.rim, look.rimAlpha * (1 - dim * 1.4));
        ctx.lineWidth = rimWidth;
        ctx.lineCap = "round";
        ctx.stroke();

        for (let c = 0; c < 4 && hullN < HULL_MAX - 2; c++) {
          const x = cx + CORNER_X[c] * hh;
          const z = cz + CORNER_Z[c] * hh;
          const sx = F.a * x + F.c * z + F.e;
          const sy = F.b * x + F.d * z + F.f;
          HULL_IN[hullN * 2] = sx;
          HULL_IN[hullN * 2 + 1] = sy - F.up * y0;
          hullN++;
          HULL_IN[hullN * 2] = sx;
          HULL_IN[hullN * 2 + 1] = sy - F.up * y1;
          hullN++;
        }
      }

      // The landmark's mast (and where its beacon goes).
      if (lot.mast > 0) {
        // A slim antenna that tapers to a point, standing on the crown.
        const top = lot.height + PAD_RISE + lift;
        const mx = F.a * lot.x + F.c * lot.z + F.e;
        const my = F.b * lot.x + F.d * lot.z + F.f - F.up * top;
        const tipY = my - lot.mast * F.up;
        const baseW = Math.max(1.1, F.S * 0.05);
        const tipW = Math.max(0.5, F.S * 0.012);
        const traceMast = (target: CanvasRenderingContext2D) => {
          target.beginPath();
          target.moveTo(mx - baseW / 2, my + baseW * 0.25);
          target.lineTo(mx - tipW / 2, tipY);
          target.lineTo(mx + tipW / 2, tipY);
          target.lineTo(mx + baseW / 2, my + baseW * 0.25);
          target.closePath();
        };
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Lit left half, shaded right half, like the walls below it.
        const mastGradient = ctx.createLinearGradient(mx - baseW / 2, 0, mx + baseW / 2, 0);
        for (const [stop, light] of MAST_STOPS) {
          shadeInto(tmp, look.wall, look, light, look.bounce);
          mastGradient.addColorStop(stop, dimmed(tmp[0], tmp[1], tmp[2]));
        }
        traceMast(ctx);
        ctx.fillStyle = mastGradient;
        ctx.fill();
        this.beaconPt.x = mx;
        this.beaconPt.y = tipY;
        result.beacon = this.beaconPt;
        HULL_IN[hullN * 2] = mx;
        HULL_IN[hullN * 2 + 1] = tipY;
        hullN++;
        if (gctx) {
          gctx.setTransform(gk, 0, 0, gk, 0, 0);
          traceMast(gctx);
          gctx.fillStyle = "#000";
          gctx.fill();
        }
      }

      if (isHover) {
        const top = lot.height + PAD_RISE + lift + (lot.roofBox ? lot.roofBox.h : 0) + lot.mast;
        this.anchorPt.x = F.a * lot.x + F.c * lot.z + F.e;
        this.anchorPt.y = F.b * lot.x + F.d * lot.z + F.f - F.up * top - F.S * 0.12;
        result.anchor = this.anchorPt;
      }
      // Its screen hull and box, for picking and for keeping labels clear.
      const o = lot.slot * HULL_MAX * 2;
      const count = hullInto(hullN, hullOut, o);
      this.hitLen[lot.slot] = count;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < count; i++) {
        const x = hullOut[o + i * 2];
        const y = hullOut[o + i * 2 + 1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const b = lot.slot * 4;
      this.hitBox[b] = minX;
      this.hitBox[b + 1] = minY;
      this.hitBox[b + 2] = maxX;
      this.hitBox[b + 3] = maxY;
      this.hitOrder[this.hitCount++] = lot.slot;
    }
    // Nearest first.
    for (let i = 0, j = this.hitCount - 1; i < j; i++, j--) {
      const swap = this.hitOrder[i];
      this.hitOrder[i] = this.hitOrder[j];
      this.hitOrder[j] = swap;
    }

    /* ---------------- month names ---------------- */

    if (!tile && options.labels > 0.01 && F.S >= LABEL_MIN_SCALE) this.labels(ctx, F, dpr, look, options, n);

    /* ---------------- night glow ---------------- */

    if (gctx && glowOn) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      if (tile) {
        // Drawn small and scaled up: soft enough without a filter.
        ctx.globalAlpha = clamp(night) * 0.55;
        ctx.drawImage(this.glow, 0, 0, ctx.canvas.width, ctx.canvas.height);
      } else {
        const wide = blurInto(this.glow, this.glowWide, F.S * 0.15 * dpr * glowScale);
        const tight = blurInto(this.glow, this.glowTight, F.S * 0.035 * dpr * glowScale);
        ctx.globalAlpha = clamp(night) * (supportsFilter ? 0.62 : 0.36);
        ctx.drawImage(wide, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalAlpha = clamp(night) * 0.32;
        ctx.drawImage(tight, 0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return result;
  }

  /** Stage drop shadow: two passes blurred at low resolution, sized in screen px with a ceiling. */
  private stageDrop(ctx: CanvasRenderingContext2D, F: Frame, width: number, height: number, dpr: number, look: Look) {
    // Canvas shadowBlur on a shape this large breaks up into streaks when
    // zoomed in, so it is only the fallback where canvas filters are missing.
    const margin = 160;
    const footprint = clipToRect(this.bottomPoints, this.outline.length, -margin, -margin, width + margin, height + margin);
    if (footprint < 3) return;
    for (let pass = 0; pass < 2; pass++) {
      const blur = pass === 0 ? Math.min(F.S * 2.2, 56) : Math.min(F.S * 0.35, 9);
      const offset = pass === 0 ? Math.min(F.S * 0.9, 22) : Math.min(F.S * 0.12, 3);
      const alpha = look.drop * (pass === 0 ? 0.55 : 0.9);
      if (supportsFilter) {
        // The wide blur at a quarter of the resolution, the tight one at half.
        const k = pass === 0 ? 0.25 : 0.5;
        const [sharp, blurred] = this.drops[pass];
        sizeCanvas(sharp, ctx.canvas.width * k, ctx.canvas.height * k);
        const dctx = sharp.getContext("2d");
        if (!dctx) continue;
        dctx.setTransform(1, 0, 0, 1, 0, 0);
        dctx.clearRect(0, 0, sharp.width, sharp.height);
        dctx.setTransform(dpr * k, 0, 0, dpr * k, 0, dpr * k * offset);
        dctx.beginPath();
        traceFlat(dctx, CLIP_A, 0, footprint);
        dctx.fillStyle = "#000";
        dctx.fill();
        const soft = blurInto(sharp, blurred, (blur / 2) * dpr * k);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = alpha;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(soft, 0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      } else {
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        shadeInto(this.tmp, look.baseSide, look, 0.2, look.bounce);
        ctx.fillStyle = rgb(this.tmp[0], this.tmp[1], this.tmp[2]);
        ctx.beginPath();
        traceFlat(ctx, CLIP_A, 0, footprint);
        ctx.shadowColor = rgb(0, 0, 0, alpha);
        ctx.shadowBlur = blur * dpr;
        ctx.shadowOffsetY = offset * dpr;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  /** Tile drop shadow: the plinth's shape blurred once, laid on the table through the ground transform. */
  private tileDrop(ctx: CanvasRenderingContext2D, F: Frame, dpr: number, look: Look) {
    if (!this.dropSprites || Math.abs(F.S / this.dropSpriteScale - 1) > 0.15) {
      const S = F.S;
      this.dropSpriteScale = S;
      // The stage's two passes, converted to world units at the tile's scale.
      this.dropSprites = [makeDropSprite(this.city, Math.min(S * 2.2, 56) / 2 / S), makeDropSprite(this.city, Math.min(S * 0.35, 9) / 2 / S)];
    }
    for (let pass = 0; pass < 2; pass++) {
      const sprite = this.dropSprites[pass];
      if (!sprite) continue;
      const offset = pass === 0 ? Math.min(F.S * 0.9, 22) : Math.min(F.S * 0.12, 3);
      const k = dpr / sprite.ppu;
      const y = -THICKNESS;
      ctx.setTransform(
        k * F.a,
        k * F.b,
        k * F.c,
        k * F.d,
        dpr * (F.a * sprite.ox + F.c * sprite.oz + F.e),
        dpr * (F.b * sprite.ox + F.d * sprite.oz + F.f - F.up * y + offset),
      );
      ctx.globalAlpha = look.drop * (pass === 0 ? 0.55 : 0.9);
      ctx.drawImage(sprite.canvas, 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Month names, set like street names: along the boulevard in front of (or
   * behind) each month's district, upright, at a fixed screen size, and only
   * where the ground under them is clear of buildings and on the plinth.
   */
  private labels(ctx: CanvasRenderingContext2D, F: Frame, dpr: number, look: Look, options: RenderOptions, outlineN: number) {
    const font = `500 ${LABEL_SIZE}px ${options.fontFamily}`;
    if (font !== this.labelFont) {
      this.labelFont = font;
      this.labelWidths.clear();
    }
    ctx.font = font;
    // The street direction (world +x) on screen, kept upright.
    let ax = F.a;
    let ay = F.b;
    const len = Math.hypot(ax, ay) || 1;
    ax /= len;
    ay /= len;
    if (ax < 0) {
      ax = -ax;
      ay = -ay;
    }
    // Too steep to read (mid-turn): skip.
    if (Math.abs(ay) > 0.75) return;
    const bx = -ay;
    const by = ax;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = css(look.label, look.labelAlpha * options.labels);
    const halfH = LABEL_SIZE * 0.5 + 1.5;
    const top = this.topPoints;
    const placed = this.placedLabels;
    let placedCount = 0;
    for (const district of this.city.districts) {
      let w = this.labelWidths.get(district.month);
      if (w === undefined) {
        w = ctx.measureText(district.month).width;
        this.labelWidths.set(district.month, w);
      }
      const halfW = w / 2 + 2;
      // Each band's names run along its side that faces you (the boulevard
      // in front of it, or the plinth's edge for the nearest band), so one
      // boulevard never carries two bands' names.
      const mid = (district.x0 + district.x1) / 2;
      const front = F.b * mid + F.d * district.zFront > F.b * mid + F.d * district.zBack;
      const z = front ? district.zFront : district.zBack;
      // Box extent on screen, for the overlap test between names.
      const ex = Math.abs(ax) * halfW + Math.abs(bx) * halfH + 3;
      const ey = Math.abs(ay) * halfW + Math.abs(by) * halfH + 2;
      for (let k = 0; k < LABEL_SLIDES.length; k++) {
        const x = mid + LABEL_SLIDES[k];
        if (x < district.x0 - 0.3 || x > district.x1 + 0.3) continue;
        const sx = F.a * x + F.c * z + F.e;
        const sy = F.b * x + F.d * z + F.f;
        let clash = false;
        for (let i = 0; i < placedCount && !clash; i++) {
          const o = i * 4;
          clash = Math.abs(sx - placed[o]) < ex + placed[o + 2] && Math.abs(sy - placed[o + 1]) < ey + placed[o + 3];
        }
        if (clash || !this.labelFits(sx, sy, ax, ay, bx, by, halfW, halfH, top, outlineN)) continue;
        ctx.setTransform(dpr * ax, dpr * ay, dpr * bx, dpr * by, dpr * sx, dpr * sy);
        ctx.fillText(district.month, 0, 0.5);
        if (placedCount < placed.length / 4) {
          const o = placedCount * 4;
          placed[o] = sx;
          placed[o + 1] = sy;
          placed[o + 2] = ex;
          placed[o + 3] = ey;
          placedCount++;
        }
        break;
      }
    }
  }

  /** Whether a label box (centre, axes, half sizes) lies on the plinth and clear of every building. */
  private labelFits(
    sx: number,
    sy: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    halfW: number,
    halfH: number,
    top: Float64Array,
    outlineN: number,
  ): boolean {
    // Box extent on screen, for the quick reject.
    const ex = Math.abs(ax) * halfW + Math.abs(bx) * halfH;
    const ey = Math.abs(ay) * halfW + Math.abs(by) * halfH;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const px = sx + ax * halfW * i + bx * halfH * j;
        const py = sy + ay * halfW * i + by * halfH * j;
        if ((i !== 0 || j !== 0) && Math.abs(i) + Math.abs(j) === 2 && !inConvex(top, 0, outlineN, px, py)) return false;
      }
    }
    for (let h = 0; h < this.hitCount; h++) {
      const slot = this.hitOrder[h];
      const b = slot * 4;
      if (sx + ex < this.hitBox[b] || sx - ex > this.hitBox[b + 2] || sy + ey < this.hitBox[b + 1] || sy - ey > this.hitBox[b + 3]) continue;
      for (let i = -2; i <= 2; i++) {
        for (let j = -1; j <= 1; j++) {
          const px = sx + ax * halfW * (i / 2) + bx * halfH * j;
          const py = sy + ay * halfW * (i / 2) + by * halfH * j;
          if (inConvex(this.hitPoly, slot * HULL_MAX * 2, this.hitLen[slot], px, py)) return false;
        }
      }
    }
    return true;
  }

  /** The windows on one wall of a tier. */
  private windows(
    ctx: CanvasRenderingContext2D,
    gctx: CanvasRenderingContext2D | null,
    lot: Lot,
    tier: Tier,
    side: number,
    diffuse: number,
    look: Look,
    night: number,
    hover: boolean,
    height: number,
    base: boolean,
    brightness: number,
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    y0: number,
    wall: (target: CanvasRenderingContext2D, x0: number, z0: number, x1: number, z1: number, y0: number, k?: number) => void,
    gk: number,
    dim: number,
  ) {
    const width = tier.half * 2;
    const cols = width >= 0.55 ? 3 : width >= 0.36 ? 2 : 1;
    const winW = 0.105 / width; // in s units
    const winH = 0.072;
    const floor = 0.165;
    const bottom = base ? 0.15 : 0.07;
    const top = height - 0.075;
    const floors = Math.max(0, Math.floor((top - bottom) / floor + 0.25));
    if (!floors) return;
    const gap = (1 - cols * winW) / (cols + 1);

    // Glass picks up the wall's light and a touch of sky.
    const g = this.tmp;
    shadeInto(g, look.glass, look, diffuse * 0.6 + 0.25);
    const face = this.face;
    const mix = look.glassMix;
    const pt = this.plinthTop;
    let offR = face[0] * mix + g[0] * (1 - mix);
    let offG = face[1] * mix + g[1] * (1 - mix);
    let offB = face[2] * mix + g[2] * (1 - mix);
    if (dim > 0) {
      offR += (pt[0] - offR) * dim;
      offG += (pt[1] - offG) * dim;
      offB += (pt[2] - offB) * dim;
    }
    // Windows light the way offices do: a floor that is still working has
    // most of its windows on, the others only the odd one. Taller buildings
    // keep more floors going. Each window has its own moment in the
    // day-to-night blend (so they come on one by one) and its own strength.
    const busyFloors = 0.18 + 0.34 * Math.min(1, lot.fullHeight / 2.4);
    const lotId = lot.col * 7 + lot.row;
    const needed = floors * cols * 4;
    if (this.windowScratch.length < needed) this.windowScratch = new Float64Array(needed * 2);
    const lit = this.windowScratch;
    let litCount = 0;

    wall(ctx, x0, z0, x1, z1, y0);
    ctx.beginPath();
    for (let f = 0; f < floors; f++) {
      const y = bottom + f * floor;
      // A floor is the same floor all the way round the building.
      const busy = hash2(lotId * 31 + f, Math.round(tier.key), 19) < busyFloors;
      for (let c = 0; c < cols; c++) {
        const x = gap + c * (winW + gap);
        const id = lotId * 977 + side * 131 + f * 17 + c;
        const pick = hash2(id, tier.key, 3);
        const threshold = 0.18 + 0.72 * hash2(id, 5, 11);
        const on = busy ? pick < 0.82 : pick < 0.07;
        let amount = 0;
        if (night > 0 && (on || hover)) {
          amount = hover ? Math.max(night, 0.0001) : smoothstep(threshold, threshold + 0.07, night);
          // Lamps differ: some windows glow full, some are a desk light deep in the room.
          amount *= hover ? 1 : 0.62 + 0.38 * hash2(id, 23, 29);
        }
        amount *= brightness;
        if (amount > 0.01) {
          const o = litCount * 4;
          lit[o] = x;
          lit[o + 1] = y;
          lit[o + 2] = amount;
          lit[o + 3] = Math.floor(hash2(id, 9, 13) * WINDOW_LIGHTS.length);
          litCount++;
        } else ctx.rect(x, y, winW, winH);
      }
    }
    ctx.fillStyle = rgb(offR, offG, offB);
    ctx.fill();
    for (let i = 0; i < litCount; i++) {
      const o = i * 4;
      const amount = lit[o + 2];
      const light = WINDOW_LIGHTS[lit[o + 3]];
      ctx.fillStyle = rgb(offR + (light[0] - offR) * amount, offG + (light[1] - offG) * amount, offB + (light[2] - offB) * amount);
      ctx.fillRect(lit[o], lit[o + 1], winW, winH);
    }
    if (gctx && litCount) {
      wall(gctx, x0, z0, x1, z1, y0, gk);
      for (let i = 0; i < litCount; i++) {
        const o = i * 4;
        gctx.fillStyle = css(WINDOW_LIGHTS[lit[o + 3]], lit[o + 2]);
        gctx.fillRect(lit[o] - winW * 0.1, lit[o + 1] - winH * 0.15, winW * 1.2, winH * 1.3);
      }
    }
  }
}

/** Shadow hull output (scratch, separate from the picking buffers). */
const HULL_STACK_OUT = new Float64Array(96);

/** The mast's lit left half and shaded right half. */
const MAST_STOPS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.85],
  [0.5, 0.6],
  [0.51, 0.2],
  [1, 0.1],
];

export type { RGB };
