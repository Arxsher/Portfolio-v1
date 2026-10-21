// The timetable: up to three trains on the line at once, each a pose along
// the track (the engine's nose at `head`, cars trailing behind it). A train
// is sent from inside one of the two tunnels, cruises across the viaduct
// and is gone into the other. Trains that follow one another keep a block
// apart; a train the other way waits until the line is clear. Each step
// also reports the wheel beats over the rail joints (for the sound) and
// fills the instance data and lights the renderer draws with. Nothing
// allocates after construction.

import type { Vec3 } from "./math";
import { CAR_INSTANCE, CAR_LEN, CAR_PITCH, CAR_SCALE_Y, DECK_Y, RECESS, TRACK_LEN, trackPoint } from "./world";

/** Where a train starts, inside the tunnel (s before the portal), and where it is dropped. */
const ENTRY = 24;
/** A following train waits until the one ahead has this much line behind it. */
const BLOCK = 46;
/** Rail joints, every this many units. */
const JOINT = 12.5;
/** Axles: bogie centres from a car's middle, and the two axles of a bogie. */
const BOGIE = CAR_LEN / 2 - 1.9;
const AXLE = 0.85;

export const MAX_TRAINS = 3;
export const MAX_CARS = 7;
/** Cars drawn at once (instances) and lights the shaders take. */
export const MAX_INSTANCES = MAX_TRAINS * MAX_CARS;
export const MAX_CAR_LIGHTS = 8;

export type Train = {
  live: boolean;
  /** +1: left portal to right, −1: right to left */
  dir: number;
  /** the engine's nose (s) */
  head: number;
  cars: number;
  livery: number;
  speed: number;
  seed: number;
  /** seconds since it was sent */
  age: number;
};

export type Beat = {
  /** where on the line (s), and how far into the frame it fell (0..1) */
  s: number;
  frac: number;
  /** the train's speed, for the sound's weight */
  speed: number;
  /** the first axle of a pair (the pair's second beat is a touch softer) */
  lead: boolean;
};

const LIVERIES = 4;

export class Timetable {
  readonly trains: Train[] = [];
  /** cars to draw this frame: CAR_INSTANCE floats each */
  readonly instances = new Float32Array(MAX_INSTANCES * CAR_INSTANCE);
  instanceCount = 0;
  /** warm light from the lit cars: xyz, strength */
  readonly carLights = new Float32Array(MAX_CAR_LIGHTS * 4);
  carLightCount = 0;
  /** the leading engine's headlight: position, direction, strength */
  readonly headPos: Vec3 = [0, 0, 0];
  readonly headDir: Vec3 = [1, 0, 0];
  head = 0;
  /** a second headlight (another train on the line) */
  readonly head2Pos: Vec3 = [0, 0, 0];
  readonly head2Dir: Vec3 = [1, 0, 0];
  head2 = 0;
  /** wheel beats over the joints since the last step */
  readonly beats: Beat[] = [];
  beatCount = 0;
  /** dispatches waiting for the line */
  pending = 0;
  private nextDir = 1;
  private sent = 0;
  private random: () => number;
  private scratchA: Vec3 = [0, 0, 0];
  private scratchB: Vec3 = [0, 0, 0];

