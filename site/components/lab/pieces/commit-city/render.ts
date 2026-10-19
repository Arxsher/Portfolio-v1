// Draws the city with Canvas 2D in a turntable axonometric view.
//
// Projection: orthographic, the camera 32° above the ground and turned by
// `yaw` around the vertical (45° + k·90° are the classic isometric rests).
// For a world point (x, y, z), relative to the focus point F on the ground:
//   u = x cos(yaw) − z sin(yaw)          screen right
//   v = x sin(yaw) + z cos(yaw)          towards you
//   screen = centre + S · (u, v · sin(pitch) − y · cos(pitch))
// The ground plane maps affinely onto the screen, so flat things (the plinth
// top, the lots, the month labels) are drawn with one setTransform, and each
// wall with another (its base edge and the vertical), which keeps windows
// and gradients crisp and cheap.
//
// Light stays with the camera, like a studio lamp over a model on a
// turntable: turn the city and its walls take their light from where they
// now face. Order of a frame: plinth (with its drop shadow), month labels,
// lots, sun shadows (one blurred union, clipped to the plinth), contact
// shadows, then the buildings back to front (painter's order by depth),
// each tier wall → windows → roof → rim; at night a bloom pass adds the
// window glow (the buildings drawn again in black so hidden windows don't
// shine through).

import { clamp, hash2, smoothstep } from "../../hooks";
import { FOOTPRINT, LOT, type City, type Lot, type Tier } from "./city";
import { css, shade, WINDOW_LIGHTS, type Look, type RGB } from "./look";

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

/** Plinth: margins around the lots, corner radius and thickness (world units). */
const MARGIN_X = 0.8;
const MARGIN_Z = 1.05;
const RADIUS = 0.62;
const THICKNESS = 0.4;
/** Lots stand this proud of the plinth (built ones only; empty lots stay flat). */
const PAD_RISE = 0.03;

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

type Frame = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  up: number;
  sin: number;
  cos: number;
  S: number;
};

function frameFor(view: View): Frame {
  const { yaw, scale: S, cx, cy, fx, fz } = view;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const a = S * cos;
  const c = -S * sin;
  const b = S * SIN_P * sin;
  const d = S * SIN_P * cos;
  return { a, b, c, d, e: cx - (a * fx + c * fz), f: cy - (b * fx + d * fz), up: S * COS_P, sin, cos, S };
}

/** Screen point (CSS px) → the ground point under it (world x, z). */
export function screenToGround(view: View, sx: number, sy: number): { x: number; z: number } {
  const F = frameFor(view);
  const det = F.a * F.d - F.b * F.c;
  const px = sx - F.e;
  const py = sy - F.f;
  return { x: (F.d * px - F.c * py) / det, z: (-F.b * px + F.a * py) / det };
}

/** World point → screen (CSS px). */
export function project(view: View, x: number, y: number, z: number): { x: number; y: number } {
  const F = frameFor(view);
  return { x: F.a * x + F.c * z + F.e, y: F.b * x + F.d * z + F.f - F.up * y };
}

export type Bounds = { minU: number; maxU: number; minW: number; maxW: number };

/** The plinth's rectangle (world units). */
export function plinthRect(city: City) {
  return {
    x0: city.minX - LOT / 2 - MARGIN_X,
    x1: city.maxX + LOT / 2 + MARGIN_X,
    z0: city.minZ - LOT / 2 - MARGIN_Z,
    z1: city.maxZ + LOT / 2 + MARGIN_Z,
  };
}

/**
 * The city's screen extent at unit scale, relative to the world origin:
 * u across, w down (heights included). Used to fit the city to the stage.
 */
