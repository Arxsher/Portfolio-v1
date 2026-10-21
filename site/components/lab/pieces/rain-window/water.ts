// Water on a pane of glass: the raindrops on the outside, or the
// condensation's own drips on the inside (the same physics, two instances).
//
// - Beads: the tiny droplets that cover wet glass. They never move; they
//   sit in a grid of small cells (a few per cell at most, so the glass beads
//   up to an even, natural density) and are swallowed by any drop that runs
//   into them. A bead that grows past a size (beads landing on beads)
//   becomes a drop.
// - Drops: bigger, and alive. Surface tension pins a drop until it is
//   heavy enough for gravity to win; how heavy depends on the glass under
//   it (a fixed friction field: clean patches let go early, grubby ones
//   hold on), so a running drop stalls, lurches and goes again, and wanders
//   a little sideways toward the slicker side. Running, it eats the beads in
//   its lane, leaves a dotted trail of its own water behind and so slows
//   down; two drops that touch merge (volume and momentum are kept) and
//   the merged one wobbles on a spring and, heavier now, often sets off.
//   Drops that reach the bottom rail sit on it and slowly drain away.
// - A knock on the glass is a wave running out from the knuckle: each drop
//   it passes jiggles and, briefly, needs less weight to let go, so a
//   knock shakes a few heavy ones loose. Thunder does the same to the whole
//   pane.
//
// Everything is in CSS px over the glass; all storage is allocated in
// setBounds() (on a resize), nothing per frame.

import { hash2 } from "../../hooks";
import type { WindowLayout } from "./layout";

export type WaterConfig = {
  /** most drops alive at once */
  capacity: number;
  /** bead grid cell (px at unit 1) and beads per cell */
  cell: number;
  cellCap: number;
  /** a bead bigger than this is a drop (px at unit 1) */
  beadMax: number;
  /** radius at which gravity beats surface tension on average glass (px at unit 1) */
  slide: number;
  /** px/s at unit 1, running speed for a drop half again as big as `slide` */
  speed: number;
  maxSpeed: number;
  /** share of its radius a running drop leaves per trail bead */
  trail: number;
  /** record the lanes of moving drops (the inside drips clear the fog) */
  lanes: boolean;
  seed: number;
};

const KNOCKS = 4;
const WAVE_SPEED = 1500;

export class Water {
  readonly cfg: WaterConfig;
  unit = 1;
  /** sideways push on running drops (storm wind), fraction of their fall speed */
  wind = 0;

  // panes (x, y, w, h) and the glass box
  private panes = new Float32Array(12);
  private paneN = 0;
  gx = 0;
  gy = 0;
  gw = 1;
  gh = 1;

  // drops
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly r: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly wob: Float32Array;
  private wobV: Float32Array;
  private wander: Float32Array;
  private wanderT: Float32Array;
  private trailD: Float32Array;
  private trailN: Float32Array;
  private loose: Float32Array;
  private sit: Uint8Array;
  private pane: Int8Array;
  private knockId: Int32Array;
  readonly alive: Uint8Array;
  private free: Int32Array;
  private freeN = 0;
  /** highest slot index in use + 1 */
  high = 0;
  drops = 0;

  // beads
  private cell = 10;
  private cols = 0;
  private rows = 0;
  private cap = 4;
  private bx = new Float32Array(0);
  private by = new Float32Array(0);
  private br = new Float32Array(0);
  private bn = new Uint8Array(0);
  beads = 0;

  // collision grid for drops
  private dCell = 24;
  private dCols = 0;
  private dRows = 0;
  private dHead = new Int32Array(0);
  private dNext: Int32Array;
  private indexed = false;

  // knocks
  private kx = new Float32Array(KNOCKS);
  private ky = new Float32Array(KNOCKS);
  private kAge = new Float32Array(KNOCKS);
  private kStrength = new Float32Array(KNOCKS);
  private kReach = new Float32Array(KNOCKS);
  private kSerial = new Int32Array(KNOCKS);
  private serial = 0;
  /** whole-pane shake (thunder), decays */
  private shake = 0;

  // rain
  private nextImpact = 0;

