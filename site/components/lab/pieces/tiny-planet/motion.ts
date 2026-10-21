// How the tiny planet moves. Everything is in world space (the camera
// looks down −z, x right, y up) and stepped at a fixed 240 Hz inside each
// frame, so a slow phone and a 120 Hz laptop feel the same.
//
// - Orientation is a quaternion with an angular velocity vector.
// - Held: a stiff, critically damped spring pulls the planet toward the
//   target the hand sets (the point you grabbed stays under your finger,
//   a frame or two behind). Grabbing a planet that is still spinning
//   starts the target where the planet is now, so it is caught with a
//   little give instead of a jump.
// - Free: the angular velocity splits into spin about the planet's own
//   axis and tumble across it. Spin keeps going (a flick turns it for
//   several seconds) and eases back to the slow idle day; tumble is
//   pulled back by a soft, slightly under-damped spring that sets the axis
//   upright again, so after any throw the planet rights itself like a
//   top, with a small wobble.
// - Keyboard: steer to a target an hour (15°) of turn away on a softer
//   spring, then hand back to the free motion.
// - Air: the clouds (and the pines' lean) ride a lagging copy of the
//   planet's turn: a spring between the cloud layer's angular velocity and
//   the planet's, so they trail when it spins up, slosh past when it stops.
// - Moon: an angle on a tilted orbit with its own speed; it can be held
//   and thrown like the planet, and drifts back to its own pace.

import {
  axisAngleQ,
  copyQ,
  cross3,
  dot3,
  len3,
  mulQ,
  normQ,
  qToRotVec,
  quat,
  rotate3,
  rotVecQ,
  conjQ,
  v3,
  type Q,
} from "./math";

const H = 1 / 240;

/** The planet's axis at rest: leaning 22° to the right and 14° toward you. */
export const REST_TILT = (() => {
  const a = quat();
  const b = quat();
  axisAngleQ(a, 0, 0, 1, (-22 * Math.PI) / 180);
  axisAngleQ(b, 1, 0, 0, (14 * Math.PI) / 180);
  return mulQ(quat(), a, b);
})();

export const ORBIT_RADIUS = 1.78;
export const MOON_RADIUS = 0.16;
/** The moon's orbit: in-plane axes (u at angle 0, v at a quarter turn: in front). */
export const ORBIT_U = (() => {
  const a = (-9 * Math.PI) / 180;
  return v3(Math.cos(a), Math.sin(a), 0);
})();
export const ORBIT_V = (() => {
  const i = (17 * Math.PI) / 180;
  return v3(0, -Math.sin(i), Math.cos(i));
})();
export const ORBIT_N = cross3(v3(), ORBIT_U, ORBIT_V);

const SPRING_HOLD = { k: 720, c: 2 * Math.sqrt(720) };
const SPRING_KEY = { k: 70, c: 2 * Math.sqrt(70) * 0.92 };
const RIGHTING = { k: 7.5, c: 3.4 };
const AIR = { k: 55, c: 6.2 };
const MOON_HOLD = { k: 300, c: 2 * Math.sqrt(300) };
export const MAX_SPIN = 22;

export class Planet {
  /** Planet orientation (model → world) and angular velocity (world, rad/s). */
  readonly o = quat();
  readonly w = v3();
  /** Where a hand or a key wants the planet. */
  readonly target = quat();
  mode: "free" | "hold" | "key" = "free";
  /** The slow day it eases back to (rad/s about its own axis). */
  idle = 0.16;
  /** Turns about its own axis so far (rad). */
  spin = 0;
  /** Rest pole in world space. */
  readonly rest = v3();

  /** Cloud layer lag: offset rotation vector, and the layer's angular velocity. */
  readonly air = v3();
  readonly airW = v3();

  /** Moon: angle on the orbit, its speed, its own pace. */
  moon = 2.2;
  moonW = 0.24;
  moonPace = 0.24;
  moonHeld = false;
  moonGoal = 0;
  /** Orbit radius (planet radii). */
  orbit = ORBIT_RADIUS;

  // scratch
  private readonly p = v3();
  private readonly e = v3();
  private readonly t3 = v3();
  private readonly dq = quat();
  private readonly cq = quat();
  private readonly y = v3(0, 1, 0);

  constructor(startSpin: number) {
    axisAngleQ(this.dq, 0, 1, 0, startSpin);
    mulQ(this.o, REST_TILT, this.dq);
    copyQ(this.target, this.o);
    rotate3(this.rest, REST_TILT, this.y);
    this.w[0] = 0;
    this.w[1] = 0;
    this.w[2] = 0;
  }

  /** The planet's axis in world space now. */
  pole(out: Float64Array | number[]) {
    return rotate3(out, this.o, this.y);
  }

  /** Spin rate about its own axis (rad/s). */
  get spinRate(): number {
    rotate3(this.p, this.o, this.y);
    return dot3(this.w, this.p);
  }

  /** Start holding: the target starts where the planet is. */
  hold() {
    this.mode = "hold";
    copyQ(this.target, this.o);
  }

  /** Turn the held target by q (world space). */
  turnTarget(q: Q) {
    mulQ(this.cq, q, this.target);
    copyQ(this.target, normQ(this.cq));
  }

  /** Let go with this angular velocity (world, rad/s). */
  release(wx: number, wy: number, wz: number) {
    this.mode = "free";
    const l = Math.hypot(wx, wy, wz);
    const k = l > MAX_SPIN ? MAX_SPIN / l : 1;
    this.w[0] = wx * k;
    this.w[1] = wy * k;
    this.w[2] = wz * k;
  }

