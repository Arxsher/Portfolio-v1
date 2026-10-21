// The piece without React: the simulation, the light, the scripted pulls
// (the keyboard's, the tile's and the one that follows a theme change made
// elsewhere), hover, and drawing. piece.tsx wires it to the DOM.

import { BULB_R, BULB_SY, DOME_R, DOME_SIL, RIM_E } from "./geometry";
import { layoutFor, type Layout } from "./layout";
import { LampLight } from "./light";
import { DCLICK, N, CordSim } from "./physics";
import { PALETTE, PullCordRenderer } from "./renderer";
import type { PieceMode } from "../../types";

export type PullSource = "hand" | "key" | "auto";

type Script = {
  kind: "key" | "auto";
  t: number;
  /** Where the hand starts (the pull, wherever it was). */
  x0: number;
  y0: number;
  /** How far below the pull's resting place to draw it, and how far aside. */
  depth: number;
  dx: number;
  /** Seconds to get there, and to hold before letting go. */
  reach: number;
  hold: number;
  /** A key is still down (the pull waits for it). */
  held: boolean;
};

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export class PullCord {
  readonly mode: PieceMode;
  readonly sim: CordSim;
  readonly light: LampLight;
  layout: Layout;
  hover = 0;
  hoverTarget = 0;
  /** Called when the switch clicks over (any source). */
  onToggle: ((on: boolean, speed: number, source: PullSource) => void) | null = null;
  onClink: ((speed: number, part: "shade" | "bulb") => void) | null = null;
  onRearm: ((speed: number) => void) | null = null;

  private renderer: PullCordRenderer | null = null;
  private script: Script | null = null;
  private source: PullSource = "hand";
  private grabDx = 0;
  private grabDy = 0;
  private reduced = false;
  private sway = 1;
  /** Tile: seconds the lamp has been left alone. */
  private idle = 0;

  constructor(mode: PieceMode, on: boolean, width = 400, height = 400) {
    this.mode = mode;
    this.layout = layoutFor(mode, width, height);
    this.sim = new CordSim(this.layout);
    this.light = new LampLight(on);
    this.sim.events = {
      onClick: (speed) => this.clicked(speed),
      onRearm: (speed) => this.onRearm?.(speed),
      onClink: (speed, part) => this.onClink?.(speed, part),
    };
  }

  attach(gl: WebGL2RenderingContext) {
    this.renderer = new PullCordRenderer(gl);
  }

  detach() {
    this.renderer?.dispose();
    this.renderer = null;
  }

  resize(cssWidth: number, cssHeight: number, reserve = 0) {
    if (!cssWidth || !cssHeight) return;
    this.layout = layoutFor(this.mode, cssWidth, cssHeight, reserve);
    this.sim.applyLayout(this.layout);
  }

  setReduced(reduced: boolean) {
    this.reduced = reduced;
    this.sim.reduced = reduced;
    this.light.reduced = reduced;
    if (reduced) {
      this.light.snap();
      this.script = null;
      this.sim.release();
    }
  }

  get busyScript() {
    return this.script !== null;
  }

  /* ------------------------------------------------------------------ */
  /* the hand                                                            */
  /* ------------------------------------------------------------------ */

  /** Take hold of the cord at particle `index`, the pointer at (x, y) scene units. */
  grab(index: number, x: number, y: number) {
    this.script = null;
    this.source = "hand";
    this.sim.hold(index);
    this.grabDx = this.sim.x[index] - x;
    this.grabDy = this.sim.y[index] - y;
  }

  drag(x: number, y: number) {
    if (this.sim.grab < 0 || this.script) return;
    this.sim.moveHand(x + this.grabDx, y + this.grabDy);
  }

  letGo() {
    if (this.script) return;
    this.sim.release();
  }

  get holding() {
    return this.sim.grab >= 0 && !this.script;
  }

  /** Is (x, y) on the shade or the bulb? Returns the side (-1 left, 1 right) or 0. */
  lampSide(x: number, y: number): number {
    const s = this.sim;
    const dx = x - s.ox;
    const dy = y - s.oy;
    const lx = dx * s.rx + dy * s.ry;
    const ly = -(dx * s.ux + dy * s.uy);
    const dome = ly >= 0 && (lx / DOME_R) ** 2 + (ly / DOME_SIL) ** 2 <= 1;
    const rim = (lx / DOME_R) ** 2 + (ly / RIM_E) ** 2 <= 1;
    const bulb = Math.hypot(lx, ly - BULB_SY) <= BULB_R;
    if (!dome && !rim && !bulb) return 0;
    return lx < 0 ? -1 : 1;
  }

  /** A tap on the shade: it swings away from the side that was tapped. */
  knock(side: number) {
    // positive omega swings the shade left
    this.sim.push(side > 0 ? 0.55 : -0.55);
  }

  /** Arrow keys: set the pull swinging. */
  nudge(direction: number) {
    this.sim.nudge(direction * 260);
  }

  /* ------------------------------------------------------------------ */
  /* scripted pulls                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Draw the cord down past the click and let it go, as if by an unseen
   * hand: the tile's loop, the keyboard, a theme change made elsewhere.
   */
  autoPull(kind: "key" | "auto" = "auto") {
    if (this.reduced) return;
    const sim = this.sim;
    if (sim.grab >= 0 && !this.script) return; // someone has hold of it
    const i = N - 1;
    sim.hold(i);
    this.sway = -this.sway;
    this.source = kind === "key" ? "key" : "auto";
    this.script = {
      kind,
      t: 0,
      x0: sim.x[i],
      y0: sim.y[i],
      depth: DCLICK + 14,
      dx: kind === "key" ? 0 : this.sway * (this.mode === "tile" ? 7 : 10),
      reach: kind === "key" ? 0.17 : 0.3,
      hold: kind === "key" ? 0.06 : 0.1,
      held: kind === "key",
    };
  }

  /** The key that started a keyboard pull came up. */
  keyUp() {
    if (this.script?.kind === "key") this.script.held = false;
  }

  /** Flip the light without moving anything (reduced motion's keyboard). */
  toggleNow() {
    const on = !this.light.on;
    this.light.set(on, true);
    this.onToggle?.(on, 120, "key");
  }

  /** Make the light match `on` (instantly, or with a pull). */
  follow(on: boolean, animate: boolean) {
    if (this.light.on === on) return;
    if (!animate || this.reduced) {
      this.light.set(on, true);
      return;
    }
    if (this.script) return;
    this.autoPull("auto");
  }

  private clicked(speed: number) {
    const on = !this.light.on;
    this.light.set(on);
    this.idle = 0;
    this.onToggle?.(on, speed, this.script ? this.source : "hand");
  }

  private runScript(dt: number) {
    const s = this.script;
    if (!s) return;
    s.t += dt;
    const sim = this.sim;
    const k = ease(s.t / s.reach);
    const tx = sim.restX() + s.dx;
    const ty = sim.restY() + s.depth;
    sim.moveHand(s.x0 + (tx - s.x0) * k, s.y0 + (ty - s.y0) * k);
    const done = s.t >= s.reach + s.hold && !s.held && (!sim.armed || s.t > 0.8);
    if (done) {
      this.script = null;
      sim.release();
    }
  }

  /* ------------------------------------------------------------------ */
  /* frame                                                               */
  /* ------------------------------------------------------------------ */

  /** The tile's loop: a pull every few seconds (longer at the theme's own state). */
  tileLoop(dt: number, homeOn: boolean) {
    if (this.reduced || this.script) return;
    this.idle += dt;
    const wait = this.light.on === homeOn ? 3.1 : 2.2;
    if (this.idle > wait) {
      this.idle = 0;
      this.autoPull("auto");
    }
  }

  /** Hovering the tile asks for a pull a little sooner. */
  hurry() {
    if (this.script || this.reduced) return;
    this.idle = Math.max(this.idle, this.light.on ? 2.6 : 1.8);
  }

  /** Advance; returns true while anything moves. */
  step(dt: number): boolean {
    this.runScript(dt);
    this.sim.step(dt);
    const lighting = this.light.step(dt);
    this.hover += (this.hoverTarget - this.hover) * (1 - Math.exp(-dt * 14));
    if (Math.abs(this.hover - this.hoverTarget) < 0.002) this.hover = this.hoverTarget;
    return lighting || !this.sim.settled || this.script !== null || this.hover !== this.hoverTarget;
  }

  render() {
    this.renderer?.render(this.sim, this.light, this.layout, PALETTE, this.hover);
  }

  /** The pull's centre and direction (scene units), for the focus target. */
  beadPose(out: { x: number; y: number; angle: number }) {
    const s = this.sim;
    let dx = s.x[N - 1] - s.x[N - 2];
    let dy = s.y[N - 1] - s.y[N - 2];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    out.x = s.x[N - 1] + dx * 12;
    out.y = s.y[N - 1] + dy * 12;
    out.angle = Math.atan2(dy, dx) - Math.PI / 2;
    return out;
  }

  /** Bounds of the cord and the pull (scene units). */
  cordBounds(out: { minX: number; minY: number; maxX: number; maxY: number }) {
    const s = this.sim;
    let minX = s.ex;
    let maxX = s.ex;
    let minY = s.ey;
    let maxY = s.ey;
    for (let i = 0; i < N; i++) {
      const x = s.x[i];
      const y = s.y[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    // the pull's body below its last particle
    const pose = this.beadPose(scratch);
    minX = Math.min(minX, pose.x - 14);
    maxX = Math.max(maxX, pose.x + 14);
    minY = Math.min(minY, pose.y - 16);
    maxY = Math.max(maxY, pose.y + 16);
    out.minX = minX;
    out.minY = minY;
    out.maxX = maxX;
    out.maxY = maxY;
    return out;
  }
}

const scratch = { x: 0, y: 0, angle: 0 };
