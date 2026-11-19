// Small, allocation-light math for the paper planes: rigid transforms,
// quaternions, a damped spring with an exact (dt-independent) step, and a
// seeded random generator so every plane keeps its own look forever.

/* ---------------------------------------------------------------------- */
/* vectors                                                                 */
/* ---------------------------------------------------------------------- */

export type Vec3 = [number, number, number];

export const clamp = (n: number, min: number, max: number) => (n < min ? min : n > max ? max : n);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ---------------------------------------------------------------------- */
/* rigid transforms                                                        */
/* ---------------------------------------------------------------------- */

/**
 * A rotation plus a translation, as 12 numbers: the 3×3 rotation row by
 * row, then tx, ty, tz. p' = R·p + t.
 */
export type Rigid = Float64Array;

export function rigid(): Rigid {
  const m = new Float64Array(12);
  m[0] = m[4] = m[8] = 1;
  return m;
}

export function setIdentity(m: Rigid): Rigid {
  m.fill(0);
  m[0] = m[4] = m[8] = 1;
  return m;
}

export function copyRigid(out: Rigid, m: Rigid): Rigid {
  out.set(m);
  return out;
}

/** out = a ∘ b (apply b first). `out` may alias a or b. */
export function compose(out: Rigid, a: Rigid, b: Rigid): Rigid {
  const a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
  const b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8];
  const bx = b[9], by = b[10], bz = b[11];
  out[0] = a0 * b0 + a1 * b3 + a2 * b6;
  out[1] = a0 * b1 + a1 * b4 + a2 * b7;
  out[2] = a0 * b2 + a1 * b5 + a2 * b8;
  out[3] = a3 * b0 + a4 * b3 + a5 * b6;
  out[4] = a3 * b1 + a4 * b4 + a5 * b7;
  out[5] = a3 * b2 + a4 * b5 + a5 * b8;
  out[6] = a6 * b0 + a7 * b3 + a8 * b6;
  out[7] = a6 * b1 + a7 * b4 + a8 * b7;
  out[8] = a6 * b2 + a7 * b5 + a8 * b8;
  const tx = a0 * bx + a1 * by + a2 * bz + a[9];
  const ty = a3 * bx + a4 * by + a5 * bz + a[10];
  const tz = a6 * bx + a7 * by + a8 * bz + a[11];
  out[9] = tx;
  out[10] = ty;
  out[11] = tz;
  return out;
}

/** Transform the point (x, y, z) by m into out[o..o+2]. */
export function applyPoint(m: Rigid, x: number, y: number, z: number, out: Float64Array | number[], o = 0) {
  out[o] = m[0] * x + m[1] * y + m[2] * z + m[9];
  out[o + 1] = m[3] * x + m[4] * y + m[5] * z + m[10];
  out[o + 2] = m[6] * x + m[7] * y + m[8] * z + m[11];
}

/**
 * The rotation by `angle` (right-hand rule) about the axis through
 * (ax, ay, az) along the unit vector (ux, uy, uz).
 */
export function axisRotation(out: Rigid, ax: number, ay: number, az: number, ux: number, uy: number, uz: number, angle: number): Rigid {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k = 1 - c;
  out[0] = c + ux * ux * k;
  out[1] = ux * uy * k - uz * s;
  out[2] = ux * uz * k + uy * s;
  out[3] = uy * ux * k + uz * s;
  out[4] = c + uy * uy * k;
  out[5] = uy * uz * k - ux * s;
  out[6] = uz * ux * k - uy * s;
  out[7] = uz * uy * k + ux * s;
  out[8] = c + uz * uz * k;
  // t = A − R·A keeps the axis in place
  out[9] = ax - (out[0] * ax + out[1] * ay + out[2] * az);
  out[10] = ay - (out[3] * ax + out[4] * ay + out[5] * az);
  out[11] = az - (out[6] * ax + out[7] * ay + out[8] * az);
  return out;
}

/* ---------------------------------------------------------------------- */
/* quaternions (x, y, z, w)                                                */
/* ---------------------------------------------------------------------- */

export type Quat = [number, number, number, number];

export function quatAxis(x: number, y: number, z: number, angle: number): Quat {
  const len = Math.hypot(x, y, z) || 1;
  const s = Math.sin(angle / 2) / len;
  return [x * s, y * s, z * s, Math.cos(angle / 2)];
}

/** a·b: rotate by b, then by a. */
export function quatMul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

