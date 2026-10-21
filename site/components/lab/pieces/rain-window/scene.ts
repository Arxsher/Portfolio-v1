// The street outside, in "scene units": 1 = the height of the glass,
// x to the right and y down from the middle of the glass. The far side of
// a wet street seen from a first-floor window: a row of four- and
// five-storey buildings with lit windows, a shop with string lights under
// its awning, a café, a side street opening onto taller towers in the
// distance (one with a red beacon), streetlamps along the far kerb, a
// traffic light at the corner, and cars passing both ways on the wet road,
// every light doubled by its reflection.
//
// Everything that glows is a light instance (x, y, w, h, r, g, b, kind),
// drawn three times by the renderer: crisp (what the drops focus), as
// out-of-focus discs (the view through clear glass, the camera focused on
// the pane), and as wide soft glows (the view through fog). The dark masses
// (sky, towers, facades, road) are drawn by the base shader from the
// building list and the few uniforms here.

import { seededRandom } from "../../hooks";

export const KIND_RECT = 0;
export const KIND_LAMP = 1;
export const KIND_STREAK = 2;
export const KIND_GLOW = 3;
export const KIND_BULB = 4;

export const LIGHT_STRIDE = 8;
export const MAX_LIGHTS = 900;
export const MAX_BUILDINGS = 20;
export const MAX_LAMPS = 10;
export const MAX_CARS = 4;

/** Street lines (scene y): the foot of the facades, the far kerb, and the two lanes. */
export const STREET = { base: 0.2, curb: 0.245, far: 0.305, near: 0.395 } as const;

/** Where the sky reaches: the scene x range that buildings are made for. */
const SPAN = 3.4;

type Rgb = [number, number, number];

const WARM: Rgb = [1.0, 0.62, 0.3];
const SOFT: Rgb = [1.0, 0.8, 0.56];
const TV: Rgb = [0.55, 0.72, 1.0];
const CURTAIN: Rgb = [1.0, 0.45, 0.2];
const SODIUM: Rgb = [1.0, 0.52, 0.18];
const LED: Rgb = [1.0, 0.8, 0.58];
const BULB: Rgb = [1.0, 0.66, 0.3];
const HEAD: Rgb = [1.0, 0.9, 0.74];
const TAIL: Rgb = [1.0, 0.07, 0.04];
const STOP: Rgb = [1, 0.08, 0.05];
const AMBER: Rgb = [1, 0.55, 0.08];
const GO: Rgb = [0.2, 1, 0.55];

export class City {
  /** per building: x0, x1, top, tone */
  readonly buildings = new Float32Array(MAX_BUILDINGS * 4);
  /** per building: column spacing, first column x, window w, window h */
  readonly grids = new Float32Array(MAX_BUILDINGS * 4);
  /** per building: storey height */
  readonly floors = new Float32Array(MAX_BUILDINGS);
  buildingN = 0;
  /** the awnings (x0, x1, y0, y1) */
  readonly awnings = new Float32Array(8);
  /** lamp posts for the base shader: x, head y, colour (0 sodium, 1 LED), 0 */
  readonly lamps = new Float32Array(MAX_LAMPS * 4);
  lampN = 0;
  /** the far tower under the beacon: x, top, half width */
  readonly tower = new Float32Array(3);
  /** traffic light post: x, head y */
  readonly traffic = new Float32Array(2);
  /** car bodies for the base shader: x centre, lane y, direction, presence */
  readonly carBodies = new Float32Array(MAX_CARS * 4);

  // windows: x, y, w, h, kind (0 warm 1 soft 2 tv 3 curtain), threshold, brightness, phase
  private win: Float32Array;
  private winN = 0;
  private winLevel: Float32Array;
  private winFlip: Uint8Array;
  // fixed street-level lights: x, y, w, h, r, g, b, kind (reflected on the road)
  private fixed: Float32Array;
  private fixedN = 0;
  // cars: x, lane (0 far, 1 near), speed, active
  private cars = new Float32Array(MAX_CARS * 4);
  private carTimer = new Float32Array(2);

  /** the lights to draw this frame */
  readonly out = new Float32Array(MAX_LIGHTS * LIGHT_STRIDE);
  count = 0;

  private rand: () => number;
  private flipTimer = 3;
  /** seconds into the traffic light's cycle */
  private trafficT = 2;
  time = 0;

