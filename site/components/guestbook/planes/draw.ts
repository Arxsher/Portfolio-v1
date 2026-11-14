// Draws one paper plane (or a sheet on its way to becoming one) on a 2D
// canvas: folds the sheet, places it, projects it with a little
// perspective, orders the faces, shades them like matte paper, and maps the
// written side onto whichever faces show it.
//
// Face order: painter's sort by depth goes wrong for folded paper (a small
// flap lying on a big wing can have its middle further away than the
// wing's middle), so every pair of faces that overlap on screen is ordered
// by which side of the other's plane it lies on, and the resulting "behind"
// graph is drawn far-to-near (Kahn's algorithm; a cycle falls back to
// depth). Sixteen faces make 120 pairs, so this stays cheap.

import { createFoldPose, foldSheet, type FoldPose, type Sheet } from "./fold";
import { applyPoint, compose, rigid, type Rigid } from "./math";
import type { PlaneLook, RGB } from "./look";
import type { Rect } from "./note";

export type PlaneContent = {
  /** Area of the sheet that has anything on it (sheet units). */
  rect: Rect;
  /** Draw the written side in sheet units (origin at the sheet's middle). */
  draw(ctx: CanvasRenderingContext2D): void;
};

export type PlaneParams = {
  sheet: Sheet;
  angles: ArrayLike<number>;
  /** Object rotation (rigid; translation ignored). */
  rot: Rigid;
  /** Point of the folded sheet (sheet units) that sits at (x, y). */
  pivotX: number;
  pivotY: number;
  pivotZ: number;
  /** Screen position, CSS px. */
  x: number;
  y: number;
  /** CSS px per sheet unit. */
  scale: number;
  /** Camera distance in CSS px (smaller = stronger perspective). */
  focal: number;
  paper: RGB;
  look: PlaneLook;
  alpha?: number;
  content?: PlaneContent | null;
  /** How flat the sheet is, 0…1: flat sheets show their creases softer. */
  creases?: number;
};

const MAX_VERTS = 6;

/** Per-plane working memory, reused every frame. Also holds the last projection for hit tests. */
export class PlaneScratch {
  readonly sheet: Sheet;
  readonly pose: FoldPose;
  readonly n: number;
  readonly cam: Float64Array;
  readonly screen: Float64Array;
  readonly normal: Float64Array;
  readonly depth: Float64Array;
  readonly box: Float64Array;
  readonly front: Uint8Array;
  readonly order: Int32Array;
  readonly indegree: Int32Array;
  readonly behind: Uint8Array;
  readonly done: Uint8Array;
  readonly combined: Rigid[];
  /** Screen bounds of the whole plane after the last project(). */
  minX = 0;
  minY = 0;
  maxX = 0;
  maxY = 0;
  visible = false;

  constructor(sheet: Sheet) {
    this.sheet = sheet;
    this.n = sheet.regions.length;
    this.pose = createFoldPose(sheet);
    this.cam = new Float64Array(this.n * MAX_VERTS * 3);
    this.screen = new Float64Array(this.n * MAX_VERTS * 2);
    this.normal = new Float64Array(this.n * 3);
    this.depth = new Float64Array(this.n);
    this.box = new Float64Array(this.n * 4);
    this.front = new Uint8Array(this.n);
    this.order = new Int32Array(this.n);
    this.indegree = new Int32Array(this.n);
    this.behind = new Uint8Array(this.n * this.n);
    this.done = new Uint8Array(this.n);
    this.combined = sheet.regions.map(() => rigid());
  }

