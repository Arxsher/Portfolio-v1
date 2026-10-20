// The camera, the fit of the pad into its box, and screen-space shapes for
// picking (which cap or the knob is under the pointer), for placing the
// focusable overlays over the caps and for drawing the focus ring round a
// cap as it sits in perspective.
//
// The camera is a long lens (21°) a little above and in front, so the pad
// keeps its proportions and the side of the case just shows. The fit is
// worked out once per size from the camera at rest and applied after the
// projection, so the small parallax tilt never changes the pad's size.
//
// Per-frame paths (update, toScreenInto, capBox, knobBox) allocate nothing;
// the polygon helpers do, and only run on pointer events or focus changes.

import { convexHull, lookAt, mat4, multiply, orbit, perspective, project, type Mat4, type Vec3 } from "./math";
import { boundPoints, CAP, CASE_CZ, KEYS, KNOB, KNOB_BASE_Y, PLATE_Y, SKIRT_REST, TRAVEL } from "./scene";

export const CAMERA = {
  target: [0, 0.38, CASE_CZ + 0.06] as Vec3,
  distance: 16,
  fov: (21 * Math.PI) / 180,
  /** Rest angles (radians): yaw about Y (+ = from the right), pitch above the table. */
  yaw: 0.2,
  pitch: 0.98,
};

export type Rect = { x0: number; y0: number; x1: number; y1: number };

export type Polygon = Array<[number, number]>;

/** A screen-space box (CSS px). */
export type Box = { x: number; y: number; w: number; h: number };

export const box = (): Box => ({ x: 0, y: 0, w: 0, h: 0 });

const CORNERS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

/** 16 points round the knob (unit circle), shared by the hull and the box. */
const RING = Array.from({ length: 16 }, (_, i) => [Math.cos((i / 16) * Math.PI * 2), Math.sin((i / 16) * Math.PI * 2)] as const);

export class View {
  width = 1;
  height = 1;
  readonly proj = mat4();
  readonly view = mat4();
  readonly viewProj = mat4();
  /** Updated in place every frame (the renderer keeps this reference). */
  readonly camPos: Vec3 = [0, 0, 0];
  /** Updated in place on resize. */
  readonly fit: [number, number, number, number] = [1, 1, 0, 0];
  /** Bumps on every resize, so callers can tell the fit changed. */
  version = 0;
  private bounds = boundPoints();
  private rest = mat4();
  private point: [number, number] = [0, 0];

  private matrices(yaw: number, pitch: number, out: Mat4, eye: Vec3) {
    orbit(CAMERA.target, CAMERA.distance, yaw, pitch, eye);
    perspective(this.proj, CAMERA.fov, this.width / this.height, 1, 60);
    lookAt(this.view, eye, CAMERA.target);
    multiply(out, this.proj, this.view);
  }