  constructor(seed = 0x7a1d) {
    this.rand = seededRandom(seed);
    this.win = new Float32Array(1600 * 8);
    this.winLevel = new Float32Array(1600);
    this.winFlip = new Uint8Array(1600);
    this.fixed = new Float32Array(160 * 8);
    this.build();
    this.carTimer[0] = 0.4;
    this.carTimer[1] = 2.2;
  }

  /* -------------------------------------------------------------------- */
  /* building the street                                                   */
  /* -------------------------------------------------------------------- */

  private addBuilding(x0: number, x1: number, top: number, tone: number) {
    if (this.buildingN >= MAX_BUILDINGS) return -1;
    const i = this.buildingN++;
    const b = this.buildings;
    b[i * 4] = x0;
    b[i * 4 + 1] = x1;
    b[i * 4 + 2] = top;
    b[i * 4 + 3] = tone;
    // its window grid
    const rand = this.rand;
    const w = x1 - x0;
    const spacing = 0.07 + rand() * 0.022;
    const cols = Math.max(1, Math.floor((w - 0.05) / spacing));
    const first = x0 + (w - (cols - 1) * spacing) / 2;
    const ww = 0.03 + rand() * 0.008;
    const wh = 0.048 + rand() * 0.012;
    const g = this.grids;
    g[i * 4] = spacing;
    g[i * 4 + 1] = first;
    g[i * 4 + 2] = ww;
    g[i * 4 + 3] = wh;
    // the windows themselves (upper floors)
    const floorH = 0.094 + rand() * 0.012;
    this.floors[i] = floorH;
    for (let k = 0; ; k++) {
      const cy = 0.09 - floorH * (k + 0.5);
      if (cy - wh / 2 < top + 0.022) break;
      for (let c = 0; c < cols; c++) {
        if (this.winN >= 1600) break;
        const cx = first + c * spacing;
        const o = this.winN * 8;
        const kindRoll = rand();
        const kind = kindRoll < 0.62 ? 0 : kindRoll < 0.84 ? 1 : kindRoll < 0.92 ? 2 : 3;
        this.win[o] = cx;
        this.win[o + 1] = cy;
        this.win[o + 2] = ww;
        this.win[o + 3] = wh;
        this.win[o + 4] = kind;
        this.win[o + 5] = rand();
        this.win[o + 6] = 0.55 + rand() * 0.6;
        this.win[o + 7] = rand() * 100;
        this.winN++;
      }
    }
    return i;
  }

  private addFixed(x: number, y: number, w: number, h: number, c: Rgb, gain: number, kind: number) {
    if (this.fixedN >= 160) return;
    const o = this.fixedN * 8;
    const f = this.fixed;
    f[o] = x;
    f[o + 1] = y;
    f[o + 2] = w;
    f[o + 3] = h;
    f[o + 4] = c[0] * gain;
    f[o + 5] = c[1] * gain;
    f[o + 6] = c[2] * gain;
    f[o + 7] = kind;
    this.fixedN++;
  }

  private addLamp(x: number, led: boolean) {
    if (this.lampN >= MAX_LAMPS) return;
    const i = this.lampN++;
    this.lamps[i * 4] = x;
    this.lamps[i * 4 + 1] = -0.035;
    this.lamps[i * 4 + 2] = led ? 1 : 0;
    this.addFixed(x, -0.026, 0.016, 0.009, led ? LED : SODIUM, 5.5, KIND_LAMP);
  }

