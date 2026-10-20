// The macropad's state and motion, independent of React and WebGL.
//
// Switches. Each cap rides a spring with two hard stops: pushed, it is
// driven past the bottom so it lands on the stop and bounces back a hair;
// released, the switch spring throws it up against the top of the housing,
// where it bounces again before it rests. A tap shorter than the travel
// still goes all the way down (the release waits for the bottom).
//
// Light. Every switch has an LED that idles low (breathing on the stage),
// flares while its key is down and fades after. A press also sends a ring
// of light across the plate; each neighbour flares as the ring reaches it,
// so the light visibly travels key to key.
//
// Knob. 24 detents a turn, 15° of hue each, so the indicator points at the
// hue it sets. Dragging is magnetic: the knob clings to a notch and jumps
// to the next. A new hue travels out from the knob over the keys.

import { oklchLinear, type Vec3 } from "./math";
import { KEYS, KNOB } from "./scene";
import { MAX_RIPPLES } from "./shaders";

export const DETENTS = 24;
export const HUE_STEP = 360 / DETENTS;
export const DETENT_ANGLE = (Math.PI * 2) / DETENTS;
/** Hue (OKLCH degrees) at detent 0: a warm amber. */
export const HUE_ZERO = 60;

const RIPPLE_SPEED = 4.6;

/** Named hues for screen readers (OKLCH hue, rounded to the notch). */
const HUE_NAMES: ReadonlyArray<[number, string]> = [
  [0, "rose"],
  [15, "coral"],
  [30, "vermilion"],
  [45, "tangerine"],
  [60, "amber"],
  [75, "gold"],
  [90, "citrine"],
  [105, "lime"],
  [120, "chartreuse"],
  [135, "green"],
  [150, "emerald"],
  [165, "jade"],
  [180, "teal"],
  [195, "aqua"],
  [210, "cyan"],
  [225, "sky"],
  [240, "azure"],
  [255, "cornflower"],
  [270, "indigo"],
  [285, "violet"],
  [300, "purple"],
  [315, "orchid"],
  [330, "magenta"],
  [345, "pink"],
];

export const wrapHue = (h: number) => ((h % 360) + 360) % 360;

export function hueName(h: number): string {
  const w = Math.round(wrapHue(h) / HUE_STEP) * HUE_STEP;
  return HUE_NAMES.find(([value]) => value === w % 360)?.[1] ?? "colour";
}

/** The glow colour for a hue, linear RGB, peak 1-ish. */
export function glowColor(h: number): Vec3 {
  return oklchLinear(0.76, 0.175, wrapHue(h));
}

/** glowColor sampled once per degree (0…360 inclusive), for the frame loop. */
const GLOW_LUT = (() => {
  const lut = new Float32Array(361 * 3);
  for (let d = 0; d <= 360; d++) lut.set(glowColor(d), d * 3);
  return lut;
})();

/** glowColor without allocating: writes rgb into out[at…at+2], scaled by `scale`. */
export function glowInto(h: number, out: Float32Array | number[], at: number, scale = 1) {
  const w = wrapHue(h);
  const i = Math.min(359, Math.floor(w));
  const f = w - i;
  const a = i * 3;
  const b = a + 3;
  out[at] = (GLOW_LUT[a] + (GLOW_LUT[b] - GLOW_LUT[a]) * f) * scale;
  out[at + 1] = (GLOW_LUT[a + 1] + (GLOW_LUT[b + 1] - GLOW_LUT[a + 1]) * f) * scale;
  out[at + 2] = (GLOW_LUT[a + 2] + (GLOW_LUT[b + 2] - GLOW_LUT[a + 2]) * f) * scale;
}

/* ---------------------------------------------------------------------- */
/* a switch                                                                */
/* ---------------------------------------------------------------------- */

export class Switch {
  x = 0;
  v = 0;
  held = false;
  /** Released before reaching the bottom: let go once it gets there. */
  pending = false;
  pendingAt = 0;

  get resting() {
    return this.v === 0 && (this.held ? this.x === 1 : this.x === 0) && !this.pending;
  }

  step(dt: number, now: number) {
    if (this.pending && (this.x >= 0.92 || now - this.pendingAt > 0.14)) {
      this.pending = false;
      this.held = false;
    }
    if (this.resting) return;
    const h = 1 / 480;
    let remaining = Math.min(dt, 0.05);
    while (remaining > 1e-6) {
      const s = Math.min(h, remaining);
      remaining -= s;
      const target = this.held ? 1.32 : -0.28;
      const k = this.held ? 1150 : 760;
      const c = this.held ? 38 : 30;
      this.v += (-k * (this.x - target) - c * this.v) * s;
      this.x += this.v * s;
      if (this.x > 1) {
        this.x = 1;
        if (this.v > 0) this.v = -this.v * 0.16;
      } else if (this.x < 0) {
        this.x = 0;
        if (this.v < 0) this.v = -this.v * 0.3;
      }
    }
    // settle on the stop once the bounces are spent
    const stop = this.held ? 1 : 0;
    if (Math.abs(this.x - stop) < 0.004 && Math.abs(this.v) < 0.4) {
      this.x = stop;
      this.v = 0;
    }
  }
}

