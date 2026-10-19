// The seal's state and timing. The React side feeds it input (hold
// start/end, a click on the seal, reset), steps it once a frame and reads
// back the phase; everything that moves lives here.
//
//   idle ──hold──▶ holding ──full──▶ pressing ──▶ sealed ──break──▶ breaking ──▶ open
//    ▲               │ let go early (eases back)                                │
//    └───────────────┴──────────────────────── reset ◀───────────────────────────┘
//
// Hold: the stamp comes down out of the air as the ring fills, slowing as
// the pressure builds, and trembles over the last third. Full: it drops
// the last few millimetres, lands with a squash, the wax squeezes out from
// under the face on a spring, the stamp lifts away and the wax cools from
// glossy to satin. Break: cracks run out from where you struck it, the
// pieces pop off the flap and scatter, the flap swings open and the letter
// slides out while the envelope settles lower to keep it all in frame.

import { clamp, damp, lerp, seededRandom, smoothstep, Spring } from "../../hooks";
import type { PieceMode, PieceTheme } from "../../types";
import { layoutFor, restView, Scene, type Layout, type LetterCopy, type ShardBody, type View } from "./scene";
import { crackle, rustle, Tension, thunk, tick } from "./sound";
import { crack, Wax } from "./wax";

export type Phase = "idle" | "holding" | "pressing" | "sealed" | "breaking" | "open" | "closing";

/** Seconds of holding to seal. */
export const HOLD_SECONDS = 1.5;

const IMPACT = 0.07; // stamp reaches the wax
const LIFT_AT = 0.62; // stamp starts lifting
const LIFT_FOR = 0.7;
const SEALED_AT = 1.25; // controls come back
const COOL_TAU = 0.6;

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type EngineOptions = {
  mode: PieceMode;
  theme: PieceTheme;
  reducedMotion: boolean;
  /** Space kept free above and below the envelope (controls), CSS px. */
  reserve: { top: number; bottom: number };
  onPhase?: (phase: Phase) => void;
  /** Hold progress (0..1) and tremble (0..1), every frame while they change. */
  onHold?: (progress: number, tremble: number) => void;
};

export class SealEngine {
  phase: Phase = "idle";
  readonly scene: Scene;
  private readonly opts: EngineOptions;
  private view: View = restView();
  private wax: Wax | null = null;
  private seed = (Math.random() * 1e9) | 0;
  private time = 0;
  private phaseTime = 0;
  private dirty = true;
  private waxState = { spread: -1, heat: -1, exposure: -1 };

  // hold
  private holding = false;
  private progress = 0;
  private progressVel = 0;
  private readonly tension = new Tension();

  // motion
  private readonly squash = new Spring(0, { stiffness: 520, damping: 20 });
  private readonly press = new Spring(0, { stiffness: 380, damping: 18 });
  private readonly spread = new Spring(0.5, { stiffness: 230, damping: 15 });
  private readonly flap = new Spring(0, { stiffness: 62, damping: 11.5 });
  private readonly letter = new Spring(0, { stiffness: 78, damping: 13 });
  private readonly hover = new Spring(0, { stiffness: 300, damping: 26 });
  private heat = 0;
  private waxAlpha = 0;
  private shards: ShardBody[] | null = null;
  private landings = 0;
  private hovering = false;

  // reduced motion: cross-fade between states
  private snapshot: HTMLCanvasElement | null = null;
  private snapshotAlpha = 0;

