// The water and the snow in it, simulated in the globe's own frame.
//
// The water is three simple flows, each divergence-free, added together:
// - swirl: the water keeps its spin while the glass turns under it. Every
//   change in the globe's angular velocity leaves the water rotating the
//   other way relative to the glass; the walls slowly drag it back into
//   step (a few seconds), which is why a snow globe keeps swirling after
//   you stop.
// - roll: a sudden push sends the middle of the water one way and the
//   edges back the other (a Hill's-vortex-like roll that stays tangent to
//   the glass), dying away in about a second.
// - churn: turbulence fed by how hard the globe is shaken, an Arnold-
//   Beltrami-Childress flow whose phases drift, so the eddies wander, with
//   a little random tumbling under it that spreads the snow through the
//   whole globe.
// Each flake follows the water with a little lag, sinks at its own speed
// along the globe's "down" (which tilts with it), flutters as it falls,
// and, being denser than water, is flung a little against each push.
// Flakes that reach the snow, the roof or a bough settle there (a height
// field of everything below) until the water moving past them is fast
// enough to lift them again. Nothing allocates per step.

import { seededRandom } from "../../hooks";
import { buildField, fieldHeight, R_IN, type Vec3 } from "./scene";

export const KIND_FLAKE = 0;
export const KIND_BIG = 1;
export const KIND_GLITTER = 2;

/** Rate the water's swirl follows the glass's turning, and how long it keeps it. */
const COUPLE = 0.42;
const SWIRL_TAU = 2.6;
const SWIRL_MAX = 3.2;
/** The roll: how much a push sets it going (per unit/s² of acceleration), and its life. */
const ROLL_GAIN = 0.016;
const ROLL_TAU = 0.95;
const ROLL_MAX = 1.1;
/** Churn: fed by acceleration and by angular acceleration; its life and strength. */
const CHURN_A = 0.0055;
const CHURN_W = 0.012;
const CHURN_TAU = 1.8;
const CHURN_MAX = 1.5;
const CHURN_SPEED = 0.78;
const CHURN_K = 4.6;
/** Small-scale tumbling on top of the eddies (units/s per √s, at full churn): spreads the cloud through the water. */
const TUMBLE = 1.2;
/** A flake's lag behind the water (s), and how hard a push flings it. */
const LAG = 0.2;
const HEAVY = 0.015;
const FLUTTER = 0.03;

export class Snow {
  readonly count: number;
  /** Per flake: x, y, z and the radius (negative while it rests). Uploaded each frame. */
  readonly pos: Float32Array;
  /** Per flake: seed, kind, phase, spin. Uploaded once. */
  readonly attr: Float32Array;
  private vel: Float32Array;
  private fall: Float32Array;
  private lift: Float32Array;
  private flutter: Float32Array;
  private field: Float32Array;
  private random: () => number;

  /** The water's spin relative to the glass (rad/s, object frame). */
  readonly swirl: Vec3 = [0, 0, 0];
  /** The roll's strength and direction (units/s). */
  readonly roll: Vec3 = [0, 0, 0];
  /** Turbulence, 0..CHURN_MAX. */
  churn = 0;
  private phase: Vec3 = [0, 0, 0];
  private prevW: Vec3 = [0, 0, 0];
  private hasPrevW = false;
  time = 0;
  /** Flakes still in the water after the last step. */
  free = 0;
  /** How much the water is moving (for the sound and the glitter): 0..~1. */
  activity = 0;

  private u: Vec3 = [0, 0, 0];

