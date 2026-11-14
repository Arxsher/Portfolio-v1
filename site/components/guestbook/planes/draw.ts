// Draws one paper plane (or a sheet on its way to becoming one) on a 2D
// canvas: folds the sheet, places it, projects it with a little
// perspective, orders the faces, shades them like matte paper, and maps the
// written side onto whichever faces show it.
//
// Paper. Every plane, at any size:
//   - light falls off softly across the whole plane, so no face is one flat
//     tone (and a sheet lying flat shows no seams between its faces);
//   - a folded edge reads as paper does: a ridge catches the light, a
//     valley goes dark. A crease only shows once its fold has been made
//     (`formed`);
//   - cut edges facing the light catch it (the paper's thickness).
// A plane drawn large (the folding table, a caught note) also gets, eased
// in with its size (`detail`), what only shows up close:
//   - the sheet's grain (a fine speckle with a few fibres, fixed to the
//     paper) on both sides, and the ink showing faintly through the back;
//   - on a sheet opened flat, each crease stays as an embossed line, lit on
//     one side and shaded on the other;
//   - a flap casts a soft shadow on the paper under it: wide while it is
//     in the air, a tight contact shadow once it lies flat.
// Small planes far off in the sky skip those, and stay cheap.
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
  /** How formed each fold's crease is, 0…1 per fold (default: all of them). */
  formed?: ArrayLike<number> | null;
  /** How much of the close-up paper material to draw, 0…1 (default: from the size). */
  detail?: number;
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
  /** Per face: +1 or −1, the way its outline winds on screen. */
  readonly wind: Int8Array;
  /** Per fold: how far it is folded, 0 flat … 1 finished. */
  readonly fold: Float64Array;
  /** Per face: how high it stands over the paper it folds onto (sheet units), and how much shadow it casts. */
  readonly lift: Float64Array;
  readonly cast: Float64Array;
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
    this.wind = new Int8Array(this.n);
    this.fold = new Float64Array(sheet.ops.length);
    this.lift = new Float64Array(this.n);
    this.cast = new Float64Array(this.n);
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
  for (let k = 0; k < sheet.ops.length; k++) s.fold[k] = p.angles[k] / (sheet.folded[k] || 1);
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
    let area = 0;
    const o0 = r * MAX_VERTS * 2;
    for (let k = 0; k < region.count; k++) {
      const k2 = (k + 1) % region.count;
      area += s.screen[o0 + k * 2] * s.screen[o0 + k2 * 2 + 1] - s.screen[o0 + k2 * 2] * s.screen[o0 + k * 2 + 1];
    }
    s.wind[r] = area >= 0 ? 1 : -1;
    // A flap (a piece the flat folds turn over): how high it stands over
    // the paper it folds onto, and the shadow it throws there.
    let lift = 0;
    let cast = 0;
    for (let h = 0; h < region.hinges.length; h++) {
      const hinge = region.hinges[h];
      if (!sheet.ops[hinge.op].flat) continue;
      const f = Math.max(0, Math.min(1, s.fold[hinge.op]));
      if (f <= 0.003) continue;
      const dx = hinge.bx - hinge.ax;
      const dy = hinge.by - hinge.ay;
      const reach = Math.abs(dx * (region.cy - hinge.ay) - dy * (region.cx - hinge.ax)) / (Math.hypot(dx, dy) || 1);
      const up = Math.sin(Math.PI * f);
      lift = Math.max(lift, up * reach);
      // in the air: a real shadow; lying flat: a contact shadow stays
      cast = Math.max(cast, Math.min(1, f / 0.08) * (0.34 + 0.66 * up));
    }
    s.lift[r] = lift;
    s.cast[r] = cast;
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