  /** instances for the field pass: (x, y, rx, ry) per kernel */
  instances: Float32Array;
  instanceCount = 0;
  /** lanes of the moving drops this step: (x0, y0, x1, y1, r) */
  lanes: Float32Array;
  laneCount = 0;
  /** set when anything visible changed since the last instances() */
  dirty = true;

  private seed: number;
  private rngState: number;

  constructor(cfg: WaterConfig) {
    this.cfg = cfg;
    const c = cfg.capacity;
    this.x = new Float32Array(c);
    this.y = new Float32Array(c);
    this.r = new Float32Array(c);
    this.vx = new Float32Array(c);
    this.vy = new Float32Array(c);
    this.wob = new Float32Array(c);
    this.wobV = new Float32Array(c);
    this.wander = new Float32Array(c);
    this.wanderT = new Float32Array(c);
    this.trailD = new Float32Array(c);
    this.trailN = new Float32Array(c);
    this.loose = new Float32Array(c);
    this.sit = new Uint8Array(c);
    this.pane = new Int8Array(c);
    this.knockId = new Int32Array(c);
    this.alive = new Uint8Array(c);
    this.free = new Int32Array(c);
    this.dNext = new Int32Array(c);
    this.instances = new Float32Array(0);
    this.lanes = new Float32Array(c * 5);
    this.seed = cfg.seed >>> 0;
    this.rngState = this.seed;
    this.reset();
  }