  /** Is the screen point (CSS px) on the plane (with some slack)? */
  hit(x: number, y: number, slack = 0): boolean {
    if (!this.visible) return false;
    if (x < this.minX - slack || x > this.maxX + slack || y < this.minY - slack || y > this.maxY + slack) return false;
    const { regions } = this.sheet;
    for (let r = 0; r < this.n; r++) {
      const count = regions[r].count;
      const base = r * MAX_VERTS * 2;
      if (pointInPolygon(this.screen, base, count, x, y)) return true;
    }
    if (slack <= 0) return false;
    // Thin planes are hard to hit: accept points near the middle of the bounds.
    const cx = (this.minX + this.maxX) / 2;
    const cy = (this.minY + this.maxY) / 2;
    const rx = (this.maxX - this.minX) / 2 + slack;
    const ry = Math.max((this.maxY - this.minY) / 2, 10) + slack * 0.5;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
}

function pointInPolygon(points: Float64Array, base: number, count: number, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = points[base + i * 2];
    const yi = points[base + i * 2 + 1];
    const xj = points[base + j * 2];
    const yj = points[base + j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

const pivotMove = rigid();
const tmp = new Float64Array(3);

/** Fold, place and project; fills scratch. Call before drawShadow / drawPlane. */
export function projectPlane(p: PlaneParams, s: PlaneScratch) {
  const { sheet } = p;
  foldSheet(sheet, p.angles, s.pose);
  pivotMove[9] = -p.pivotX;
  pivotMove[10] = -p.pivotY;
  pivotMove[11] = -p.pivotZ;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let r = 0; r < s.n; r++) {
    const region = sheet.regions[r];
    const m = s.combined[r];
    compose(m, pivotMove, s.pose[r]);
    compose(m, p.rot, m);
    // Front of the sheet faces −z in sheet space.
    s.normal[r * 3] = -m[2];
    s.normal[r * 3 + 1] = -m[5];
    s.normal[r * 3 + 2] = -m[8];
    let depth = 0;
    let bx0 = Infinity;
    let by0 = Infinity;
    let bx1 = -Infinity;
    let by1 = -Infinity;
    for (let k = 0; k < region.count; k++) {
      applyPoint(m, region.poly[k * 2], region.poly[k * 2 + 1], 0, tmp);
      const cx = tmp[0] * p.scale;
      const cy = tmp[1] * p.scale;
      const cz = p.focal + tmp[2] * p.scale;
      const c = (r * MAX_VERTS + k) * 3;
      s.cam[c] = cx;
      s.cam[c + 1] = cy;
      s.cam[c + 2] = cz;
      const f = p.focal / Math.max(cz, 1);
      const sx = p.x + cx * f;
      const sy = p.y + cy * f;
      const o = (r * MAX_VERTS + k) * 2;
      s.screen[o] = sx;
      s.screen[o + 1] = sy;
      depth += cz;
      if (sx < bx0) bx0 = sx;
      if (sx > bx1) bx1 = sx;
      if (sy < by0) by0 = sy;
      if (sy > by1) by1 = sy;
    }
    s.depth[r] = depth / region.count;
    s.box[r * 4] = bx0;
    s.box[r * 4 + 1] = by0;
    s.box[r * 4 + 2] = bx1;
    s.box[r * 4 + 3] = by1;
    if (bx0 < minX) minX = bx0;
    if (by0 < minY) minY = by0;
    if (bx1 > maxX) maxX = bx1;
    if (by1 > maxY) maxY = by1;
    // Front visible when its normal points back at the camera (at the origin).
    const c0 = r * MAX_VERTS * 3;
    const facing = -(s.normal[r * 3] * s.cam[c0] + s.normal[r * 3 + 1] * s.cam[c0 + 1] + s.normal[r * 3 + 2] * s.cam[c0 + 2]);
    s.front[r] = facing > 0 ? 1 : 0;
  }
  s.minX = minX;
  s.minY = minY;
  s.maxX = maxX;
  s.maxY = maxY;
  s.visible = true;
  sortFaces(s, p.scale);
}

/** Which side of face i's plane face j lies on: 1 camera side, −1 far side, 0 straddles or coplanar. */
function sideOf(s: PlaneScratch, i: number, j: number, eps: number): number {
  const nx = s.normal[i * 3];
  const ny = s.normal[i * 3 + 1];
  const nz = s.normal[i * 3 + 2];
  const c0 = i * MAX_VERTS * 3;
  const px = s.cam[c0];
  const py = s.cam[c0 + 1];
  const pz = s.cam[c0 + 2];
  // Camera (origin) side sign.
  const camSide = -(nx * px + ny * py + nz * pz) >= 0 ? 1 : -1;
  let near = 0;
  let far = 0;
  const count = s.sheet.regions[j].count;
  for (let k = 0; k < count; k++) {
    const c = (j * MAX_VERTS + k) * 3;
    const d = (nx * (s.cam[c] - px) + ny * (s.cam[c + 1] - py) + nz * (s.cam[c + 2] - pz)) * camSide;
    if (d > eps) near++;
    else if (d < -eps) far++;
  }
  if (near && !far) return 1;
  if (far && !near) return -1;
  return 0;
}

function sortFaces(s: PlaneScratch, scale: number) {
  const n = s.n;
  const eps = 0.004 * Math.max(scale, 0.05);
  s.behind.fill(0);
  s.indegree.fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const bi = i * 4;
      const bj = j * 4;
      if (s.box[bi] > s.box[bj + 2] || s.box[bj] > s.box[bi + 2] || s.box[bi + 1] > s.box[bj + 3] || s.box[bj + 1] > s.box[bi + 3]) continue;
      // Does j sit in front of i?
      let rel = sideOf(s, i, j, eps);
      if (rel === 0) rel = -sideOf(s, j, i, eps);
      if (rel === 0) continue;
      // rel 1: j in front of i → i drawn before j.
      if (rel > 0) {
        s.behind[i * n + j] = 1;
        s.indegree[j]++;
      } else {
        s.behind[j * n + i] = 1;
        s.indegree[i]++;
      }
    }
  }
  // Kahn, farthest first among the free faces.
  const done = s.done;
  done.fill(0);
  for (let placed = 0; placed < n; placed++) {
    let pick = -1;
    let pickDepth = -Infinity;
    for (let r = 0; r < n; r++) {
      if (done[r] || s.indegree[r] > 0) continue;
      if (s.depth[r] > pickDepth) {
        pickDepth = s.depth[r];
        pick = r;
      }
    }
    if (pick < 0) {
      // A cycle: break it at the farthest remaining face.
      for (let r = 0; r < n; r++) {
        if (done[r]) continue;
        if (s.depth[r] > pickDepth) {
          pickDepth = s.depth[r];
          pick = r;
        }
      }
    }
    done[pick] = 1;
    s.order[placed] = pick;
    for (let r = 0; r < n; r++) if (s.behind[pick * n + r]) s.indegree[r]--;
  }
}

