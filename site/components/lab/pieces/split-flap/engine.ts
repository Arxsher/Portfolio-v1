// The flap mechanism: DOM cells driven by one clock, no React.
//
// A cell is four kinds of half-flap stacked in one slot (see styles.ts):
//
//   static top     the top half of the character waiting behind the falling flap
//   static bottom  the bottom half of the character already down
//   fall  ×2       a flap's FRONT: the top half of the old character, hinged
//                  at its lower edge, folding toward you and down to 90°
//   land  ×2       the same flap's BACK past 90°: the bottom half of the new
//                  character, swinging down onto the stack, bouncing off the
//                  stop and settling
//
// Two flap slots are enough because a cell releases its flaps one at a time,
// never faster than one flap falls, so at most two are moving at once (one
// landing, the next one falling over it). A run through the drum is a
// sequence of characters seq[0] → seq[n], one flip per `period`; at any
// time the whole look of the cell (which characters, angles and shadows)
// follows from the clock alone, so retargeting mid-run, pausing and
// resuming need no special cases.
//
// Light comes from above: the falling front darkens as it tips away from
// the light, the landing back catches a glint while it faces up, the
// revealed top half sits in the falling flap's shadow, and the bottom half
// darkens under the flap swinging over it.

import type { Glyph, Tone } from "./drum";

export type Timing = {
  /** Seconds between two flaps of one cell (≥ fall). */
  period: number;
  /** Seconds a flap takes to fall 180°. */
  fall: number;
  /** How far the flap bounces back off the stop, in degrees. */
  bounce: number;
  /** Seconds for one bounce. */
  bounceTime: number;
  /** Seconds for the bounce to die away. */
  decay: number;
  /** Seconds from landing until the flap counts as still. */
  settle: number;
  /** ± fraction of per-cell variation in period and fall (so a row never ticks in lockstep). */
  jitter: number;
};

export const STAGE_TIMING: Timing = {
  period: 0.066,
  fall: 0.062,
  bounce: 17,
  bounceTime: 0.052,
  decay: 0.04,
  settle: 0.17,
  jitter: 0.07,
};

