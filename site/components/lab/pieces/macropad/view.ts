// The camera, the fit of the pad into its box, and screen-space shapes for
// picking (which cap or the knob is under the pointer) and for placing the
// focusable overlays over the caps.
//
// The camera is a long lens (21°) a little above and in front, so the pad
// keeps its proportions and the side of the case just shows. The fit is
// worked out once per size from the camera at rest and applied after the
// projection, so the small parallax tilt never changes the pad's size.

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

export class View {
  width = 1;
  height = 1;
  readonly proj = mat4();
  readonly view = mat4();
  readonly viewProj = mat4();
  camPos: Vec3 = [0, 0, 0];
  fit: [number, number, number, number] = [1, 1, 0, 0];
  private bounds = boundPoints();

  private matrices(yaw: number, pitch: number, out: Mat4) {
    const eye = orbit(CAMERA.target, CAMERA.distance, yaw, pitch);
    perspective(this.proj, CAMERA.fov, this.width / this.height, 1, 60);
    lookAt(this.view, eye, CAMERA.target);
    multiply(out, this.proj, this.view);
    return eye;
  }

  /** Size the view and fit the pad (at the rest camera) into `rect` (CSS px). */
  resize(width: number, height: number, rect: Rect, maxHeight = Infinity) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const m = mat4();
    this.matrices(CAMERA.yaw, CAMERA.pitch, m);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const p of this.bounds) {
      const c = project(m, p[0], p[1], p[2]);
      const px = (c[0] / c[3] * 0.5 + 0.5) * this.width;
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
    this.fit = [s, s, tx / (W / 2), -ty / (H / 2)];
  }

  /** The camera for this frame (rest angles plus a parallax offset). */
  update(yawOffset: number, pitchOffset: number) {
    this.camPos = this.matrices(CAMERA.yaw + yawOffset, CAMERA.pitch + pitchOffset, this.viewProj);
  }

  /** World point → CSS px in the canvas. */
  toScreen(x: number, y: number, z: number): [number, number] {
    const c = project(this.viewProj, x, y, z);
    const nx = (c[0] / c[3]) * this.fit[0] + this.fit[2];
    const ny = (c[1] / c[3]) * this.fit[1] + this.fit[3];
    return [(nx * 0.5 + 0.5) * this.width, (0.5 - ny * 0.5) * this.height];
  }

  /** A cap's outline on screen (convex hull of its skirt and top corners). */
  capHull(index: number, travel: number): Polygon {
    const k = KEYS[index];
    const skirt = PLATE_Y + SKIRT_REST - travel * TRAVEL;
    const top = skirt + CAP.height;
    const pts: Polygon = [];
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      pts.push(this.toScreen(k.x + sx * CAP.base, skirt + 0.02, k.z + sz * CAP.base));
      pts.push(this.toScreen(k.x + sx * CAP.topX, top, k.z + CAP.topShift + sz * CAP.topZ));
    }
    return convexHull(pts);
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
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = KNOB.x + KNOB.radius * Math.cos(a);
      const z = KNOB.z + KNOB.radius * Math.sin(a);
      pts.push(this.toScreen(x, KNOB_BASE_Y, z));
      pts.push(this.toScreen(x, KNOB_BASE_Y + KNOB.height, z));
    }
    return convexHull(pts);
  }

  knobCentre(): [number, number] {
    return this.toScreen(KNOB.x, KNOB_BASE_Y + KNOB.height, KNOB.z);
  }
}

export function bbox(poly: Polygon): { x: number; y: number; w: number; h: number } {
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