/* ---------------------------------------------------------------------- */
/* painting                                                                */
/* ---------------------------------------------------------------------- */

// Toward the light, in camera space (x right, y down, z away): above, a
// little left, and in front.
const LIGHT = (() => {
  const v = [-0.28, -0.5, -0.82];
  const len = Math.hypot(v[0], v[1], v[2]);
  return v.map((n) => n / len);
})();

/**
 * Final brightness of a face from its raw light (ambient + diffuse …):
 * anything below the look's knee is eased into [floor, knee], so faces
 * turned from the light stay paper rather than going grey.
 */
function shadeOf(look: PlaneLook, raw: number): number {
  if (raw >= look.knee) return raw;
  const lowest = look.ambient - look.backShade;
  const t = Math.max(0, Math.min(1, (raw - lowest) / Math.max(1e-3, look.knee - lowest)));
  return look.floor + (look.knee - look.floor) * t;
}

/** Brightness of a sheet lying flat and facing the reader (for matching DOM paper). */
export function flatShade(look: PlaneLook): number {
  return shadeOf(look, look.ambient + look.diffuse * Math.max(0, -LIGHT[2]));
}

/** CSS colour of a flat sheet of this paper, exactly as the canvas paints it. */
export function flatPaperCss(look: PlaneLook, paper: RGB): string {
  return paperFill(paper, flatShade(look), look.warmth);
}

const fillCache = new Map<number, string>();
/**
 * Paper at a brightness. Below 1 the channels darken unevenly (red least,
 * blue most), so shade reads as warm paper in its own shadow, not grey.
 */