  constructor(count: number, seed = 0x5a0b) {
    this.count = count;
    this.pos = new Float32Array(count * 4);
    this.attr = new Float32Array(count * 4);
    this.vel = new Float32Array(count * 3);
    this.fall = new Float32Array(count);
    this.lift = new Float32Array(count);
    this.flutter = new Float32Array(count);
    this.field = buildField();
    this.random = seededRandom(seed);
    const r = this.random;
    for (let i = 0; i < count; i++) {
      const roll = r();
      const kind = roll < 0.08 ? KIND_GLITTER : roll < 0.22 ? KIND_BIG : KIND_FLAKE;
      let radius: number;
      if (kind === KIND_GLITTER) {
        radius = 0.0068 + r() * 0.0015;
        this.fall[i] = 0.05 + r() * 0.025;
        this.lift[i] = 0.06 + r() * 0.12;
      } else if (kind === KIND_BIG) {
        radius = 0.0105 + r() * 0.0035;
        this.fall[i] = 0.085 + r() * 0.04;
        this.lift[i] = 0.12 + r() * 0.2;
      } else {
        radius = 0.0056 + r() * 0.003;
        this.fall[i] = 0.055 + r() * 0.045;
        this.lift[i] = 0.08 + r() * 0.2;
      }
      this.flutter[i] = 0.7 + r() * 1.1;
      this.pos[i * 4 + 3] = radius;
      this.attr[i * 4] = r();
      this.attr[i * 4 + 1] = kind;
      this.attr[i * 4 + 2] = r() * Math.PI * 2;
      this.attr[i * 4 + 3] = (1.5 + r() * 3.5) * (r() < 0.5 ? -1 : 1);
    }
    this.scatter(0.3, 0.9);
  }

