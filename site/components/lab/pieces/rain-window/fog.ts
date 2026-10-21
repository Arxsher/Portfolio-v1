// The condensation on the inside of the glass.
//
// The GPU keeps the real fog map (renderer.ts): a small texture over the
// glass, R = how wiped it is (1 just wiped, creeping back to 0), G = breath
// (fresh fog breathed onto it), B = wet (the sheen of a fresh wipe). Every
// change reaches it as a stamp: a wipe or a drip's lane (a capsule) or a
// breath (a disc), drawn with plain alpha blending, so each stamp pulls the
// texels under it toward its own values. A fade pass lets it all relax back.
//
// FogMirror is a coarse copy of the same map on the CPU, fed the same
// stamps and fades, so the brush knows how much fog (water) it is wiping
// up, and so how much it leaves along the edges of the stroke.
//
// fogBase() is the density of the settled fog: thin near the top of a pane,
// thick toward the bottom rail and along the cold frame. The composite
// shader computes the same thing (plus a patchy noise the mirror ignores).

import type { WindowLayout } from "./layout";

/** Seconds for a wipe to fog back over; for a breath to clear; for the wet sheen to dry. */
export const FOG_BACK = 7.5;
export const BREATH_FADE = 6;
export const WET_FADE = 1.6;

export type FogLevel = { lo: number; hi: number };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Settled fog density at (x, y) on a pane (0 … 1): thicker low down and along the sides and bottom rail. */
export function fogBase(l: WindowLayout, pane: number, x: number, y: number, level: FogLevel): number {
  const p = l.panes[pane];
  const v = (y - p.y) / p.h;
  const edge = Math.min(x - p.x, p.x + p.w - x, p.y + p.h - y) / l.unit;
  const d = level.lo + (level.hi - level.lo) * smooth(0.3, 0.92, v) + 0.3 * Math.exp(-Math.max(0, edge) / 24);
  return Math.min(1, Math.max(0, d));
}