function paperFill(paper: RGB, shade: number, warmth: number): string {
  const level = Math.max(0, Math.min(127, Math.round(shade * 100)));
  const warm = Math.max(0, Math.min(63, Math.round(warmth * 50)));
  const key = (((paper[0] * 256 + paper[1]) * 256 + paper[2]) * 128 + level) * 64 + warm;
  let fill = fillCache.get(key);
  if (!fill) {
    const k = level / 100;
    const w = warm / 50;
    const kr = k < 1 ? Math.pow(k, 1 - 0.5 * w) : k;
    const kb = k < 1 ? Math.pow(k, 1 + 0.6 * w) : k;
    const c = (n: number, f: number) => Math.max(0, Math.min(255, Math.round(n * f)));
    fill = `rgb(${c(paper[0], kr)} ${c(paper[1], k)} ${c(paper[2], kb)})`;
    if (fillCache.size > 4000) fillCache.clear();
    fillCache.set(key, fill);
  }
  return fill;
}

function tracePolygon(ctx: CanvasRenderingContext2D, s: PlaneScratch, r: number) {
  const count = s.sheet.regions[r].count;
  const base = r * MAX_VERTS * 2;
  ctx.moveTo(s.screen[base], s.screen[base + 1]);
  for (let k = 1; k < count; k++) ctx.lineTo(s.screen[base + k * 2], s.screen[base + k * 2 + 1]);
  ctx.closePath();
}

/**
 * A soft shadow of the last projected plane, cast `dx, dy` CSS px away and
 * blurred by `blur`. Uses the canvas shadow (drawn from a copy parked far
 * off-canvas) so no filter support is needed.
 */
export function drawShadow(ctx: CanvasRenderingContext2D, dpr: number, s: PlaneScratch, dx: number, dy: number, blur: number, color: string) {
  if (!s.visible) return;
  const park = 100000;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, -park * dpr, 0);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * dpr;
  ctx.shadowOffsetX = park * dpr + dx * dpr;
  ctx.shadowOffsetY = dy * dpr;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  for (let r = 0; r < s.n; r++) tracePolygon(ctx, s, r);
  ctx.fill("nonzero");
  ctx.restore();
}

/** Paint the last projected plane. */
export function drawPlane(ctx: CanvasRenderingContext2D, dpr: number, p: PlaneParams, s: PlaneScratch) {
  const { look, paper, content } = p;
  const alpha = p.alpha ?? 1;
  if (alpha <= 0.002) return;
  const regions = s.sheet.regions;
  // Folds read as edges while folded; once flat they are just soft marks.
  const creases = look.crease * (1 - 0.45 * (p.creases ?? 0));
  const hair = Math.min(1, 0.45 + p.scale * 1.4);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (let o = 0; o < s.n; o++) {
    const r = s.order[o];
    const region = regions[r];
    const front = s.front[r] === 1;
    const sign = front ? 1 : -1;
    const facing = sign * (s.normal[r * 3] * LIGHT[0] + s.normal[r * 3 + 1] * LIGHT[1] + s.normal[r * 3 + 2] * LIGHT[2]);
    const raw =
      look.ambient + look.diffuse * Math.max(0, facing) + look.backLight * Math.max(0, -facing) - (front ? 0 : look.backShade);
    const fill = paperFill(paper, shadeOf(look, raw), look.warmth);
    ctx.beginPath();
    tracePolygon(ctx, s, r);
    ctx.fillStyle = fill;
    ctx.fill();
    // Same colour hairline closes the anti-aliasing seams between faces.
    ctx.strokeStyle = fill;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    if (content && front && intersects(region, content.rect)) drawContent(ctx, dpr, s, r, content);

    // Edges: the cut edge of the paper a touch stronger than the folds.
    const base = r * MAX_VERTS * 2;
    const count = region.count;
    ctx.lineWidth = 0.75 * hair;
    ctx.beginPath();
    let outer = false;
    for (let k = 0; k < count; k++) {
      if (!region.outer[k]) continue;
      const k2 = (k + 1) % count;
      ctx.moveTo(s.screen[base + k * 2], s.screen[base + k * 2 + 1]);
      ctx.lineTo(s.screen[base + k2 * 2], s.screen[base + k2 * 2 + 1]);
      outer = true;
    }
    if (outer) {
      ctx.strokeStyle = inkRgba(look, look.edge);
      ctx.stroke();
    }
    ctx.beginPath();
    let crease = false;
    for (let k = 0; k < count; k++) {
      if (region.outer[k]) continue;
      const k2 = (k + 1) % count;
      ctx.moveTo(s.screen[base + k * 2], s.screen[base + k * 2 + 1]);
      ctx.lineTo(s.screen[base + k2 * 2], s.screen[base + k2 * 2 + 1]);
      crease = true;
    }
    if (crease) {
      ctx.strokeStyle = inkRgba(look, creases);
      ctx.stroke();
    }
  }
  ctx.restore();
}

