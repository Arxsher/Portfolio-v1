// Small column-major 4×4 matrix and vector helpers for the macropad
// (the same layout WebGL expects, so matrices go straight to uniformMatrix4fv).

export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;

export const mat4 = () => {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
};

export function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

const UP: Vec3 = [0, 1, 0];

export function lookAt(out: Mat4, eye: Vec3, target: Vec3, up: Vec3 = UP): Mat4 {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len;
  zy /= len;
  zz /= len;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len;
  xy /= len;
  xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
  return out;
}

/** Scratch for multiply (out may alias a or b), so a frame allocates nothing. */
const PRODUCT = new Float32Array(16);

export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const r = PRODUCT;
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      r[col * 4 + row] = sum;
    }
  }
  out.set(r);
  return out;
}

/** Clip-space position of a world point. */
export function project(m: Mat4, x: number, y: number, z: number): [number, number, number, number] {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
    m[3] * x + m[7] * y + m[11] * z + m[15],
  ];
}

/** Camera position on a sphere around `target`: yaw about Y, pitch above the horizon (radians). */
export function orbit(target: Vec3, distance: number, yaw: number, pitch: number, out: Vec3 = [0, 0, 0]): Vec3 {
  const cp = Math.cos(pitch);
  out[0] = target[0] + distance * cp * Math.sin(yaw);
  out[1] = target[1] + distance * Math.sin(pitch);
  out[2] = target[2] + distance * cp * Math.cos(yaw);
  return out;
}

/** Whether point (px, py) is inside the convex polygon (any winding). */
export function insideConvex(points: ReadonlyArray<readonly [number, number]>, px: number, py: number): boolean {
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    if (Math.abs(cross) < 1e-9) continue;
    const s = cross > 0 ? 1 : -1;
    if (!sign) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/** Convex hull (monotone chain) of 2D points. */
export function convexHull(points: Array<[number, number]>): Array<[number, number]> {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Array<[number, number]> = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/* ---------------------------------------------------------------------- */
/* colour                                                                  */
/* ---------------------------------------------------------------------- */

/** "#rrggbb" → linear RGB. */
export function linearHex(hex: string): Vec3 {
  const h = hex.replace("#", "");
  const c = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return [c(0), c(2), c(4)];
}

/**
 * OKLCH → linear sRGB (hue in degrees). Used for the glow, so every hue on
 * the knob has the same perceived brightness. Out-of-gamut channels are
 * clamped at 0.
 */
export function oklchLinear(l: number, c: number, hueDeg: number): Vec3 {
  const h = (hueDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;
  return [
    Math.max(0, 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    Math.max(0, -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    Math.max(0, -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  ];
}

const toSrgb = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
};

/** Linear RGB → "rgb(r g b)". */
export function cssColor(rgb: Vec3): string {
  return `rgb(${toSrgb(rgb[0])} ${toSrgb(rgb[1])} ${toSrgb(rgb[2])})`;
}
