// The cord, the switch and the lamp, simulated together.
//
// - The pull cord is a chain of 20 particles (the last one carries the
//   porcelain pull) joined by distance constraints, solved with XPBD in
//   small substeps (about 600 a second, one pass each), with weak bending
//   constraints so it hangs like braided cotton rather than a bead chain.
// - Its top leaves the shade through a grommet. Behind the grommet is the
//   switch: a spring-loaded slider that lets the cord out by up to DMAX.
//   The first segment's rest length is `seg + d`, so drawing the cord out
//   really lengthens it. The slider is pushed by the cord's tension (the
//   constraint force, λ / h²) against a preloaded spring with a cam bump:
//   resistance builds toward the click point and lets go past it, the way
//   a ceiling pull switch does. Crossing DCLICK toggles the light once; it
//   re-arms when the slider has gone most of the way back in.
// - The lamp hangs from the canopy as a heavy pendulum (angle, plus a
//   little stretch along the cable), and the grommet is a point on it: the
//   cord's first constraint moves the lamp through its generalised inverse
//   mass, so pulling sideways swings the shade and a hard pull dips it.
// - A hand holds a particle with a stiff spring whose force is capped,
//   so the pull follows the finger exactly while the cord is slack, stops
//   when the switch is fully out (the hand runs on ahead), and keeps the
//   speed it was moving at when it is let go: flicks throw it.
// - The cord can't pass through the shade, the bulb or the edges of the
//   canvas. The pull knocking the shade reports a clink.
//
// Everything is preallocated; step() does no allocation.

import {
  BEAD_R1,
  BULB_R,
  BULB_SY,
  CORD_R,
  DOME_R,
  DOME_SIL,
  EXIT_X,
  EXIT_Y,
  MASS_Y,
} from "./geometry";
import type { Layout } from "./layout";

/** Free particles; the last is the pull. */
export const N = 20;

/** Substeps a second, and constraint passes per substep. */
const RATE = 600;
const ITERATIONS = 3;
/** Longest frame simulated in real time (seconds); longer ones run slow. */
const MAX_FRAME = 1 / 24;
/** Gravity, scene units / s². */
const G = 1800;
const M_ROPE = 0.04;
const M_BEAD = 0.6;

/** Switch travel and click points (scene units of cord let out). */
export const DMAX = 26;
export const DCLICK = 16;
const DREARM = 5;
const SLIDER_M = 0.1;
/** Preload: the switch only gives once the pull is drawn on well past the cord's own weight. */
const F0 = 2.5 * G * ((N - 1) * M_ROPE + M_BEAD);
const K_SLIDER = F0 / DMAX;
const CAM = 0.35 * F0;
/** The switch's dashpot (force per unit/s): the cord snaps back in, but not like a catapult. */
const SLIDER_DASH = 14;

const LAMP_M = 50;
const LAMP_MY = 6;
const K_CABLE = 4000;

const ALPHA_ROPE = 1.5e-5;
const ALPHA_BEND = 3e-3;
const ALPHA_GRIP = 1e-6;
const GRIP_MAX = 16000;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Spring force on the slider: preload + rate + the cam bump before the click. */
function sliderForce(d: number) {
  const cam = d <= DCLICK ? smoothstep(DCLICK - 7, DCLICK, d) : 1 - smoothstep(DCLICK, DCLICK + 0.8, d);
  return F0 + K_SLIDER * d + CAM * cam;
}

export type CordEvents = {
  /** The switch clicked over (`speed`: how fast the cord was coming out, units / s). */
  onClick?: (speed: number) => void;
  /** The slider went back in far enough to click again. */
  onRearm?: (speed: number) => void;
  /** The pull knocked the shade or the bulb. */
  onClink?: (speed: number, part: "shade" | "bulb") => void;
};

export class CordSim {
  readonly x = new Float64Array(N);
  readonly y = new Float64Array(N);
  readonly px = new Float64Array(N);
  readonly py = new Float64Array(N);
  readonly vx = new Float64Array(N);
  readonly vy = new Float64Array(N);
  readonly w = new Float64Array(N);

  // layout
  ax = 0;
  ay = 0;
  arm = 196;
  seg = 7.4;
  width = 600;
  floor = 500;
  private inertia = 1;
  private rcm = 1;