/** Euler-ish helper: rotations about X, then Y, then Z (applied in that order). */
export function quatXYZ(rx: number, ry: number, rz: number): Quat {
  return quatMul(quatAxis(0, 0, 1, rz), quatMul(quatAxis(0, 1, 0, ry), quatAxis(1, 0, 0, rx)));
}

export function quatSlerp(a: Quat, b: Quat, t: number, out: Quat = [0, 0, 0, 1]): Quat {
  let [bx, by, bz, bw] = b;
  let dot = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (dot < 0) {
    dot = -dot;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  let wa: number;
  let wb: number;
  if (dot > 0.9995) {
    wa = 1 - t;
    wb = t;
  } else {
    const theta = Math.acos(clamp(dot, -1, 1));
    const sin = Math.sin(theta);
    wa = Math.sin((1 - t) * theta) / sin;
    wb = Math.sin(t * theta) / sin;
  }
  out[0] = a[0] * wa + bx * wb;
  out[1] = a[1] * wa + by * wb;
  out[2] = a[2] * wa + bz * wb;
  out[3] = a[3] * wa + bw * wb;
  const len = Math.hypot(out[0], out[1], out[2], out[3]) || 1;
  out[0] /= len;
  out[1] /= len;
  out[2] /= len;
  out[3] /= len;
  return out;
}

/** The rotation part of a rigid transform from a quaternion (translation zero). */
export function quatToRigid(q: Quat, out: Rigid = rigid()): Rigid {
  const [x, y, z, w] = q;
  const xx = x * x, yy = y * y, zz = z * z;
  const xy = x * y, xz = x * z, yz = y * z;
  const wx = w * x, wy = w * y, wz = w * z;
  out[0] = 1 - 2 * (yy + zz);
  out[1] = 2 * (xy - wz);
  out[2] = 2 * (xz + wy);
  out[3] = 2 * (xy + wz);
  out[4] = 1 - 2 * (xx + zz);
  out[5] = 2 * (yz - wx);
  out[6] = 2 * (xz - wy);
  out[7] = 2 * (yz + wx);
  out[8] = 1 - 2 * (xx + yy);
  out[9] = out[10] = out[11] = 0;
  return out;
}

/* ---------------------------------------------------------------------- */
/* springs                                                                 */
/* ---------------------------------------------------------------------- */

/**
 * A damped spring stepped with the exact solution of x'' = −ω²(x−target)
 * − 2ζω x', so it behaves the same at 30, 60 or 120 fps and never blows up
 * on a long frame. `response` is the period in seconds (lower = snappier),
 * `damping` the damping ratio (1 = no overshoot, 0.6 = a soft bounce).
 * Retargeting keeps the current velocity, so every motion is interruptible.
 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  response: number;
  damping: number;

  constructor(value = 0, response = 0.5, damping = 0.85) {
    this.value = value;
    this.target = value;
    this.response = response;
    this.damping = damping;
  }

  to(target: number, response?: number, damping?: number) {
    this.target = target;
    if (response !== undefined) this.response = response;
    if (damping !== undefined) this.damping = damping;
    return this;
  }

  /** Jump straight to a value and stop. */
  snap(value: number) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    return this;
  }

  get resting() {
    return Math.abs(this.value - this.target) < 1e-4 && Math.abs(this.velocity) < 1e-3;
  }

  step(dt: number) {
    if (dt <= 0) return this.value;
    const x0 = this.value - this.target;
    const v0 = this.velocity;
    if (Math.abs(x0) < 1e-5 && Math.abs(v0) < 1e-4) {
      this.value = this.target;
      this.velocity = 0;
      return this.value;
    }
    const w = (2 * Math.PI) / Math.max(0.02, this.response);
    const z = clamp(this.damping, 0.05, 1);
    let x: number;
    let v: number;
    if (z > 0.999) {
      const e = Math.exp(-w * dt);
      const c = v0 + w * x0;
      x = (x0 + c * dt) * e;
      v = (c - w * (x0 + c * dt)) * e;
    } else {
      const wd = w * Math.sqrt(1 - z * z);
      const e = Math.exp(-z * w * dt);
      const cos = Math.cos(wd * dt);
      const sin = Math.sin(wd * dt);
      const b = (v0 + z * w * x0) / wd;
      x = e * (x0 * cos + b * sin);
      v = e * ((b * wd - z * w * x0) * cos - (x0 * wd + z * w * b) * sin);
    }
    this.value = this.target + x;
    this.velocity = v;
    return this.value;
  }
}

/* ---------------------------------------------------------------------- */
/* seeded randomness                                                       */
/* ---------------------------------------------------------------------- */

/** FNV-1a over a string. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a tiny seeded generator returning [0, 1). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