const inkCache = new Map<string, string>();
function inkRgba(look: PlaneLook, alpha: number): string {
  const key = `${look.ink}|${Math.round(alpha * 200)}`;
  let value = inkCache.get(key);
  if (!value) {
    // look.ink is a #rrggbb colour
    const hex = look.ink.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    value = `rgb(${r} ${g} ${b} / ${Math.round(alpha * 200) / 200})`;
    inkCache.set(key, value);
  }
  return value;
}

function intersects(region: { poly: Float64Array; count: number }, rect: Rect): boolean {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let k = 0; k < region.count; k++) {
    const x = region.poly[k * 2];
    const y = region.poly[k * 2 + 1];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return !(x1 < rect.x || x0 > rect.x + rect.w || y1 < rect.y || y0 > rect.y + rect.h);
}

/** Map the written side onto face r with the affine through its three widest vertices. */
function drawContent(ctx: CanvasRenderingContext2D, dpr: number, s: PlaneScratch, r: number, content: PlaneContent) {
  const region = s.sheet.regions[r];
  const [i0, i1, i2] = region.tri;
  const u0 = region.poly[i0 * 2];
  const v0 = region.poly[i0 * 2 + 1];
  const du1 = region.poly[i1 * 2] - u0;
  const dv1 = region.poly[i1 * 2 + 1] - v0;
  const du2 = region.poly[i2 * 2] - u0;
  const dv2 = region.poly[i2 * 2 + 1] - v0;
  const det = du1 * dv2 - du2 * dv1;
  if (Math.abs(det) < 1e-6) return;
  const base = r * MAX_VERTS * 2;
  const x0 = s.screen[base + i0 * 2];
  const y0 = s.screen[base + i0 * 2 + 1];
  const dx1 = s.screen[base + i1 * 2] - x0;
  const dy1 = s.screen[base + i1 * 2 + 1] - y0;
  const dx2 = s.screen[base + i2 * 2] - x0;
  const dy2 = s.screen[base + i2 * 2 + 1] - y0;
  const a = (dx1 * dv2 - dx2 * dv1) / det;
  const c = (dx2 * du1 - dx1 * du2) / det;
  const b = (dy1 * dv2 - dy2 * dv1) / det;
  const d = (dy2 * du1 - dy1 * du2) / det;
  const e = x0 - a * u0 - c * v0;
  const f = y0 - b * u0 - d * v0;
  ctx.save();
  ctx.beginPath();
  tracePolygon(ctx, s, r);
  ctx.clip();
  ctx.setTransform(dpr * a, dpr * b, dpr * c, dpr * d, dpr * e, dpr * f);
  content.draw(ctx);
  ctx.restore();
}

/**
 * The last projected plane as a dashed pencil sketch: its silhouette (the
 * convex outline of every face, which for a dart is its true outline but
 * for a notch at the tail) and one crease, the wing root from the nose to
 * the tail, in a single dash pattern. No edge is drawn twice, so layered
 * paper never doubles a line.
 */
