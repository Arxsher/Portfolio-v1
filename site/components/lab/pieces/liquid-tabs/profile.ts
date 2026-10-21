// The drop's outline as a profile: every part of the liquid lies on the
// channel's centre line and is symmetric about it, so the whole shape is
// one function r(x), its half-height at each x. That makes the smooth
// union exact and cheap:
//
// 1. Union: r(x) = the largest half-height of any capsule at x.
// 2. Closing (dilate, then erode, by a disc of radius ρ): a ball rolled
//    along the outline fills every notch tighter than itself (where a neck
//    meets a body, where bridge segments meet) and bridges any two drops
//    closer than 2ρ with a neck that thickens continuously as they
//    approach. Unlike a smooth-min, it never bulges edges that run side by
//    side, and it leaves convex ends exactly as they were.
// 3. Past the ends, r(x) is extended with minus the distance to the
//    nearest liquid, so the shader can treat (|y| − r) / √(1 + r′²) as a
//    signed distance everywhere for antialiasing and soft shadows.
//
// The result is uploaded as an RG32F texture (r, r′) sampled every half
// CSS pixel. No allocations after resize.
//
// Wet: the floor stays damp where the liquid has been, as a band as thick
// as the liquid was there, shrinking and fading as it dries.

import { PRIM_STRIDE } from "./engine";

/** Samples per CSS px. */
const DENSITY = 2;

export class Profile {
  /** x of sample 0 (bar-local CSS px), and sample count. */
  origin = 0;
  count = 0;
  /** Closing radius in CSS px. */
  rho = 0;
  private raw = new Float32Array(1);
  private dil = new Float32Array(1);
  private kernel = new Float32Array(1);
  private reach = 0;
  /** Closed half-height, extended negative outside the liquid. */
  readonly r: Float32Array = new Float32Array(1);
  /** (r, r′) interleaved, for the texture. */
  data = new Float32Array(2);
  private rBuf = new Float32Array(1);

  get step() {
    return 1 / DENSITY;
  }

  /** Size for a channel `length` CSS px long, with liquid allowed `margin` past each end. */
  resize(length: number, margin: number, rho: number) {
    const count = Math.ceil((length + margin * 2) * DENSITY) + 1;
    this.origin = -margin;
    if (count !== this.count) {
      this.count = count;
      this.raw = new Float32Array(count);
      this.dil = new Float32Array(count);
      this.rBuf = new Float32Array(count);
      this.data = new Float32Array(count * 2);
    }
    if (rho !== this.rho) {
      this.rho = rho;
      const reach = Math.max(1, Math.ceil(rho * DENSITY));
      this.reach = reach;
      this.kernel = new Float32Array(reach + 1);
      for (let j = 0; j <= reach; j++) {
        const s = j / DENSITY;
        this.kernel[j] = Math.sqrt(Math.max(0, rho * rho - s * s));
      }
    }
  }

  /** Half-height at x (0 where there's no liquid). */
  at(x: number): number {
    const f = (x - this.origin) * DENSITY;
    const i = Math.floor(f);
    if (i < 0 || i >= this.count - 1) return 0;
    const r = this.rBuf;
    const v = r[i] + (r[i + 1] - r[i]) * (f - i);
    return v > 0 ? v : 0;
  }

  /** The values the shader reads (also usable for drawing in 2D). */
  get values(): Float32Array {
    return this.rBuf;
  }