function paneIndex(l: WindowLayout, x: number, y: number): number {
  for (let i = 0; i < l.paneCount; i++) {
    const p = l.panes[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

/* ---------------------------------------------------------------------- */
/* stamps for the GPU                                                      */
/* ---------------------------------------------------------------------- */

export const STAMP_WIPE = 0;
export const STAMP_LANE = 1;
export const STAMP_BREATH = 2;

const MAX_STAMPS = 512;

/** This frame's stamps: (x0, y0, x1, y1) + (radius, alpha, kind, softness) each. */
export class Stamps {
  readonly data = new Float32Array(MAX_STAMPS * 8);
  count = 0;

  private push(x0: number, y0: number, x1: number, y1: number, r: number, a: number, kind: number, soft: number) {
    if (this.count >= MAX_STAMPS) return;
    const o = this.count * 8;
    const d = this.data;
    d[o] = x0;
    d[o + 1] = y0;
    d[o + 2] = x1;
    d[o + 3] = y1;
    d[o + 4] = r;
    d[o + 5] = a;
    d[o + 6] = kind;
    d[o + 7] = soft;
    this.count++;
  }

  wipe(x0: number, y0: number, x1: number, y1: number, r: number) {
    this.push(x0, y0, x1, y1, r, 1, STAMP_WIPE, Math.max(1.5, r * 0.14));
  }

  lane(x0: number, y0: number, x1: number, y1: number, r: number) {
    this.push(x0, y0, x1, y1, r, 0.9, STAMP_LANE, Math.max(0.8, r * 0.3));
  }

  breath(x: number, y: number, r: number, a: number) {
    this.push(x, y, x, y, r, a, STAMP_BREATH, r * 0.55);
  }

  clear() {
    this.count = 0;
  }
}

/* ---------------------------------------------------------------------- */
/* the CPU copy                                                            */
/* ---------------------------------------------------------------------- */

const CELL = 6;

export class FogMirror {
  private cols = 0;
  private rows = 0;
  private gx = 0;
  private gy = 0;
  private clear = new Float32Array(0);
  private breath = new Float32Array(0);
  private layout: WindowLayout | null = null;
  level: FogLevel;
  /** something to fade */
  private live = false;

  constructor(level: FogLevel) {
    this.level = level;
  }

  setBounds(l: WindowLayout) {
    this.layout = l;
    this.gx = l.glass.x;
    this.gy = l.glass.y;
    this.cols = Math.ceil(l.glass.w / CELL) + 1;
    this.rows = Math.ceil(l.glass.h / CELL) + 1;
    const n = this.cols * this.rows;
    if (this.clear.length < n) {
      this.clear = new Float32Array(n);
      this.breath = new Float32Array(n);
    }
    this.reset();
  }

  reset() {
    this.clear.fill(0);
    this.breath.fill(0);
    this.live = false;
  }

  /** Let it relax for dt seconds (nothing moves under reduced motion: `back` false). */
  decay(dt: number, back: boolean) {
    if (!this.live || !back) return;
    const dc = dt / FOG_BACK;
    const db = dt / BREATH_FADE;
    const n = this.cols * this.rows;
    let any = false;
    for (let i = 0; i < n; i++) {
      const c = this.clear[i];
      if (c > 0) {
        this.clear[i] = c > dc ? c - dc : 0;
        any = true;
      }
      const b = this.breath[i];
      if (b > 0) {
        this.breath[i] = b > db ? b - db : 0;
        any = true;
      }
    }
    this.live = any;
  }

  /**
   * A wipe or a lane: a capsule pulled toward clear. Returns how much fog it
   * took off (density × px²), which is the water the finger picks up.
   */
  wipe(x0: number, y0: number, x1: number, y1: number, r: number, soft: number): number {
    const l = this.layout;
    let removed = 0;
    const reach = r + soft;
    const c0 = Math.max(0, Math.floor((Math.min(x0, x1) - reach - this.gx) / CELL));
    const c1 = Math.min(this.cols - 1, Math.ceil((Math.max(x0, x1) + reach - this.gx) / CELL));
    const r0 = Math.max(0, Math.floor((Math.min(y0, y1) - reach - this.gy) / CELL));
    const r1 = Math.min(this.rows - 1, Math.ceil((Math.max(y0, y1) + reach - this.gy) / CELL));
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy;
    for (let row = r0; row <= r1; row++) {
      const py = this.gy + (row + 0.5) * CELL;
      for (let col = c0; col <= c1; col++) {
        const px = this.gx + (col + 0.5) * CELL;
        let t = len2 > 0 ? ((px - x0) * dx + (py - y0) * dy) / len2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = px - (x0 + dx * t);
        const ey = py - (y0 + dy * t);
        const d = Math.sqrt(ex * ex + ey * ey);
        const a = 1 - smooth(r - soft, r + soft, d);
        if (a <= 0) continue;
        const i = row * this.cols + col;
        const c0 = this.clear[i];
        const b0 = this.breath[i];
        const c1 = c0 + (1 - c0) * a;
        const b1 = b0 * (1 - a);
        this.clear[i] = c1;
        this.breath[i] = b1;
        this.live = true;
        if (l) {
          const pane = paneIndex(l, px, py);
          if (pane >= 0) {
            const base = fogBase(l, pane, px, py, this.level);
            removed += Math.max(0, Math.max(base * (1 - c0), b0) - Math.max(base * (1 - c1), b1)) * CELL * CELL;
          }
        }
      }
    }
    return removed;
  }

  /** A breath: a soft disc pulled toward fog. */
  breathe(x: number, y: number, r: number, alpha: number) {
    const c0 = Math.max(0, Math.floor((x - r - this.gx) / CELL));
    const c1 = Math.min(this.cols - 1, Math.ceil((x + r - this.gx) / CELL));
    const r0 = Math.max(0, Math.floor((y - r - this.gy) / CELL));
    const r1 = Math.min(this.rows - 1, Math.ceil((y + r - this.gy) / CELL));
    for (let row = r0; row <= r1; row++) {
      const py = this.gy + (row + 0.5) * CELL;
      for (let col = c0; col <= c1; col++) {
        const px = this.gx + (col + 0.5) * CELL;
        const d = Math.hypot(px - x, py - y) / r;
        const a = alpha * (1 - smooth(0.45, 1, d));
        if (a <= 0) continue;
        const i = row * this.cols + col;
        this.breath[i] += (1 - this.breath[i]) * a;
        this.clear[i] *= 1 - a;
        this.live = true;
      }
    }
  }

  /** How much fog covers (x, y) right now (0 … 1). */
  at(x: number, y: number): number {
    const l = this.layout;
    if (!l) return 0;
    const pane = paneIndex(l, x, y);
    if (pane < 0) return 0;
    const col = Math.min(this.cols - 1, Math.max(0, Math.floor((x - this.gx) / CELL)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor((y - this.gy) / CELL)));
    const i = row * this.cols + col;
    const base = fogBase(l, pane, x, y, this.level) * (1 - this.clear[i]);
    return Math.max(base, this.breath[i]);
  }
}