  // tile loop
  private cycle = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number, opts: EngineOptions) {
    this.opts = opts;
    this.scene = new Scene(ctx, this.makeLayout(width, height, dpr), opts.theme);
    this.newWax();
    // The tile opens on a sealed envelope (and stays on it under reduced motion).
    if (opts.mode === "tile") this.showSealed();
  }

  /* -------------------------------------------------------------------- */
  /* setup                                                                 */
  /* -------------------------------------------------------------------- */

  private makeLayout(width: number, height: number, dpr: number): Layout {
    return layoutFor(width, height, dpr, { ...this.opts.reserve, tile: this.opts.mode === "tile" });
  }

  resize(width: number, height: number, dpr: number) {
    const before = this.scene.layout;
    if (before.width === width && before.height === height && before.dpr === dpr) return;
    this.scene.setLayout(this.makeLayout(width, height, dpr));
    if (Math.abs(before.R - this.scene.layout.R) > 0.01 || before.dpr !== dpr) {
      this.newWax(this.seed);
      // Shards were cut from the old wax: let them go.
      if (this.shards) this.shards = null;
    }
    this.dirty = true;
  }

  /** Space for the controls; takes effect on the next resize. */
  setReserve(reserve: { top: number; bottom: number }) {
    this.opts.reserve = reserve;
    this.scene.layout = { ...this.scene.layout, width: -1 };
  }

  setTheme(theme: PieceTheme) {
    this.scene.setTheme(theme);
    this.waxState.exposure = -1;
    this.dirty = true;
  }

  setReducedMotion(value: boolean) {
    this.opts.reducedMotion = value;
    this.dirty = true;
  }

  setLetter(copy: LetterCopy | null) {
    this.scene.setLetter(copy);
    this.dirty = true;
  }

  refreshFont() {
    this.scene.refreshFont();
    this.dirty = true;
  }

  private newWax(seed = (Math.random() * 1e9) | 0) {
    this.seed = seed;
    const { R, dpr } = this.scene.layout;
    this.wax = new Wax(R * dpr, seed);
    this.scene.wax = this.wax;
    this.waxState.spread = -1;
  }

  private setPhase(phase: Phase) {
    if (this.phase === phase) return;
    this.phase = phase;
    this.phaseTime = 0;
    this.dirty = true;
    this.opts.onPhase?.(phase);
  }

  /** Start sealed and set (a seal that was pressed earlier, or the reduced-motion tile). */
  showSealed() {
    this.waxAlpha = 1;
    this.heat = 0;
    this.spread.set(1);
    this.flap.set(0);
    this.letter.set(0);
    this.view.lift = 0;
    this.progress = 0;
    this.shards = null;
    this.setPhase("sealed");
    this.dirty = true;
  }

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  holdStart(): boolean {
    if (this.phase !== "idle" && this.phase !== "holding") return false;
    this.holding = true;
    this.tension.start();
    this.setPhase("holding");
    return true;
  }

  holdEnd() {
    if (!this.holding) return;
    this.holding = false;
    this.tension.stop();
  }

  /** Seal straight away (assistive tech clicks the button rather than holding it). */
  sealNow() {
    if (this.phase !== "idle" && this.phase !== "holding") return;
    this.holding = false;
    this.tension.stop(true);
    this.progress = 1;
    this.beginPress();
  }

  /** Break the seal; `at` is where it was struck, in canvas CSS px (default: near the centre). */
  breakSeal(at?: [number, number]): boolean {
    if (this.phase !== "sealed") return false;
    const R = this.scene.layout.R;
    const [sx, sy] = this.scene.sealCentre(this.view);
    const random = seededRandom(this.seed ^ 0x9e37);
    const hx = at ? (at[0] - sx) / R : (random() - 0.5) * 0.4;
    const hy = at ? (at[1] - sy) / R : (random() - 0.5) * 0.4;
    if (this.opts.mode === "stage") crackle();
    if (this.opts.reducedMotion) {
      this.takeSnapshot();
      this.waxAlpha = 0;
      if (this.opts.mode === "stage") {
        this.flap.set(Math.PI * 0.985);
        this.letter.set(1);
        this.view.lift = 1;
      }
      this.setPhase(this.opts.mode === "stage" ? "open" : "idle");
      return true;
    }
    const wax = this.wax;
    if (wax) {
      this.heat = 0;
      this.renderWax();
      const { shards, cracks } = crack(wax, hx, hy, this.seed ^ 0x51ed);
      this.scene.crackLines = cracks;
      const rand = seededRandom(this.seed ^ 0x2545);
      const scale = R / 54;
      this.shards = shards.map((shape) => {
        let dx = shape.cx - hx;
        let dy = shape.cy - hy;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const speed = (26 + rand() * 46) * scale * (this.opts.mode === "tile" ? 0.8 : 1);
        return {
          shape,
          x: 0,
          y: 0,
          z: 0,
          vx: dx * speed,
          vy: dy * speed * 0.9 + 8 * scale,
          vz: (40 + rand() * 32) * Math.sqrt(scale),
          angle: 0,
          spin: (rand() - 0.5) * 2.6,
          alpha: 1,
          landed: -1,
          bounced: false,
        };
      });
      this.landings = 0;
    }
    this.view.cracks = 0;
    this.setPhase("breaking");
    return true;
  }

  reset() {
    if (this.phase === "idle") return;
    this.holding = false;
    this.tension.stop(true);
    if (this.opts.reducedMotion) {
      this.takeSnapshot();
      this.toIdle();
      return;
    }
    if (this.phase === "open" || this.phase === "breaking") rustle(0.42, 0.8, false);
    this.setPhase("closing");
  }

  private toIdle() {
    this.waxAlpha = 0;
    this.shards = null;
    this.view.cracks = null;
    this.flap.set(0);
    this.letter.set(0);
    this.view.lift = 1;
    this.progress = 0;
    this.progressVel = 0;
    this.newWax();
    this.setPhase("idle");
  }

  /** Pointer position for hover feedback; returns what it is over. */
  pointer(x: number, y: number, inside: boolean): "seal" | "envelope" | null {
    let over: "seal" | "envelope" | null = null;
    if (inside) {
      if (this.phase === "sealed" && this.overSeal(x, y)) over = "seal";
      else if ((this.phase === "idle" || this.phase === "holding") && this.scene.overEnvelope(x, y, this.view)) over = "envelope";
    }
    const hovering = over === "seal";
    if (hovering !== this.hovering) {
      this.hovering = hovering;
      this.dirty = true;
    }
    return over;
  }

  overSeal(x: number, y: number): boolean {
    if (!this.wax || this.waxAlpha < 0.5) return false;
    const R = this.scene.layout.R;
    const [sx, sy] = this.scene.sealCentre(this.view);
    return this.wax.contains((x - sx) / R, (y - sy) / R, 1.04);
  }

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  /** Advance and draw. Returns false once everything is at rest (the loop may sleep). */
  step(dt: number): boolean {
    this.time += dt;
    this.phaseTime += dt;
    if (this.opts.mode === "tile") this.stepTile(dt);
    else this.stepStage(dt);

    const busy = this.animate(dt);
    if (busy || this.dirty) this.draw();
    this.dirty = false;
    // The tile's loop keeps time through its pauses; the stage sleeps at rest.
    if (this.opts.mode === "tile" && !this.opts.reducedMotion) return true;
    return busy || this.snapshotAlpha > 0;
  }

  private stepStage(dt: number) {
    const reduced = this.opts.reducedMotion;
    switch (this.phase) {
      case "holding": {
        if (this.holding) {
          this.progress = Math.min(1, this.progress + dt / HOLD_SECONDS);
          this.progressVel = 1 / HOLD_SECONDS;
          // (The very first press may land before the audio context is running.)
          this.tension.start();
          this.tension.set(this.progress);
          if (this.progress >= 1) {
            this.holding = false;
            this.tension.stop(true);
            this.beginPress();
          }
        } else {
          // Let go early: ease back up, a little faster than it came down.
          const force = -95 * this.progress - 19 * this.progressVel;
          this.progressVel += force * dt;
          this.progress = Math.max(0, this.progress + this.progressVel * dt);
          if (this.progress <= 0.002 && Math.abs(this.progressVel) < 0.05) {
            this.progress = 0;
            this.progressVel = 0;
            this.setPhase("idle");
          }
        }
        this.opts.onHold?.(this.progress, reduced ? 0 : smoothstep(0.62, 1, this.progress));
        break;
      }
      case "pressing":
        if (this.phaseTime >= (reduced ? 0.05 : SEALED_AT)) this.setPhase("sealed");
        break;
      case "breaking":
        if (this.phaseTime >= 2.1) this.setPhase("open");
        break;
      case "closing": {
        const t = this.phaseTime;
        if (this.shards) this.shards = null;
        this.view.cracks = null;
        this.waxAlpha = Math.max(0, this.waxAlpha - dt / 0.3);
        this.letter.to(0);
        if (this.letter.value < 0.06) this.flap.to(0);
        if (this.flap.value < 0.05 && this.letter.value < 0.02 && this.waxAlpha <= 0 && t > 0.2) this.toIdle();
        break;
      }
      default:
        break;
    }
  }

  private stepTile(dt: number) {
    if (this.opts.reducedMotion) return;
    // idle (descend) → pressing → sealed (rest) → breaking → idle (rest) → …
    switch (this.phase) {
      case "idle":
        if (this.phaseTime > (this.cycle === 0 ? 0.5 : 0.9)) {
          this.cycle += 1;
          this.setPhase("holding");
          this.progress = 0;
        }
        break;
      case "holding":
        this.progress = Math.min(1, this.progress + dt / 1.15);
        if (this.progress >= 1) this.beginPress();
        break;
      case "pressing":
        if (this.phaseTime >= SEALED_AT) this.setPhase("sealed");
        break;
      case "sealed":
        if (this.phaseTime > 2.4) this.breakSeal();
        break;
      case "breaking":
        if (this.phaseTime > 1.4) {
          this.shards = null;
          this.view.cracks = null;
          this.waxAlpha = 0;
          this.progress = 0;
          this.newWax();
          this.setPhase("idle");
        }
        break;
      default:
        break;
    }
  }

  /** The tile skips ahead on hover when it's between seals. */
  nudge() {
    if (this.opts.mode !== "tile" || this.opts.reducedMotion) return;
    if (this.phase === "idle") this.phaseTime = 10;
  }

  private beginPress() {
    this.progress = 1;
    this.opts.onHold?.(1, 0);
    if (this.opts.reducedMotion) {
      this.takeSnapshot();
      this.waxAlpha = 1;
      this.heat = 0;
      this.spread.set(1);
      this.view.lift = 0;
      if (this.opts.mode === "stage") thunk(0.8);
      this.setPhase("pressing");
      return;
    }
    if (!this.wax) this.newWax();
    this.spread.set(0.5);
    this.waxAlpha = 0;
    this.heat = 1;
    this.setPhase("pressing");
  }

  /** Springs, physics and the view; true while anything is moving. */
  private animate(dt: number): boolean {
    const v = this.view;
    const reduced = this.opts.reducedMotion;
    const tile = this.opts.mode === "tile";
    let busy = false;
    const R = this.scene.layout.R;

    // stamp + tremble
    v.stamp = null;
    v.shakeX = 0;
    v.shakeY = 0;
    if (!reduced && (this.phase === "holding" || this.phase === "pressing")) {
      let z = 1;
      let alpha = 1;
      if (this.phase === "holding") {
        const p = this.progress;
        z = lerp(1, 0.09, easeOut(p));
        alpha = smoothstep(0, 0.2, p);
      } else {
        const t = this.phaseTime;
        if (t < IMPACT) z = 0.09 * (1 - (t / IMPACT) * (t / IMPACT));
        else if (t < LIFT_AT) z = 0;
        else z = easeInOut(clamp((t - LIFT_AT) / LIFT_FOR)) * 1.35;
        alpha = 1 - smoothstep(0.3, 0.95, z);
        if (t >= IMPACT && this.waxAlpha === 0) this.impact();
      }
      const tremble = this.phase === "holding" ? smoothstep(0.62, 1, this.progress) : 0;
      const tt = this.time;
      const sway = z * 1.2; // a hand holding it up drifts a little
      const jitter = tremble * tremble * (tile ? 0.6 : 1.3);
      const dx = Math.sin(tt * 1.3) * sway + (Math.sin(tt * 71) + Math.sin(tt * 113 + 1.3) * 0.6) * jitter;
      const dy = Math.cos(tt * 1.1) * sway * 0.8 + (Math.sin(tt * 89 + 2.1) + Math.sin(tt * 131) * 0.5) * jitter;
      // Lifting away: up and a little to the right, out of the light.
      const away = this.phase === "pressing" && this.phaseTime > LIFT_AT ? z : 0;
      v.stamp = { z, alpha, squash: clamp(this.squash.value, -0.5, 1.5), dx: dx + away * R * 0.35, dy: dy - away * R * 0.75 };
      v.shakeX = (Math.sin(tt * 67 + 0.7) + Math.sin(tt * 97) * 0.5) * jitter * 0.28;
      v.shakeY = (Math.sin(tt * 83 + 1.9) + Math.sin(tt * 109) * 0.5) * jitter * 0.28;
      busy = true;
    }

    // flap lift: loose at rest, pressed flat once sealed
    const liftTarget = this.waxAlpha > 0 || this.phase === "pressing" ? 0 : this.phase === "holding" ? 1 - 0.3 * this.progress : 1;
    const lift = reduced ? liftTarget : damp(v.lift, liftTarget, 10, dt);
    if (Math.abs(lift - v.lift) > 1e-4) busy = true;
    v.lift = Math.abs(lift - liftTarget) < 1e-4 ? liftTarget : lift;

    // springs
    for (const spring of [this.squash, this.press, this.spread, this.flap, this.letter, this.hover]) {
      if (!spring.settled) {
        spring.step(dt);
        busy = true;
      }
    }
    if (this.phase === "breaking" && !reduced) {
      const t = this.phaseTime;
      if (!tile && t > 0.52 && this.flap.target === 0) {
        this.flap.to(Math.PI * 0.985);
        rustle(0.34, 0.7);
      }
      if (!tile && t > 1.0 && this.letter.target === 0) {
        this.letter.to(1);
        rustle(0.55, 1);
      }
      busy = true;
    }
    // A paper flap stops on the table.
    if (this.flap.value > Math.PI) {
      this.flap.value = Math.PI;
      this.flap.velocity = Math.min(0, this.flap.velocity) * -0.2;
    }
    v.flap = Math.max(0, this.flap.value);
    v.letter = this.letter.value;
    v.shift = clamp(this.letter.value);
    v.press = clamp(this.press.value, -1, 1.5);

    // hover lift on the sealed wax
    this.hover.to(this.hovering && this.phase === "sealed" ? 1 : 0);

    // heat
    if (this.waxAlpha > 0 && this.heat > 0) {
      if (this.phase !== "pressing" || this.phaseTime > LIFT_AT) {
        this.heat = this.heat * Math.exp(-dt / COOL_TAU);
        if (this.heat < 0.004) this.heat = 0;
      }
      busy = true;
    }

    // wax
    if (this.waxAlpha > 0) {
      this.renderWax();
      v.wax = { alpha: this.waxAlpha, scale: 1 + (this.phase === "closing" ? (1 - this.waxAlpha) * 0.04 : 0), lift: clamp(this.hover.value) };
    } else v.wax = null;
    if (this.phase === "closing" && this.waxAlpha > 0) busy = true;

    // cracks, then shards
    if (this.phase === "breaking" && this.shards) {
      const t = this.phaseTime;
      if (t < 0.16) {
        v.cracks = clamp(t / 0.14);
        v.shards = null;
      } else {
        v.cracks = null;
        this.waxAlpha = 0;
        v.wax = null;
        this.stepShards(dt, R);
        v.shards = this.shards;
      }
      busy = true;
    } else {
      v.shards = this.phase === "breaking" || this.phase === "open" ? this.shards : null;
      if (v.shards && v.shards.some((s) => s.alpha > 0)) {
        this.stepShards(dt, R);
        busy = true;
      }
      if (this.phase !== "breaking") v.cracks = null;
    }

    if (this.snapshotAlpha > 0) {
      this.snapshotAlpha = Math.max(0, this.snapshotAlpha - dt / 0.24);
      busy = true;
    }
    return busy;
  }

  private impact() {
    this.waxAlpha = 1;
    this.heat = 1;
    this.spread.set(0.52).to(1);
    this.squash.set(0).impulse(14);
    this.press.set(0).impulse(9);
    if (this.opts.mode === "stage") thunk();
  }

  private stepShards(dt: number, R: number) {
    const shards = this.shards;
    if (!shards) return;
    const scale = R / 54;
    const g = 520 * Math.sqrt(scale);
    for (const s of shards) {
      if (s.alpha <= 0) continue;
      if (s.landed < 0 || s.z > 0) {
        s.vz -= g * dt;
        s.z += s.vz * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.angle += s.spin * dt;
        if (s.z <= 0) {
          s.z = 0;
          if (!s.bounced && s.vz < -40) {
            s.vz = -s.vz * 0.28;
            s.bounced = true;
            s.vx *= 0.55;
            s.vy *= 0.55;
            s.spin *= 0.4;
            s.z = 0.01;
            if (this.landings < 6 && this.opts.mode === "stage") tick(1 - this.landings * 0.13);
            this.landings += 1;
          } else s.vz = 0;
          if (s.landed < 0) s.landed = 0;
        }
      } else {
        // sliding to a stop on the paper
        const f = Math.exp(-7 * dt);
        s.vx *= f;
        s.vy *= f;
        s.spin *= f;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.angle += s.spin * dt;
      }
      if (s.landed >= 0) {
        s.landed += dt;
        if (s.landed > 0.05) s.alpha = Math.max(0, s.alpha - dt / 0.24);
      }
    }
  }

  private renderWax() {
    const wax = this.wax;
    if (!wax) return;
    const spread = clamp(this.spread.value, 0.3, 1.2);
    const heat = this.heat;
    const exposure = this.scene.paper.exposure;
    const s = this.waxState;
    if (Math.abs(s.spread - spread) < 2e-4 && Math.abs(s.heat - heat) < 2e-3 && s.exposure === exposure) return;
    s.spread = spread;
    s.heat = heat;
    s.exposure = exposure;
    wax.render({ spread, heat, exposure });
  }

  private takeSnapshot() {
    const canvas = this.scene.ctx.canvas as HTMLCanvasElement;
    if (!canvas.width || !canvas.height) return;
    if (!this.snapshot) this.snapshot = document.createElement("canvas");
    this.snapshot.width = canvas.width;
    this.snapshot.height = canvas.height;
    this.snapshot.getContext("2d")?.drawImage(canvas, 0, 0);
    this.snapshotAlpha = 1;
  }

  private draw() {
    this.scene.draw(this.view);
    if (this.snapshot && this.snapshotAlpha > 0) {
      const ctx = this.scene.ctx;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = this.snapshotAlpha;
      ctx.drawImage(this.snapshot, 0, 0);
      ctx.restore();
    }
  }

  /** Force a redraw on the next step. */
  invalidate() {
    this.dirty = true;
  }

  destroy() {
    this.tension.stop(true);
    this.wax = null;
    this.scene.wax = null;
    this.shards = null;
    this.snapshot = null;
  }
}
