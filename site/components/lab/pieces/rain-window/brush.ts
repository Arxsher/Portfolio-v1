// The fingertip (or the keyboard's cursor, or the tile's ghost) wiping the
// condensation off the inside of the glass.
//
// The stroke is the pointer's own path, sample by sample (coalesced events
// included), so the clear streak is exactly under the finger: no lag, no
// smoothing that would make it feel second-hand. What makes it physical is
// where the water goes. The fog is water, so the finger collects it as it
// goes, in proportion to how thick the fog was under it, and sheds it
// along both edges of the streak as a row of small beads (bigger on the
// lower edge, where it runs to). When it has gathered enough, a drip
// forms on the lower rim of the fingertip and sets off down the glass on
// its own, clearing a lane through the fog. Any drips and beads the finger
// passes over are swept up into the load, so you can mop up your own
// drips. Lifting the finger leaves what it still holds as a bead or a drip.
//
// The fingertip's size springs in on contact (a light touch flattening
// into a press) and that is the only animated part of the stroke.

import type { FogMirror, Stamps } from "./fog";
import type { WindowLayout } from "./layout";
import type { Water } from "./water";

/** Water in fog, px³ per px² of glass wiped at full density. */
const FOG_WATER = 0.024;

export class Brush {
  down = false;
  x = 0;
  y = 0;
  /** the last point the stroke was laid to */
  private lx = 0;
  private ly = 0;
  /** the full radius for this stroke (px) */
  size = 20;
  /** the radius now (springs from a light touch to a press) */
  r = 0;
  private rv = 0;
  /** water gathered so far (px³) */
  load = 0;
  /** distance along the stroke since the last edge bead */
  private edgeAcc = 0;
  /** smoothed speed (px/s), for the sound and the ring */
  speed = 0;
  /** how much fog the stroke is going through (0 … 1), smoothed */
  fog = 0;
  /** total stroke length */
  travelled = 0;
  private rng: () => number;

  constructor(rng: () => number) {
    this.rng = rng;
  }

  begin(x: number, y: number, size: number) {
    this.down = true;
    this.x = this.lx = x;
    this.y = this.ly = y;
    this.size = size;
    this.r = size * 0.62;
    this.rv = 0;
    this.load = 0;
    this.edgeAcc = 0;
    this.travelled = 0;
  }

  /**
   * Move the fingertip to (x, y), wiping the way there. Call it for every
   * pointer sample. `dt` is the time since the previous sample (s).
   */
  to(x: number, y: number, dt: number, l: WindowLayout, inner: Water, mirror: FogMirror, stamps: Stamps) {
    this.x = x;
    this.y = y;
    if (!this.down) return;
    const dx = x - this.lx;
    const dy = y - this.ly;
    const len = Math.hypot(dx, dy);
    if (dt > 0) this.speed += (Math.min(4000, len / dt) - this.speed) * Math.min(1, dt * 14);
    if (len < 1.2) return;
    const R = this.r;
    const u = l.unit;
    const nx = -dy / len;
    const ny = dx / len;

    // the fog just ahead of the fingertip (what the edges of the streak are made of)
    const ahead = mirror.at(x + (dx / len) * R * 0.75, y + (dy / len) * R * 0.75);
    this.fog += (ahead - this.fog) * 0.3;
    // the fog taken off is the water picked up
    this.load += mirror.wipe(this.lx, this.ly, x, y, R, Math.max(1.5, R * 0.14)) * FOG_WATER;
    stamps.wipe(this.lx, this.ly, x, y, R);
    // and the edges bead
    const step = 2.6 * u + 1.2;
    this.edgeAcc += len;
    while (this.edgeAcc > step) {
      this.edgeAcc -= step;
      const t = 1 - this.edgeAcc / len;
      this.shed(this.lx + dx * t, this.ly + dy * t, nx, ny, R, this.fog, l, inner);
    }
    // the finger mops up drips and beads already on the inside
    this.load += inner.sweep(x, y, R * 0.92);
    if (len > R) this.load += inner.sweep((x + this.lx) / 2, (y + this.ly) / 2, R * 0.92);

    // enough gathered: a drip forms on the fingertip's lower rim and goes
    const drip = Math.pow(3.1 * u, 3);
    if (this.load > drip) {
      const r = Math.min(3.6 * u, Math.cbrt(this.load * 0.8));
      const ox = (this.rng() - 0.5) * R * 0.7;
      const oy = Math.sqrt(Math.max(0, R * R - ox * ox)) + r * 0.35;
      inner.addDrop(x + ox, y + oy, r, 0, 12 * u);
      this.load *= 0.18;
    }

    this.travelled += len;
    this.lx = x;
    this.ly = y;
  }

  /** A pair of edge beads either side of the stroke at (px, py), from the load. */
  private shed(px: number, py: number, nx: number, ny: number, R: number, f: number, l: WindowLayout, inner: Water) {
    if (f < 0.05) return;
    const u = l.unit;
    for (let side = -1; side <= 1; side += 2) {
      if (this.rng() > 0.35 + 0.6 * f) continue;
      const sx = nx * side;
      const sy = ny * side;
      // water runs to the lower edge
      const lower = sy > 0 ? 0.55 + 0.6 * sy : 0.55 + 0.25 * sy;
      const t = this.rng();
      const r = u * (0.4 + 1.25 * t * t) * (0.45 + 0.75 * f) * lower;
      this.load = Math.max(0, this.load - r * r * r);
      const off = R + r * 0.6 + (this.rng() - 0.25) * 2.2 * u;
      inner.addBead(px + sx * off, py + sy * off, r);
    }
  }

  /** Lift: what the finger still holds stays on the glass at its lower rim. */
  end(l: WindowLayout, inner: Water) {
    if (!this.down) return;
    this.down = false;
    const u = l.unit;
    if (this.load > Math.pow(1.2 * u, 3)) {
      const r = Math.min(3.6 * u, Math.cbrt(this.load * 0.9));
      const y = this.y + this.r + r * 0.25;
      if (r <= inner.cfg.beadMax * u) inner.addBead(this.x, y, r);
      else inner.addDrop(this.x, y, r, 0, 0);
    }
    this.load = 0;
  }

  /** The fingertip's spring and the speed's decay; returns true while it is still moving. */
  step(dt: number): boolean {
    const target = this.down ? this.size : this.size * 0.62;
    // stiff and just under critical: a quick press that doesn't bounce
    const k = 900;
    const c = 2 * Math.sqrt(k) * 0.85;
    let rem = Math.min(dt, 0.1);
    while (rem > 1e-5) {
      const h = Math.min(rem, 1 / 240);
      this.rv += (-k * (this.r - target) - c * this.rv) * h;
      this.r += this.rv * h;
      rem -= h;
    }
    if (!this.down) this.speed *= Math.exp(-dt * 10);
    else this.speed *= Math.exp(-dt * 4);
    return Math.abs(this.r - target) > 0.05 || Math.abs(this.rv) > 0.1 || this.speed > 1;
  }
}