  /** Keyboard: turn about the planet's own axis by `angle` from where it is heading. */
  keyTurn(angle: number) {
    const from = this.mode === "key" ? this.target : this.o;
    rotate3(this.p, from, this.y);
    axisAngleQ(this.dq, this.p[0], this.p[1], this.p[2], angle);
    mulQ(this.cq, this.dq, from);
    copyQ(this.target, normQ(this.cq));
    this.mode = "key";
  }

  /** Keyboard: tip the axis toward (or away from) you, `angle` from where it is heading. */
  keyTip(angle: number) {
    const from = this.mode === "key" ? this.target : this.o;
    axisAngleQ(this.dq, 1, 0, 0, angle);
    mulQ(this.cq, this.dq, from);
    copyQ(this.target, normQ(this.cq));
    this.mode = "key";
  }

  /** Give it a push about its own axis (rad/s). */
  kick(amount: number) {
    if (this.mode !== "free") this.mode = "free";
    rotate3(this.p, this.o, this.y);
    this.w[0] += this.p[0] * amount;
    this.w[1] += this.p[1] * amount;
    this.w[2] += this.p[2] * amount;
  }

  /** Set an exact state (reduced motion, or a jump). */
  snapToTarget() {
    copyQ(this.o, this.target);
    this.w[0] = this.w[1] = this.w[2] = 0;
  }

  step(dt: number) {
    let remaining = Math.min(dt, 0.1);
    while (remaining > 1e-6) {
      const h = Math.min(H, remaining);
      this.substep(h);
      remaining -= h;
    }
  }

  private substep(h: number) {
    const { o, w, p, e } = this;
    rotate3(p, o, this.y);
    if (this.mode === "free") {
      // spin about the axis eases toward the idle day; quick spins fade slowly at first
      let ws = dot3(w, p);
      const tx = w[0] - p[0] * ws, ty = w[1] - p[1] * ws, tz = w[2] - p[2] * ws;
      const excess = ws - this.idle;
      const rate = 0.8 + 0.05 * Math.abs(excess);
      ws = this.idle + excess * Math.exp(-rate * h);
      // tumble: a spring sets the axis upright again
      cross3(e, p, this.rest);
      if (dot3(p, this.rest) < -0.95) e[0] += 0.3; // upside down: pick a way round
      let ax = tx + (RIGHTING.k * e[0] - RIGHTING.c * tx) * h;
      let ay = ty + (RIGHTING.k * e[1] - RIGHTING.c * ty) * h;
      let az = tz + (RIGHTING.k * e[2] - RIGHTING.c * tz) * h;
      // keep the tumble across the axis
      const along = ax * p[0] + ay * p[1] + az * p[2];
      ax -= p[0] * along;
      ay -= p[1] * along;
      az -= p[2] * along;
      w[0] = p[0] * ws + ax;
      w[1] = p[1] * ws + ay;
      w[2] = p[2] * ws + az;
    } else {
      // held or steered: spring toward the target
      const s = this.mode === "hold" ? SPRING_HOLD : SPRING_KEY;
      conjQ(this.cq, o);
      mulQ(this.dq, this.target, this.cq);
      qToRotVec(e, this.dq);
      w[0] += (s.k * e[0] - s.c * w[0]) * h;
      w[1] += (s.k * e[1] - s.c * w[1]) * h;
      w[2] += (s.k * e[2] - s.c * w[2]) * h;
      if (this.mode === "key" && len3(e) < 0.0015 && len3(w) < 0.02) this.mode = "free";
    }
    this.spin += dot3(w, p) * h;
    rotVecQ(this.dq, w[0] * h, w[1] * h, w[2] * h);
    mulQ(this.cq, this.dq, o);
    copyQ(o, normQ(this.cq));

    // the air: offset' = layer − planet; layer' = −k·offset − c·(layer − planet)
    const air = this.air, aw = this.airW;
    for (let i = 0; i < 3; i++) {
      const rel = aw[i] - w[i];
      aw[i] += (-AIR.k * air[i] - AIR.c * rel) * h;
      air[i] += (aw[i] - w[i]) * h;
    }

    // the moon
    if (this.moonHeld) {
      let d = this.moonGoal - this.moon;
      d -= Math.round(d / (Math.PI * 2)) * Math.PI * 2;
      this.moonW += (MOON_HOLD.k * d - MOON_HOLD.c * this.moonW) * h;
    } else {
      this.moonW = this.moonPace + (this.moonW - this.moonPace) * Math.exp(-0.75 * h);
    }
    this.moon += this.moonW * h;
  }

  /** Moon centre in world space (planet radius 1). */
  moonPosition(out: Float64Array | number[]) {
    const c = Math.cos(this.moon) * this.orbit;
    const s = Math.sin(this.moon) * this.orbit;
    out[0] = ORBIT_U[0] * c + ORBIT_V[0] * s;
    out[1] = ORBIT_U[1] * c + ORBIT_V[1] * s;
    out[2] = ORBIT_U[2] * c + ORBIT_V[2] * s;
    return out;
  }

  /** Clouds' lag, softly limited (rad), for drawing. */
  airShown(out: Float64Array | number[], limit = 0.32) {
    const l = len3(this.air);
    const k = l > 1e-9 ? limit / (limit + l) : 1;
    out[0] = this.air[0] * k;
    out[1] = this.air[1] * k;
    out[2] = this.air[2] * k;
    return out;
  }

  /** How settled everything is (for sleeping the loop under reduced motion). */
  get still(): boolean {
    return this.mode === "free" && len3(this.w) < 1e-4 && len3(this.air) < 1e-4 && len3(this.airW) < 1e-4;
  }
}
