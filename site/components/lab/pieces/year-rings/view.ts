// The camera: a product shot of the slice lying on the stage's own surface,
// seen from the front and above (about 56°), in a gentle perspective. The
// framing is fitted once per size at rest: the lens is zoomed (tan of the
// half angle) and shifted (an off-centre projection, like a shift lens) so
// the slice and its dial sit in the space the controls leave free. A small
// parallax (the camera leaning a few degrees after the pointer) moves the
// eye without refitting, so nothing ever pumps.
//
// Also: the zoomed projection the loupe renders through, projecting points
// to CSS px for the DOM overlays, and casting the pointer onto a plane.
// Nothing here allocates per frame.

import { THICKNESS } from "./rings";

export type Mat4 = Float32Array;

export type Framing = {
  tanHalf: number;
  shiftX: number;
  shiftY: number;
};

export type Camera = {
  /** CSS px of the canvas. */
  width: number;
  height: number;
  eye: Float32Array;
  view: Mat4;
  proj: Mat4;
  vp: Mat4;
  inv: Mat4;
  framing: Framing;
  /** CSS px per world unit at the slice's centre (for sizes in the overlay). */
  pxPerUnit: number;
};

/** Camera distance from the target, in slice radii. */
const DISTANCE = 6.2;
/** Resting elevation and azimuth of the camera (radians). */
export const CAM_EL = (56 * Math.PI) / 180;
const TARGET_Y = THICKNESS * 0.4;
const NEAR = 1.5;
const FAR = 14;

export function newCamera(): Camera {
  return {
    width: 1,
    height: 1,
    eye: new Float32Array(3),
    view: new Float32Array(16),
    proj: new Float32Array(16),
    vp: new Float32Array(16),
    inv: new Float32Array(16),
    framing: { tanHalf: 0.3, shiftX: 0, shiftY: 0 },
    pxPerUnit: 100,
  };
}

/* ---------------------------------------------------------------------- */
/* matrices (column-major, like GL)                                        */
/* ---------------------------------------------------------------------- */

export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  for (let i = 0; i < 4; i++) {
    const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
    out[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  }
  return out;
}

export function invert(out: Mat4, m: Mat4): Mat4 {
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return out;
  det = 1 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

function lookAt(out: Mat4, ex: number, ey: number, ez: number, tx: number, ty: number, tz: number) {
  let zx = ex - tx, zy = ey - ty, zz = ez - tz;
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  // x = up × z (up = +y)
  let xx = zz, xy = 0, xz = -zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
}

/** Perspective with a lens shift: NDC = projected / tanHalf + shift. */
function perspective(out: Mat4, tanHalf: number, aspect: number, sx: number, sy: number) {
  const f = 1 / tanHalf;
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[8] = -sx;
  out[9] = -sy;
  out[10] = (FAR + NEAR) / (NEAR - FAR);
  out[11] = -1;
  out[14] = (2 * FAR * NEAR) / (NEAR - FAR);
}

function placeEye(cam: Camera, az: number, el: number) {
  const ce = Math.cos(el);
  cam.eye[0] = Math.sin(az) * ce * DISTANCE;
  cam.eye[1] = TARGET_Y + Math.sin(el) * DISTANCE;
  cam.eye[2] = Math.cos(az) * ce * DISTANCE;
  lookAt(cam.view, cam.eye[0], cam.eye[1], cam.eye[2], 0, TARGET_Y, 0);
}

/* ---------------------------------------------------------------------- */
/* framing                                                                 */
/* ---------------------------------------------------------------------- */

export type Insets = { top: number; bottom: number; side: number };

const fitPoint = new Float32Array(4);

/**
 * Fit the slice (radius `fitRadius` on the floor, 1 on its top face) into
 * the canvas minus `insets` (CSS px), at the resting camera.
 */
export function frame(cam: Camera, width: number, height: number, insets: Insets, fitRadius: number) {
  cam.width = Math.max(1, width);
  cam.height = Math.max(1, height);
  placeEye(cam, 0, CAM_EL);
  const aspect = cam.width / cam.height;
  // projected extents with tanHalf = 1 and no shift (u = x/-z, v = y/-z in eye space)
  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
  const v = cam.view;
  const steps = 72;
  for (let ring = 0; ring < 2; ring++) {
    const radius = ring === 0 ? fitRadius : 1;
    const y = ring === 0 ? 0 : THICKNESS;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = Math.sin(a) * radius;
      const z = -Math.cos(a) * radius;
      fitPoint[0] = v[0] * x + v[4] * y + v[8] * z + v[12];
      fitPoint[1] = v[1] * x + v[5] * y + v[9] * z + v[13];
      fitPoint[2] = v[2] * x + v[6] * y + v[10] * z + v[14];
      const w = -fitPoint[2];
      const u = fitPoint[0] / w;
      const vv = fitPoint[1] / w;
      if (u < uMin) uMin = u;
      if (u > uMax) uMax = u;
      if (vv < vMin) vMin = vv;
      if (vv > vMax) vMax = vv;
    }
  }
  // the free area in NDC
  const x0 = -1 + (2 * insets.side) / cam.width;
  const x1 = 1 - (2 * insets.side) / cam.width;
  const y0 = -1 + (2 * insets.bottom) / cam.height;
  const y1 = 1 - (2 * insets.top) / cam.height;
  const availW = Math.max(0.2, x1 - x0);
  const availH = Math.max(0.2, y1 - y0);
  const tanHalf = Math.max((uMax - uMin) / (availW * aspect), (vMax - vMin) / availH);
  const f = cam.framing;
  f.tanHalf = tanHalf;
  f.shiftX = (x0 + x1) / 2 - (uMin + uMax) / 2 / (tanHalf * aspect);
  f.shiftY = (y0 + y1) / 2 - (vMin + vMax) / 2 / tanHalf;
  // px per unit at the centre: one unit across, seen at the target's depth
  cam.pxPerUnit = (cam.height / 2) / (tanHalf * DISTANCE);
  aim(cam, 0, CAM_EL);
}

