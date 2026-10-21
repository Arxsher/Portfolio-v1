// The globe as a rigid body: where it is, how it leans, and how a hand (or
// a script standing in for one) moves it. Everything is integrated with dt
// in fixed 1/240 s substeps, so it feels the same at any frame rate, and
// nothing ever jumps: a grab takes the globe from wherever it is, moving
// or not, and a release hands the hand's velocity to the springs.
//
// - Position (x, y) is the whole object's offset in world units; y is the
//   lift off the table. Held: a stiff, critically damped spring to the
//   hand (it trails by a frame or two, like something with weight). Let
//   go: a softer spring sets it back down in the middle of the stage, it
//   lands on the table with a small bounce, and a landing reports its
//   speed (the thunk).
// - Tilt is three damped pendulums (roll about the view axis, pitch toward
//   the camera, yaw about the vertical) driven by the hand's acceleration:
//   carry it right and the top trails left and the globe twists, then it
//   wobbles out. In the hand the wrist holds it firmly; on the table it
//   rocks on the rim of its foot (the contact point stays put and the body
//   rises as it tips, so it can never sink into the table).
// - The fluid reads the world acceleration and the angular velocity of
//   the step, so every motion stirs the water in proportion.

import { BASE, FLOOR_Y, PIVOT, type Vec3 } from "./scene";

const H = 1 / 240;

const HOLD = { k: 1100, c: 63 };
const HOME_X = { k: 58, c: 11.6 };
const HOME_Y = { k: 90, c: 15 };
const TILT_HELD = { k: 300, c: 10.5 };
const TILT_FREE = { k: 185, c: 3.9 };
const YAW = { k: 70, c: 4.2 };

/** How hard the hand's acceleration swings the globe (rad/s² per unit/s²). */
const G_ROLL = 0.3;
const G_PITCH = 0.1;
const G_YAW = 0.16;

const MAX_ROLL = 0.62;
const MAX_PITCH = 0.36;
const MAX_YAW = 0.7;

/** The hand's reach, in world units, before it rubber-bands. */
const REACH_X = 1.05;
const REACH_UP = 0.85;

const FOOT_DEPTH = PIVOT[1] - FLOOR_Y;
const FOOT_R = BASE.footR;

const rubber = (over: number, limit: number) => (limit * over) / (limit + over);
const softClamp = (v: number, max: number) => max * Math.tanh(v / max);

/** What a scripted hand does: lift, shake side to side `cycles` times, set down. */
export type ShakeScript = {
  lift: number;
  amp: number;
  freq: number;
  cycles: number;
  /** Seconds to lift before shaking, and to bring it down after. */
  rise: number;
  settle: number;
  /** Lifts and lets go (a hop) instead of shaking. */
  hop?: boolean;
};

export const SHAKES = {
  /** Space or the Shake button: a proper shake. */
  hand: { lift: 0.3, amp: 0.3, freq: 3.6, cycles: 3, rise: 0.16, settle: 0.22 },
  /** The tile's own, every few seconds: gentle. */
  tile: { lift: 0.14, amp: 0.15, freq: 2.8, cycles: 2, rise: 0.18, settle: 0.26 },
  /** ↑: lift it and let it drop. */
  hop: { lift: 0.36, amp: 0, freq: 1, cycles: 0, rise: 0.17, settle: 0, hop: true },
} as const satisfies Record<string, ShakeScript>;

export class Globe {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  roll = 0;
  rollV = 0;
  pitch = 0;
  pitchV = 0;
  yaw = 0;
  yawV = 0;

  held = false;
  /** The hand's target (world units, offset from rest). */
  tx = 0;
  ty = 0;
  /** A gentle lean toward a hovering pointer (radians of roll). */
  lean = 0;

  private script: ShakeScript | null = null;
  private scriptT = 0;
  private scriptX0 = 0;
  private scriptY0 = 0;
  /** 1 while sitting on the table (it rocks on its rim), 0 in the hand. */
  private grounded = 1;

  /* outputs, refreshed by step() */
  /** Object → world rotation, column-major. */
  readonly rot = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  /** World offset of the pivot (includes the rocking correction). */
  readonly offset: Vec3 = [0, 0, 0];
  /** The base's up axis in world space. */
  readonly up: Vec3 = [0, 1, 0];
  /** Mean world acceleration over the last step (units/s²). */
  ax = 0;
  ay = 0;
  /** Angular velocity, world (rad/s) about x, y, z. */
  readonly omega: Vec3 = [0, 0, 0];
  /** Fastest landing this step (units/s), 0 if none. */
  impact = 0;
  /** Render tilts (soft-clamped). */
  rollOut = 0;
  pitchOut = 0;
  yawOut = 0;