  // lamp: swing angle (positive swings the shade left), cable stretch
  theta = 0;
  omega = 0;
  yl = 0;
  vyl = 0;

  // switch
  d = 0;
  vd = 0;
  armed = true;
  /** Cord tension at the grommet (last substep), force units. */
  tension = 0;

  // hand
  grab = -1;
  hx = 0;
  hy = 0;
  private hxPrev = 0;
  private hyPrev = 0;

  // frame of the lamp, refreshed by frame()
  rx = 1;
  ry = 0;
  ux = 0;
  uy = 1;
  ox = 0;
  oy = 0;
  ex = 0;
  ey = 0;

  /** Heavier damping, no ringing (prefers-reduced-motion). */
  reduced = false;
  /** Fastest particle in the last step (units / s). */
  maxSpeed = 0;
  events: CordEvents = {};

  private clinkCooldown = 0;
  private readonly lambdaLinks = new Float64Array(N);
  private readonly lambdaBends = new Float64Array(N);
  private lambdaGrip = 0;
  private lambdaExit = 0;

  constructor(layout: Layout) {
    for (let i = 0; i < N; i++) this.w[i] = 1 / (i === N - 1 ? M_BEAD : M_ROPE);
    this.applyLayout(layout, true);
  }

  /** Fit to a new layout. The first call hangs the cord straight; later ones carry it along. */
  applyLayout(layout: Layout, reset = false) {
    const dx = layout.ax - this.ax;
    const dy = layout.ay - this.ay;
    this.ax = layout.ax;
    this.ay = layout.ay;
    this.arm = layout.arm;
    this.seg = layout.cord / N;
    this.width = layout.width;
    this.floor = layout.floor;
    this.rcm = layout.arm - MASS_Y;
    this.inertia = LAMP_M * this.rcm * this.rcm;
    if (reset) {
      this.hang();
      return;
    }
    for (let i = 0; i < N; i++) {
      this.x[i] += dx;
      this.y[i] += dy;
      this.px[i] += dx;
      this.py[i] += dy;
    }
    this.hx += dx;
    this.hy += dy;
    this.hxPrev += dx;
    this.hyPrev += dy;
    this.frame();
  }

  /** Hang at rest: lamp still, cord straight down, then let it settle. */
  hang() {
    this.theta = 0;
    this.omega = 0;
    this.yl = 0;
    this.vyl = 0;
    this.d = 0;
    this.vd = 0;
    this.tension = 0;
    this.armed = true;
    this.grab = -1;
    this.frame();
    for (let i = 0; i < N; i++) {
      this.x[i] = this.ex;
      this.y[i] = this.ey + (i + 1) * this.seg;
      this.px[i] = this.x[i];
      this.py[i] = this.y[i];
      this.vx[i] = 0;
      this.vy[i] = 0;
    }
    // settle the cord's sag and the cable's stretch, quietly
    const events = this.events;
    const reduced = this.reduced;
    this.events = {};
    this.reduced = true;
    // (the cord's weight tips the lamp a little: let that finish too)
    for (let k = 0; k < 360 && (k < 40 || !this.settled); k++) this.step(1 / 60);
    this.reduced = reduced;
    this.events = events;
    this.omega = 0;
    this.vyl = 0;
    for (let i = 0; i < N; i++) {
      this.vx[i] = 0;
      this.vy[i] = 0;
    }
  }

  /** The lamp's axes, rim centre and the grommet's exit point. */
  frame() {
    const c = Math.cos(this.theta);
    const s = Math.sin(this.theta);
    this.rx = c;
    this.ry = s;
    this.ux = -s;
    this.uy = c;
    const reach = this.arm + this.yl;
    this.ox = this.ax + this.ux * reach;
    this.oy = this.ay + this.uy * reach;
    this.ex = this.ox + this.rx * EXIT_X - this.ux * EXIT_Y;
    this.ey = this.oy + this.ry * EXIT_X - this.uy * EXIT_Y;
  }

  /** Where the pull would hang if everything were still (for scripted pulls). */
  restX() {
    return this.ex;
  }
  restY() {
    return this.ey + N * this.seg;
  }