export function boundsAt(city: City, yaw: number): Bounds {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const { x0, x1, z0, z1 } = plinthRect(city);
  let minU = Infinity;
  let maxU = -Infinity;
  let minW = Infinity;
  let maxW = -Infinity;
  for (const [x, z] of [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ]) {
    const u = x * cos - z * sin;
    const w = (x * sin + z * cos) * SIN_P;
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minW = Math.min(minW, w);
    maxW = Math.max(maxW, w + THICKNESS * COS_P);
  }
  const spread = (FOOTPRINT / 2) * (Math.abs(sin) + Math.abs(cos));
  for (const lot of city.lots) {
    if (lot.height <= 0) continue;
    const w = (lot.x * sin + lot.z * cos) * SIN_P - (lot.height + lot.mast) * COS_P - spread * SIN_P;
    if (w < minW) minW = w;
  }
  return { minU, maxU, minW, maxW };
}

/**
 * The ground point that lands on the centre of the bounds (so a view
 * focused on it, at the fitted scale, shows the whole city centred).
 */
export function centreOf(bounds: Bounds, yaw: number): { x: number; z: number } {
  const u = (bounds.minU + bounds.maxU) / 2;
  const v = (bounds.minW + bounds.maxW) / 2 / SIN_P;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return { x: u * cos + v * sin, z: -u * sin + v * cos };
}

/* ---------------------------------------------------------------------- */
/* geometry helpers                                                        */
/* ---------------------------------------------------------------------- */

/** Monotone-chain convex hull of flat [x0, y0, x1, y1, …]; returns the same layout. */
function hull(points: number[]): number[] {
  const n = points.length / 2;
  const idx = Array.from({ length: n }, (_, i) => i).sort(
    (i, j) => points[i * 2] - points[j * 2] || points[i * 2 + 1] - points[j * 2 + 1],
  );
  const cross = (o: number, a: number, b: number) =>
    (points[a * 2] - points[o * 2]) * (points[b * 2 + 1] - points[o * 2 + 1]) -
    (points[a * 2 + 1] - points[o * 2 + 1]) * (points[b * 2] - points[o * 2]);
  const lower: number[] = [];
  for (const i of idx) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], i) <= 0) lower.pop();
    lower.push(i);
  }
  const upper: number[] = [];
  for (let k = idx.length - 1; k >= 0; k--) {
    const i = idx[k];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], i) <= 0) upper.pop();
    upper.push(i);
  }
  lower.pop();
  upper.pop();
  const out: number[] = [];
  for (const i of lower.concat(upper)) out.push(points[i * 2], points[i * 2 + 1]);
  return out;
}