  /** Pick it up: from here on the springs chase the hand. */
  grab() {
    this.script = null;
    this.held = true;
    this.tx = this.x;
    this.ty = this.y;
  }

  /** Where the hand wants it (offsets from rest, world units), rubber-banded past its reach. */
  setHand(x: number, y: number) {
    const ax = Math.abs(x);
    this.tx = ax > REACH_X ? Math.sign(x) * (REACH_X + rubber(ax - REACH_X, 0.35)) : x;
    if (y > REACH_UP) this.ty = REACH_UP + rubber(y - REACH_UP, 0.3);
    else if (y < 0) this.ty = -rubber(-y, 0.08);
    else this.ty = y;
  }

  /** Let go with the hand's velocity (world units / s). */
  release(vx: number, vy: number) {
    this.held = false;
    this.script = null;
    this.vx = Math.max(-7, Math.min(7, vx));
    this.vy = Math.max(-7, Math.min(7, vy));
  }

  /** Tip it on the table (←/→): a push on one side. */
  nudge(dir: number) {
    this.rollV += dir * 2.8;
    this.yawV -= dir * 0.9;
    if (!this.held) this.vx += dir * 0.35;
  }

  /** A scripted hand takes it (keyboard, the Shake button, the tile). */
  play(script: ShakeScript) {
    this.script = script;
    this.scriptT = 0;
    this.scriptX0 = this.x;
    this.scriptY0 = this.y;
    this.held = true;
    this.tx = this.x;
    this.ty = this.y;
  }

  get scripted() {
    return this.script !== null;
  }

  /** At rest: on the table, upright, still. */
  get settled(): boolean {
    return (
      !this.held &&
      Math.abs(this.x) < 1e-3 &&
      Math.abs(this.vx) < 1e-3 &&
      Math.abs(this.vy) < 1e-3 &&
      Math.abs(this.roll - this.lean) < 1e-3 &&
      Math.abs(this.rollV) < 1e-3 &&
      Math.abs(this.pitch) < 1e-3 &&
      Math.abs(this.pitchV) < 1e-3 &&
      Math.abs(this.yaw) < 1e-3 &&
      Math.abs(this.yawV) < 1e-3 &&
      this.y - this.need() < 1e-3
    );
  }

  private runScript(dt: number) {
    const s = this.script;
    if (!s) return;
    this.scriptT += dt;
    const t = this.scriptT;
    const shakeT = s.cycles / s.freq;
    const ease = (k: number) => k * k * (3 - 2 * k);
    if (t < s.rise) {
      const k = ease(t / s.rise);
      this.tx = this.scriptX0 * (1 - k);
      this.ty = this.scriptY0 + (s.lift - this.scriptY0) * k;
      return;
    }
    if (s.hop) {
      // let it drop
      this.release(this.vx, this.vy);
      return;
    }
    const u = t - s.rise;
    if (u < shakeT) {
      const env = Math.sin(Math.PI * Math.min(1, u / shakeT)) ** 0.6;
      this.tx = s.amp * Math.sin(2 * Math.PI * s.freq * u) * env;
      this.ty = s.lift + 0.05 * Math.sin(4 * Math.PI * s.freq * u) * env;
      return;
    }
    const w = u - shakeT;
    if (w < s.settle) {
      const k = ease(w / s.settle);
      this.tx = 0;
      this.ty = s.lift * (1 - k) + 0.04 * k;
      return;
    }
    this.release(this.vx, this.vy);
  }

  /** The lift that keeps the foot's rim above the table at the current tilt. */
  private need(): number {
    const ny = Math.cos(this.rollOut) * Math.cos(this.pitchOut);
    return Math.max(0, FOOT_DEPTH * ny + FOOT_R * Math.sqrt(Math.max(0, 1 - ny * ny)) - FOOT_DEPTH);
  }