  constructor(seed = 7) {
    let a = seed >>> 0;
    this.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < MAX_TRAINS; i++) {
      this.trains.push({ live: false, dir: 1, head: 0, cars: 0, livery: 0, speed: 0, seed: 0, age: 0 });
    }
    for (let i = 0; i < 64; i++) this.beats.push({ s: 0, frac: 0, speed: 0, lead: false });
  }

  /** Trains on the line (or waiting to be). */
  get busy(): boolean {
    return this.pending > 0 || this.trains.some((t) => t.live);
  }

  /** Any part of a train between the portals? */
  get visible(): boolean {
    for (const t of this.trains) {
      if (!t.live) continue;
      const tail = t.head - t.dir * this.length(t);
      const lo = Math.min(t.head, tail);
      const hi = Math.max(t.head, tail);
      if (hi > -RECESS && lo < TRACK_LEN + RECESS) return true;
    }
    return false;
  }

  length(t: Train): number {
    return t.cars * CAR_PITCH - (CAR_PITCH - CAR_LEN);
  }

  /** Ask for the next train. Returns the direction it will come from (+1: from the left). */
  request(): number {
    this.pending = Math.min(this.pending + 1, 3);
    return this.directionForNext();
  }

  private directionForNext(): number {
    for (const t of this.trains) if (t.live) return t.dir;
    return this.nextDir;
  }

  /** Which way the most recent train runs (for a hint), or 0. */
  get lastDir(): number {
    let best: Train | null = null;
    for (const t of this.trains) if (t.live && (!best || t.age < best.age)) best = t;
    return best ? best.dir : 0;
  }

  private spawn(dir: number) {
    const slot = this.trains.find((t) => !t.live);
    if (!slot) return false;
    const n = this.sent++;
    // the first is the sleeper: long, in the night livery
    const cars = n === 0 ? 6 : 4 + Math.floor(this.random() * 4);
    slot.live = true;
    slot.dir = dir;
    slot.cars = Math.min(MAX_CARS, cars);
    slot.livery = n === 0 ? 0 : Math.floor(this.random() * LIVERIES);
    slot.speed = 12.2 + this.random() * 1.6;
    slot.seed = this.random();
    slot.age = 0;
    slot.head = dir > 0 ? -ENTRY : TRACK_LEN + ENTRY;
    return true;
  }

  /** Is the line free for a train going `dir`? */
  private clearFor(dir: number): boolean {
    for (const t of this.trains) {
      if (!t.live) continue;
      if (t.dir !== dir) return false;
      // the newest train in that direction must be a block in
      const tail = t.head - t.dir * this.length(t);
      const entered = dir > 0 ? tail - -ENTRY : TRACK_LEN + ENTRY - tail;
      if (entered < BLOCK) return false;
    }
    return true;
  }

  /**
   * Put one train still, mid-viaduct (reduced motion), or the next one in
   * its place. Returns its direction.
   */
  park(): number {
    for (const t of this.trains) t.live = false;
    this.pending = 0;
    const dir = this.nextDir;
    this.nextDir = -dir;
    this.spawn(dir);
    const t = this.trains.find((x) => x.live);
    if (t) t.head = TRACK_LEN / 2 + (t.dir * this.length(t)) / 2 - t.dir * 6;
    return dir;
  }

  clear() {
    for (const t of this.trains) t.live = false;
    this.pending = 0;
  }

  /** Advance by dt seconds (0 keeps everything where it is but rebuilds the frame data). */
  step(dt: number, still: boolean) {
    this.beatCount = 0;
    // send what's waiting, if the line allows
    if (this.pending > 0) {
      const dir = this.directionForNext();
      if (this.clearFor(dir) && this.spawn(dir)) {
        this.pending--;
        if (!this.trains.some((t) => t.live && t.dir !== dir)) this.nextDir = -dir;
      }
    }
    for (const t of this.trains) {
      if (!t.live) continue;
      const prev = t.head;
      if (!still) {
        t.head += t.dir * t.speed * dt;
        t.age += dt;
      }
      if (!still && dt > 0) this.collectBeats(t, prev, t.head);
      const tail = t.head - t.dir * this.length(t);
      if ((t.dir > 0 && tail > TRACK_LEN + ENTRY) || (t.dir < 0 && tail < -ENTRY)) t.live = false;
    }
    this.buildFrame();
  }

  private collectBeats(t: Train, from: number, to: number) {
    const span = to - from;
    if (span === 0) return;
    for (let c = 0; c < t.cars; c++) {
      const centre = -t.dir * (CAR_LEN / 2 + c * CAR_PITCH);
      for (let b = 0; b < 2; b++) {
        const bogie = centre + (b === 0 ? BOGIE : -BOGIE);
        for (let a = 0; a < 2; a++) {
          const off = bogie + (a === 0 ? AXLE : -AXLE) * t.dir;
          const s0 = from + off;
          const s1 = to + off;
          // only near the viaduct (and a little into the tunnels)
          if (Math.max(s0, s1) < -18 || Math.min(s0, s1) > TRACK_LEN + 18) continue;
          const k0 = Math.floor(s0 / JOINT);
          const k1 = Math.floor(s1 / JOINT);
          if (k0 === k1) continue;
          const joint = (t.dir > 0 ? k1 : k0) * JOINT;
          if (this.beatCount >= this.beats.length) return;
          const beat = this.beats[this.beatCount++];
          beat.s = joint;
          beat.frac = Math.min(1, Math.max(0, (joint - s0) / (s1 - s0)));
          beat.speed = t.speed;
          beat.lead = a === 0;
        }
      }
    }
  }

  /** Instance data for every visible car, the warm lights they cast and the headlights. */
  private buildFrame() {
    const inst = this.instances;
    let n = 0;
    let lights = 0;
    this.head = 0;
    this.head2 = 0;
    const A = this.scratchA;
    const B = this.scratchB;
    let heads = 0;
    for (let ti = 0; ti < this.trains.length; ti++) {
      const t = this.trains[ti];
      if (!t.live) continue;
      for (let c = 0; c < t.cars; c++) {
        const sc = t.head - t.dir * (CAR_LEN / 2 + c * CAR_PITCH);
        // fully inside a tunnel: nothing to draw
        if (sc + CAR_LEN / 2 < -RECESS - 0.5 || sc - CAR_LEN / 2 > TRACK_LEN + RECESS + 0.5) continue;
        if (n >= MAX_INSTANCES) break;
        trackPoint(sc - (t.dir * CAR_LEN) / 2, 0, A);
        trackPoint(sc + (t.dir * CAR_LEN) / 2, 0, B);
        let fx = B[0] - A[0];
        let fz = B[2] - A[2];
        const l = Math.hypot(fx, fz) || 1;
        fx /= l;
        fz /= l;
        const o = n * CAR_INSTANCE;
        inst[o] = (A[0] + B[0]) / 2;
        inst[o + 1] = DECK_Y;
        inst[o + 2] = (A[2] + B[2]) / 2;
        inst[o + 3] = sc;
        inst[o + 4] = fx;
        inst[o + 5] = fz;
        inst[o + 6] = t.dir;
        inst[o + 7] = c === 0 ? 0 : 1;
        inst[o + 8] = t.livery;
        inst[o + 9] = c === t.cars - 1 ? 1 : 0;
        inst[o + 10] = (t.seed * 13.7 + c * 0.618) % 1;
        // how much of the car is out in the open (its light reaches the stone)
        const out = Math.min(1, Math.max(0, Math.min(sc + CAR_LEN / 2, TRACK_LEN - (sc - CAR_LEN / 2)) / CAR_LEN));
        inst[o + 11] = 1;
        n++;
        if (c > 0 && out > 0 && lights < MAX_CAR_LIGHTS) {
          const L = lights * 4;
          this.carLights[L] = (A[0] + B[0]) / 2;
          this.carLights[L + 1] = DECK_Y + 1.35 * CAR_SCALE_Y;
          this.carLights[L + 2] = (A[2] + B[2]) / 2;
          this.carLights[L + 3] = out;
          lights++;
        }
      }
      // the headlight, from the nose (the first two trains on the line)
      if (heads < 2) {
        const pos = heads === 0 ? this.headPos : this.head2Pos;
        const dir = heads === 0 ? this.headDir : this.head2Dir;
        // still in the tunnel: the light comes out of the mouth, not through the hill
        const lampS = Math.min(TRACK_LEN + 0.3, Math.max(-0.3, t.head));
        const lampY = DECK_Y + 0.88 * CAR_SCALE_Y;
        trackPoint(lampS, 0, pos, lampY);
        // aimed along the curve, nearly level (the deck hides anything much lower)
        trackPoint(lampS + t.dir * 14, 0, B, lampY - 0.6);
        let dx = B[0] - pos[0];
        let dy = B[1] - pos[1];
        let dz = B[2] - pos[2];
        const dl = Math.hypot(dx, dy, dz) || 1;
        dx /= dl;
        dy /= dl;
        dz /= dl;
        dir[0] = dx;
        dir[1] = dy;
        dir[2] = dz;
        // fades up as the nose nears the mouth (the tunnel walls hold it in),
        // and out once it is well into the far tunnel
        const inside = t.dir > 0 ? -t.head : t.head - TRACK_LEN;
        const strength = Math.min(1, Math.max(0, 1 - (inside - 2) / 16));
        const done = t.dir > 0 ? t.head - TRACK_LEN : -t.head;
        const fade = Math.min(1, Math.max(0, 1 - (done - 4) / 10));
        if (heads === 0) this.head = Math.max(1e-3, strength * fade);
        else this.head2 = Math.max(1e-3, strength * fade);
        heads++;
      }
    }
    this.instanceCount = n;
    this.carLightCount = lights;
  }
}