  /** Size the view and fit the pad (at the rest camera) into `rect` (CSS px). */
  resize(width: number, height: number, rect: Rect, maxHeight = Infinity) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const m = this.rest;
    const eye: Vec3 = [0, 0, 0];
    this.matrices(CAMERA.yaw, CAMERA.pitch, m, eye);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const p of this.bounds) {
      const c = project(m, p[0], p[1], p[2]);
      const px = ((c[0] / c[3]) * 0.5 + 0.5) * this.width;
      const py = (0.5 - (c[1] / c[3]) * 0.5) * this.height;
      x0 = Math.min(x0, px);
      x1 = Math.max(x1, px);
      y0 = Math.min(y0, py);
      y1 = Math.max(y1, py);
    }
    const rw = Math.max(1, rect.x1 - rect.x0);
    const rh = Math.max(1, Math.min(rect.y1 - rect.y0, maxHeight));
    const s = Math.min(rw / Math.max(1, x1 - x0), rh / Math.max(1, y1 - y0));
    const W = this.width;
    const H = this.height;
    const rcx = (rect.x0 + rect.x1) / 2;
    const rcy = (rect.y0 + rect.y1) / 2;
    const bcx = (x0 + x1) / 2;
    const bcy = (y0 + y1) / 2;
    const tx = rcx - W / 2 - (bcx - W / 2) * s;
    const ty = rcy - H / 2 - (bcy - H / 2) * s;
    this.fit[0] = s;
    this.fit[1] = s;
    this.fit[2] = tx / (W / 2);
    this.fit[3] = -ty / (H / 2);
    this.version += 1;
  }

  /** The camera for this frame (rest angles plus a parallax offset). */
  update(yawOffset: number, pitchOffset: number) {
    this.matrices(CAMERA.yaw + yawOffset, CAMERA.pitch + pitchOffset, this.viewProj, this.camPos);
  }

  /** World point → CSS px in the canvas, written into `out`. */
  toScreenInto(x: number, y: number, z: number, out: [number, number]): [number, number] {
    const m = this.viewProj;
    const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
    const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
    const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    const nx = (cx / cw) * this.fit[0] + this.fit[2];
    const ny = (cy / cw) * this.fit[1] + this.fit[3];
    out[0] = (nx * 0.5 + 0.5) * this.width;
    out[1] = (0.5 - ny * 0.5) * this.height;
    return out;
  }

  /** World point → CSS px in the canvas. */
  toScreen(x: number, y: number, z: number): [number, number] {
    return this.toScreenInto(x, y, z, [0, 0]);
  }

  /** The eight corners that bound a cap (skirt and top), in order skirt, top per corner. */
  private capPoint(index: number, travel: number, i: number, out: [number, number]) {
    const k = KEYS[index];
    const skirt = PLATE_Y + SKIRT_REST - travel * TRAVEL;
    const [sx, sz] = CORNERS[i >> 1];
    if ((i & 1) === 0) return this.toScreenInto(k.x + sx * CAP.base, skirt + 0.02, k.z + sz * CAP.base, out);
    return this.toScreenInto(k.x + sx * CAP.topX, skirt + CAP.height, k.z + CAP.topShift + sz * CAP.topZ, out);
  }

  /**
   * A cap's silhouette on screen, close enough to draw a ring round it: the
   * hull of its skirt and its top, each a rounded rectangle sampled round
   * the corners (so the ring keeps the cap's own corner radii).
   */
  capOutline(index: number, travel: number): Polygon {
    const k = KEYS[index];
    const skirt = PLATE_Y + SKIRT_REST - travel * TRAVEL;
    const pts: Polygon = [];
    const ring = (hw: number, hd: number, r: number, cz: number, y: number) => {
      for (const [sx, sz] of CORNERS) {
        const a0 = Math.atan2(sz, sx) - Math.PI / 4;
        for (let i = 0; i <= 6; i++) {
          const a = a0 + (i / 6) * (Math.PI / 2);
          pts.push(this.toScreen(k.x + sx * (hw - r) + r * Math.cos(a), y, k.z + cz + sz * (hd - r) + r * Math.sin(a)));
        }
      }
    };
    ring(CAP.base, CAP.base, CAP.baseRadius, 0, skirt + 0.02);
    ring(CAP.topX, CAP.topZ, CAP.topRadius, CAP.topShift, skirt + CAP.height);
    return convexHull(pts);
  }

  /** The knob's silhouette on screen (its base and top circles). */
  knobOutline(): Polygon {
    const pts: Polygon = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const x = KNOB.x + KNOB.radius * Math.cos(a);
      const z = KNOB.z + KNOB.radius * Math.sin(a);
      pts.push(this.toScreen(x, KNOB_BASE_Y, z));
      pts.push(this.toScreen(x, KNOB_BASE_Y + KNOB.height, z));
    }
    return convexHull(pts);
  }

  /** A cap's outline on screen (convex hull of its skirt and top corners). */
  capHull(index: number, travel: number): Polygon {
    const pts: Polygon = [];
    for (let i = 0; i < 8; i++) pts.push(this.capPoint(index, travel, i, [0, 0]));
    return convexHull(pts);
  }

  /** The bounding box of a cap on screen, written into `out` (no allocation). */
  capBox(index: number, travel: number, out: Box): Box {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const p = this.point;
    for (let i = 0; i < 8; i++) {
      this.capPoint(index, travel, i, p);
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    out.x = x0;
    out.y = y0;
    out.w = x1 - x0;
    out.h = y1 - y0;
    return out;
  }

  /** Just the cap's top face on screen. */
  capTop(index: number, travel: number): Polygon {
    const k = KEYS[index];
    const top = PLATE_Y + SKIRT_REST - travel * TRAVEL + CAP.height;
    return [
      this.toScreen(k.x - CAP.topX, top, k.z + CAP.topShift - CAP.topZ),
      this.toScreen(k.x + CAP.topX, top, k.z + CAP.topShift - CAP.topZ),
      this.toScreen(k.x + CAP.topX, top, k.z + CAP.topShift + CAP.topZ),
      this.toScreen(k.x - CAP.topX, top, k.z + CAP.topShift + CAP.topZ),
    ];
  }

  knobHull(): Polygon {
    const pts: Polygon = [];
    for (const [c, s] of RING) {
      const x = KNOB.x + KNOB.radius * c;
      const z = KNOB.z + KNOB.radius * s;
      pts.push(this.toScreen(x, KNOB_BASE_Y, z));
      pts.push(this.toScreen(x, KNOB_BASE_Y + KNOB.height, z));
    }
    return convexHull(pts);
  }

  /** The knob's bounding box on screen, written into `out` (no allocation). */
  knobBox(out: Box): Box {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const p = this.point;
    for (let i = 0; i < RING.length; i++) {
      const x = KNOB.x + KNOB.radius * RING[i][0];
      const z = KNOB.z + KNOB.radius * RING[i][1];
      for (let j = 0; j < 2; j++) {
        this.toScreenInto(x, KNOB_BASE_Y + j * KNOB.height, z, p);
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[1] > y1) y1 = p[1];
      }
    }
    out.x = x0;
    out.y = y0;
    out.w = x1 - x0;
    out.h = y1 - y0;
    return out;
  }

  knobCentre(): [number, number] {
    return this.toScreen(KNOB.x, KNOB_BASE_Y + KNOB.height, KNOB.z);
  }
}