  step(dt: number) {
    let remaining = Math.min(dt, 0.1);
    let sumAx = 0;
    let sumAy = 0;
    let time = 0;
    this.impact = 0;
    this.runScript(dt);
    while (remaining > 1e-6) {
      const h = Math.min(H, remaining);
      remaining -= h;
      time += h;
      // position
      let ax: number;
      let ay: number;
      if (this.held) {
        ax = HOLD.k * (this.tx - this.x) - HOLD.c * this.vx;
        ay = HOLD.k * (this.ty - this.y) - HOLD.c * this.vy;
      } else {
        ax = -HOME_X.k * this.x - HOME_X.c * this.vx;
        ay = -HOME_Y.k * this.y - HOME_Y.c * this.vy;
      }
      this.vx += ax * h;
      this.vy += ay * h;
      this.x += this.vx * h;
      this.y += this.vy * h;

      // tilt: pendulums swung by the acceleration
      const tilt = this.held ? TILT_HELD : TILT_FREE;
      const rollA = -tilt.k * (this.roll - (this.held ? 0 : this.lean)) - tilt.c * this.rollV + G_ROLL * ax;
      const pitchA = -tilt.k * this.pitch - tilt.c * this.pitchV - G_PITCH * ay;
      const yawA = -YAW.k * this.yaw - YAW.c * this.yawV + G_YAW * ax;
      this.rollV += rollA * h;
      this.pitchV += pitchA * h;
      this.yawV += yawA * h;
      this.roll += this.rollV * h;
      this.pitch += this.pitchV * h;
      this.yaw += this.yawV * h;
      this.rollOut = softClamp(this.roll, MAX_ROLL);
      this.pitchOut = softClamp(this.pitch, MAX_PITCH);
      this.yawOut = softClamp(this.yaw, MAX_YAW);

      // the table
      const need = this.need();
      if (this.y < need) {
        const before = this.vy;
        if (this.vy < 0) {
          const speed = -this.vy;
          if (speed > this.impact) this.impact = speed;
          this.vy = speed > 0.7 ? speed * 0.2 : 0;
        }
        this.y = need;
        ay += (this.vy - before) / h;
      }
      sumAx += ax * h;
      sumAy += ay * h;
    }
    this.ax = time > 0 ? sumAx / time : 0;
    this.ay = time > 0 ? sumAy / time : 0;

    // on the table it rocks on its rim; in the hand it turns about the collar
    const sitting = !this.held && this.y - this.need() < 0.02 ? 1 : 0;
    this.grounded += (sitting - this.grounded) * (1 - Math.exp(-dt * 10));
    this.compose();
  }

  /** Rotation matrix, up axis, offset with the rocking correction. */
  private compose() {
    const r = this.rollOut;
    const p = this.pitchOut;
    const w = this.yawOut;
    const cr = Math.cos(r);
    const sr = Math.sin(r);
    const cp = Math.cos(p);
    const sp = Math.sin(p);
    const cw = Math.cos(w);
    const sw = Math.sin(w);
    // R = Rz(roll) · Rx(pitch) · Ry(yaw)
    // Ry: [cw 0 sw; 0 1 0; -sw 0 cw], Rx: [1 0 0; 0 cp -sp; 0 sp cp], Rz: [cr -sr 0; sr cr 0; 0 0 1]
    // R = [cr·cw − sr·sp·sw, −sr·cp, cr·sw + sr·sp·cw; sr·cw + cr·sp·sw, cr·cp, sr·sw − cr·sp·cw; −cp·sw, sp, cp·cw]
    const m00 = cr * cw - sr * sp * sw;
    const m01 = -sr * cp;
    const m02 = cr * sw + sr * sp * cw;
    const m10 = sr * cw + cr * sp * sw;
    const m11 = cr * cp;
    const m12 = sr * sw - cr * sp * cw;
    const m20 = cp * -sw;
    const m21 = sp;
    const m22 = cp * cw;
    const m = this.rot;
    m[0] = m00;
    m[1] = m10;
    m[2] = m20;
    m[3] = m01;
    m[4] = m11;
    m[5] = m21;
    m[6] = m02;
    m[7] = m12;
    m[8] = m22;
    this.up[0] = m01;
    this.up[1] = m11;
    this.up[2] = m21;
    // keep the touching rim where it was while it rocks on the table
    const comp = -(FOOT_DEPTH * sr + FOOT_R * (1 - cr) * Math.sign(r));
    this.offset[0] = this.x + this.grounded * comp;
    this.offset[1] = this.y;
    this.offset[2] = 0;
    this.omega[0] = this.pitchV;
    this.omega[1] = this.yawV;
    this.omega[2] = this.rollV;
  }
}