  compute(prims: Float32Array, primCount: number) {
    const n = this.count;
    const raw = this.raw;
    raw.fill(-1);
    const step = 1 / DENSITY;
    let lo = n;
    let hi = -1;

    // 1. union
    for (let p = 0; p < primCount; p++) {
      const o = p * PRIM_STRIDE;
      const a = prims[o];
      const b = prims[o + 1];
      const ra = prims[o + 2];
      const rb = prims[o + 3];
      const curve = prims[o + 4];
      const i0 = Math.max(0, Math.ceil((a - ra - this.origin) * DENSITY));
      const i1 = Math.min(n - 1, Math.floor((b + rb - this.origin) * DENSITY));
      const len = b - a;
      // curve 2: the convex hull of the two end circles (a teardrop when
      // the ends differ), between the points where the outer tangent
      // touches them
      let xa = a;
      let xb = b;
      let ya = ra;
      let yb = rb;
      if (curve > 1.5 && len > 1e-4 && Math.abs(rb - ra) < len) {
        const sn = (rb - ra) / len;
        const cs = Math.sqrt(1 - sn * sn);
        xa = a - ra * sn;
        ya = ra * cs;
        xb = b - rb * sn;
        yb = rb * cs;
      }
      const span = xb - xa;
      if (curve >= 3) {
        // a bridge: r(t) = taper · (1 − n · 4t(1 − t)), exact, no end circles
        const pinch = curve - 3;
        if (len <= 1e-4) continue;
        const j0 = Math.max(0, Math.ceil((a - this.origin) * DENSITY));
        const j1 = Math.min(n - 1, Math.floor((b - this.origin) * DENSITY));
        for (let i = j0; i <= j1; i++) {
          const t = (this.origin + i * step - a) / len;
          const r = (ra + (rb - ra) * t) * (1 - pinch * 4 * t * (1 - t));
          if (r > raw[i]) raw[i] = r;
        }
        if (j0 < lo) lo = j0;
        if (j1 > hi) hi = j1;
        continue;
      }
      for (let i = i0; i <= i1; i++) {
        const x = this.origin + i * step;
        let r = -1;
        if (x >= xa && x <= xb && span > 1e-4) {
          let t = (x - xa) / span;
          if (curve > 0.5 && curve < 1.5) t = t * t * (3 - 2 * t);
          r = ya + (yb - ya) * t;
        }
        const da = x - a;
        if (da * da < ra * ra) {
          const c = Math.sqrt(ra * ra - da * da);
          if (c > r) r = c;
        }
        const db = x - b;
        if (db * db < rb * rb) {
          const c = Math.sqrt(rb * rb - db * db);
          if (c > r) r = c;
        }
        if (r > raw[i]) raw[i] = r;
      }
      if (i0 < lo) lo = i0;
      if (i1 > hi) hi = i1;
    }

    const out = this.rBuf;
    if (hi < lo) {
      // nothing at all
      out.fill(-64);
      this.pack();
      return;
    }

    // 2. closing: dilate by the disc …
    const K = this.reach;
    const kern = this.kernel;
    const dil = this.dil;
    const dlo = Math.max(0, lo - K);
    const dhi = Math.min(n - 1, hi + K);
    dil.fill(-1);
    for (let i = dlo; i <= dhi; i++) {
      let best = -1;
      const j0 = Math.max(lo, i - K);
      const j1 = Math.min(hi, i + K);
      for (let j = j0; j <= j1; j++) {
        const v = raw[j];
        if (v < 0) continue;
        const d = v + kern[j > i ? j - i : i - j];
        if (d > best) best = d;
      }
      dil[i] = best;
    }
    // … then erode it
    out.fill(-1);
    for (let i = lo; i <= hi; i++) {
      let best = 1e9;
      const j0 = i - K;
      const j1 = i + K;
      for (let j = j0; j <= j1; j++) {
        const v = j < 0 || j >= n ? -1 : dil[j];
        const d = v < 0 ? -1e9 : v - kern[j > i ? j - i : i - j];
        if (d < best) {
          best = d;
          if (best < 0) break;
        }
      }
      const r = Math.max(best, raw[i]);
      out[i] = r >= 0 ? r : -1;
    }

    // 3. outside the liquid: minus the distance to the nearest liquid
    let last = -1e9;
    for (let i = 0; i < n; i++) {
      if (out[i] >= 0) last = i;
      else out[i] = -Math.min(64, (i - last) * step);
    }
    last = 1e9;
    for (let i = n - 1; i >= 0; i--) {
      if (out[i] >= 0) last = i;
      else out[i] = Math.max(out[i], -Math.min(64, (last - i) * step));
    }
    this.pack();
  }

  /**
   * Interleave (r, r′). The slope comes from a lightly blurred copy of r
   * (about a pixel), so the creases where two shapes meet shade as soft
   * folds instead of hard steps in the reflections; the outline itself
   * stays exact.
   */
  private pack() {
    const r = this.rBuf;
    const b = this.dil; // free after compute: reused for the blur
    const d = this.data;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      const a2 = r[i > 1 ? i - 2 : 0];
      const a1 = r[i > 0 ? i - 1 : 0];
      const c1 = r[i < n - 1 ? i + 1 : n - 1];
      const c2 = r[i < n - 2 ? i + 2 : n - 1];
      b[i] = (a2 + 4 * a1 + 6 * r[i] + 4 * c1 + c2) / 16;
    }
    const inv = DENSITY / 4;
    for (let i = 0; i < n; i++) {
      // inside the liquid, the blurred slope; at the tips, the exact one
      const exact = r[i] > 0 && (r[i > 1 ? i - 2 : 0] <= 0 || r[i < n - 2 ? i + 2 : n - 1] <= 0);
      const src = exact ? r : b;
      let s = (src[i < n - 2 ? i + 2 : n - 1] - src[i > 1 ? i - 2 : 0]) * inv;
      if (s > 10) s = 10;
      else if (s < -10) s = -10;
      d[i * 2] = r[i];
      d[i * 2 + 1] = s;
    }
  }
}

/** One value per WET_STEP CSS px along the channel: how thick the damp band is (0..1 of the drop). */
export const WET_STEP = 2;

export class Wet {
  values = new Float32Array(1);
  bytes = new Uint8Array(1);
  /** Still drying somewhere. */
  active = false;
  dirty = true;

  resize(length: number) {
    const n = Math.max(1, Math.ceil(length / WET_STEP) + 1);
    if (n !== this.values.length) {
      this.values = new Float32Array(n);
      this.bytes = new Uint8Array(n);
    }
    this.clear();
  }

  clear() {
    this.values.fill(0);
    this.bytes.fill(0);
    this.active = false;
    this.dirty = true;
  }

  /** Soak where the liquid is, dry everywhere else (`dry`: seconds; 0 = this liquid never wets). */
  update(profile: Profile, half: number, dry: number, dt: number) {
    const w = this.values;
    let active = false;
    if (dry <= 0) {
      for (let i = 0; i < w.length; i++) {
        if (w[i] <= 0) continue;
        w[i] = Math.max(0, w[i] - dt * 3);
        active = true;
      }
    } else {
      const decay = Math.exp(-dt / dry);
      for (let i = 0; i < w.length; i++) {
        const here = Math.min(1, profile.at(i * WET_STEP) / half);
        let v = w[i] * decay - dt * 0.12;
        if (here > v) v = here;
        if (v < 0) v = 0;
        if (Math.abs(v - w[i]) > 1e-4) active = true;
        w[i] = v;
      }
    }
    if (active || this.active) {
      const b = this.bytes;
      for (let i = 0; i < w.length; i++) b[i] = Math.round(Math.min(1, w[i]) * 255);
      this.dirty = true;
    }
    this.active = active;
  }
}