  /**
   * Spread the snow: `resting` of it lying on the snow, the roof and the
   * boughs, the rest in the water up to height `top`.
   */
  scatter(resting: number, top: number) {
    const r = this.random;
    const pos = this.pos;
    let free = 0;
    for (let i = 0; i < this.count; i++) {
      const o = i * 4;
      const radius = Math.abs(pos[o + 3]);
      this.vel[i * 3] = 0;
      this.vel[i * 3 + 1] = 0;
      this.vel[i * 3 + 2] = 0;
      if (r() < resting) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * 0.8;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        pos[o] = x;
        pos[o + 1] = fieldHeight(this.field, x, z) + radius * 0.6;
        pos[o + 2] = z;
        pos[o + 3] = -radius;
        continue;
      }
      const rmax = R_IN - radius - 0.01;
      for (let tries = 0; tries < 24; tries++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * (rmax - 0.02);
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d;
        const floor = fieldHeight(this.field, x, z) + 0.02;
        const ceil = Math.min(top, Math.sqrt(Math.max(0, rmax * rmax - x * x - z * z)));
        if (ceil <= floor) continue;
        // a little denser low down, as snow that has been falling a while
        const k = 1 - Math.pow(r(), 1.25);
        pos[o] = x;
        pos[o + 1] = floor + (ceil - floor) * (1 - k);
        pos[o + 2] = z;
        pos[o + 3] = radius;
        free++;
        break;
      }
      if (pos[o + 3] < 0) continue;
    }
    this.free = free;
  }

  /** Give the water a spin about the vertical (radians/s) and some churn. */
  stir(spin: number, churn: number) {
    this.swirl[1] += spin;
    this.churn = Math.min(CHURN_MAX, this.churn + churn);
  }

  /** The water's velocity at a point (into this.u). */
  private flow(x: number, y: number, z: number) {
    const s = this.swirl;
    const rl = this.roll;
    const u = this.u;
    // swirl: rigid rotation
    let ux = s[1] * z - s[2] * y;
    let uy = s[2] * x - s[0] * z;
    let uz = s[0] * y - s[1] * x;
    // roll: through the middle and back along the glass
    const inv = 1 / R_IN;
    const px = x * inv;
    const py = y * inv;
    const pz = z * inv;
    const r2 = px * px + py * py + pz * pz;
    const dot = rl[0] * px + rl[1] * py + rl[2] * pz;
    const m = 1 - 2 * r2;
    ux += rl[0] * m + dot * px;
    uy += rl[1] * m + dot * py;
    uz += rl[2] * m + dot * pz;
    // churn
    const c = this.churn * CHURN_SPEED;
    if (c > 1e-4) {
      const ph = this.phase;
      const k = CHURN_K;
      const sx = Math.sin(k * x + ph[2]);
      const cx = Math.cos(k * x + ph[2]);
      const sy = Math.sin(k * y + ph[1]);
      const cy = Math.cos(k * y + ph[1]);
      const sz = Math.sin(k * z + ph[0]);
      const cz = Math.cos(k * z + ph[0]);
      ux += c * (sz + 0.55 * cy);
      uy += c * (0.75 * sx + cz);
      uz += c * (0.55 * sy + 0.75 * cx);
    }
    u[0] = ux;
    u[1] = uy;
    u[2] = uz;
  }

  /**
   * Advance by dt. `down`: the globe's down in its own frame (unit); `acc`:
   * the globe's acceleration (units/s², object frame); `w`: its angular
   * velocity (rad/s, object frame).
   */
  step(dt: number, down: Vec3, acc: Vec3, w: Vec3) {
    let remaining = Math.min(dt, 0.1);
    // the water
    if (!this.hasPrevW) {
      this.prevW[0] = w[0];
      this.prevW[1] = w[1];
      this.prevW[2] = w[2];
      this.hasPrevW = true;
    }
    const dwx = w[0] - this.prevW[0];
    const dwy = w[1] - this.prevW[1];
    const dwz = w[2] - this.prevW[2];
    this.prevW[0] = w[0];
    this.prevW[1] = w[1];
    this.prevW[2] = w[2];
    const s = this.swirl;
    const swirlKeep = Math.exp(-dt / SWIRL_TAU);
    s[0] = clampAbs((s[0] - dwx * COUPLE) * swirlKeep, SWIRL_MAX);
    s[1] = clampAbs((s[1] - dwy * COUPLE) * swirlKeep, SWIRL_MAX);
    s[2] = clampAbs((s[2] - dwz * COUPLE) * swirlKeep, SWIRL_MAX);
    const rl = this.roll;
    const rollKeep = Math.exp(-dt / ROLL_TAU);
    rl[0] = clampAbs((rl[0] - acc[0] * ROLL_GAIN * dt) * rollKeep, ROLL_MAX);
    rl[1] = clampAbs((rl[1] - acc[1] * ROLL_GAIN * dt * 0.6) * rollKeep, ROLL_MAX);
    rl[2] = clampAbs((rl[2] - acc[2] * ROLL_GAIN * dt) * rollKeep, ROLL_MAX);
    const aMag = Math.hypot(acc[0], acc[1], acc[2]);
    const dwMag = Math.hypot(dwx, dwy, dwz);
    this.churn = Math.min(CHURN_MAX, this.churn * Math.exp(-dt / CHURN_TAU) + aMag * CHURN_A * dt + dwMag * CHURN_W);
    if (this.churn < 1e-4) this.churn = 0;
    const drift = dt * (0.3 + 1.4 * this.churn);
    this.phase[0] += drift;
    this.phase[1] += drift * 0.8;
    this.phase[2] += drift * 1.23;
    const swirlMag = Math.hypot(s[0], s[1], s[2]);
    const rollMag = Math.hypot(rl[0], rl[1], rl[2]);
    this.activity = Math.min(1.5, swirlMag * 0.22 + rollMag * 0.9 + this.churn * 0.8);

    // calm water and no push: resting flakes stay put
    const calm = this.churn < 0.02 && swirlMag < 0.05 && rollMag < 0.02 && aMag < 1;
    const push = aMag * HEAVY;

    while (remaining > 1e-6) {
      const h = Math.min(1 / 60, remaining);
      remaining -= h;
      this.time += h;
      this.integrate(h, down, acc, calm, push);
    }
  }

  private integrate(dt: number, down: Vec3, acc: Vec3, calm: boolean, push: number) {
    const pos = this.pos;
    const vel = this.vel;
    const field = this.field;
    const u = this.u;
    const k = 1 - Math.exp(-dt / LAG);
    const t = this.time;
    const random = this.random;
    const tumble = this.churn > 0.05 ? TUMBLE * this.churn * Math.sqrt(dt) * 3.4 : 0;
    let free = 0;
    for (let i = 0; i < this.count; i++) {
      const o = i * 4;
      const v = i * 3;
      let x = pos[o];
      let y = pos[o + 1];
      let z = pos[o + 2];
      const w = pos[o + 3];
      const radius = w < 0 ? -w : w;
      if (w < 0) {
        // resting: lifted only when the water past it is quick enough
        if (calm) continue;
        this.flow(x, y, z);
        const speed = Math.hypot(u[0], u[1], u[2]) + push * 0.12;
        if (speed > this.lift[i]) {
          // kicked up off the snow, harder the harder the water pulls
          const kick = Math.min(2.2, speed / this.lift[i]);
          pos[o + 3] = radius;
          vel[v] = u[0] * 0.6 + (random() - 0.5) * 0.12 * kick;
          vel[v + 1] = (0.15 + random() * 0.4) * kick + Math.max(0, u[1]) * 0.6;
          vel[v + 2] = u[2] * 0.6 + (random() - 0.5) * 0.12 * kick;
          free++;
        }
        continue;
      }
      free++;
      this.flow(x, y, z);
      const fall = this.fall[i];
      const fr = this.flutter[i];
      const ph = this.attr[o + 2];
      const fx = FLUTTER * Math.sin(t * fr * 2.2 + ph);
      const fz = FLUTTER * Math.cos(t * fr * 1.8 + ph * 1.7);
      let vx = vel[v];
      let vy = vel[v + 1];
      let vz = vel[v + 2];
      vx += (u[0] + down[0] * fall + fx - vx) * k - acc[0] * HEAVY * dt;
      vy += (u[1] + down[1] * fall - vy) * k - acc[1] * HEAVY * dt;
      vz += (u[2] + down[2] * fall + fz - vz) * k - acc[2] * HEAVY * dt;
      if (tumble > 0) {
        vx += (random() - 0.5) * tumble;
        vy += (random() - 0.5) * tumble;
        vz += (random() - 0.5) * tumble;
      }
      const px = x;
      const py = y;
      const pz = z;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      // the glass
      const rmax = R_IN - radius - 0.006;
      const r2 = x * x + y * y + z * z;
      if (r2 > rmax * rmax) {
        const r = Math.sqrt(r2);
        const nx = x / r;
        const ny = y / r;
        const nz = z / r;
        x = nx * rmax;
        y = ny * rmax;
        z = nz * rmax;
        const out = vx * nx + vy * ny + vz * nz;
        if (out > 0) {
          vx -= out * nx;
          vy -= out * ny;
          vz -= out * nz;
        }
      }
      // whatever lies below
      const floor = fieldHeight(field, x, z) + radius * 0.6;
      if (y < floor) {
        if (py >= floor - 0.025) {
          const speed = Math.hypot(vx, vy, vz);
          y = floor;
          if (speed < 0.45) {
            pos[o] = x;
            pos[o + 1] = y;
            pos[o + 2] = z;
            pos[o + 3] = -radius;
            vel[v] = 0;
            vel[v + 1] = 0;
            vel[v + 2] = 0;
            free--;
            continue;
          }
          vy = Math.abs(vy) * 0.25;
        } else {
          // ran into the side of something: back off
          x = px;
          z = pz;
          y = Math.max(py, y);
          vx *= -0.3;
          vz *= -0.3;
        }
      }
      pos[o] = x;
      pos[o + 1] = y;
      pos[o + 2] = z;
      vel[v] = vx;
      vel[v + 1] = vy;
      vel[v + 2] = vz;
    }
    this.free = free;
  }
}

function clampAbs(v: number, max: number) {
  return v > max ? max : v < -max ? -max : v;
}