export function drawSketch(ctx: CanvasRenderingContext2D, dpr: number, p: PlaneParams, s: PlaneScratch, color: string, alpha = 1) {
  if (!s.visible) return;
  const hull = convexHull(s, sketchHull);
  const crease = creaseFor(s.sheet);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([5, 4]);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i < hull; i++) {
    const x = sketchHull[i * 2];
    const y = sketchHull[i * 2 + 1];
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  if (crease) {
    const [r, x0, y0, x1, y1] = crease;
    projectSheetPoint(p, s, r, x0, y0, sketchA);
    projectSheetPoint(p, s, r, x1, y1, sketchB);
    ctx.globalAlpha = alpha * 0.55;
    ctx.beginPath();
    // from the nose back, so the dashes start crisp at the point
    ctx.moveTo(sketchB[0], sketchB[1]);
    ctx.lineTo(sketchA[0], sketchA[1]);
    ctx.stroke();
  }
  ctx.restore();
}

const sketchHull = new Float64Array(MAX_VERTS * 64 * 2);
const sketchPoints: Array<[number, number]> = [];
const sketchA = new Float64Array(2);
const sketchB = new Float64Array(2);
const sketchTmp = new Float64Array(3);

/** Screen position (CSS px) of a flat-sheet point on region r, as last projected. */
function projectSheetPoint(p: PlaneParams, s: PlaneScratch, r: number, x: number, y: number, out: Float64Array) {
  applyPoint(s.combined[r], x, y, 0, sketchTmp);
  const cz = p.focal + sketchTmp[2] * p.scale;
  const f = p.focal / Math.max(cz, 1);
  out[0] = p.x + sketchTmp[0] * p.scale * f;
  out[1] = p.y + sketchTmp[1] * p.scale * f;
}

/** Convex hull of every projected vertex (monotone chain); writes x,y pairs, returns the count. */
function convexHull(s: PlaneScratch, out: Float64Array): number {
  sketchPoints.length = 0;
  for (let r = 0; r < s.n; r++) {
    const count = s.sheet.regions[r].count;
    const base = r * MAX_VERTS * 2;
    for (let k = 0; k < count; k++) sketchPoints.push([s.screen[base + k * 2], s.screen[base + k * 2 + 1]]);
  }
  const pts = sketchPoints.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain: Array<[number, number]> = [];
  for (const point of pts) {
    while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0) chain.pop();
    chain.push(point);
  }
  const lower = chain.length;
  for (let i = pts.length - 2; i >= 0; i--) {
    const point = pts[i];
    while (chain.length > lower && cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0) chain.pop();
    chain.push(point);
  }
  chain.pop();
  const n = Math.min(chain.length, out.length / 2);
  for (let i = 0; i < n; i++) {
    out[i * 2] = chain[i][0];
    out[i * 2 + 1] = chain[i][1];
  }
  return n;
}

/**
 * The near wing's root crease ("D-top"): the region it hinges and the
 * crease's two ends on that region (tail, nose), in flat sheet units.
 */
const creases = new WeakMap<Sheet, [number, number, number, number, number] | null>();
function creaseFor(sheet: Sheet): [number, number, number, number, number] | null {
  if (creases.has(sheet)) return creases.get(sheet) ?? null;
  const op = sheet.ops.findIndex((o) => o.name === "D-top");
  let best: [number, number, number, number, number] | null = null;
  let bestArea = -1;
  sheet.regions.forEach((region, r) => {
    const hinge = region.hinges.find((h) => h.op === op);
    if (!hinge) return;
    // the biggest piece the wing fold turns: the wing itself
    let area = 0;
    for (let k = 0; k < region.count; k++) {
      const k2 = (k + 1) % region.count;
      area += region.poly[k * 2] * region.poly[k2 * 2 + 1] - region.poly[k2 * 2] * region.poly[k * 2 + 1];
    }
    area = Math.abs(area);
    if (area <= bestArea) return;
    // stretch the hinge across the sheet, tail (x = −w/2) to nose (x = +w/2)
    const dx = hinge.bx - hinge.ax;
    if (Math.abs(dx) < 1e-6) return;
    const at = (x: number) => hinge.ay + ((x - hinge.ax) / dx) * (hinge.by - hinge.ay);
    const half = sheet.width / 2;
    best = [r, -half, at(-half), half, at(half)];
    bestArea = area;
  });
  creases.set(sheet, best);
  return best;
}