  /** mulberry32, inline so the hot loops don't call through a closure */
  rand(): number {
    let t = (this.rngState = (this.rngState + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Fit to a new window: storage is (re)allocated here, and the glass is cleared. */
  setBounds(l: WindowLayout) {
    this.unit = l.unit;
    this.paneN = l.paneCount;
    for (let i = 0; i < l.paneCount; i++) {
      const p = l.panes[i];
      this.panes[i * 4] = p.x;
      this.panes[i * 4 + 1] = p.y;
      this.panes[i * 4 + 2] = p.w;
      this.panes[i * 4 + 3] = p.h;
    }
    this.gx = l.glass.x;
    this.gy = l.glass.y;
    this.gw = Math.max(1, l.glass.w);
    this.gh = Math.max(1, l.glass.h);
    const u = this.unit;
    this.cell = Math.max(5, this.cfg.cell * u);
    this.cap = this.cfg.cellCap;
    this.cols = Math.ceil(this.gw / this.cell) + 1;
    this.rows = Math.ceil(this.gh / this.cell) + 1;
    const n = this.cols * this.rows;
    if (this.bn.length < n) {
      this.bn = new Uint8Array(n);
      this.bx = new Float32Array(n * this.cap);
      this.by = new Float32Array(n * this.cap);
      this.br = new Float32Array(n * this.cap);
    }
    this.dCell = Math.max(12, 24 * u);
    this.dCols = Math.ceil(this.gw / this.dCell) + 1;
    this.dRows = Math.ceil(this.gh / this.dCell) + 1;
    if (this.dHead.length < this.dCols * this.dRows) this.dHead = new Int32Array(this.dCols * this.dRows);
    const need = (n * this.cap + this.cfg.capacity * 3) * 4;
    if (this.instances.length < need) this.instances = new Float32Array(need);
    this.reset();
  }

  /** Clear the glass (same seed, so a reset glass beads up the same way). */
  reset() {
    this.rngState = this.seed;
    this.alive.fill(0);
    this.freeN = 0;
    for (let i = this.cfg.capacity - 1; i >= 0; i--) this.free[this.freeN++] = i;
    this.high = 0;
    this.drops = 0;
    this.bn.fill(0);
    this.beads = 0;
    this.kReach.fill(0);
    this.shake = 0;
    this.nextImpact = 0;
    this.laneCount = 0;
    this.indexed = false;
    this.dirty = true;
  }

  /* -------------------------------------------------------------------- */
  /* glass                                                                 */
  /* -------------------------------------------------------------------- */

  /** Index of the pane holding (x, y), or -1. */
  paneOf(x: number, y: number): number {
    const p = this.panes;
    for (let i = 0; i < this.paneN; i++) {
      const o = i * 4;
      if (x >= p[o] && x <= p[o] + p[o + 2] && y >= p[o + 1] && y <= p[o + 1] + p[o + 3]) return i;
    }
    return -1;
  }

  /**
   * How hard the glass holds a drop here (about 0.8 … 1.3): two octaves of
   * value noise, fixed to the glass, so the same spots always catch.
   */
  friction(x: number, y: number): number {
    const u = this.unit;
    return 0.8 + 0.28 * valueNoise(x / (16 * u), y / (16 * u), this.seed) + 0.22 * valueNoise(x / (70 * u), y / (70 * u), this.seed + 7);
  }

  /* -------------------------------------------------------------------- */
  /* beads                                                                 */
  /* -------------------------------------------------------------------- */

  private cellOf(x: number, y: number): number {
    const c = Math.min(this.cols - 1, Math.max(0, Math.floor((x - this.gx) / this.cell)));
    const r = Math.min(this.rows - 1, Math.max(0, Math.floor((y - this.gy) / this.cell)));
    return r * this.cols + c;
  }

  /** A bead at (x, y): into its cell, or onto the nearest bead there if the cell is full. */
  addBead(x: number, y: number, r: number) {
    if (r <= 0.15 || this.paneOf(x, y) < 0) return;
    if (r > this.cfg.beadMax * this.unit) {
      this.addDrop(x, y, r, 0, 0);
      return;
    }
    const c = this.cellOf(x, y);
    const n = this.bn[c];
    const base = c * this.cap;
    if (n < this.cap) {
      this.bx[base + n] = x;
      this.by[base + n] = y;
      this.br[base + n] = r;
      this.bn[c] = n + 1;
      this.beads++;
      this.dirty = true;
      return;
    }
    // full: it lands on the nearest one, and they join
    let best = 0;
    let bestD = Infinity;
    for (let k = 0; k < n; k++) {
      const dx = this.bx[base + k] - x;
      const dy = this.by[base + k] - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    const i = base + best;
    const r0 = this.br[i];
    const v0 = r0 * r0 * r0;
    const v1 = r * r * r;
    const rr = Math.cbrt(v0 + v1);
    const nx = (this.bx[i] * v0 + x * v1) / (v0 + v1);
    const ny = (this.by[i] * v0 + y * v1) / (v0 + v1);
    if (rr > this.cfg.beadMax * this.unit) {
      this.removeBead(c, best);
      this.addDrop(nx, ny, rr, 0, 0);
    } else {
      this.bx[i] = nx;
      this.by[i] = ny;
      this.br[i] = rr;
    }
    this.dirty = true;
  }

  private removeBead(c: number, k: number) {
    const base = c * this.cap;
    const last = this.bn[c] - 1;
    if (k !== last) {
      this.bx[base + k] = this.bx[base + last];
      this.by[base + k] = this.by[base + last];
      this.br[base + k] = this.br[base + last];
    }
    this.bn[c] = last;
    this.beads--;
    this.dirty = true;
  }

  /**
   * Remove the beads within `reach` of (x, y) (a bead counts as touching
   * when its centre is within reach + its radius × `edge`). Returns their volume (px³).
   */
  private sweepBeads(x: number, y: number, reach: number, edge: number): number {
    const span = reach + this.cfg.beadMax * this.unit;
    const c0 = Math.max(0, Math.floor((x - span - this.gx) / this.cell));
    const c1 = Math.min(this.cols - 1, Math.floor((x + span - this.gx) / this.cell));
    const r0 = Math.max(0, Math.floor((y - span - this.gy) / this.cell));
    const r1 = Math.min(this.rows - 1, Math.floor((y + span - this.gy) / this.cell));
    let volume = 0;
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const c = row * this.cols + col;
        const base = c * this.cap;
        for (let k = this.bn[c] - 1; k >= 0; k--) {
          const br = this.br[base + k];
          const dx = this.bx[base + k] - x;
          const dy = this.by[base + k] - y;
          const lim = reach + br * edge;
          if (dx * dx + dy * dy < lim * lim) {
            volume += br * br * br;
            this.removeBead(c, k);
          }
        }
      }
    }
    return volume;
  }

  /* -------------------------------------------------------------------- */
  /* drops                                                                 */
  /* -------------------------------------------------------------------- */

  addDrop(x: number, y: number, r: number, vx: number, vy: number): number {
    const pane = this.paneOf(x, y);
    if (pane < 0) return -1;
    let i = -1;
    if (this.freeN > 0) i = this.free[--this.freeN];
    else {
      // full: the smallest drop resting on the glass gives way
      let smallest = Infinity;
      for (let j = 0; j < this.high; j++) {
        if (this.alive[j] && this.vy[j] < 1 && this.r[j] < smallest) {
          smallest = this.r[j];
          i = j;
        }
      }
      if (i < 0 || smallest > r) return -1;
      this.alive[i] = 0;
      this.drops--;
    }
    this.alive[i] = 1;
    this.drops++;
    if (i >= this.high) this.high = i + 1;
    this.x[i] = x;
    this.y[i] = y;
    this.r[i] = r;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.wob[i] = 0;
    this.wobV[i] = 0;
    this.wander[i] = 0;
    this.wanderT[i] = 0;
    this.trailD[i] = 0;
    this.trailN[i] = r * (0.6 + this.rand());
    this.loose[i] = 0;
    this.sit[i] = 0;
    this.pane[i] = pane;
    this.knockId[i] = 0;
    this.absorb(i);
    this.dirty = true;
    return i;
  }

  private kill(i: number) {
    if (!this.alive[i]) return;
    this.alive[i] = 0;
    this.drops--;
    this.free[this.freeN++] = i;
    this.dirty = true;
  }

  /** Drop i swallows the beads under it. */
  private absorb(i: number) {
    const v = this.sweepBeads(this.x[i], this.y[i], this.r[i] * 0.92, 0.6);
    if (v > 0) {
      const r = this.r[i];
      this.r[i] = Math.cbrt(r * r * r + v);
    }
  }

  private merge(a: number, b: number) {
    const ra = this.r[a];
    const rb = this.r[b];
    const va = ra * ra * ra;
    const vb = rb * rb * rb;
    const v = va + vb;
    // keep the bigger slot
    if (rb > ra) {
      const t = a;
      a = b;
      b = t;
    }
    const big = Math.max(va, vb);
    const small = Math.min(va, vb);
    const xa = this.x[a];
    const ya = this.y[a];
    const xb = this.x[b];
    const yb = this.y[b];
    const wa = Math.max(va, vb) / v;
    const wb = 1 - wa;
    this.x[a] = xa * wa + xb * wb;
    // the joined drop slumps toward the lower one
    this.y[a] = Math.max(ya, yb) * 0.55 + (ya * wa + yb * wb) * 0.45;
    this.vx[a] = this.vx[a] * wa + this.vx[b] * wb;
    this.vy[a] = Math.max(this.vy[a] * wa + this.vy[b] * wb, Math.max(this.vy[a], this.vy[b]) * 0.7);
    this.r[a] = Math.cbrt(v);
    // the bigger the newcomer, the harder it shakes
    this.wobV[a] += (2.2 + 3.5 * (small / big)) * (this.rand() < 0.5 ? -1 : 1);
    this.loose[a] = Math.max(this.loose[a], this.loose[b], 0.25);
    this.sit[a] = 0;
    this.kill(b);
    this.absorb(a);
  }

  /* -------------------------------------------------------------------- */
  /* rain                                                                  */
  /* -------------------------------------------------------------------- */

  /** Rain landing: `rate` impacts per second per 10 000 px² of glass (at unit 1). */
  rain(dt: number, rate: number) {
    if (rate <= 0 || this.paneN === 0) return;
    const u = this.unit;
    let area = 0;
    for (let i = 0; i < this.paneN; i++) area += this.panes[i * 4 + 2] * this.panes[i * 4 + 3];
    const perSecond = (rate * area) / (10000 * u * u);
    if (perSecond <= 0) return;
    this.nextImpact -= dt;
    let guard = 0;
    while (this.nextImpact <= 0 && guard++ < 64) {
      this.nextImpact += -Math.log(1 - this.rand() * 0.999) / perSecond;
      this.impact();
    }
  }

  private impact() {
    const u = this.unit;
    const pi = Math.min(this.paneN - 1, Math.floor(this.rand() * this.paneN));
    const o = pi * 4;
    const x = this.panes[o] + this.rand() * this.panes[o + 2];
    const y = this.panes[o + 1] + this.rand() * this.panes[o + 3];
    const s = this.rand();
    let r = u * (0.4 + 3.4 * s * s * s * s);
    if (this.rand() < 0.06) r = u * (3.4 + 3.2 * this.rand());
    // landing on a drop, it joins it (and the drop shivers)
    const hit = this.dropNear(x, y, r * 0.5);
    if (hit >= 0) {
      const rh = this.r[hit];
      this.r[hit] = Math.cbrt(rh * rh * rh + r * r * r);
      this.wobV[hit] += (1.2 + 3 * (r / rh)) * (this.rand() < 0.5 ? -1 : 1);
      this.dirty = true;
    } else if (r <= this.cfg.beadMax * u) this.addBead(x, y, r);
    else this.addDrop(x, y, r, 0, 0);
    // a few specks splash around a bigger one
    if (r > 1.5 * u) {
      const n = 1 + Math.floor(this.rand() * 3);
      for (let k = 0; k < n; k++) {
        const a = this.rand() * Math.PI * 2;
        const d = r * (1.4 + 1.6 * this.rand());
        this.addBead(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.12 + 0.16 * this.rand()));
      }
    }
  }

  /* -------------------------------------------------------------------- */
  /* knocks                                                                */
  /* -------------------------------------------------------------------- */

  /** A knuckle on the glass at (x, y): a wave that jiggles and loosens the drops it passes. */
  knock(x: number, y: number, strength: number) {
    let slot = 0;
    for (let k = 0; k < KNOCKS; k++) {
      if (this.kReach[k] <= 0) {
        slot = k;
        break;
      }
      if (this.kAge[k] > this.kAge[slot]) slot = k;
    }
    this.kx[slot] = x;
    this.ky[slot] = y;
    this.kAge[slot] = 0;
    this.kStrength[slot] = strength;
    this.kReach[slot] = Math.hypot(this.gw, this.gh) + 40;
    this.kSerial[slot] = ++this.serial;
  }

  /** Shake the whole pane (thunder rattling the window). */
  rattle(strength: number) {
    this.shake = Math.max(this.shake, strength);
    for (let i = 0; i < this.high; i++) {
      if (!this.alive[i]) continue;
      this.wobV[i] += strength * (1.5 + 2 * this.rand()) * (this.rand() < 0.5 ? -1 : 1);
    }
  }

  /* -------------------------------------------------------------------- */
  /* the brush (inside layer)                                              */
  /* -------------------------------------------------------------------- */

  /** Wipe a disc: the beads and drops under it go. Returns the volume taken (px³). */
  sweep(x: number, y: number, radius: number): number {
    let v = this.sweepBeads(x, y, radius, -0.2);
    for (let i = 0; i < this.high; i++) {
      if (!this.alive[i]) continue;
      const dx = this.x[i] - x;
      const dy = this.y[i] - y;
      const lim = radius + this.r[i] * 0.3;
      if (dx * dx + dy * dy < lim * lim) {
        const r = this.r[i];
        v += r * r * r;
        this.kill(i);
      }
    }
    return v;
  }

  /* -------------------------------------------------------------------- */
  /* step                                                                  */
  /* -------------------------------------------------------------------- */

  step(dt: number) {
    if (dt <= 0) return;
    const u = this.unit;
    const cfg = this.cfg;
    this.laneCount = 0;
    this.shake *= Math.exp(-dt / 0.6);

    // knock waves
    let knocks = 0;
    for (let k = 0; k < KNOCKS; k++) {
      if (this.kReach[k] <= 0) continue;
      this.kAge[k] += dt;
      if (this.kAge[k] * WAVE_SPEED > this.kReach[k]) this.kReach[k] = 0;
      else knocks++;
    }

    const slideBase = cfg.slide * u;
    const decayLoose = Math.exp(-dt / 0.7);
    let moved = false;

    for (let i = 0; i < this.high; i++) {
      if (!this.alive[i]) continue;
      let x = this.x[i];
      let y = this.y[i];
      let r = this.r[i];

      // the wave from a knock reaches this drop
      if (knocks > 0) {
        for (let k = 0; k < KNOCKS; k++) {
          if (this.kReach[k] <= 0 || this.knockId[i] === this.kSerial[k]) continue;
          const d = Math.hypot(x - this.kx[k], y - this.ky[k]);
          if (d > this.kAge[k] * WAVE_SPEED) continue;
          this.knockId[i] = this.kSerial[k];
          const near = Math.exp(-d / (190 * u));
          const s = this.kStrength[k] * (0.12 + 0.88 * near);
          this.wobV[i] += s * (2.5 + 2 * this.rand()) * (this.rand() < 0.5 ? -1 : 1);
          this.loose[i] = Math.max(this.loose[i], s);
          if (this.sit[i]) this.sit[i] = 0;
        }
      }
      this.loose[i] *= decayLoose;

      // the wobble: a stiff little spring
      {
        const k = 340;
        const c = 11;
        let w = this.wob[i];
        let wv = this.wobV[i];
        let rem = dt;
        while (rem > 1e-5) {
          const h = Math.min(rem, 1 / 120);
          wv += (-k * w - c * wv) * h;
          w += wv * h;
          rem -= h;
        }
        this.wob[i] = Math.max(-0.35, Math.min(0.35, w));
        this.wobV[i] = wv;
        if (Math.abs(w) > 0.002 || Math.abs(wv) > 0.02) this.dirty = true;
      }

      // resting on the bottom rail: it drains into the frame
      if (this.sit[i]) {
        r -= dt * 0.45 * u;
        if (r < 0.7 * u) {
          this.kill(i);
          continue;
        }
        this.r[i] = r;
        this.dirty = true;
        continue;
      }

      // does gravity win here?
      const f = this.friction(x, y);
      const hold = slideBase * f * (1 - 0.5 * Math.max(this.loose[i], this.shake));
      let target = 0;
      if (r > hold) target = Math.min(cfg.maxSpeed * u, cfg.speed * u * (r / hold - 1) * 2);
      let vy = this.vy[i];
      vy += (target - vy) * (1 - Math.exp(-dt * (target > vy ? 6 : 15)));
      if (vy < 0.3 && target === 0) vy = 0;

      // wandering: a new lean every so often, and toward the slicker side
      this.wanderT[i] -= dt;
      if (this.wanderT[i] <= 0) {
        this.wanderT[i] = 0.12 + this.rand() * 0.45;
        this.wander[i] = (this.rand() * 2 - 1) * 0.32;
      }
      const slope = (this.friction(x - 3 * u, y + r) - this.friction(x + 3 * u, y + r)) * 1.4;
      const vxTarget = vy * (this.wander[i] + slope + this.wind);
      let vx = this.vx[i] + (vxTarget - this.vx[i]) * (1 - Math.exp(-dt * 6));
      if (vy === 0) vx *= Math.exp(-dt * 10);

      if (vy > 0.05 || Math.abs(vx) > 0.05) {
        const x0 = x;
        const y0 = y;
        x += vx * dt;
        y += vy * dt;
        const o = this.pane[i] * 4;
        const left = this.panes[o] + r * 0.55;
        const right = this.panes[o] + this.panes[o + 2] - r * 0.55;
        if (x < left) {
          x = left;
          vx = Math.abs(vx) * 0.2;
        } else if (x > right) {
          x = right;
          vx = -Math.abs(vx) * 0.2;
        }
        const floor = this.panes[o + 1] + this.panes[o + 3] - r * 0.55;
        if (y >= floor) {
          y = floor;
          vy = 0;
          vx = 0;
          this.sit[i] = 1;
          this.wobV[i] += 1.5;
        }
        const dist = Math.hypot(x - x0, y - y0);
        this.x[i] = x;
        this.y[i] = y;
        this.absorb(i);
        r = this.r[i];

        // the trail: a bead of its own water every so often
        if (cfg.trail > 0 && r > 1.4 * u) {
          this.trailD[i] += dist;
          if (this.trailD[i] > this.trailN[i]) {
            this.trailD[i] = 0;
            this.trailN[i] = r * (0.45 + 1.7 * this.rand());
            const rb = r * cfg.trail * (0.55 + 0.9 * this.rand());
            const v = r * r * r - rb * rb * rb * 1.15;
            if (v > 0) {
              r = Math.cbrt(v);
              this.r[i] = r;
              this.addBeadQuiet(x + (this.rand() - 0.5) * r * 0.7, y - r * (1.0 + 0.5 * this.rand()), rb);
            }
          }
        }

        if (cfg.lanes && this.laneCount < this.cfg.capacity) {
          const l = this.laneCount * 5;
          this.lanes[l] = x0;
          this.lanes[l + 1] = y0;
          this.lanes[l + 2] = x;
          this.lanes[l + 3] = y;
          this.lanes[l + 4] = r;
          this.laneCount++;
        }
        moved = true;
      }
      this.vx[i] = vx;
      this.vy[i] = vy;
    }
    if (moved) {
      this.dirty = true;
      this.collide();
    } else this.index();
  }

  /** A trail bead: never promoted to a drop on the spot (that would feed the drop that left it). */
  private addBeadQuiet(x: number, y: number, r: number) {
    if (this.paneOf(x, y) < 0) return;
    const max = this.cfg.beadMax * this.unit;
    if (r > max) r = max;
    const c = this.cellOf(x, y);
    const n = this.bn[c];
    if (n >= this.cap) return;
    const base = c * this.cap;
    this.bx[base + n] = x;
    this.by[base + n] = y;
    this.br[base + n] = r;
    this.bn[c] = n + 1;
    this.beads++;
  }

  /** Rebuild the grid of drops (each step; read by collide() and dropNear()). */
  private index() {
    const cols = this.dCols;
    const rows = this.dRows;
    const head = this.dHead;
    const next = this.dNext;
    const n = cols * rows;
    for (let c = 0; c < n; c++) head[c] = -1;
    for (let i = 0; i < this.high; i++) {
      if (!this.alive[i]) continue;
      const cx = Math.min(cols - 1, Math.max(0, Math.floor((this.x[i] - this.gx) / this.dCell)));
      const cy = Math.min(rows - 1, Math.max(0, Math.floor((this.y[i] - this.gy) / this.dCell)));
      const c = cy * cols + cx;
      next[i] = head[c];
      head[c] = i;
    }
    this.indexed = true;
  }

  /** A drop whose edge is within `reach` of (x, y), or -1 (uses the last index). */
  private dropNear(x: number, y: number, reach: number): number {
    if (!this.indexed || this.dCols === 0) return -1;
    const cols = this.dCols;
    const rows = this.dRows;
    const cx = Math.min(cols - 1, Math.max(0, Math.floor((x - this.gx) / this.dCell)));
    const cy = Math.min(rows - 1, Math.max(0, Math.floor((y - this.gy) / this.dCell)));
    for (let oy = -1; oy <= 1; oy++) {
      const yy = cy + oy;
      if (yy < 0 || yy >= rows) continue;
      for (let ox = -1; ox <= 1; ox++) {
        const xx = cx + ox;
        if (xx < 0 || xx >= cols) continue;
        for (let j = this.dHead[yy * cols + xx]; j >= 0; j = this.dNext[j]) {
          if (!this.alive[j]) continue;
          const dx = this.x[j] - x;
          const dy = this.y[j] - y;
          const lim = this.r[j] + reach;
          if (dx * dx + dy * dy < lim * lim) return j;
        }
      }
    }
    return -1;
  }

  /** Merge drops that touch. */
  private collide() {
    this.index();
    const cols = this.dCols;
    const rows = this.dRows;
    const head = this.dHead;
    const next = this.dNext;
    for (let i = 0; i < this.high; i++) {
      if (!this.alive[i]) continue;
      const cx = Math.min(cols - 1, Math.max(0, Math.floor((this.x[i] - this.gx) / this.dCell)));
      const cy = Math.min(rows - 1, Math.max(0, Math.floor((this.y[i] - this.gy) / this.dCell)));
      for (let oy = -1; oy <= 1 && this.alive[i]; oy++) {
        const yy = cy + oy;
        if (yy < 0 || yy >= rows) continue;
        for (let ox = -1; ox <= 1 && this.alive[i]; ox++) {
          const xx = cx + ox;
          if (xx < 0 || xx >= cols) continue;
          for (let j = head[yy * cols + xx]; j >= 0; j = next[j]) {
            if (j <= i || !this.alive[j] || this.pane[j] !== this.pane[i]) continue;
            const dx = this.x[j] - this.x[i];
            const dy = this.y[j] - this.y[i];
            const lim = (this.r[i] + this.r[j]) * 0.86;
            if (dx * dx + dy * dy < lim * lim) {
              this.merge(i, j);
              if (!this.alive[i]) break;
            }
          }
        }
      }
    }
  }

  /** Bead the glass all over with fine mist (`fill` 0 … 1 of each cell's room). */
  mist(fill: number) {
    const u = this.unit;
    for (let i = 0; i < this.paneN; i++) {
      const o = i * 4;
      const n = Math.round(((this.panes[o + 2] * this.panes[o + 3]) / (this.cell * this.cell)) * this.cap * fill);
      for (let k = 0; k < n; k++) {
        const t = this.rand();
        this.addBead(this.panes[o] + this.rand() * this.panes[o + 2], this.panes[o + 1] + this.rand() * this.panes[o + 3], u * (0.35 + 1.25 * t * t));
      }
    }
  }

  /** Run the weather for a while without drawing (a glass that has been out in the rain). */
  prewarm(seconds: number, rate: number) {
    const dt = 1 / 30;
    for (let t = 0; t < seconds; t += dt) {
      this.rain(dt, rate);
      this.step(dt);
    }
    this.laneCount = 0;
  }

  /* -------------------------------------------------------------------- */
  /* output                                                                */
  /* -------------------------------------------------------------------- */

  /**
   * The kernels for the field pass, (x, y, rx, ry) each: the beads, then
   * every drop as a head (squashed by its wobble, stretched by its speed)
   * and, while it runs, a tapering tail above it.
   */
  build(): number {
    const out = this.instances;
    const u = this.unit;
    let n = 0;
    const cells = this.cols * this.rows;
    for (let c = 0; c < cells; c++) {
      const base = c * this.cap;
      for (let k = 0; k < this.bn[c]; k++) {
        const o = n * 4;
        out[o] = this.bx[base + k];
        out[o + 1] = this.by[base + k];
        out[o + 2] = this.br[base + k];
        out[o + 3] = this.br[base + k];
        n++;
      }
    }
    for (let i = 0; i < this.high; i++) {
      if (!this.alive[i]) continue;
      const r = this.r[i];
      const vy = this.vy[i];
      const w = this.wob[i];
      const run = Math.min(1, Math.max(0, (vy - 4 * u) / (36 * u)));
      const stretch = 1 + 0.32 * run;
      let o = n * 4;
      out[o] = this.x[i];
      out[o + 1] = this.y[i] + r * 0.1 * run;
      out[o + 2] = r * (1 + w) * (1 - 0.06 * run);
      out[o + 3] = r * (1 - w) * stretch;
      n++;
      if (run > 0.02) {
        const vx = this.vx[i];
        o = n * 4;
        out[o] = this.x[i] - vx * 0.03;
        out[o + 1] = this.y[i] - r * 0.95;
        out[o + 2] = r * 0.56 * run;
        out[o + 3] = r * 0.95 * run;
        n++;
        o = n * 4;
        out[o] = this.x[i] - vx * 0.06;
        out[o + 1] = this.y[i] - r * 1.8;
        out[o + 2] = r * 0.32 * run;
        out[o + 3] = r * 0.8 * run;
        n++;
      }
    }
    this.instanceCount = n;
    this.dirty = false;
    return n;
  }
}

/* ---------------------------------------------------------------------- */
/* noise                                                                   */
/* ---------------------------------------------------------------------- */

/** Smooth value noise, 0..1. */
export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