export const TILE_TIMING: Timing = {
  period: 0.078,
  fall: 0.072,
  bounce: 15,
  bounceTime: 0.056,
  decay: 0.04,
  settle: 0.16,
  jitter: 0.06,
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** One half-flap element with a write cache, so a frame only touches what changed. */
class Half {
  el: HTMLDivElement;
  private ch = "";
  private tone: Tone | "" = "";
  private transform = "";
  private shade = -1;
  private shown: boolean;

  constructor(className: string, parent: HTMLElement, shown: boolean, overlay?: "light") {
    this.el = document.createElement("div");
    this.el.className = className;
    if (overlay) this.el.dataset.o = "l";
    this.shown = shown;
    if (!shown) this.el.style.display = "none";
    parent.appendChild(this.el);
  }

  glyph(glyph: Glyph) {
    if (glyph.ch !== this.ch) {
      this.ch = glyph.ch;
      this.el.dataset.c = glyph.ch;
    }
    if (glyph.tone !== this.tone) {
      this.tone = glyph.tone;
      if (glyph.tone === "ink") delete this.el.dataset.t;
      else this.el.dataset.t = glyph.tone;
    }
  }

  rotate(value: string) {
    if (value !== this.transform) {
      this.transform = value;
      this.el.style.transform = value;
    }
  }

  setShade(value: number) {
    const rounded = Math.round(value * 100) / 100;
    if (rounded !== this.shade) {
      this.shade = rounded;
      this.el.style.setProperty("--s", String(rounded));
    }
  }

  show(on: boolean) {
    if (on !== this.shown) {
      this.shown = on;
      this.el.style.display = on ? "" : "none";
    }
  }

  layer(z: number) {
    this.el.style.zIndex = String(z);
  }
}

export class Cell {
  readonly el: HTMLDivElement;
  readonly drum: string;
  /** -1 (left) … 1 (right): where its clack sits in the stereo field. */
  pan = 0;
  /** Characters from the one showing (seq[0] at t0) to the target. */
  seq: Glyph[];
  t0 = 0;
  /** Held down: keeps riffling through the drum. */
  spinning = false;
  readonly period: number;
  readonly fall: number;
  private readonly top: Half;
  private readonly bottom: Half;
  private readonly falls: [Half, Half];
  private readonly lands: [Half, Half];
  private layered = -1;

  constructor(drum: string, glyph: Glyph, timing: Timing, random: () => number) {
    this.drum = drum;
    this.seq = [glyph];
    const vary = 1 + (random() * 2 - 1) * timing.jitter;
    this.period = timing.period * vary;
    this.fall = Math.min(this.period, timing.fall * (1 + (random() * 2 - 1) * timing.jitter * 0.6));
    this.el = document.createElement("div");
    this.el.className = "sf-cell";
    this.top = new Half("sf-h sf-t", this.el, true);
    this.bottom = new Half("sf-h sf-b", this.el, true);
    this.falls = [new Half("sf-h sf-t sf-fall", this.el, false), new Half("sf-h sf-t sf-fall", this.el, false)];
    this.lands = [
      new Half("sf-h sf-b sf-land", this.el, false, "light"),
      new Half("sf-h sf-b sf-land", this.el, false, "light"),
    ];
    this.top.glyph(glyph);
    this.bottom.glyph(glyph);
  }

  /** The character the cell will come to rest on. */
  get target(): Glyph {
    return this.seq[this.seq.length - 1];
  }

  /** Index of the last flap released at `time` (0: none yet). */
  started(time: number): number {
    const n = this.seq.length - 1;
    if (n <= 0 || time < this.t0) return 0;
    return Math.min(n, Math.floor((time - this.t0) / this.period) + 1);
  }

  /** Flaps landed by `time` (for the clack). */
  landed(time: number): number {
    const n = this.seq.length - 1;
    if (n <= 0) return 0;
    const count = Math.floor((time - this.t0 - this.fall) / this.period) + 1;
    return count < 0 ? 0 : count > n ? n : count;
  }

  /** The way round the drum from `from` to `to` (excluding `from`). */
  path(from: string, to: string): string[] {
    const length = this.drum.length;
    const a = Math.max(0, this.drum.indexOf(from));
    const b = Math.max(0, this.drum.indexOf(to));
    const steps = (b - a + length) % length;
    return Array.from({ length: steps }, (_, i) => this.drum[(a + 1 + i) % length]);
  }

  next(ch: string): string {
    const index = Math.max(0, this.drum.indexOf(ch));
    return this.drum[(index + 1) % this.drum.length];
  }

  /** Flap angle `tau` seconds after release: falls under gravity, hits the stop, bounces, settles. */
  angle(tau: number, timing: Timing): number {
    if (tau <= 0) return 0;
    if (tau < this.fall) return 180 * Math.pow(tau / this.fall, 1.55);
    const t = tau - this.fall;
    return 180 - timing.bounce * Math.exp(-t / timing.decay) * Math.abs(Math.sin((Math.PI * t) / timing.bounceTime));
  }

  /** Draws the cell at `time`. Returns false once it has come to rest. */
  draw(time: number, timing: Timing): boolean {
    const n = this.seq.length - 1;
    const k = this.started(time);
    const life = this.fall + timing.settle;

    let lowest = -1;
    let latestAngle = -1;
    let under: Half = this.bottom;
    let underGlint = 0;
    let used0 = false;
    let used1 = false;

    for (let i = Math.max(1, k - 1); i <= k; i++) {
      const tau = time - (this.t0 + (i - 1) * this.period);
      if (tau < 0 || tau >= life) continue;
      const slot = i & 1;
      if (slot) used1 = true;
      else used0 = true;
      if (lowest < 0) lowest = i;
      const theta = this.angle(tau, timing);
      const fall = this.falls[slot];
      const land = this.lands[slot];
      fall.glyph(this.seq[i - 1]);
      land.glyph(this.seq[i]);
      if (theta < 90) {
        fall.show(true);
        land.show(false);
        fall.rotate(`rotateX(${(-theta).toFixed(2)}deg)`);
        fall.setShade(0.78 * Math.pow(theta / 90, 1.35));
      } else {
        fall.show(false);
        land.show(true);
        land.rotate(`rotateX(${(180 - theta).toFixed(2)}deg)`);
        const glint = 0.3 * Math.sin(((180 - theta) / 90) * (Math.PI / 2));
        land.setShade(glint);
        if (i !== k) underGlint = glint;
      }
      if (i === k) latestAngle = theta;
      else under = land;
    }
    if (!used0) {
      this.falls[0].show(false);
      this.lands[0].show(false);
    }
    if (!used1) {
      this.falls[1].show(false);
      this.lands[1].show(false);
    }
    // The newest flap sits over the one before it.
    const front = k & 1;
    if (front !== this.layered) {
      this.layered = front;
      this.falls[front].layer(3);
      this.lands[front].layer(3);
      this.falls[front ^ 1].layer(2);
      this.lands[front ^ 1].layer(2);
    }

    this.top.glyph(this.seq[k]);
    this.bottom.glyph(this.seq[lowest > 0 ? lowest - 1 : k]);

    // Shadows from the newest flap: on the half it uncovers, and on whatever it swings over.
    this.top.setShade(latestAngle >= 0 && latestAngle < 90 ? 0.5 * (1 - latestAngle / 90) : 0);
    const cast = latestAngle > 50 ? 0.55 * Math.sin(Math.PI * clamp01((latestAngle - 50) / 130)) : 0;
    if (under === this.bottom) {
      this.bottom.setShade(cast);
    } else {
      this.bottom.setShade(0);
      // the settling flap underneath: its glint gives way to the shadow
      under.setShade(Math.max(0, underGlint - cast));
    }

    const done = !this.spinning && k >= n && (n === 0 || time - (this.t0 + (n - 1) * this.period) >= life);
    if (done) this.rest(this.seq[n], time);
    return !done;
  }

  /**
   * Forgets flaps that landed long ago, so a held flap's run stays a few
   * entries long however long it is held. Drops an even count, so every
   * flap keeps its slot (slot = index & 1) and nothing on screen changes.
   */
  rebase(time: number) {
    const k = this.started(time);
    if (k <= 4) return;
    const drop = (k - 1) & ~1;
    this.seq.splice(0, drop);
    this.t0 += drop * this.period;
  }

  /** Snaps to a character and stops. */
  rest(glyph: Glyph, time: number) {
    this.seq = [glyph];
    this.t0 = time;
    this.spinning = false;
    for (let slot = 0; slot < 2; slot++) {
      this.falls[slot].show(false);
      this.lands[slot].show(false);
    }
    this.top.glyph(glyph);
    this.bottom.glyph(glyph);
    this.top.setShade(0);
    this.bottom.setShade(0);
  }
}

export type FrameReport = {
  /** Still moving (keep the loop running). */
  busy: boolean;
  /** Flaps that hit the stop this frame, and where they sit on average (-1 … 1). */
  landings: number;
  pan: number;
};

/** Every cell on one piece, on one clock (seconds, paused while the piece is). */
export class FlapEngine {
  time = 0;
  readonly timing: Timing;
  private readonly active = new Set<Cell>();
  private readonly random: () => number;

  constructor(timing: Timing, random: () => number = Math.random) {
    this.timing = timing;
    this.random = random;
  }

  create(drum: string, glyph: Glyph): Cell {
    return new Cell(drum, glyph, this.timing, this.random);
  }

  release(cell: Cell) {
    this.active.delete(cell);
    cell.el.remove();
  }

  get busy(): boolean {
    return this.active.size > 0;
  }

  /** Still turning (or waiting to start), as opposed to at rest. */
  turning(cell: Cell): boolean {
    return this.active.has(cell);
  }

  /** Turn the cell to `target`, the first flap falling after `delay` seconds (if it is at rest). */
  set(cell: Cell, target: Glyph, delay = 0) {
    if (!this.active.has(cell)) {
      const current = cell.seq[0];
      if (current.ch === target.ch) {
        if (current.tone !== target.tone) cell.rest(target, this.time);
        return;
      }
      cell.seq = [current, ...cell.path(current.ch, target.ch).map((ch) => ({ ch, tone: target.tone }))];
      cell.t0 = this.time + delay;
      this.active.add(cell);
      return;
    }
    // Already turning: keep what has been released, re-plan the rest of the way.
    const k = cell.started(this.time);
    const base = cell.seq[k];
    const rest = cell.path(base.ch, target.ch).map((ch) => ({ ch, tone: target.tone }));
    cell.seq = cell.seq.slice(0, k + 1).concat(rest);
    // Same letter, new ink: the flap already on its way carries the new colour.
    if (!rest.length && base.tone !== target.tone) cell.seq[k] = target;
  }

  /** Show `glyph` at once (reduced motion, first paint). */
  place(cell: Cell, glyph: Glyph) {
    this.active.delete(cell);
    cell.rest(glyph, this.time);
  }

  /** One more flap. */
  nudge(cell: Cell) {
    const target = cell.target;
    this.set(cell, { ch: cell.next(target.ch), tone: target.tone });
  }

  /** Keep riffling while held. */
  spin(cell: Cell, on: boolean) {
    cell.spinning = on;
    if (on) this.nudge(cell);
  }

  step(dt: number): FrameReport {
    const previous = this.time;
    this.time += dt;
    const time = this.time;
    let landings = 0;
    let pan = 0;
    for (const cell of this.active) {
      // Held down: keep two flaps queued ahead of the falling one.
      if (cell.spinning && cell.seq.length - 1 - cell.started(time) < 2) {
        const last = cell.target;
        cell.seq.push({ ch: cell.next(last.ch), tone: last.tone });
      }
      const hits = cell.landed(time) - cell.landed(previous);
      if (hits > 0) {
        landings += hits;
        pan += cell.pan * hits;
      }
      if (cell.spinning) cell.rebase(time);
      if (!cell.draw(time, this.timing)) this.active.delete(cell);
    }
    return { busy: this.active.size > 0, landings, pan: landings ? pan / landings : 0 };
  }
}