/** Seconds from a press to the cap landing on the bottom stop (for the thock). */
export const BOTTOM_OUT = (() => {
  const s = new Switch();
  s.held = true;
  let t = 0;
  while (s.x < 1 && t < 0.3) {
    s.step(1 / 480, t);
    t += 1 / 480;
  }
  return t;
})();

/** Seconds from a release to the cap reaching the top (for the clack). */
export const TOP_OUT = (() => {
  const s = new Switch();
  s.x = 1;
  let t = 0;
  while (s.x > 0 && t < 0.3) {
    s.step(1 / 480, t);
    t += 1 / 480;
  }
  return t;
})();

/* ---------------------------------------------------------------------- */
/* the pad                                                                 */
/* ---------------------------------------------------------------------- */

/** A ring of light on the plate. The pad keeps a fixed pool of them. */
type Ripple = { alive: boolean; x: number; z: number; age: number; amp: number; hue: number; hit: number };

const RIPPLE_LIFE = 1.6;

const KNOB_DISTANCE = KEYS.map((k) => Math.hypot(k.x - KNOB.x, k.z - KNOB.z));
/** Key-to-key distances (9 × 9), so a frame never calls hypot for them. */
const KEY_DISTANCE = (() => {
  const d = new Float32Array(81);
  for (const a of KEYS) for (const b of KEYS) d[a.index * 9 + b.index] = Math.hypot(a.x - b.x, a.z - b.z);
  return d;
})();

/** What Pad.fill writes into (the renderer's per-frame arrays). */
export type FillTarget = {
  travel: Float32Array;
  glow: Float32Array;
  ripples: Float32Array;
  rippleColors: Float32Array;
  knobLight: Vec3;
  /** How far the idle LEDs breathe, 0 (steady) … 1. */
  breathe: number;
  reduced: boolean;
  gain: number;
  /** Written: how many ripples are live (they come first). */
  rippleCount: number;
};

export class Pad {
  readonly switches = KEYS.map(() => new Switch());
  readonly flash = new Float32Array(9);
  /** A steady extra glow per key (the reduced-motion still uses it). */
  readonly accent = new Float32Array(9);
  /** Displayed hue per key (unwrapped degrees). */
  readonly hues = new Float32Array(9);
  /** Where the hue is going (unwrapped degrees). */
  hue = HUE_ZERO;
  knobHue = HUE_ZERO;
  detent = 0;
  /** Knob angle as shown (radians, clockwise from the rest notch). */
  angle = 0;
  angleV = 0;
  angleTarget = 0;
  dragging = false;
  readonly ripples: Ripple[] = Array.from({ length: MAX_RIPPLES }, () => ({ alive: false, x: 0, z: 0, age: 0, amp: 0, hue: 0, hit: 0 }));
  time = 0;
  /** Idle LED level and how much a press flares. */
  idle = 0.3;
  private history: Array<{ t: number; hue: number }> = [{ t: -1, hue: HUE_ZERO }];

  constructor() {
    this.hues.fill(HUE_ZERO);
  }

  /** Press a key; returns false if it was already down. */
  press(index: number, reduced: boolean, strength = 1): boolean {
    const s = this.switches[index];
    if (!s) return false;
    if (s.held && !s.pending) return false;
    s.held = true;
    s.pending = false;
    if (reduced) {
      s.x = 1;
      s.v = 0;
    }
    this.flash[index] = Math.max(this.flash[index], 1.15 * strength);
    if (reduced) {
      // no travelling ring: the neighbours brighten in place
      for (let j = 0; j < 9; j++) {
        if (j === index) continue;
        const d = KEY_DISTANCE[index * 9 + j];
        this.flash[j] = Math.max(this.flash[j], 0.55 * strength * Math.exp(-d * 0.55));
      }
    } else this.spawn(index, 0.9 * strength);
    return true;
  }

  /** Light a key and send a ring from it without pressing it. */
  pulse(index: number, strength: number, reduced: boolean) {
    if (!KEYS[index]) return;
    this.flash[index] = Math.max(this.flash[index], strength);
    if (!reduced) this.spawn(index, 0.8 * strength);
  }