export function bbox(poly: Polygon): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * An SVG path for a ring round a convex polygon: the outline pushed out by
 * `offset` px, with round corners (the polygon grown by a disc). Points are
 * relative to (ox, oy). Nearly collinear corners are merged first so the
 * ring stays smooth.
 */
export function ringPath(poly: Polygon, offset: number, ox = 0, oy = 0): string {
  // drop corners that barely turn or sit on top of their neighbour
  const pts: Polygon = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[(i - 1 + poly.length) % poly.length];
    const b = poly[i];
    const c = poly[(i + 1) % poly.length];
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const vx = c[0] - b[0];
    const vy = c[1] - b[1];
    const lu = Math.hypot(ux, uy);
    const lv = Math.hypot(vx, vy);
    if (lu < 0.75) continue;
    if (lu > 0 && lv > 0 && Math.abs(ux * vy - uy * vx) / (lu * lv) < 0.02) continue;
    pts.push(b);
  }
  if (pts.length < 3) return "";
  // winding: offset to the outside whichever way the hull runs
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area += x0 * y1 - x1 * y0;
  }
  // y runs down the screen: a positive area is a clockwise outline
  const sign = area > 0 ? 1 : -1;
  const n = pts.length;
  const out: string[] = [];
  const f = (v: number) => v.toFixed(1);
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % n];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    // outward normal of edge a → b
    const nx = (sign * (by - ay)) / len;
    const ny = (sign * -(bx - ax)) / len;
    const sx = ax + nx * offset - ox;
    const sy = ay + ny * offset - oy;
    const ex = bx + nx * offset - ox;
    const ey = by + ny * offset - oy;
    if (i === 0) out.push(`M${f(sx)} ${f(sy)}`);
    out.push(`L${f(ex)} ${f(ey)}`);
    // round the corner at b, to the start of the next edge
    const [cx, cy] = pts[(i + 2) % n];
    const len2 = Math.hypot(cx - bx, cy - by) || 1;
    const mx = (sign * (cy - by)) / len2;
    const my = (sign * -(cx - bx)) / len2;
    out.push(`A${f(offset)} ${f(offset)} 0 0 ${sign > 0 ? 1 : 0} ${f(bx + mx * offset - ox)} ${f(by + my * offset - oy)}`);
  }
  out.push("Z");
  return out.join("");
}
