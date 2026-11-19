// Rise: the city's buildings growing to their height on springs.
//
// The home card raises its city once, when it first comes into view (a
// wave through the year, oldest week first, so the year is built the way it
// happened), and again whenever fresher numbers arrive (each day that
// changed grows from the height it had to its new one; a new day rises from
// its empty lot). The renderer reads every lot's height and boxes as they
// are, so rising is only moving those: each frame, every lot still moving
// takes its height from its spring and its boxes are scaled to match (the
// tallest tower's antenna slides out at the very end); once a lot lands,
// its exact plan comes back.
//
// Springs work in world units (height), slightly under-damped so a building
// overshoots by a few percent and settles, like something set down with a
// little give. Handing a lot over (new data mid-rise) passes its current
// height and speed, so nothing ever jumps. While paused (the card not yet
// in view), every lot holds where it is.
//
// No allocation per frame: springs are made once per city, and the moving
// lots live in a typed list.

import { Spring, smoothstep } from "../../hooks";
import type { City, Lot } from "./city";

/** ~6% overshoot, settled in about half a second. */
const FEEL = { stiffness: 210, damping: 19, precision: 0.0015 };

type Shape = { y0: Float64Array; y1: Float64Array; mast: number };

export class Rise {
  readonly city: City;
  /** The built shape of each lot (by slot), to scale from. */
  private shapes: Shape[];
  private springs: Array<Spring | null>;
  private delay: Float64Array;
  private moving: Int32Array;
  private count = 0;
  private held = false;

  constructor(city: City) {
    this.city = city;
    const lots = city.lots;
    this.shapes = lots.map((lot) => ({
      y0: Float64Array.from(lot.tiers, (tier) => tier.y0),
      y1: Float64Array.from(lot.tiers, (tier) => tier.y1),
      mast: lot.mast,
    }));
    this.springs = lots.map(() => null);
    this.delay = new Float64Array(lots.length);
    this.moving = new Int32Array(lots.length);
  }

  /** Anything still to rise (waiting, held or moving)? */
  get busy() {
    return this.count > 0;
  }

  /** Held until go() (the card not yet in view)? */
  get paused() {
    return this.held && this.count > 0;
  }

  /** Current speed of a lot's building (world units a second), for a hand-over. */
  velocityOf(lot: Lot): number {
    return this.isMoving(lot) ? (this.springs[lot.slot]?.velocity ?? 0) : 0;
  }

  /** Seconds a lot still waits before it rises (0 once it is on its way). */
  delayOf(lot: Lot): number {
    return this.isMoving(lot) ? Math.max(0, this.delay[lot.slot]) : 0;
  }

  /** Still to land (waiting, held or moving)? */
  isMoving(lot: Lot): boolean {
    return this.listed(lot.slot);
  }

  /**
   * Puts a lot's building at `from` (moving at `velocity`) to rise to its
   * full height after `delay` seconds. An empty lot (nothing to build) is
   * left alone.
   */
  set(lot: Lot, from: number, velocity: number, delay: number) {
    if (lot.fullHeight <= 0) return;
    let spring = this.springs[lot.slot];
    if (!spring) {
      spring = new Spring(from, FEEL);
      this.springs[lot.slot] = spring;
    }
    spring.value = Math.max(0, from);
    spring.velocity = velocity;
    spring.target = lot.fullHeight;
    if (spring.settled) {
      spring.set(lot.fullHeight);
      this.shape(lot, lot.fullHeight);
      return;
    }
    if (!this.listed(lot.slot)) this.moving[this.count++] = lot.slot;
    this.delay[lot.slot] = Math.max(0, delay);
    this.shape(lot, spring.value);
  }

  /** Holds every lot where it is until go(). */
  pause() {
    this.held = true;
  }

  go() {
    this.held = false;
  }

  /** Advances the springs; returns true if anything moved (draw this frame). */
  step(dt: number): boolean {
    if (this.held || this.count === 0) return false;
    const before = this.count;
    const lots = this.city.lots;
    let kept = 0;
    for (let i = 0; i < this.count; i++) {
      const slot = this.moving[i];
      const lot = lots[slot];
      const spring = this.springs[slot]!;
      if (this.delay[slot] > 0) {
        this.delay[slot] -= dt;
        // The part of this frame after the wait still counts.
        if (this.delay[slot] > 0) {
          this.moving[kept++] = slot;
          continue;
        }
        spring.step(-this.delay[slot]);
        this.delay[slot] = 0;
      } else spring.step(dt);
      if (spring.settled) {
        spring.set(lot.fullHeight);
        this.shape(lot, lot.fullHeight);
        continue;
      }
      this.shape(lot, spring.value);
      this.moving[kept++] = slot;
    }
    this.count = kept;
    // Lots that landed this frame were snapped to their plan: that is a change too.
    return kept > 0 || before > 0;
  }

  /** Everything at its full height, now (reduced motion, or the end). */
  snap() {
    const lots = this.city.lots;
    for (let i = 0; i < this.count; i++) {
      const slot = this.moving[i];
      this.springs[slot]?.set(lots[slot].fullHeight);
      this.shape(lots[slot], lots[slot].fullHeight);
    }
    this.count = 0;
    this.held = false;
  }

  private listed(slot: number) {
    for (let i = 0; i < this.count; i++) if (this.moving[i] === slot) return true;
    return false;
  }

  /** A lot's building at height `h`: its boxes scaled from the built shape. */
  private shape(lot: Lot, h: number) {
    const full = lot.fullHeight;
    const shape = this.shapes[lot.slot];
    if (h >= full - 1e-6 && h <= full + 1e-6) {
      lot.height = full;
      for (let t = 0; t < lot.tiers.length; t++) {
        lot.tiers[t].y0 = shape.y0[t];
        lot.tiers[t].y1 = shape.y1[t];
      }
      lot.mast = shape.mast;
      return;
    }
    const r = Math.max(0, h) / full;
    // Below a sliver the lot is still an empty lot (no pad, no shadow).
    lot.height = h > 0.004 ? h : 0;
    for (let t = 0; t < lot.tiers.length; t++) {
      lot.tiers[t].y0 = shape.y0[t] * r;
      lot.tiers[t].y1 = shape.y1[t] * r;
    }
    // The antenna goes up last.
    lot.mast = shape.mast * smoothstep(0.86, 1, r);
  }
}
