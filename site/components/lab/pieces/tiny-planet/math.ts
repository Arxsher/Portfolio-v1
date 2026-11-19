// Small allocation-free vector, quaternion and matrix helpers for the tiny
// planet. Quaternions are [x, y, z, w] and rotate as q · v · q⁻¹, so
// mul(a, b) applies b first, then a. Matrices are column-major (GLSL order).

export type V3 = Float64Array | number[];
export type Q = Float64Array | number[];

export const v3 = (x = 0, y = 0, z = 0) => new Float64Array([x, y, z]);
export const quat = () => new Float64Array([0, 0, 0, 1]);

export function set3(out: V3, x: number, y: number, z: number): V3 {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

export function copy3(out: V3, a: V3): V3 {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);

export function cross3(out: V3, a: V3, b: V3): V3 {
  const x = a[1] * b[2] - a[2] * b[1];
  const y = a[2] * b[0] - a[0] * b[2];
  const z = a[0] * b[1] - a[1] * b[0];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

export function norm3(out: V3, a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  out[0] = a[0] / l;
  out[1] = a[1] / l;
  out[2] = a[2] / l;
  return out;
}

export function copyQ(out: Q, a: Q): Q {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

export function mulQ(out: Q, a: Q, b: Q): Q {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3];
  const bx = b[0], by = b[1], bz = b[2], bw = b[3];
  out[0] = aw * bx + ax * bw + ay * bz - az * by;
  out[1] = aw * by - ax * bz + ay * bw + az * bx;
  out[2] = aw * bz + ax * by - ay * bx + az * bw;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

export function normQ(q: Q): Q {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  q[0] /= l;
  q[1] /= l;
  q[2] /= l;
  q[3] /= l;
  return q;
}

export function conjQ(out: Q, a: Q): Q {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}

export function axisAngleQ(out: Q, x: number, y: number, z: number, angle: number): Q {
  const l = Math.hypot(x, y, z) || 1;
  const s = Math.sin(angle / 2) / l;
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = Math.cos(angle / 2);
  return out;
}

/** exp map: the rotation by |v| radians about v. */
export function rotVecQ(out: Q, x: number, y: number, z: number): Q {
  const angle = Math.hypot(x, y, z);
  if (angle < 1e-9) {
    out[0] = x / 2;
    out[1] = y / 2;
    out[2] = z / 2;
    out[3] = 1;
    return normQ(out);
  }
  const s = Math.sin(angle / 2) / angle;
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = Math.cos(angle / 2);
  return out;
}

/** log map: the rotation vector (axis × angle, shortest way round) of q. */
export function qToRotVec(out: V3, q: Q): V3 {
  let x = q[0], y = q[1], z = q[2], w = q[3];
  if (w < 0) {
    x = -x;
    y = -y;
    z = -z;
    w = -w;
  }
  const s = Math.hypot(x, y, z);
  if (s < 1e-9) {
    out[0] = 2 * x;
    out[1] = 2 * y;
    out[2] = 2 * z;
    return out;
  }
  const angle = 2 * Math.atan2(s, w);
  out[0] = (x / s) * angle;
  out[1] = (y / s) * angle;
  out[2] = (z / s) * angle;
  return out;
}

/** Rotate v by q (out may be v). */
export function rotate3(out: V3, q: Q, v: V3): V3 {
  const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  const vx = v[0], vy = v[1], vz = v[2];
  // t = 2 · cross(q.xyz, v)
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  out[0] = vx + qw * tx + (qy * tz - qz * ty);
  out[1] = vy + qw * ty + (qz * tx - qx * tz);
  out[2] = vz + qw * tz + (qx * ty - qy * tx);
  return out;
}

/** Rotate v by the inverse of q. */
export function unrotate3(out: V3, q: Q, v: V3): V3 {
  const qx = -q[0], qy = -q[1], qz = -q[2], qw = q[3];
  const vx = v[0], vy = v[1], vz = v[2];
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  out[0] = vx + qw * tx + (qy * tz - qz * ty);
  out[1] = vy + qw * ty + (qz * tx - qx * tz);
  out[2] = vz + qw * tz + (qx * ty - qy * tx);
  return out;
}

/** The rotation that takes unit vector a onto unit vector b (shortest arc). */
export function arcQ(out: Q, a: V3, b: V3): Q {
  const d = dot3(a, b);
  if (d < -0.999999) {
    // opposite: any perpendicular axis
    let x = 0, y = -a[2], z = a[1];
    if (Math.hypot(x, y, z) < 1e-6) {
      x = a[2];
      y = 0;
      z = -a[0];
    }
    return axisAngleQ(out, x, y, z, Math.PI);
  }
  out[0] = a[1] * b[2] - a[2] * b[1];
  out[1] = a[2] * b[0] - a[0] * b[2];
  out[2] = a[0] * b[1] - a[1] * b[0];
  out[3] = 1 + d;
  return normQ(out);
}

/** Column-major 3×3 rotation matrix of q, optionally scaled. */
export function mat3FromQ(out: Float32Array, q: Q, scale = 1): Float32Array {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  out[0] = (1 - (yy + zz)) * scale;
  out[1] = (xy + wz) * scale;
  out[2] = (xz - wy) * scale;
  out[3] = (xy - wz) * scale;
  out[4] = (1 - (xx + zz)) * scale;
  out[5] = (yz + wx) * scale;
  out[6] = (xz + wy) * scale;
  out[7] = (yz - wx) * scale;
  out[8] = (1 - (xx + yy)) * scale;
  return out;
}

/**
 * Perspective × view for a camera at (0, 0, dist) looking down −z, with the
 * image shifted by (sx, sy) in normalised device units (an off-centre lens,
 * so the planet can sit above the controls without the camera turning).
 */
export function viewProjection(
  out: Float32Array,
  fovY: number,
  aspect: number,
  near: number,
  far: number,
  dist: number,
  sx: number,
  sy: number,
): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  // projection (column-major) with the lens shift folded into column 2
  const p0 = f / aspect;
  const p5 = f;
  const p8 = -sx;
  const p9 = -sy;
  const p10 = (far + near) * nf;
  const p14 = 2 * far * near * nf;
  // × translate(0, 0, −dist)
  out.fill(0);
  out[0] = p0;
  out[5] = p5;
  out[8] = p8;
  out[9] = p9;
  out[10] = p10;
  out[11] = -1;
  out[12] = p8 * -dist;
  out[13] = p9 * -dist;
  out[14] = p10 * -dist + p14;
  out[15] = dist;
  return out;
}