  /** A string of bulbs hanging from (x0, y0) to (x1, y1), sagging by `sag`. */
  private addString(x0: number, y0: number, x1: number, y1: number, sag: number, spacing: number) {
    const n = Math.max(2, Math.round((x1 - x0) / spacing));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
      const tint = 0.85 + this.rand() * 0.3;
      this.addFixed(x, y, 0.007, 0.007, BULB, 2.6 * tint, KIND_BULB);
    }
  }

  private build() {
    const rand = this.rand;
    // the middle of the street, composed: what the tile and a phone see
    this.addBuilding(-1.02, -0.66, -0.44, 0.95);
    this.addBuilding(-0.66, -0.43, -0.17, 1.15);
    const shop = this.addBuilding(-0.43, 0.14, -0.33, 0.85);
    this.addBuilding(0.14, 0.31, -0.68, 1.05);
    // (a side street from 0.31 to 0.47)
    const cafe = this.addBuilding(0.47, 0.98, -0.25, 1.0);
    // and on along the street both ways
    let x = 0.98;
    while (x < SPAN && this.buildingN < MAX_BUILDINGS - 1) {
      if (rand() < 0.16) x += 0.12 + rand() * 0.08;
      const w = 0.3 + rand() * 0.3;
      this.addBuilding(x, x + w, -0.1 - rand() * 0.52, 0.8 + rand() * 0.45);
      x += w;
    }
    x = -1.02;
    while (x > -SPAN && this.buildingN < MAX_BUILDINGS) {
      if (rand() < 0.16) x -= 0.12 + rand() * 0.08;
      const w = 0.3 + rand() * 0.3;
      this.addBuilding(x - w, x, -0.1 - rand() * 0.52, 0.8 + rand() * 0.45);
      x -= w;
    }

    // the shop: a wide warm window under a dark awning with bulbs along it
    if (shop >= 0) {
      this.awnings[0] = -0.41;
      this.awnings[1] = 0.12;
      this.awnings[2] = 0.083;
      this.awnings[3] = 0.104;
      this.addFixed(-0.15, 0.152, 0.46, 0.07, WARM, 1.5, KIND_RECT);
      this.addString(-0.41, 0.107, 0.12, 0.107, 0.012, 0.034);
    }
    // the café: three tall windows, a warm lamp over the door, bulbs above
    if (cafe >= 0) {
      this.awnings[4] = 0.5;
      this.awnings[5] = 0.95;
      this.awnings[6] = 0.088;
      this.awnings[7] = 0.1;
      for (let k = 0; k < 3; k++) this.addFixed(0.56 + k * 0.15, 0.15, 0.1, 0.075, SOFT, 1.05, KIND_RECT);
      this.addString(0.5, 0.103, 0.95, 0.103, 0.016, 0.036);
    }
    // two signs: a pink blade over the café door, a teal band along the corner shop
    this.addFixed(0.505, 0.012, 0.013, 0.085, [1.0, 0.2, 0.42], 1.7, KIND_RECT);
    this.addFixed(-0.84, 0.06, 0.13, 0.014, [0.14, 0.86, 0.78], 1.35, KIND_RECT);
    // bulbs strung across the side street, in front of the towers
    this.addString(0.31, -0.01, 0.47, 0.004, 0.045, 0.026);
    // doorway lamps and lit shopfronts along the rest of the street
    for (let i = 0; i < this.buildingN; i++) {
      const x0 = this.buildings[i * 4];
      const x1 = this.buildings[i * 4 + 1];
      if (x1 > -0.45 && x0 < 1.0) continue;
      const roll = rand();
      if (roll < 0.4) this.addFixed(x0 + (x1 - x0) * (0.25 + rand() * 0.5), 0.118, 0.008, 0.008, BULB, 2.4, KIND_BULB);
      else if (roll < 0.7) this.addFixed((x0 + x1) / 2, 0.15, (x1 - x0) * 0.6, 0.06, rand() < 0.5 ? WARM : SOFT, 0.75, KIND_RECT);
    }
    // streetlamps along the far kerb
    for (const lx of [-3.1, -2.4, -1.72, -1.12, 0.39, 1.25, 1.95, 2.7]) this.addLamp(lx, rand() < 0.45);
    // the traffic light at the corner
    this.traffic[0] = 1.03;
    this.traffic[1] = 0.03;
    // the beacon tower beyond the side street
    this.tower[0] = 0.4;
    this.tower[1] = -0.31;
    this.tower[2] = 0.035;
    for (let i = 0; i < this.winN; i++) this.winLevel[i] = this.target(i, 0);
  }

  /* -------------------------------------------------------------------- */
  /* life                                                                  */
  /* -------------------------------------------------------------------- */

  private target(i: number, night: number) {
    const lit = 0.6 - 0.2 * night;
    const t = this.win[i * 8 + 5];
    const on = t < lit;
    return this.winFlip[i] ? (on ? 0 : 1) : on ? 1 : 0;
  }

  /**
   * Advance the street: cars, the traffic light, windows going on and off.
   * `x0`, `x1`: the scene x range in view (cars enter and leave beyond it).
   */
  update(dt: number, night: number, x0: number, x1: number, motion: boolean) {
    if (motion) {
      this.time += dt;
      this.trafficT = (this.trafficT + dt) % 20;
      // now and then someone switches a light on or off
      this.flipTimer -= dt;
      if (this.flipTimer <= 0) {
        this.flipTimer = 2.5 + this.rand() * 5;
        for (let tries = 0; tries < 8; tries++) {
          const i = Math.floor(this.rand() * this.winN);
          const wx = this.win[i * 8];
          if (wx > x0 && wx < x1) {
            this.winFlip[i] ^= 1;
            break;
          }
        }
      }
      // cars: each lane sends one now and then
      for (let lane = 0; lane < 2; lane++) {
        this.carTimer[lane] -= dt;
        if (this.carTimer[lane] > 0) continue;
        this.carTimer[lane] = 3 + this.rand() * 7;
        for (let c = 0; c < MAX_CARS; c++) {
          const o = c * 4;
          if (this.cars[o + 3]) continue;
          const dir = lane === 0 ? -1 : 1;
          this.cars[o] = dir > 0 ? x0 - 0.45 : x1 + 0.45;
          this.cars[o + 1] = lane;
          this.cars[o + 2] = (0.2 + this.rand() * 0.1) * dir;
          this.cars[o + 3] = 1;
          break;
        }
      }
      for (let c = 0; c < MAX_CARS; c++) {
        const o = c * 4;
        if (!this.cars[o + 3]) continue;
        this.cars[o] += this.cars[o + 2] * dt;
        if (this.cars[o] < x0 - 0.6 || this.cars[o] > x1 + 0.6) this.cars[o + 3] = 0;
      }
    }
    const k = motion ? 1 - Math.exp(-dt * 10) : 1;
    for (let i = 0; i < this.winN; i++) {
      const target = this.target(i, night);
      this.winLevel[i] += (target - this.winLevel[i]) * k;
    }
    for (let c = 0; c < MAX_CARS; c++) {
      const o = c * 4;
      this.carBodies[o] = this.cars[o];
      this.carBodies[o + 1] = this.cars[o + 1] ? STREET.near : STREET.far;
      this.carBodies[o + 2] = Math.sign(this.cars[o + 2]) || 1;
      this.carBodies[o + 3] = this.cars[o + 3];
    }
  }

  /** Red, amber or green: which head is lit (0 red, 1 amber, 2 green) and how brightly. */
  private trafficPhase(): number {
    const t = this.trafficT;
    if (t < 8.5) return 2;
    if (t < 10.5) return 1;
    return 0;
  }

  /* -------------------------------------------------------------------- */
  /* the light list                                                        */
  /* -------------------------------------------------------------------- */

  private emit(x: number, y: number, w: number, h: number, r: number, g: number, b: number, kind: number) {
    if (this.count >= MAX_LIGHTS) return;
    const o = this.count * LIGHT_STRIDE;
    const out = this.out;
    out[o] = x;
    out[o + 1] = y;
    out[o + 2] = w;
    out[o + 3] = h;
    out[o + 4] = r;
    out[o + 5] = g;
    out[o + 6] = b;
    out[o + 7] = kind;
    this.count++;
  }

  /** Its reflection in the wet road: a long, rippled streak below the kerb. */
  private reflect(x: number, y: number, w: number, r: number, g: number, b: number, gain: number) {
    const c = STREET.curb;
    const depth = Math.max(0.02, c - y);
    const ry = c + depth * 0.9 + 0.012;
    const len = 0.05 + depth * 0.9;
    this.emit(x, ry, Math.max(0.012, w * 0.9), len, r * gain, g * gain, b * gain, KIND_STREAK);
  }

  /**
   * Write this frame's lights for the scene x range [x0, x1] (plus a
   * margin for the blur), shifted by the parallax (near things move more).
   */
  fill(x0: number, x1: number, parX: number, parY: number) {
    this.count = 0;
    const t = this.time;
    const farX = parX * 0.75;
    const farY = parY * 0.75;
    // windows
    for (let i = 0; i < this.winN; i++) {
      const level = this.winLevel[i];
      if (level < 0.01) continue;
      const o = i * 8;
      const x = this.win[o] + farX;
      if (x < x0 || x > x1) continue;
      const kind = this.win[o + 4];
      let gain = this.win[o + 6] * level * 1.15;
      const c = kind === 0 ? WARM : kind === 1 ? SOFT : kind === 2 ? TV : CURTAIN;
      if (kind === 2) {
        // a television: restless
        const ph = this.win[o + 7];
        gain *= 0.55 + 0.25 * Math.sin(t * 3.1 + ph) * Math.sin(t * 1.7 + ph * 2) + 0.2 * Math.sin(t * 11 + ph);
      }
      if (kind === 3) gain *= 0.7;
      this.emit(x, this.win[o + 1] + farY, this.win[o + 2], this.win[o + 3], c[0] * gain, c[1] * gain, c[2] * gain, KIND_RECT);
    }
    // street level: shopfronts, bulbs, lamps, and their reflections
    for (let i = 0; i < this.fixedN; i++) {
      const o = i * 8;
      const f = this.fixed;
      const x = f[o] + parX;
      if (x + f[o + 2] < x0 || x - f[o + 2] > x1) continue;
      let r = f[o + 4];
      let g = f[o + 5];
      let b = f[o + 6];
      const kind = f[o + 7];
      if (kind === KIND_BULB) {
        // old filament bulbs: a faint shimmer each
        const s = 0.92 + 0.08 * Math.sin(t * 2.3 + i * 1.7);
        r *= s;
        g *= s;
        b *= s;
      }
      this.emit(x, f[o + 1] + parY, f[o + 2], f[o + 3], r, g, b, kind);
      this.reflect(x, f[o + 1], f[o + 2], r, g, b, kind === KIND_RECT ? 0.28 : 0.42);
      if (kind === KIND_LAMP) {
        // the pool it throws on the pavement and the facade behind
        this.emit(x, 0.215 + parY, 0.2, 0.05, r * 0.05, g * 0.05, b * 0.05, KIND_GLOW);
      }
    }
    // the beacon on the tower: a slow red blink
    {
      const x = this.tower[0] + parX * 0.35;
      if (x > x0 && x < x1) {
        const ph = (t % 2.4) / 2.4;
        const blink = ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI) : 0;
        if (blink > 0.01) this.emit(x, this.tower[1] - 0.012 + parY * 0.35, 0.008, 0.008, 3 * blink, 0.18 * blink, 0.1 * blink, KIND_BULB);
      }
    }
    // the traffic light: one of three heads
    {
      const x = this.traffic[0] + parX;
      if (x > x0 - 0.2 && x < x1 + 0.2) {
        const phase = this.trafficPhase();
        const y = this.traffic[1] + parY + phase * 0.019;
        const c = phase === 0 ? STOP : phase === 1 ? AMBER : GO;
        this.emit(x, y, 0.011, 0.011, c[0] * 4.5, c[1] * 4.5, c[2] * 4.5, KIND_LAMP);
        this.reflect(x, this.traffic[1] + phase * 0.019, 0.011, c[0] * 4.5, c[1] * 4.5, c[2] * 4.5, 0.4);
      }
    }
    // cars: a headlamp in front, a tail lamp behind, the beam on the road
    for (let c = 0; c < MAX_CARS; c++) {
      const o = c * 4;
      if (!this.cars[o + 3]) continue;
      const dir = Math.sign(this.cars[o + 2]) || 1;
      const lane = this.cars[o + 1];
      const y = (lane ? STREET.near : STREET.far) - 0.016 + parY;
      const cx = this.cars[o] + parX;
      if (cx < x0 - 0.5 || cx > x1 + 0.5) continue;
      const fx = cx + dir * 0.095;
      const bx = cx - dir * 0.095;
      const near = lane ? 1.15 : 1;
      this.emit(fx, y, 0.014 * near, 0.011 * near, HEAD[0] * 6, HEAD[1] * 6, HEAD[2] * 6, KIND_LAMP);
      this.emit(bx, y - 0.002, 0.01 * near, 0.008 * near, TAIL[0] * 3.2, TAIL[1] * 3.2, TAIL[2] * 3.2, KIND_LAMP);
      this.emit(fx + dir * 0.14, y + 0.024, 0.26, 0.026, 0.3, 0.27, 0.22, KIND_GLOW);
      this.reflect(fx, y + 0.016 - parY, 0.014, HEAD[0] * 6, HEAD[1] * 6, HEAD[2] * 6, 0.32);
      this.reflect(bx, y + 0.016 - parY, 0.01, TAIL[0] * 3.2, TAIL[1] * 3.2, TAIL[2] * 3.2, 0.4);
    }
    return this.count;
  }
}