  /** Take hold of particle `index`; the hand starts where the particle is. */
  hold(index: number) {
    this.grab = index;
    this.hx = this.hxPrev = this.x[index];
    this.hy = this.hyPrev = this.y[index];
  }

  /** Move the hand (the held particle springs to it over the next step). */
  moveHand(x: number, y: number) {
    this.hx = x;
    this.hy = y;
  }

  release() {
    this.grab = -1;
  }

  /** The particle nearest a point (scene units) and its distance. */
  nearest(x: number, y: number): { index: number; distance: number } {
    let best = Infinity;
    let index = -1;
    // the pull itself: measured to its body, a little below the last particle
    for (let i = 0; i < N; i++) {
      let px = this.x[i];
      let py = this.y[i];
      let r = CORD_R;
      if (i === N - 1) {
        const tx = px - this.x[i - 1];
        const ty = py - this.y[i - 1];
        const len = Math.hypot(tx, ty) || 1;
        px += (tx / len) * 12;
        py += (ty / len) * 12;
        r = BEAD_R1 + 2;
      }
      const dist = Math.hypot(x - px, y - py) - r;
      if (dist < best) {
        best = dist;
        index = i;
      }
    }
    return { index, distance: best };
  }

  /** Give the pull some sideways speed (keyboard nudges, the tile's tugs). */
  nudge(vx: number, vy = 0) {
    const i = N - 1;
    this.vx[i] += vx;
    this.vy[i] += vy;
  }

  /** Knock the shade (radians / s; positive swings it left). */
  push(omega: number) {
    this.omega += omega;
  }

  get settled() {
    return (
      this.grab < 0 &&
      this.maxSpeed < 0.6 &&
      Math.abs(this.omega) < 0.002 &&
      Math.abs(this.vyl) < 0.05 &&
      Math.abs(this.vd) < 0.3 &&
      this.d < 0.02
    );
  }

  step(dt: number) {
    // a repeated timestamp (dt 0) would divide by zero below
    if (!(dt > 0)) return;
    // Substeps never longer than 1 / RATE: the switch is a light slider on a
    // stiff cord, and longer steps let it ring and re-arm under a held hand
    // (one pull clicking the light off and on again). A long frame (a hitch,
    // the page repainting for a theme change) plays in slow motion instead.
    const span = Math.min(dt, MAX_FRAME);
    const n = Math.max(2, Math.ceil(span * RATE - 1e-6));
    const h = span / n;
    this.maxSpeed = 0;
    for (let k = 0; k < n; k++) {
      const f = (k + 1) / n;
      this.substep(h, this.hxPrev + (this.hx - this.hxPrev) * f, this.hyPrev + (this.hy - this.hyPrev) * f);
    }
    this.hxPrev = this.hx;
    this.hyPrev = this.hy;
    this.clinkCooldown = Math.max(0, this.clinkCooldown - span);
    // never let one bad frame poison the simulation for good
    if (!Number.isFinite(this.x[N - 1] + this.y[N - 1] + this.theta + this.yl + this.d + this.tension)) this.hang();
  }