/** Point the camera (parallax: azimuth and elevation in radians) with the fitted lens. */
export function aim(cam: Camera, az: number, el: number) {
  placeEye(cam, az, el);
  const f = cam.framing;
  perspective(cam.proj, f.tanHalf, cam.width / cam.height, f.shiftX, f.shiftY);
  multiply(cam.vp, cam.proj, cam.view);
  invert(cam.inv, cam.vp);
}

/**
 * The loupe's view: the same camera, zoomed `mag` times about the CSS px
 * point (cx, cy), framing a square `side` CSS px wide.
 */
export function loupeMatrices(cam: Camera, cx: number, cy: number, side: number, mag: number, vpOut: Mat4, invOut: Mat4) {
  const ndcX = (cx / cam.width) * 2 - 1;
  const ndcY = 1 - (cy / cam.height) * 2;
  const sx = (mag * cam.width) / side;
  const sy = (mag * cam.height) / side;
  const m = cam.vp;
  // clip' = S·T·clip: x' = sx (x − ndcX w), y' = sy (y − ndcY w)
  for (let col = 0; col < 4; col++) {
    const x = m[col * 4];
    const y = m[col * 4 + 1];
    const z = m[col * 4 + 2];
    const w = m[col * 4 + 3];
    vpOut[col * 4] = sx * (x - ndcX * w);
    vpOut[col * 4 + 1] = sy * (y - ndcY * w);
    vpOut[col * 4 + 2] = z;
    vpOut[col * 4 + 3] = w;
  }
  invert(invOut, vpOut);
}

/* ---------------------------------------------------------------------- */
/* projecting and picking                                                  */
/* ---------------------------------------------------------------------- */

export type ScreenPoint = { x: number; y: number; depth: number };

/** World → CSS px. */
export function project(cam: Camera, x: number, y: number, z: number, out: ScreenPoint): ScreenPoint {
  const m = cam.vp;
  const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
  const cz = m[2] * x + m[6] * y + m[10] * z + m[14];
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  const w = cw || 1e-6;
  out.x = ((cx / w) * 0.5 + 0.5) * cam.width;
  out.y = (0.5 - (cy / w) * 0.5) * cam.height;
  out.depth = cz / w;
  return out;
}

export type PlanePoint = { x: number; z: number; ok: boolean };

/** Cast CSS px (px, py) onto the horizontal plane at height `y`. */
export function castToPlane(cam: Camera, px: number, py: number, y: number, out: PlanePoint): PlanePoint {
  const nx = (px / cam.width) * 2 - 1;
  const ny = 1 - (py / cam.height) * 2;
  const m = cam.inv;
  // near and far points
  let w = m[3] * nx + m[7] * ny + m[11] * -1 + m[15];
  const ax = (m[0] * nx + m[4] * ny + m[8] * -1 + m[12]) / w;
  const ay = (m[1] * nx + m[5] * ny + m[9] * -1 + m[13]) / w;
  const az = (m[2] * nx + m[6] * ny + m[10] * -1 + m[14]) / w;
  w = m[3] * nx + m[7] * ny + m[11] + m[15];
  const bx = (m[0] * nx + m[4] * ny + m[8] + m[12]) / w;
  const by = (m[1] * nx + m[5] * ny + m[9] + m[13]) / w;
  const bz = (m[2] * nx + m[6] * ny + m[10] + m[14]) / w;
  const dy = by - ay;
  if (Math.abs(dy) < 1e-9) {
    out.ok = false;
    return out;
  }
  const t = (y - ay) / dy;
  out.x = ax + (bx - ax) * t;
  out.z = az + (bz - az) * t;
  out.ok = t > 0;
  return out;
}

/** The direction toward the light: azimuth clockwise from the far side seen from above, elevation up. */
export function lightDirection(az: number, el: number, out: Float32Array) {
  const ce = Math.cos(el);
  out[0] = Math.sin(az) * ce;
  out[1] = Math.sin(el);
  out[2] = -Math.cos(az) * ce;
  return out;
}