  /** A new ring from a key, in a free slot of the pool (or the oldest). */
  private spawn(index: number, amp: number) {
    let slot = this.ripples[0];
    for (const r of this.ripples) {
      if (!r.alive) {
        slot = r;
        break;
      }
      if (r.age > slot.age) slot = r;
    }
    const key = KEYS[index];
    slot.alive = true;
    slot.x = key.x;
    slot.z = key.z;
    slot.age = 0;
    slot.amp = amp;
    slot.hue = this.hues[index];
    slot.hit = 1 << index;
  }

  release(index: number, reduced: boolean) {
    const s = this.switches[index];
    if (!s || !s.held) return;
    if (reduced) {
      s.held = false;
      s.pending = false;
      s.x = 0;
      s.v = 0;
      return;
    }
    if (s.x < 0.92) {
      s.pending = true;
      s.pendingAt = this.time;
    } else {
      s.held = false;
    }
  }

  isDown(index: number) {
    const s = this.switches[index];
    return Boolean(s && s.held && !s.pending);
  }

  /** Turn the knob by whole notches. Returns the new hue (unwrapped). */
  turn(delta: number, reduced: boolean): number {
    if (!delta) return this.hue;
    this.detent += delta;
    this.angleTarget = this.detent * DETENT_ANGLE;
    if (reduced) {
      this.angle = this.angleTarget;
      this.angleV = 0;
    }
    this.setHue(HUE_ZERO + this.detent * HUE_STEP, reduced);
    return this.hue;
  }

  /** While dragging: the raw angle under the hand (radians). Returns notches moved. */
  dragTo(raw: number, reduced: boolean): number {
    const nearest = Math.round(raw / DETENT_ANGLE);
    const moved = nearest - this.detent;
    if (moved) {
      this.detent = nearest;
      this.setHue(HUE_ZERO + this.detent * HUE_STEP, reduced);
    }
    // magnetic: cling to the notch, snap across the midpoint
    const residual = raw - nearest * DETENT_ANGLE;
    const t = residual / (DETENT_ANGLE / 2);
    this.angleTarget = nearest * DETENT_ANGLE + (DETENT_ANGLE / 2) * Math.sign(t) * Math.abs(t) ** 3 * 0.85;
    if (reduced) {
      this.angle = this.angleTarget;
      this.angleV = 0;
    }
    return moved;
  }

  endDrag() {
    this.dragging = false;
    this.angleTarget = this.detent * DETENT_ANGLE;
  }

  private setHue(hue: number, reduced: boolean) {
    this.hue = hue;
    this.history.push({ t: this.time, hue });
    if (this.history.length > 64) this.history.splice(0, this.history.length - 64);
    if (reduced) {
      this.hues.fill(hue);
      this.knobHue = hue;
    }
  }

  private hueAt(t: number): number {
    const h = this.history;
    for (let i = h.length - 1; i >= 0; i--) if (h[i].t <= t) return h[i].hue;
    return h[0].hue;
  }

  /** Advance by dt seconds. Returns true while anything is still moving. */
  step(dt: number, reduced: boolean): boolean {
    this.time += dt;
    const now = this.time;
    let busy = false;

    for (const s of this.switches) {
      if (reduced) {
        if (s.pending) {
          s.pending = false;
          s.held = false;
        }
        s.x = s.held ? 1 : 0;
        s.v = 0;
      } else {
        s.step(dt, now);
      }
      if (!s.resting) busy = true;
    }

    // ripples travel; each key they reach flares
    for (const r of this.ripples) {
      if (!r.alive) continue;
      r.age += dt;
      if (r.age >= RIPPLE_LIFE) {
        r.alive = false;
        continue;
      }
      busy = true;
      const radius = r.age * RIPPLE_SPEED;
      for (let j = 0; j < 9; j++) {
        if (r.hit & (1 << j)) continue;
        const k = KEYS[j];
        const d = Math.hypot(k.x - r.x, k.z - r.z);
        if (radius >= d - 0.25) {
          r.hit |= 1 << j;
          this.flash[j] = Math.max(this.flash[j], 0.62 * r.amp * Math.exp(-d * 0.42));
        }
      }
    }

    // the LEDs
    for (let i = 0; i < 9; i++) {
      if (this.isDown(i)) this.flash[i] = Math.max(this.flash[i], 0.85);
      else if (this.flash[i] > 0) {
        this.flash[i] *= Math.exp(-dt * (reduced ? 4 : 3.1));
        if (this.flash[i] < 0.002) this.flash[i] = 0;
        else busy = true;
      }
    }

    // hue travels out from the knob
    for (let i = 0; i < 9; i++) {
      const target = this.hueAt(now - KNOB_DISTANCE[i] * 0.075);
      if (reduced) this.hues[i] = this.hue;
      else {
        const next = this.hues[i] + (target - this.hues[i]) * (1 - Math.exp(-dt * 16));
        this.hues[i] = Math.abs(target - next) < 0.05 ? target : next;
      }
      if (this.hues[i] !== this.hue) busy = true;
    }
    this.knobHue = reduced ? this.hue : this.knobHue + (this.hue - this.knobHue) * (1 - Math.exp(-dt * 22));
    if (Math.abs(this.knobHue - this.hue) < 0.05) this.knobHue = this.hue;
    else busy = true;

    // the knob's own spring (detent snap with a little overshoot)
    if (!reduced) {
      const h = 1 / 480;
      let remaining = Math.min(dt, 0.05);
      const k = this.dragging ? 900 : 520;
      const c = this.dragging ? 52 : 26;
      while (remaining > 1e-6) {
        const s = Math.min(h, remaining);
        remaining -= s;
        this.angleV += (-k * (this.angle - this.angleTarget) - c * this.angleV) * s;
        this.angle += this.angleV * s;
      }
      if (Math.abs(this.angle - this.angleTarget) < 1e-4 && Math.abs(this.angleV) < 1e-3) {
        this.angle = this.angleTarget;
        this.angleV = 0;
      } else busy = true;
    } else {
      this.angle = this.angleTarget;
    }
    if (this.dragging) busy = true;

    return busy;
  }