  private substep(h: number, tx: number, ty: number) {
    const reduced = this.reduced;
    const ropeDamp = Math.exp(-(reduced ? 9 : 0.5) * h);
    const swingDamp = Math.exp(-(reduced ? 9 : 0.7) * h);
    const cableDamp = Math.exp(-(reduced ? 40 : 9) * h);
    const { x, y, px, py, vx, vy, w } = this;
    const h2 = h * h;

    // lamp: a pendulum about the canopy, and a springy cable
    const theta0 = this.theta;
    const yl0 = this.yl;
    this.omega += -(G / this.rcm) * Math.sin(this.theta) * h;
    this.omega *= swingDamp;
    this.theta += this.omega * h;
    this.vyl += -(K_CABLE / LAMP_MY) * this.yl * h;
    this.vyl *= cableDamp;
    this.yl += this.vyl * h;

    // switch: the cord's pull (low-passed constraint force) against the spring
    const pull = Math.max(0, this.tension);
    // (the dashpot is integrated implicitly: it is stiff next to the slider's mass)
    this.vd = (this.vd + ((pull - sliderForce(this.d)) / SLIDER_M) * h) / (1 + (SLIDER_DASH / SLIDER_M) * h);
    this.d += this.vd * h;
    if (this.d < 0) {
      this.d = 0;
      if (this.vd < 0) this.vd = 0;
    } else if (this.d > DMAX) {
      this.d = DMAX;
      if (this.vd > 0) this.vd = 0;
    }
    this.frame();

    // cord: predict
    for (let i = 0; i < N; i++) {
      vy[i] += G * h;
      vx[i] *= ropeDamp;
      vy[i] *= ropeDamp;
      px[i] = x[i];
      py[i] = y[i];
      x[i] += vx[i] * h;
      y[i] += vy[i] * h;
    }

    // constraints, a few Gauss-Seidel passes (XPBD: λ accumulates per substep)
    const links = this.lambdaLinks;
    const bends = this.lambdaBends;
    links.fill(0);
    bends.fill(0);
    this.lambdaGrip = 0;
    this.lambdaExit = 0;
    const seg = this.seg;
    const ropeA = ALPHA_ROPE / h2;
    const bendA = ALPHA_BEND / h2;
    for (let it = 0; it < ITERATIONS; it++) {
      if (this.grab >= 0) this.solveGrip(tx, ty, ALPHA_GRIP / h2, GRIP_MAX * h2);
      // one sweep down the cord and one back up, every pass: alternating the
      // order from substep to substep leaves the top particle flickering
      // between two solutions, which never lets the cord come to rest
      this.solveExit(ropeA);
      for (let i = 1; i < N; i++) links[i] += this.solveLink(i - 1, i, seg, ropeA, links[i]);
      for (let i = N - 1; i >= 1; i--) links[i] += this.solveLink(i - 1, i, seg, ropeA, links[i]);
      this.solveExit(ropeA);
      for (let i = 2; i < N; i++) bends[i] += this.solveLink(i - 2, i, seg * 2, bendA, bends[i]);
    }

    this.collide(h);

    // velocities from positions
    let fastest = this.maxSpeed * this.maxSpeed;
    for (let i = 0; i < N; i++) {
      vx[i] = (x[i] - px[i]) / h;
      vy[i] = (y[i] - py[i]) / h;
      const speed = vx[i] * vx[i] + vy[i] * vy[i];
      if (speed > fastest) fastest = speed;
    }
    this.maxSpeed = Math.sqrt(fastest);
    this.omega = (this.theta - theta0) / h;
    this.vyl = (this.yl - yl0) / h;

    // the cord's tension at the grommet, smoothed a little (one pass of
    // Gauss-Seidel leaves it noisy from substep to substep)
    const raw = -this.lambdaExit / h2;
    this.tension += (raw - this.tension) * (1 - Math.exp(-h / 0.006));

    // the click (only while someone holds the cord: a bounce never switches
    // the light), and the re-arm once the slider is nearly back in
    if (this.armed && this.d >= DCLICK) {
      if (this.grab >= 0) {
        this.armed = false;
        this.events.onClick?.(this.vd);
      }
    } else if (!this.armed && this.d <= DREARM) {
      this.armed = true;
      this.events.onRearm?.(-this.vd);
    }
  }

  private solveGrip(tx: number, ty: number, alpha: number, cap: number) {
    const { x, y, w } = this;
    const i = this.grab;
    const dx = x[i] - tx;
    const dy = y[i] - ty;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return;
    let dl = (-len - alpha * this.lambdaGrip) / (w[i] + alpha);
    // the hand can only pull so hard: past that, the pull slips behind it
    if (this.lambdaGrip + dl < -cap) dl = -cap - this.lambdaGrip;
    this.lambdaGrip += dl;
    x[i] += (w[i] * dl * dx) / len;
    y[i] += (w[i] * dl * dy) / len;
  }

  /** Grommet to the first particle: rest length seg + d, the lamp on the other end. */
  private solveExit(alpha: number) {
    const { x, y, w } = this;
    const dx = x[0] - this.ex;
    const dy = y[0] - this.ey;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return;
    const nx = dx / len;
    const ny = dy / len;
    const c = len - (this.seg + this.d);
    // the lamp's share: turning about the canopy and stretching the cable
    const rEx = this.ex - this.ax;
    const rEy = this.ey - this.ay;
    const cross = rEx * ny - rEy * nx;
    const along = this.ux * nx + this.uy * ny;
    const wLamp = (cross * cross) / this.inertia + (along * along) / LAMP_MY;
    const dl = (-c - alpha * this.lambdaExit) / (w[0] + wLamp + alpha);
    this.lambdaExit += dl;
    x[0] += w[0] * dl * nx;
    y[0] += w[0] * dl * ny;
    this.theta += (-cross * dl) / this.inertia;
    this.yl += (-along * dl) / LAMP_MY;
    this.frame();
  }