function inConvex(poly: ArrayLike<number>, x: number, y: number): boolean {
  const n = poly.length / 2;
  if (n < 3) return false;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const ax = poly[i * 2];
    const ay = poly[i * 2 + 1];
    const bx = poly[((i + 1) % n) * 2];
    const by = poly[((i + 1) % n) * 2 + 1];
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (Math.abs(cross) < 1e-9) continue;
    const s = cross > 0 ? 1 : -1;
    if (!sign) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/** The rounded plinth outline in the ground plane: points and outward normals (counter-clockwise seen from above). */
function plinthOutline(city: City) {
  const { x0, x1, z0, z1 } = plinthRect(city);
  const r = RADIUS;
  const corners: Array<[number, number, number]> = [
    // centre x, centre z, start angle (the arc sweeps 90°)
    [x1 - r, z0 + r, -Math.PI / 2],
    [x1 - r, z1 - r, 0],
    [x0 + r, z1 - r, Math.PI / 2],
    [x0 + r, z0 + r, Math.PI],
  ];
  const points: Array<{ x: number; z: number; nx: number; nz: number }> = [];
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

/* ---------------------------------------------------------------------- */
/* renderer                                                                */
/* ---------------------------------------------------------------------- */

export type RenderOptions = {
  look: Look;
  /** 0 day … 1 night (window lights follow it). */
  night: number;
  /** Lot index under the pointer / keyboard, or -1. */
  hover: number;
  /** Lift of a lot's building, 0..1 (hover pops it up a little). */
  liftOf: (index: number) => number;
  /** 0..1: how far the rest of the city steps back while one day is pointed at. */
  focus: number;
  /** Month labels on the plinth. */
  labels: boolean;
  /** "tile" draws a little lighter (thinner rims, no labels). */
  quality: "tile" | "stage";
  fontFamily: string;
};

export type RenderResult = {
  /** Screen point (CSS px) above the hovered building or lot, for the tooltip. */
  anchor: { x: number; y: number } | null;
  /** Mast tip of the tallest tower (CSS px), for the night beacon. */
  beacon: { x: number; y: number } | null;
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

export class CityRenderer {
  readonly city: City;
  private order: Lot[];
  private orderYaw = NaN;
  private outline: ReturnType<typeof plinthOutline>;
  private shadow = makeCanvas();
  private shadowSoft = makeCanvas();
  private glow = makeCanvas();
  private glowWide = makeCanvas();
  private glowTight = makeCanvas();
  /** Screen hulls of what was drawn last frame (for picking), nearest first. */
  private hits: Array<{ lot: Lot; poly: number[] }> = [];
  private pads: Array<{ lot: Lot; poly: number[] }> = [];

  constructor(city: City) {
    this.city = city;
    this.order = city.lots.slice();
    this.outline = plinthOutline(city);
  }

  /** The lot under a screen point (CSS px) in the last frame drawn. */
  pick(x: number, y: number): Lot | null {
    for (const hit of this.hits) if (inConvex(hit.poly, x, y)) return hit.lot;
    for (const pad of this.pads) if (inConvex(pad.poly, x, y)) return pad.lot;
    return null;
  }

  private sortFor(F: Frame) {
    const yaw = Math.atan2(F.sin, F.cos);
    if (yaw === this.orderYaw) return;
    this.orderYaw = yaw;
    const { sin, cos } = F;
    this.order.sort((p, q) => p.x * sin + p.z * cos - (q.x * sin + q.z * cos));
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number,
    view: View,
    options: RenderOptions,
  ): RenderResult {
    const F = frameFor(view);
    const { look, night, quality } = options;
    this.sortFor(F);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const P = (x: number, y: number, z: number): [number, number] => [
      F.a * x + F.c * z + F.e,
      F.b * x + F.d * z + F.f - F.up * y,
    ];
    /** Ground-plane transform at height y (draw in world x, z). */
    const ground = (target: CanvasRenderingContext2D, y: number, k = dpr) =>
      target.setTransform(k * F.a, k * F.b, k * F.c, k * F.d, k * F.e, k * (F.f - F.up * y));
    /**
     * Wall transform: s runs 0..1 from (x0, z0) to (x1, z1), t is height in
     * world units from y0 (positive up).
     */
    const wall = (
      target: CanvasRenderingContext2D,
      x0: number,
      z0: number,
      x1: number,
      z1: number,
      y0: number,
      k = dpr,
    ) => {
      const [ax, ay] = P(x0, y0, z0);
      const [bx, by] = P(x1, y0, z1);
      target.setTransform(k * (bx - ax), k * (by - ay), 0, -k * F.up, k * ax, k * ay);
    };

    const sideDiffuse = (nx: number, nz: number) => {
      const nu = nx * F.cos - nz * F.sin;
      const nv = nx * F.sin + nz * F.cos;
      return Math.max(0, nu * LIGHT.u + nv * LIGHT.v);
    };
    const facing = (nx: number, nz: number) => nx * F.sin + nz * F.cos;

    /* ---------------- plinth ---------------- */

    const outline = this.outline;
    const topPoints: number[] = [];
    const allPoints: number[] = [];
    for (const p of outline) {
      const [sx, sy] = P(p.x, 0, p.z);
      topPoints.push(sx, sy);
      allPoints.push(sx, sy, sx, sy + THICKNESS * F.up);
    }
    const silhouette = hull(allPoints);

    const tracePoly = (target: CanvasRenderingContext2D, poly: ArrayLike<number>) => {
      target.moveTo(poly[0], poly[1]);
      for (let i = 2; i < poly.length; i += 2) target.lineTo(poly[i], poly[i + 1]);
      target.closePath();
    };

    // Drop shadow on the stage: a wide soft one and a tight contact one.
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const baseSide = css(shade(look.baseSide, look, 0.2, look.bounce));
    ctx.fillStyle = baseSide;
    ctx.shadowColor = css([0, 0, 0], look.drop * 0.55);
    ctx.shadowBlur = F.S * 2.2 * dpr;
    ctx.shadowOffsetY = F.S * 0.9 * dpr;
    ctx.beginPath();
    tracePoly(ctx, silhouette);
    ctx.fill();
    ctx.shadowColor = css([0, 0, 0], look.drop * 0.9);
    ctx.shadowBlur = F.S * 0.35 * dpr;
    ctx.shadowOffsetY = F.S * 0.12 * dpr;
    ctx.fill();
    ctx.restore();

    // Sides, one facet per outline segment, each lit by its own normal,
    // darkening towards the table.
    const sideFade = (() => {
      const g = ctx.createLinearGradient(0, -THICKNESS, 0, 0);
      g.addColorStop(0, css(look.shadowTint, 0.28));
      g.addColorStop(0.6, css(look.shadowTint, 0.06));
      g.addColorStop(1, css(look.shadowTint, 0));
      return g;
    })();
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i];
      const q = outline[(i + 1) % outline.length];
      const nx = (p.nx + q.nx) / 2;
      const nz = (p.nz + q.nz) / 2;
      if (facing(nx, nz) <= 0) continue;
      const color = css(shade(look.baseSide, look, sideDiffuse(nx, nz), look.bounce * 0.5));
      // A hair of overlap (in world units) so neighbouring facets never show a seam.
      const seam = 0.012 / Math.max(1e-3, Math.hypot(q.x - p.x, q.z - p.z));
      wall(ctx, p.x, p.z, q.x, q.z, -THICKNESS);
      ctx.fillStyle = color;
      ctx.fillRect(-seam, 0, 1 + seam * 2, THICKNESS);
      ctx.fillStyle = sideFade;
      wall(ctx, p.x, p.z, q.x, q.z, 0);
      ctx.fillRect(-seam, -THICKNESS, 1 + seam * 2, THICKNESS);
    }

    // Top.
    const plinthTop = shade(look.base, look, LIGHT.y);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    tracePoly(ctx, topPoints);
    ctx.fillStyle = css(plinthTop);
    ctx.fill();

    // Bevel: a bright line along the front of the top edge.
    ctx.beginPath();
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i];
      const q = outline[(i + 1) % outline.length];
      if (facing((p.nx + q.nx) / 2, (p.nz + q.nz) / 2) <= 0.05) continue;
      ctx.moveTo(topPoints[i * 2], topPoints[i * 2 + 1]);
      ctx.lineTo(topPoints[((i + 1) % outline.length) * 2], topPoints[((i + 1) % outline.length) * 2 + 1]);
    }
    ctx.strokeStyle = css(look.rim, look.rimAlpha * 0.8);
    ctx.lineWidth = quality === "tile" ? 0.6 : 1;
    ctx.lineCap = "round";
    ctx.stroke();

    /* ---------------- month labels ---------------- */

    if (options.labels && F.S * 0.46 >= 7) {
      const alpha = smoothstep(0.2, 0.5, Math.abs(F.cos)) * look.labelAlpha;
      if (alpha > 0.01) {
        const forward = F.cos > 0 ? 1 : -1; // +x/+z or −x/−z: never mirrored
        const { z0, z1 } = plinthRect(this.city);
        const z = forward > 0 ? z1 - MARGIN_Z * 0.5 : z0 + MARGIN_Z * 0.5;
        const size = 0.46;
        const k = size / 12;
        ctx.fillStyle = css(look.label, alpha);
        ctx.font = `500 12px ${options.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const district of this.city.districts) {
          const x = (district.x0 + district.x1) / 2;
          // Origin at the label, x along ±world x, y along ±world z, 12px = `size` units.
          const ox = F.a * x + F.c * z + F.e;
          const oy = F.b * x + F.d * z + F.f;
          ctx.setTransform(
            dpr * F.a * k * forward,
            dpr * F.b * k * forward,
            dpr * F.c * k * forward,
            dpr * F.d * k * forward,
            dpr * ox,
            dpr * oy,
          );
          ctx.fillText(district.month.toUpperCase(), 0, 0);
        }
      }
    }

    /* ---------------- lots ---------------- */

    const half = LOT / 2;
    this.pads = [];
    // Empty lots: flat, a shade darker than the street.
    ground(ctx, 0);
    ctx.beginPath();
    for (const lot of this.order) if (lot.count === 0) ctx.rect(lot.x - half, lot.z - half, LOT, LOT);
    ctx.fillStyle = css(shade(look.padEmpty, look, LIGHT.y));
    ctx.fill();
    // Built lots: a pavement standing a little proud.
    const padSides: Array<{ nx: number; nz: number }> = [
      { nx: 1, nz: 0 },
      { nx: -1, nz: 0 },
      { nx: 0, nz: 1 },
      { nx: 0, nz: -1 },
    ];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const side of padSides) {
      if (facing(side.nx, side.nz) <= 0) continue;
      ctx.beginPath();
      for (const lot of this.order) {
        if (lot.count === 0) continue;
        const ex = side.nx * half;
        const ez = side.nz * half;
        // The edge of this side, from one corner to the other.
        const tx = -side.nz * half;
        const tz = side.nx * half;
        const [ax, ay] = P(lot.x + ex - tx, 0, lot.z + ez - tz);
        const [bx, by] = P(lot.x + ex + tx, 0, lot.z + ez + tz);
        const rise = PAD_RISE * F.up;
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by - rise);
        ctx.lineTo(ax, ay - rise);
        ctx.closePath();
      }
      ctx.fillStyle = css(shade(look.pad, look, sideDiffuse(side.nx, side.nz) * 0.8));
      ctx.fill();
    }
    ground(ctx, PAD_RISE);
    ctx.beginPath();
    for (const lot of this.order) if (lot.count > 0) ctx.rect(lot.x - half, lot.z - half, LOT, LOT);
    ctx.fillStyle = css(shade(look.pad, look, LIGHT.y));
    ctx.fill();

    // Pick polygons for the lots (nearest first).
    for (let i = this.order.length - 1; i >= 0; i--) {
      const lot = this.order[i];
      const y = lot.count > 0 ? PAD_RISE : 0;
      const poly: number[] = [];
      for (const [dx, dz] of [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ]) {
        const [sx, sy] = P(lot.x + dx, y, lot.z + dz);
        poly.push(sx, sy);
      }
      this.pads.push({ lot, poly });
    }

    // The hovered lot: a soft ring on the paving.
    const hovered = options.hover >= 0 ? this.city.lots.find((lot) => lot.index === options.hover) ?? null : null;
    if (hovered) {
      ground(ctx, hovered.count > 0 ? PAD_RISE : 0);
      ctx.beginPath();
      ctx.rect(hovered.x - half + 0.03, hovered.z - half + 0.03, LOT - 0.06, LOT - 0.06);
      ctx.lineWidth = 0.05;
      ctx.strokeStyle = css(night > 0.5 ? [255, 214, 150] : [23, 23, 23], night > 0.5 ? 0.75 : 0.32);
      ctx.stroke();
    }

    /* ---------------- sun shadows ---------------- */

    // World-space ground offset of a shadow per unit of height.
    const lx = LIGHT.u * F.cos + LIGHT.v * F.sin;
    const lz = -LIGHT.u * F.sin + LIGHT.v * F.cos;
    const offX = -lx / LIGHT.y;
    const offZ = -lz / LIGHT.y;
    // Drawn at a quarter of the resolution and blurred there (cheap), then
    // scaled up over the plinth.
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
      for (const lot of this.order) {
        for (const tier of lot.tiers) {
          const pts: number[] = [];
          for (const y of [tier.y0, tier.y1]) {
            for (const [dx, dz] of [
              [-tier.half, -tier.half],
              [tier.half, -tier.half],
              [tier.half, tier.half],
              [-tier.half, tier.half],
            ]) {
              const [sx, sy] = P(lot.x + dx + offX * y, 0, lot.z + dz + offZ * y);
              pts.push(sx, sy);
            }
          }
          tracePoly(sctx, hull(pts));
        }
      }
      sctx.fill("nonzero");
      const soft = blurInto(this.shadow, this.shadowSoft, F.S * 0.06 * dpr * shadowScale);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.beginPath();
      tracePoly(ctx, topPoints);
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
    for (const [grow, strength] of [
      [0.11, 0.35],
      [0.05, 0.55],
    ] as const) {
      ctx.beginPath();
      for (const lot of this.order) {
        if (lot.height <= 0) continue;
        const h = FOOTPRINT / 2 + grow;
        ctx.rect(lot.x - h, lot.z - h, h * 2, h * 2);
      }
      ctx.fillStyle = css(look.shadowTint, look.contact * strength);
      ctx.fill();
    }

    /* ---------------- buildings ---------------- */

    const aoBand = (() => {
      const g = ctx.createLinearGradient(0, 0, 0, 0.26);
      g.addColorStop(0, css(look.shadowTint, look.contact * 1.25));
      g.addColorStop(1, css(look.shadowTint, 0));
      return g;
    })();
    const windowsVisible = F.S * 0.1 >= 0.6;
    const glowOn = night > 0.02;
    const glowScale = 1 / 3;
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

    this.hits = [];
    let anchor: RenderResult["anchor"] = null;
    let beacon: RenderResult["beacon"] = null;
    const rimWidth = quality === "tile" ? 0.6 : 1;

    for (const lot of this.order) {
      if (lot === hovered && lot.height <= 0) {
        const [sx, sy] = P(lot.x, 0, lot.z);
        anchor = { x: sx, y: sy - F.S * 0.3 };
      }
      if (lot.height <= 0) continue;
      const lift = options.liftOf(lot.index) * 0.18;
      const isHover = lot === hovered;
      const litBoost = isHover ? 1 : 0;
      // The rest of the city steps back a little towards the plinth colour.
      const dim = isHover ? 0 : options.focus * (0.55 - 0.2 * night);
      const fade = (color: RGB): RGB => (dim > 0 ? mixRGB(color, plinthTop, dim) : color);
      const hullPts: number[] = [];

      const tiers: Tier[] = lot.roofBox
        ? [
            ...lot.tiers,
            {
              half: lot.roofBox.half,
              y0: lot.height,
              y1: lot.height + lot.roofBox.h,
              windows: false,
            },
          ]
        : lot.tiers;

      for (let t = 0; t < tiers.length; t++) {
        const tier = tiers[t];
        const isBox = lot.roofBox !== null && t === tiers.length - 1;
        const cx = lot.x + (isBox ? lot.roofBox!.dx : 0);
        const cz = lot.z + (isBox ? lot.roofBox!.dz : 0);
        const y0 = tier.y0 + PAD_RISE + lift;
        const y1 = tier.y1 + PAD_RISE + lift;
        const hh = tier.half;
        const corners: Array<[number, number]> = [
          [cx - hh, cz - hh],
          [cx + hh, cz - hh],
          [cx + hh, cz + hh],
          [cx - hh, cz + hh],
        ];
        // Sides: (corner i → corner i+1), outward normals −z, +x, +z, −x.
        const normals: Array<[number, number]> = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ];
        const rims: Array<[number, number, number, number]> = [];
        for (let s = 0; s < 4; s++) {
          const [nx, nz] = normals[s];
          if (facing(nx, nz) <= 1e-4) continue;
          const [x0, z0] = corners[s];
          const [x1, z1] = corners[(s + 1) % 4];
          const diffuse = sideDiffuse(nx, nz);
          const face = fade(shade(isHover ? brighten(look.wall, 1.035) : look.wall, look, diffuse, look.bounce));
          const height = y1 - y0;
          wall(ctx, x0, z0, x1, z1, y0);
          ctx.fillStyle = css(face);
          ctx.fillRect(-0.006 / (hh * 2), 0, 1 + 0.012 / (hh * 2), height);
          if (t === 0) {
            ctx.fillStyle = aoBand;
            ctx.fillRect(0, 0, 1, Math.min(height, 0.26));
          }
          if (gctx) {
            wall(gctx, x0, z0, x1, z1, y0, gk);
            gctx.fillStyle = "#000";
            gctx.fillRect(-0.01, 0, 1.02, height);
          }
          if (tier.windows && windowsVisible) {
            this.windows(ctx, gctx, lot, tier, s, face, diffuse, look, night, litBoost, height, t === 0, 1 - dim * 1.2, {
              x0,
              z0,
              x1,
              z1,
              y0,
              wall,
              gk,
            });
          }
          const [ax, ay] = P(x0, y1, z0);
          const [bx, by] = P(x1, y1, z1);
          rims.push([ax, ay, bx, by]);
        }
        // Roof.
        ground(ctx, y1);
        ctx.fillStyle = css(fade(shade(isHover ? brighten(look.roof, 1.03) : look.roof, look, LIGHT.y)));
        ctx.fillRect(cx - hh, cz - hh, hh * 2, hh * 2);
        if (gctx) {
          ground(gctx, y1, gk);
          gctx.fillStyle = "#000";
          gctx.fillRect(cx - hh, cz - hh, hh * 2, hh * 2);
        }
        // A thin parapet shadow inside the roof edge on taller tiers.
        if (!isBox && hh > 0.2 && F.S > 14) {
          ctx.strokeStyle = css(look.shadowTint, 0.06 + night * 0.08);
          ctx.lineWidth = 0.035;
          ctx.strokeRect(cx - hh + 0.035, cz - hh + 0.035, hh * 2 - 0.07, hh * 2 - 0.07);
        }
        // Rim light along the front roof edges.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        for (const [ax, ay, bx, by] of rims) {
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
        }
        ctx.strokeStyle = css(look.rim, look.rimAlpha * (1 - dim * 1.4));
        ctx.lineWidth = rimWidth;
        ctx.lineCap = "round";
        ctx.stroke();

        for (const [x, z] of corners) {
          for (const y of [y0, y1]) {
            const [sx, sy] = P(x, y, z);
            hullPts.push(sx, sy);
          }
        }
      }

      // The landmark's mast (and where its beacon goes).
      if (lot.mast > 0) {
        const top = lot.height + PAD_RISE + lift;
        const [mx, my] = P(lot.x, top, lot.z);
        const tipY = my - lot.mast * F.up;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx, tipY);
        ctx.strokeStyle = css(shade(look.wall, look, 0.3), 1);
        ctx.lineWidth = Math.max(0.8, F.S * 0.035);
        ctx.stroke();
        // A small platform half way up.
        ctx.beginPath();
        ctx.moveTo(mx - F.S * 0.05, my - lot.mast * F.up * 0.45);
        ctx.lineTo(mx + F.S * 0.05, my - lot.mast * F.up * 0.45);
        ctx.lineWidth = Math.max(0.7, F.S * 0.025);
        ctx.stroke();
        beacon = { x: mx, y: tipY };
        hullPts.push(mx, tipY);
        if (gctx) {
          gctx.setTransform(gk, 0, 0, gk, 0, 0);
          gctx.beginPath();
          gctx.moveTo(mx, my);
          gctx.lineTo(mx, tipY);
          gctx.strokeStyle = "#000";
          gctx.lineWidth = Math.max(0.8, F.S * 0.035);
          gctx.stroke();
        }
      }

      if (isHover) {
        const top = lot.height + PAD_RISE + lift + (lot.roofBox ? lot.roofBox.h : 0) + lot.mast;
        const [sx, sy] = P(lot.x, top, lot.z);
        anchor = { x: sx, y: sy - F.S * 0.12 };
      }
      this.hits.push({ lot, poly: hull(hullPts) });
    }
    this.hits.reverse();

    /* ---------------- night glow ---------------- */

    if (gctx && glowOn) {
      const wide = blurInto(this.glow, this.glowWide, F.S * 0.15 * dpr * glowScale);
      const tight = blurInto(this.glow, this.glowTight, F.S * 0.035 * dpr * glowScale);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.globalAlpha = clamp(night) * (supportsFilter ? 0.9 : 0.5);
      ctx.drawImage(wide, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalAlpha = clamp(night) * 0.4;
      ctx.drawImage(tight, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return { anchor, beacon };
  }

  /** The windows on one wall of a tier. */
  private windows(
    ctx: CanvasRenderingContext2D,
    gctx: CanvasRenderingContext2D | null,
    lot: Lot,
    tier: Tier,
    side: number,
    face: RGB,
    diffuse: number,
    look: Look,
    night: number,
    boost: number,
    height: number,
    base: boolean,
    brightness: number,
    w: {
      x0: number;
      z0: number;
      x1: number;
      z1: number;
      y0: number;
      wall: (
        target: CanvasRenderingContext2D,
        x0: number,
        z0: number,
        x1: number,
        z1: number,
        y0: number,
        k?: number,
      ) => void;
      gk: number;
    },
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
    const glass = shade(look.glass, look, diffuse * 0.6 + 0.25);
    const off: RGB = [
      face[0] * look.glassMix + glass[0] * (1 - look.glassMix),
      face[1] * look.glassMix + glass[1] * (1 - look.glassMix),
      face[2] * look.glassMix + glass[2] * (1 - look.glassMix),
    ];
    // How many of this building's windows are ever lit: more on taller ones.
    const share = 0.32 + 0.4 * Math.min(1, lot.height / 2.4);

    w.wall(ctx, w.x0, w.z0, w.x1, w.z1, w.y0);
    ctx.beginPath();
    const lit: Array<[number, number, number, number]> = [];
    for (let f = 0; f < floors; f++) {
      const y = bottom + f * floor;
      for (let c = 0; c < cols; c++) {
        const x = gap + c * (winW + gap);
        const id = (lot.col * 7 + lot.row) * 977 + side * 131 + f * 17 + c;
        const pick = hash2(id, tier.y0 * 100, 3);
        const threshold = 0.18 + 0.72 * hash2(id, 5, 11);
        let amount = 0;
        if (night > 0 && (pick < share || boost > 0)) {
          amount = boost > 0 ? Math.max(night, 0.0001) : smoothstep(threshold, threshold + 0.07, night);
        }
        amount *= brightness;
        if (amount > 0.01) lit.push([x, y, amount, Math.floor(hash2(id, 9, 13) * WINDOW_LIGHTS.length)]);
        else ctx.rect(x, y, winW, winH);
      }
    }
    ctx.fillStyle = css(off);
    ctx.fill();
    for (const [x, y, amount, tone] of lit) {
      const light = WINDOW_LIGHTS[tone];
      const color: RGB = [
        off[0] + (light[0] - off[0]) * amount,
        off[1] + (light[1] - off[1]) * amount,
        off[2] + (light[2] - off[2]) * amount,
      ];
      ctx.fillStyle = css(color);
      ctx.fillRect(x, y, winW, winH);
    }
    if (gctx && lit.length) {
      w.wall(gctx, w.x0, w.z0, w.x1, w.z1, w.y0, w.gk);
      for (const [x, y, amount, tone] of lit) {
        const light = WINDOW_LIGHTS[tone];
        gctx.fillStyle = css(light, amount);
        gctx.fillRect(x - winW * 0.2, y - winH * 0.25, winW * 1.4, winH * 1.5);
      }
    }
  }
}

function mixRGB(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function brighten(color: RGB, k: number): RGB {
  return [color[0] * k, color[1] * k, color[2] * k];
}