  /**
   * Fills the renderer's per-frame arrays (allocates nothing). The idle
   * level breathes by `out.breathe`: at 0 every LED sits at the wave's mean.
   */
  fill(out: FillTarget) {
    const t = this.time;
    const breathe = out.reduced ? 0 : out.breathe;
    for (let i = 0; i < 9; i++) {
      out.travel[i] = this.switches[i].x;
      const wave = 0.86 + 0.14 * breathe * Math.sin(t * 1.25 - KEYS[i].x * 0.7 - KEYS[i].z * 0.5);
      const level = (this.idle * wave + this.flash[i] + this.accent[i]) * out.gain;
      glowInto(this.hues[i], out.glow, i * 3);
      // a hot key runs a little whiter at its core (the shader keeps the
      // walls and the polished edge from clipping to white)
      const white = Math.min(0.3, this.flash[i] * 0.24);
      const g = out.glow;
      g[i * 3] = (g[i * 3] * (1 - white) + white) * level;
      g[i * 3 + 1] = (g[i * 3 + 1] * (1 - white) + white) * level;
      g[i * 3 + 2] = (g[i * 3 + 2] * (1 - white) + white) * level;
    }
    // live ripples first, so the shader can stop at the count
    let n = 0;
    for (const r of this.ripples) {
      if (!r.alive) continue;
      const fade = Math.exp(-r.age * 2.6) * Math.min(1, r.age * 30);
      out.ripples[n * 4] = r.x;
      out.ripples[n * 4 + 1] = r.z;
      out.ripples[n * 4 + 2] = r.age * RIPPLE_SPEED;
      out.ripples[n * 4 + 3] = r.amp * fade * 0.55 * out.gain;
      glowInto(r.hue, out.rippleColors, n * 3);
      n += 1;
    }
    for (let i = n; i < MAX_RIPPLES; i++) out.ripples[i * 4 + 3] = 0;
    out.rippleCount = n;
    glowInto(this.knobHue, out.knobLight, 0, 0.9 * out.gain);
  }
}

/* ---------------------------------------------------------------------- */
/* the tile's self-play                                                    */
/* ---------------------------------------------------------------------- */

/** A slow, wandering little figure over the nine keys (indices). */
const FIGURE = [4, 0, 8, 2, 6, 1, 5, 7, 3, 4, 2, 6, 0, 8];

export class AutoPlay {
  private next = 0.9;
  private step = 0;
  private holding = -1;
  private releaseAt = 0;

  /** Press a key briefly (the tile's hover). */
  poke(pad: Pad, key: number, reduced: boolean) {
    if (this.holding >= 0) pad.release(this.holding, reduced);
    pad.press(key, reduced, 0.7);
    this.holding = key;
    this.releaseAt = pad.time + 0.12;
    this.next = Math.max(this.next, pad.time + 0.9);
  }

  /** Releases a held key when its time is up (call every frame). */
  settle(pad: Pad, reduced: boolean) {
    if (this.holding >= 0 && pad.time >= this.releaseAt) {
      pad.release(this.holding, reduced);
      this.holding = -1;
    }
  }

  /** Call every frame with the pad's clock. */
  tick(pad: Pad, reduced: boolean) {
    const t = pad.time;
    this.settle(pad, reduced);
    if (t < this.next) return;
    const key = FIGURE[this.step % FIGURE.length];
    this.step += 1;
    pad.press(key, reduced, 0.8);
    this.holding = key;
    this.releaseAt = t + 0.13;
    // every few notes the knob moves on a notch or two
    if (this.step % 5 === 0) pad.turn(this.step % 10 === 0 ? 2 : 1, reduced);
    this.next = t + 1.05 + ((this.step * 0.37) % 0.5);
  }
}