  /** One distance constraint; returns its Δλ. */
  private solveLink(a: number, b: number, rest: number, alpha: number, lambda: number) {
    const { x, y, w } = this;
    const dx = x[b] - x[a];
    const dy = y[b] - y[a];
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) return 0;
    const c = len - rest;
    const dl = (-c - alpha * lambda) / (w[a] + w[b] + alpha);
    const nx = dx / len;
    const ny = dy / len;
    x[a] -= w[a] * dl * nx;
    y[a] -= w[a] * dl * ny;
    x[b] += w[b] * dl * nx;
    y[b] += w[b] * dl * ny;
    return dl;
  }

  /** Keep the cord out of the shade and the bulb and inside the canvas. */
  private collide(h: number) {
    const { x, y, px, py } = this;
    const { rx, ry, ux, uy, ox, oy } = this;
    for (let i = 1; i < N; i++) {
      const bead = i === N - 1;
      const pad = bead ? BEAD_R1 * 0.9 : CORD_R + 0.4;
      // into the lamp's screen frame
      const dx = x[i] - ox;
      const dy = y[i] - oy;
      let lx = dx * rx + dy * ry;
      let ly = -(dx * ux + dy * uy);
      let hit: "shade" | "bulb" | null = null;
      if (ly > -pad) {
        // the shade is a shell open at the bottom: a point that got in from
        // below leaves the way it came (down through the opening), one that
        // got in from the side or the top goes back out through the dome
        const a = DOME_R + pad;
        const b = DOME_SIL + pad;
        const lyc = Math.max(0, ly);
        const k = (lx / a) * (lx / a) + (lyc / b) * (lyc / b);
        if (k < 1) {
          const s = 1 / Math.sqrt(Math.max(k, 1e-6));
          const out = Math.hypot(lx, lyc) * (s - 1);
          const down = ly + pad;
          if (down < out) {
            ly = -pad;
          } else {
            lx *= s;
            ly = lyc * s;
          }
          hit = "shade";
        }
      }
      if (!hit) {
        const bx = lx;
        const by = ly - BULB_SY;
        const r = BULB_R + pad;
        const dist = Math.hypot(bx, by);
        if (dist < r && dist > 1e-6) {
          lx = (bx / dist) * r;
          ly = BULB_SY + (by / dist) * r;
          hit = "bulb";
        }
      }
      if (hit) {
        const nxp = ox + rx * lx - ux * ly;
        const nyp = oy + ry * lx - uy * ly;
        // outward normal (from where the particle was pushed in to where it is put back)
        let nx = nxp - x[i];
        let ny = nyp - y[i];
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl;
        ny /= nl;
        // the velocity it hit with: keep most of it along the surface, bounce a little
        const vxp = (x[i] - px[i]) / h;
        const vyp = (y[i] - py[i]) / h;
        const vn = vxp * nx + vyp * ny;
        let vxn = vxp;
        let vyn = vyp;
        if (vn < 0) {
          vxn = (vxp - vn * nx) * 0.82 - vn * 0.25 * nx;
          vyn = (vyp - vn * ny) * 0.82 - vn * 0.25 * ny;
          if (bead && -vn > 90 && this.clinkCooldown <= 0) {
            this.clinkCooldown = 0.08;
            this.events.onClink?.(-vn, hit);
          }
        }
        x[i] = nxp;
        y[i] = nyp;
        px[i] = nxp - vxn * h;
        py[i] = nyp - vyn * h;
      }
      // the canvas edges and the ceiling
      const edge = bead ? BEAD_R1 : CORD_R + 1;
      if (x[i] < edge) x[i] = edge;
      else if (x[i] > this.width - edge) x[i] = this.width - edge;
      if (y[i] < this.ay + 2) y[i] = this.ay + 2;
      else if (y[i] > this.floor) y[i] = this.floor;
    }
  }
}