/** Toward the light on screen (unit vector; y is down). */
const LIGHT2 = (() => {
  const len = Math.hypot(LIGHT[0], LIGHT[1]);
  return [LIGHT[0] / len, LIGHT[1] / len];
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

/** The two ends of the light's slope across a flat sheet: [nearest the light, farthest]. */
function flatSlope(look: PlaneLook, paper: RGB): [string, string] {
  const shade = flatShade(look);
  return [paperFill(paper, shade + look.sheen, look.warmth), paperFill(paper, shade - look.sheen, look.warmth)];
}

const grainUrls = new Map<number, string>();

/**
 * CSS `background` for an element that should be a flat sheet of this
 * paper, as the canvas paints one up close: the light's slope across it
 * and the sheet's grain.
 */
export function flatPaperBackground(look: PlaneLook, paper: RGB): string {
  const [lit, dim] = flatSlope(look, paper);
  // CSS angles turn clockwise from "up"; the slope runs away from the light
  const angle = (Math.atan2(-LIGHT[0], LIGHT[1]) * 180) / Math.PI;
  const slope = `linear-gradient(${angle.toFixed(1)}deg, ${lit}, ${dim})`;
  const grain = grainTexture();
  if (!grain || look.grain <= 0) return slope;
  const key = Math.round(look.grain * 100);
  let url = grainUrls.get(key);
  if (!url) {
    const copy = document.createElement("canvas");
    copy.width = grain.width;
    copy.height = grain.height;
    const ctx = copy.getContext("2d");
    if (!ctx) return slope;
    ctx.globalAlpha = Math.min(1, look.grain);
    ctx.drawImage(grain, 0, 0);
    url = copy.toDataURL("image/png");
    grainUrls.set(key, url);
  }
  return `url(${url}) center / 100% 100% no-repeat, ${slope}`;
}

/** Paint a flat, blank sheet of this paper into a rectangle (CSS px), as the canvas paints one up close. */
export function fillFlatPaper(ctx: CanvasRenderingContext2D, look: PlaneLook, paper: RGB, x: number, y: number, w: number, h: number, radius = 0) {
  const [lit, dim] = flatSlope(look, paper);
  let near = -Infinity;
  let far = Infinity;
  for (let i = 0; i < 4; i++) {
    const t = (i & 1 ? x + w : x) * LIGHT2[0] + (i & 2 ? y + h : y) * LIGHT2[1];
    if (t > near) near = t;
    if (t < far) far = t;
  }
  const gradient = ctx.createLinearGradient(LIGHT2[0] * near, LIGHT2[1] * near, LIGHT2[0] * far, LIGHT2[1] * far);
  gradient.addColorStop(0, lit);
  gradient.addColorStop(1, dim);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  const grain = grainTexture();
  if (!grain || look.grain <= 0) return;
  ctx.save();
  ctx.clip();
  ctx.shadowColor = "transparent";
  ctx.globalAlpha *= Math.min(1, look.grain);
  ctx.drawImage(grain, x, y, w, h);
  ctx.restore();
}

const fillCache = new Map<number, string>();
/**
 * Paper at a brightness. Below 1 the channels darken unevenly (red least,
 * blue most), so shade reads as warm paper in its own shadow, not grey.
 */
function paperFill(paper: RGB, shade: number, warmth: number): string {
  // half-percent steps: fine enough for the soft slope across a sheet
  const level = Math.max(0, Math.min(255, Math.round(shade * 200)));
  const warm = Math.max(0, Math.min(63, Math.round(warmth * 50)));
  const key = (((Math.round(paper[0]) * 256 + Math.round(paper[1])) * 256 + Math.round(paper[2])) * 256 + level) * 64 + warm;
  let fill = fillCache.get(key);
  if (!fill) {
    const k = level / 200;
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
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, -PARK * dpr, 0);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * dpr;
  ctx.shadowOffsetX = PARK * dpr + dx * dpr;
  ctx.shadowOffsetY = dy * dpr;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  for (let r = 0; r < s.n; r++) tracePolygon(ctx, s, r);
  ctx.fill("nonzero");
  ctx.restore();
}

/** How much of the close-up material a plane drawn at this scale gets. */
export function detailFor(scale: number): number {
  const t = (scale - 0.3) / 0.24;
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}

/** Paint the last projected plane. */
export function drawPlane(ctx: CanvasRenderingContext2D, dpr: number, p: PlaneParams, s: PlaneScratch) {
  const { look, paper, content } = p;
  const alpha = p.alpha ?? 1;
  if (alpha <= 0.002) return;
  const regions = s.sheet.regions;
  const ops = s.sheet.ops;
  const detail = p.detail ?? detailFor(p.scale);
  const rich = detail > 0.01;
  // the light's play on the paper: gentler on small planes, never off
  const soft = 0.6 + 0.4 * detail;
  const formed = p.formed ?? null;
  // Folds read as edges while folded; once flat they are just soft marks.
  const creases = look.crease * (1 - 0.45 * (p.creases ?? 0));
  const hair = Math.min(1, 0.45 + p.scale * 1.4);
  const grain = rich && look.grain > 0 ? grainTexture() : null;
  // Light falls off across the whole plane, from its end nearest the light:
  // one slope for every face, so a flat sheet shows no seams.
  let near = -Infinity;
  let far = Infinity;
  if (look.sheen > 0) {
    for (let i = 0; i < 4; i++) {
      const t = (i & 1 ? s.maxX : s.minX) * LIGHT2[0] + (i & 2 ? s.maxY : s.minY) * LIGHT2[1];
      if (t > near) near = t;
      if (t < far) far = t;
    }
  }
  const slope = near - far > 8 ? (2 * look.sheen * soft) / (near - far) : 0;
  const middle = (near + far) / 2;
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
    const base = r * MAX_VERTS * 2;
    const count = region.count;

    // The shadow this flap throws on the paper already drawn under it
    // (and only there: "source-atop"). In the air it is a real, soft
    // shadow; lying flat, a dark line just past its edge is all there is
    // to see, and costs next to nothing.
    if (rich && s.cast[r] > 0.2 && look.flapShadow > 0) {
      const height = s.lift[r] * p.scale;
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      if (height > 1.4) {
        const reach = 0.8 + height * 0.5;
        ctx.globalAlpha = alpha * detail * s.cast[r];
        ctx.setTransform(dpr, 0, 0, dpr, -PARK * dpr, 0);
        ctx.shadowColor = look.flapShadow >= 1 ? "#000" : `rgb(0 0 0 / ${look.flapShadow})`;
        ctx.shadowBlur = Math.min(28, 1.6 + height * 0.42) * dpr;
        ctx.shadowOffsetX = (PARK - LIGHT2[0] * reach) * dpr;
        ctx.shadowOffsetY = -LIGHT2[1] * reach * dpr;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        tracePolygon(ctx, s, r);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha * detail * s.cast[r] * look.flapShadow;
        ctx.translate(-LIGHT2[0] * 0.9, -LIGHT2[1] * 0.9);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        tracePolygon(ctx, s, r);
        ctx.stroke();
      }
      ctx.restore();
    }

    const facing = sign * (s.normal[r * 3] * LIGHT[0] + s.normal[r * 3 + 1] * LIGHT[1] + s.normal[r * 3 + 2] * LIGHT[2]);
    const raw =
      look.ambient + look.diffuse * Math.max(0, facing) + look.backLight * Math.max(0, -facing) - (front ? 0 : look.backShade);
    const shade = shadeOf(look, raw);
    const fill = paperFill(paper, shade, look.warmth);
    ctx.beginPath();
    tracePolygon(ctx, s, r);
    if (slope > 0) {
      // this face's stretch of that slope
      let lo = Infinity;
      let hi = -Infinity;
      for (let k = 0; k < count; k++) {
        const t = s.screen[base + k * 2] * LIGHT2[0] + s.screen[base + k * 2 + 1] * LIGHT2[1];
        if (t < lo) lo = t;
        if (t > hi) hi = t;
      }
      if (rich && hi - lo > 4) {
        const gradient = ctx.createLinearGradient(LIGHT2[0] * hi, LIGHT2[1] * hi, LIGHT2[0] * lo, LIGHT2[1] * lo);
        gradient.addColorStop(0, paperFill(paper, shade + (hi - middle) * slope, look.warmth));
        gradient.addColorStop(1, paperFill(paper, shade + (lo - middle) * slope, look.warmth));
        ctx.fillStyle = gradient;
      } else ctx.fillStyle = paperFill(paper, shade + ((hi + lo) / 2 - middle) * slope, look.warmth);
    } else ctx.fillStyle = fill;
    ctx.fill();
    // Same colour hairline closes the anti-aliasing seams between faces.
    ctx.strokeStyle = fill;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // What is on the paper: its grain on both sides, the note on the
    // front, and a ghost of the ink through the back.
    const written = content && intersects(region, content.rect) ? content : null;
    const through = rich && !front ? look.showThrough * detail : 0;
    const inked = written && (front || through > 0.004) ? written : null;
    if ((grain || inked) && faceAffine(s, r)) {
      if (grain) fillGrain(ctx, s, r, grain, alpha * look.grain * detail);
      if (inked) drawContent(ctx, dpr, s, r, inked, front ? 1 : through);
    }

    // The cut edge of the paper: a hairline, and light caught along the
    // edges that face it.
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
      if (look.rim > 0) {
        ctx.beginPath();
        let lit = false;
        for (let k = 0; k < count; k++) {
          if (!region.outer[k]) continue;
          const k2 = (k + 1) % count;
          const x0 = s.screen[base + k * 2];
          const y0 = s.screen[base + k * 2 + 1];
          const x1 = s.screen[base + k2 * 2];
          const y1 = s.screen[base + k2 * 2 + 1];
          const len = Math.hypot(x1 - x0, y1 - y0);
          if (len < 2) continue;
          // outward normal of this edge
          const nx = ((y1 - y0) / len) * s.wind[r];
          const ny = (-(x1 - x0) / len) * s.wind[r];
          if (nx * LIGHT2[0] + ny * LIGHT2[1] < 0.25) continue;
          // just inside the edge, so the hairline stays outside it
          const inset = 0.6 * hair;
          ctx.moveTo(x0 - nx * inset, y0 - ny * inset);
          ctx.lineTo(x1 - nx * inset, y1 - ny * inset);
          lit = true;
        }
        if (lit) {
          ctx.strokeStyle = `rgb(255 255 255 / ${(look.rim * soft).toFixed(3)})`;
          ctx.lineWidth = 0.9 * hair;
          ctx.stroke();
        }
      }
    }

    // Creases.
    if (!rich) {
      // far off: one stroke for this face's ridges, one for its valleys
      ctx.lineWidth = 0.75 * hair;
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        let any = false;
        for (let k = 0; k < count; k++) {
          if (region.outer[k]) continue;
          const op = region.crease[k];
          if (op >= 0 && formed && formed[op] < 0.5) continue;
          const ridge = op >= 0 ? front !== ops[op].valley : false;
          if (ridge !== (pass === 0)) continue;
          const k2 = (k + 1) % count;
          ctx.moveTo(s.screen[base + k * 2], s.screen[base + k * 2 + 1]);
          ctx.lineTo(s.screen[base + k2 * 2], s.screen[base + k2 * 2 + 1]);
          any = true;
        }
        if (!any) continue;
        ctx.strokeStyle = pass === 0 ? `rgb(255 255 255 / ${(look.ridge * soft * 0.7).toFixed(3)})` : inkRgba(look, Math.max(creases, look.valley * soft));
        ctx.stroke();
      }
      continue;
    }
    for (let k = 0; k < count; k++) {
      if (region.outer[k]) continue;
      const op = region.crease[k];
      const made = op >= 0 && formed ? Math.max(0, Math.min(1, formed[op])) : 1;
      if (made <= 0.01) continue;
      const k2 = (k + 1) % count;
      const x0 = s.screen[base + k * 2];
      const y0 = s.screen[base + k * 2 + 1];
      const x1 = s.screen[base + k2 * 2];
      const y1 = s.screen[base + k2 * 2 + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1.5) continue;
      const bent = op >= 0 ? Math.abs(s.fold[op]) : 1;
      // 1 on a sheet lying open, 0 once the fold has closed past a third
      const open = bent >= 0.34 ? 0 : 1 - (bent / 0.34) * (bent / 0.34) * (3 - (2 * bent) / 0.34);
      // seen from this side, does the crease stand up (a ridge) or sink (a groove)?
      const ridge = op >= 0 ? front !== ops[op].valley : true;
      const closed = (1 - open) * made;
      if (closed > 0.01) {
        // a folded edge: the ridge catches light, the valley goes dark
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineWidth = 0.9 * hair;
        ctx.strokeStyle = ridge
          ? `rgb(255 255 255 / ${(look.ridge * closed * soft).toFixed(3)})`
          : inkRgba(look, Math.max(creases, look.valley * soft) * closed);
        ctx.stroke();
      }
      const flat = open * made * detail;
      if (flat > 0.01) {
        // an opened crease: embossed, lit on one side and shaded on the other
        const nx = (y1 - y0) / len;
        const ny = -(x1 - x0) / len;
        const toward = nx * LIGHT2[0] + ny * LIGHT2[1] >= 0 ? 1 : -1;
        // a ridge is lit on the side nearer the light; a groove on its far wall
        const lit = (ridge ? 1 : -1) * toward * 0.65;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = inkRgba(look, look.embossDark * flat);
        ctx.beginPath();
        ctx.moveTo(x0 - nx * lit, y0 - ny * lit);
        ctx.lineTo(x1 - nx * lit, y1 - ny * lit);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgb(255 255 255 / ${(look.embossLight * flat).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x0 + nx * lit, y0 + ny * lit);
        ctx.lineTo(x1 + nx * lit, y1 + ny * lit);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

/** Where shapes are parked (CSS px to the left) while only their canvas shadow is wanted. */
const PARK = 100000;

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

/** The map from flat sheet units to the screen (CSS px) on the face last passed to faceAffine. */
const affine = new Float64Array(6);

/** Work out that map for face r, through its three widest vertices. False if the face is edge-on. */
function faceAffine(s: PlaneScratch, r: number): boolean {
  const region = s.sheet.regions[r];
  const [i0, i1, i2] = region.tri;
  const u0 = region.poly[i0 * 2];
  const v0 = region.poly[i0 * 2 + 1];
  const du1 = region.poly[i1 * 2] - u0;
  const dv1 = region.poly[i1 * 2 + 1] - v0;
  const du2 = region.poly[i2 * 2] - u0;
  const dv2 = region.poly[i2 * 2 + 1] - v0;
  const det = du1 * dv2 - du2 * dv1;
  if (Math.abs(det) < 1e-6) return false;
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
  affine[0] = a;
  affine[1] = b;
  affine[2] = c;
  affine[3] = d;
  affine[4] = x0 - a * u0 - c * v0;
  affine[5] = y0 - b * u0 - d * v0;
  // a face seen edge-on has nothing to show
  return Math.abs(a * d - b * c) > 1e-5;
}

/** Map the written side onto face r (at `ink` strength: full on the front, a ghost through the back). */
function drawContent(ctx: CanvasRenderingContext2D, dpr: number, s: PlaneScratch, r: number, content: PlaneContent, ink: number) {
  ctx.save();
  ctx.beginPath();
  tracePolygon(ctx, s, r);
  ctx.clip();
  ctx.setTransform(dpr * affine[0], dpr * affine[1], dpr * affine[2], dpr * affine[3], dpr * affine[4], dpr * affine[5]);
  ctx.globalAlpha *= Math.min(1, ink);
  content.draw(ctx);
  ctx.restore();
}

let grainFill: CanvasPattern | null = null;
let grainMatrix: DOMMatrix | null = null;

/** Lay the sheet's grain over face r: the texture as a pattern, pinned to the paper by the face's own map. */
function fillGrain(ctx: CanvasRenderingContext2D, s: PlaneScratch, r: number, grain: HTMLCanvasElement, strength: number) {
  if (strength <= 0.004) return;
  grainFill ??= ctx.createPattern(grain, "repeat");
  if (!grainFill || typeof DOMMatrix === "undefined") return;
  grainMatrix ??= new DOMMatrix();
  // texture px → sheet units (the texture covers the sheet) → screen
  const { width, height } = s.sheet;
  const sx = width / grain.width;
  const sy = height / grain.height;
  const m = grainMatrix;
  m.a = affine[0] * sx;
  m.b = affine[1] * sx;
  m.c = affine[2] * sy;
  m.d = affine[3] * sy;
  m.e = affine[4] - (affine[0] * width + affine[2] * height) / 2;
  m.f = affine[5] - (affine[1] * width + affine[3] * height) / 2;
  grainFill.setTransform(m);
  const before = ctx.globalAlpha;
  ctx.globalAlpha = Math.min(1, strength);
  ctx.fillStyle = grainFill;
  ctx.beginPath();
  tracePolygon(ctx, s, r);
  ctx.fill();
  ctx.globalAlpha = before;
}

let grainCanvas: HTMLCanvasElement | null | undefined;

/**
 * The sheet's grain, made once: a fine speckle, slow mottling and a few
 * fibres, as light and dark marks on a clear ground, so it sits on paper of
 * any tint. Drawn across the whole sheet (it is stretched to the sheet's
 * size), on whichever faces show.
 */
function grainTexture(): HTMLCanvasElement | null {
  if (grainCanvas !== undefined) return grainCanvas;
  grainCanvas = null;
  if (typeof document === "undefined") return null;
  const W = 640;
  const H = 400;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // a fixed sequence, so the paper looks the same every visit
  let seed = 0x2f6e2b1;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // slow mottling: a coarse grid of values, smoothed between its points
  const GX = 20;
  const GY = 13;
  const coarse = new Float32Array((GX + 1) * (GY + 1));
  for (let i = 0; i < coarse.length; i++) coarse[i] = random() - 0.5;
  const image = ctx.createImageData(W, H);
  const data = image.data;
  for (let y = 0; y < H; y++) {
    const gy = (y / H) * GY;
    const y0 = Math.floor(gy);
    const ty = gy - y0;
    const sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < W; x++) {
      const gx = (x / W) * GX;
      const x0 = Math.floor(gx);
      const tx = gx - x0;
      const sx = tx * tx * (3 - 2 * tx);
      const i00 = y0 * (GX + 1) + x0;
      const i10 = i00 + GX + 1;
      const top = coarse[i00] + (coarse[i00 + 1] - coarse[i00]) * sx;
      const bottom = coarse[i10] + (coarse[i10 + 1] - coarse[i10]) * sx;
      const mottle = top + (bottom - top) * sy;
      // fine speckle on top of it
      const value = mottle * 0.3 + (random() - 0.5) * 0.9;
      const o = (y * W + x) * 4;
      const tone = value > 0 ? 255 : 0;
      data[o] = tone;
      data[o + 1] = tone;
      data[o + 2] = tone;
      data[o + 3] = Math.min(255, Math.abs(value) * 46);
    }
  }
  ctx.putImageData(image, 0, 0);
  // fibres: short, faint strands lying every way
  ctx.lineCap = "round";
  for (let i = 0; i < 260; i++) {
    const x = random() * W;
    const y = random() * H;
    const angle = random() * Math.PI;
    const length = 5 + random() * 16;
    const bend = (random() - 0.5) * 5;
    const light = random() > 0.45;
    ctx.strokeStyle = light ? `rgb(255 255 255 / ${0.05 + random() * 0.07})` : `rgb(0 0 0 / ${0.03 + random() * 0.045})`;
    ctx.lineWidth = 0.5 + random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + (Math.cos(angle) * length) / 2 - Math.sin(angle) * bend,
      y + (Math.sin(angle) * length) / 2 + Math.cos(angle) * bend,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    );
    ctx.stroke();
  }
  grainCanvas = canvas;
  return canvas;
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
