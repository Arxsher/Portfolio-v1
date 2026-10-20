// The seal's state and timing. The React side feeds it input (hold
// start/end, a click on the seal, reset), steps it once a frame and reads
// back the phase; everything that moves lives here.
//
//   idle ──hold──▶ holding ──full──▶ pressing ──▶ sealed ──break──▶ breaking ──▶ open
//    ▲               │ let go early (eases back)                                │
//    └───────────────┴────────────────── closing ◀── reset ◀────────────────────┘
//
// Hold. Three drops of molten wax fall onto the flap's tip and spread into
// a glossy puddle; the stamp is lifted off the table beside the envelope,
// carried over (its top leading, swinging a little when it slows) and
// lowered, slowing as it nears the wax and trembling over the last third.
// Let go early and the stamp eases back to where it stood; the poured wax
// stays, so the next hold goes straight to the stamp.
//
// Full. The stamp drops the last few millimetres, lands with a squash and
// a thunk, the puddle squeezes out from under its face on a spring and
// takes the mark; the stamp lifts away, is carried back and set down with
// a knock, and the wax cools from glossy to satin.
//
// Break. Cracks run from where you struck it, along the flap's edge first.
// The half stuck to the flap goes up with it as it swings open, the half on
// the pocket stays where it is, a few crumbs pop off and skitter, the
// letter slides out and the camera pulls back so all of it fits.

import { clamp, damp, seededRandom, smoothstep, Spring } from "../../hooks";
import type { PieceMode, PieceTheme } from "../../types";
import { ENVELOPE, layoutFor, restView, Scene, type Drop, type Layout, type LetterCopy, type ShardBody, type View } from "./scene";
import { crackle, drip, rustle, setDown, Tension, thunk, tick } from "./sound";
import { crack, Wax } from "./wax";

export type Phase = "idle" | "holding" | "pressing" | "sealed" | "breaking" | "open" | "closing";

/** Seconds of holding to seal. */
export const HOLD_SECONDS = 1.6;

// The hold, in hold progress (0 … 1).
const DROP_AT = [0.02, 0.115, 0.21];
const DROP_SPREAD = [0.4, 0.62, 0.8];
const POURED = 0.24; // progress a new hold starts from once the wax is down
const LIFT_FROM = 0.26;
const LIFT_TO = 0.44;
const TRAVEL_FROM = 0.3;
const TRAVEL_TO = 0.8;
const DESCEND_FROM = 0.7;
const TREMBLE_FROM = 0.64;
const Z_CARRY = 1.15; // face radii above the paper while carried
const Z_HOVER = 0.07; // just over the wax when the ring is full

// The press, in seconds.
const IMPACT = 0.07; // the face reaches the wax
const RAISE_FROM = 0.55;
const RAISE_TO = 0.84;
const BACK_FROM = 0.64;
const BACK_TO = 1.32;
const LAND_FROM = 1.08;
const LAND_TO = 1.42;
const SETTLED = 1.8;
const SEALED_AT = 0.95; // the controls come back once the stamp is off the seal
const COOL_TAU = 0.6;
const FALL = 0.22; // a drop's fall
const SWAP_OUT = 0.34; // sliding the used envelope off the table
const CAMERA_OUT = { stiffness: 58, damping: 15 };
const CAMERA_IN = { stiffness: 110, damping: 21 };
// Opening is slow and loose; putting it away is brisker.
const FLAP_OPEN = { stiffness: 62, damping: 11.5 };
const FLAP_CLOSE = { stiffness: 130, damping: 18 };
const LETTER_OUT = { stiffness: 78, damping: 13 };
const LETTER_IN = { stiffness: 130, damping: 19 };

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type EngineOptions = {
  mode: PieceMode;
  theme: PieceTheme;
  reducedMotion: boolean;
  /** Space taken by the controls above and below the scene, CSS px. */
  reserve: { top: number; bottom: number };
  onPhase?: (phase: Phase, previous: Phase) => void;
  /** Hold progress (0..1) and tremble (0..1), every frame while they change. */
  onHold?: (progress: number, tremble: number) => void;
  /** Poured wax is waiting for the stamp (true), or not any more (false). */
  onPuddle?: (has: boolean) => void;
};

const TILE_LETTER: LetterCopy = { date: "", title: "Some things keep better under wax.", body: "", sign: "" };

export class SealEngine {
  phase: Phase = "idle";
  readonly scene: Scene;
  private readonly opts: EngineOptions;
  private readonly view: View = restView();
  private wax: Wax | null = null;
  private seed = (Math.random() * 1e9) | 0;
  private time = 0;
  private phaseTime = 0;
  private dirty = true;
  private waxState = { spread: -1, impress: -1, heat: -1, exposure: -1, theme: "" };

  // hold
  private holding = false;
  /** Sealing on its own (an assistive click, or the tile's loop). */
  private auto = false;
  private progress = 0;
  private progressVel = 0;
  private readonly tension = new Tension();

  // wax
  private poured = 0; // drops let go
  private drops: Array<Drop & { index: number; t: number; z0: number }> = [];
  private impress = 0;
  private heat = 0;
  private waxAlpha = 0;

  // stamp
  private pressTime = -1; // seconds since it started down to the wax; −1 when not pressing
  private impacted = false;
  private landedSound = false;
  private puddleShown = false;
  private lastBase = { x: 0, y: 0, set: false };
  /** Scratch point for the stamp's path (no allocation per frame). */
  private readonly pt = { x: 0, y: 0 };

  // motion
  private readonly squash = new Spring(0, { stiffness: 520, damping: 20 });
  private readonly press = new Spring(0, { stiffness: 380, damping: 18 });
  private readonly spread = new Spring(0, { stiffness: 250, damping: 12 });
  private readonly flap = new Spring(0, FLAP_OPEN);
  private readonly letter = new Spring(0, LETTER_OUT);
  private readonly camera = new Spring(0, CAMERA_OUT);
  private readonly hover = new Spring(0, { stiffness: 300, damping: 26 });
  // a fresh envelope sliding in across the table, coming to rest with a little give
  private readonly sheetX = new Spring(0, { stiffness: 190, damping: 22, precision: 0.1 });
  private readonly sheetY = new Spring(0, { stiffness: 190, damping: 22, precision: 0.1 });
  private readonly sheetA = new Spring(0, { stiffness: 190, damping: 20, precision: 0.0005 });
  /** Swapping envelopes: 0 not, 1 sliding the old one off, 2 sliding the new one in. */
  private swap = 0;
  private swapTime = 0;
  private readonly shearX = new Spring(0, { stiffness: 150, damping: 10 });
  private readonly shearY = new Spring(0, { stiffness: 150, damping: 10 });
  private readonly springs: Spring[] = [
    this.squash,
    this.press,
    this.spread,
    this.flap,
    this.letter,
    this.camera,
    this.hover,
    this.shearX,
    this.shearY,
    this.sheetX,
    this.sheetY,
    this.sheetA,
  ];

  // breaking
  private shards: ShardBody[] | null = null;
  private hit: [number, number] = [0, 0];
  private shardAlpha = 1;
  private readonly waxLook = { alpha: 1, scale: 1, lift: 0 };
  private landings = 0;
  private hovering = false;

  // reduced motion: cross-fade in place, or dip through the table and back for a new composition
  private snapshot: HTMLCanvasElement | null = null;
  private fade: { mode: "cross" | "dip"; t: number } | null = null;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number, opts: EngineOptions) {
    this.opts = opts;
    this.scene = new Scene(ctx, this.makeLayout(width, height, dpr), opts.theme);
    this.newWax();
    this.placeStamp();
    // The tile opens on a sealed envelope (and stays on it under reduced motion).
    if (opts.mode === "tile") {
      this.scene.setLetter(TILE_LETTER);
      this.showSealed();
    }
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
      if (this.shards) this.recut(before.R);
    }
    this.lastBase.set = false;
    this.dirty = true;
  }

  /** Space for the controls; takes effect on the next resize. */
  setReserve(reserve: { top: number; bottom: number }) {
    this.opts.reserve = reserve;
    this.scene.layout = { ...this.scene.layout, width: -1 };
  }

  setTheme(theme: PieceTheme) {
    if (theme === this.scene.theme) return;
    this.scene.setTheme(theme);
    // The pieces were cut from wax lit for the other room.
    if (this.shards) this.recut(this.scene.layout.R);
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

  /** Sealing on its own after an assistive click (no finger on it). */
  get sealing() {
    return this.auto;
  }

  /** Is there poured wax waiting for the stamp? */
  get hasPuddle() {
    return this.poured > 0 && this.impress < 0.5 && this.waxAlpha > 0;
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
    const previous = this.phase;
    this.phase = phase;
    this.phaseTime = 0;
    this.dirty = true;
    this.opts.onPhase?.(phase, previous);
  }

  /** Start sealed and set (a seal that was pressed earlier, or the tile). */
  showSealed() {
    this.waxAlpha = 1;
    this.heat = 0;
    this.impress = 1;
    this.poured = DROP_AT.length;
    this.drops = [];
    this.spread.set(1);
    this.flap.set(0);
    this.letter.set(0);
    this.camera.set(0);
    this.view.lift = 0;
    this.progress = 0;
    this.pressTime = -1;
    this.shards = null;
    this.placeStamp();
    this.setPhase("sealed");
    this.dirty = true;
  }

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  holdStart(): boolean {
    if (this.phase !== "idle" && this.phase !== "holding") return false;
    this.holding = true;
    // Wax already down: go straight to the stamp.
    if (this.poured >= DROP_AT.length) this.progress = Math.max(this.progress, POURED);
    else if (this.poured > 0) this.progress = Math.max(this.progress, DROP_AT[this.poured] - 0.02);
    if (this.opts.mode === "stage") this.tension.start();
    this.setPhase("holding");
    return true;
  }

  holdEnd() {
    if (!this.holding || this.auto) return;
    this.holding = false;
    this.tension.stop();
  }

  /** Seal without holding (assistive tech clicks the button): the same sequence, quicker. */
  sealNow() {
    if (this.phase !== "idle" && this.phase !== "holding") return;
    if (this.opts.reducedMotion) {
      this.holding = false;
      this.tension.stop(true);
      this.progress = 1;
      this.beginPress();
      return;
    }
    this.auto = true;
    this.holdStart();
  }

  /** Break the seal; `at` is where it was struck, in canvas CSS px (default: near the centre). */
  breakSeal(at?: [number, number]): boolean {
    if (this.phase !== "sealed") return false;
    const R = this.scene.layout.R;
    const [sx, sy] = this.scene.sealCentre(this.view);
    const random = seededRandom(this.seed ^ 0x9e37);
    if (at) {
      const [x, y] = this.scene.toScene(this.view, at[0], at[1]);
      this.hit = [(x - sx) / R, (y - sy) / R];
    } else this.hit = [(random() - 0.5) * 0.5, (random() - 0.5) * 0.4];
    if (this.opts.mode === "stage") crackle();
    if (this.opts.reducedMotion) {
      this.transition("dip");
      this.cut(true);
      this.flap.set(Math.PI * 0.985);
      this.letter.set(1);
      this.camera.set(1);
      this.view.lift = 1;
      this.setPhase("open");
      return true;
    }
    this.cut(false);
    this.view.cracks = 0;
    this.setPhase("breaking");
    return true;
  }

  reset() {
    if (this.phase === "idle" && !this.hasPuddle) return;
    if (this.phase === "holding" || this.phase === "pressing" || this.phase === "closing") return;
    this.holding = false;
    this.auto = false;
    this.tension.stop(true);
    if (this.opts.reducedMotion) {
      this.transition("dip");
      this.toIdle();
      return;
    }
    if (this.opts.mode === "stage" && (this.phase === "open" || this.phase === "breaking")) rustle(0.42, 0.8, false);
    // (back in a little quicker than it pulled out)
    this.camera.configure(CAMERA_IN);
    this.flap.configure(FLAP_CLOSE);
    this.letter.configure(LETTER_IN);
    this.setPhase("closing");
  }

  /** Back to a fresh, unsealed envelope (`announce`: say so now; the swap says so once the new one has arrived). */
  private toIdle(announce = true) {
    this.waxAlpha = 0;
    this.shards = null;
    this.shardAlpha = 1;
    this.view.cracks = null;
    this.flap.set(0);
    this.letter.set(0);
    this.camera.set(0);
    this.view.lift = 1;
    this.progress = 0;
    this.progressVel = 0;
    this.poured = 0;
    this.drops = [];
    this.impress = 0;
    this.heat = 0;
    this.spread.set(0);
    if (this.pressTime < 0) this.placeStamp();
    this.newWax();
    if (announce) {
      this.swap = 0;
      const sheet = this.view.sheet;
      sheet.x = sheet.y = sheet.angle = 0;
      this.setPhase("idle");
    }
  }

  /** Pointer position for hover feedback; returns what it is over. */
  pointer(x: number, y: number, inside: boolean): "seal" | "envelope" | "stamp" | null {
    let over: "seal" | "envelope" | "stamp" | null = null;
    if (inside) {
      if (this.phase === "sealed" && this.overSeal(x, y)) over = "seal";
      else if (this.phase === "idle" || this.phase === "holding") {
        if (this.phase === "idle" && this.scene.overStamp(x, y, this.view)) over = "stamp";
        else if (this.scene.overEnvelope(x, y, this.view)) over = "envelope";
      }
    }
    const hovering = over === "seal";
    if (hovering !== this.hovering) {
      this.hovering = hovering;
      this.dirty = true;
    }
    return over;
  }

  overSeal(x: number, y: number): boolean {
    if (!this.wax || this.waxAlpha < 0.5 || this.impress < 0.5) return false;
    const R = this.scene.layout.R;
    const [sx, sy] = this.scene.sealCentre(this.view);
    const [px, py] = this.scene.toScene(this.view, x, y);
    return this.wax.contains((px - sx) / R, (py - sy) / R, 1.04);
  }

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  /** Advance and draw. Returns false once everything is at rest (the loop may sleep). */
  step(dt: number): boolean {
    this.time += dt;
    this.phaseTime += dt;
    if (this.opts.mode === "tile") this.stepTile();
    this.stepPhase(dt);

    const busy = this.animate(dt);
    if (busy || this.dirty) this.draw();
    this.dirty = false;
    // The tile's loop keeps time through its pauses; the stage sleeps at rest.
    if (this.opts.mode === "tile" && !this.opts.reducedMotion) return true;
    return busy || this.fade !== null;
  }

  private stepPhase(dt: number) {
    const reduced = this.opts.reducedMotion;
    switch (this.phase) {
      case "holding": {
        if (this.holding) {
          const rate = this.auto ? (this.opts.mode === "tile" ? 1 / 1.35 : 2.2 / HOLD_SECONDS) : 1 / HOLD_SECONDS;
          this.progress = Math.min(1, this.progress + dt * rate);
          this.progressVel = rate;
          // (The very first press may land before the audio context is running.)
          if (this.opts.mode === "stage") {
            this.tension.start();
            this.tension.set(this.progress);
          }
          this.pour();
          if (this.progress >= 1) {
            this.holding = false;
            this.auto = false;
            this.tension.stop(true);
            this.beginPress();
          }
        } else {
          // Let go early: ease back, a little faster than it came.
          const force = -95 * this.progress - 19 * this.progressVel;
          this.progressVel += force * dt;
          this.progress = Math.max(0, this.progress + this.progressVel * dt);
          if (this.progress <= 0.002 && Math.abs(this.progressVel) < 0.05) {
            this.progress = 0;
            this.progressVel = 0;
            this.setPhase("idle");
          }
        }
        if (this.phase === "holding" || this.phase === "idle") this.opts.onHold?.(this.progress, reduced ? 0 : smoothstep(TREMBLE_FROM, 1, this.progress));
        break;
      }
      case "pressing":
        if (this.phaseTime >= (reduced ? 0.05 : SEALED_AT)) this.setPhase("sealed");
        break;
      case "breaking": {
        const t = this.phaseTime;
        const stage = this.opts.mode === "stage";
        if (t > 0.5 && this.flap.target === 0) {
          this.flap.configure(FLAP_OPEN).to(Math.PI * 0.985);
          this.camera.configure(CAMERA_OUT).to(1);
          if (stage) rustle(0.34, 0.7);
        }
        if (t > 0.95 && this.letter.target === 0) {
          this.letter.configure(LETTER_OUT).to(1);
          if (stage) rustle(0.55, 1);
        }
        if (t >= 2.1) this.setPhase("open");
        break;
      }
      case "closing": {
        // The letter goes back in, the flap closes over it, and the used envelope is slid off the
        // table (broken seal and all), then a fresh one is slid into its place.
        const L = this.scene.layout;
        const sheet = this.view.sheet;
        this.letter.to(0);
        this.camera.to(0);
        // the flap folds down as the letter's last stretch goes in
        if (this.letter.value < 0.3) this.flap.to(0);
        // (once the view is nearly back, so the old one really leaves the frame)
        if (this.swap === 0 && this.flap.value < 0.5 && this.letter.value < 0.04 && this.camera.value < 0.3) {
          this.swap = 1;
          this.swapTime = 0;
          if (this.opts.mode === "stage") rustle(0.32, 0.55, false);
        }
        if (this.swap === 1) {
          this.swapTime += dt;
          const k = easeIn(clamp(this.swapTime / SWAP_OUT));
          sheet.x = (-(L.x + L.W * 1.15 + 60) / L.open.zoom) * k;
          sheet.y = L.H * 0.12 * k;
          sheet.angle = -0.08 * k;
          if (this.swapTime >= SWAP_OUT) {
            // A fresh envelope, waiting just off the left edge.
            this.toIdle(false);
            this.sheetX.set(-(L.x + L.W * 1.1 + 40)).to(0);
            this.sheetY.set(-L.H * 0.08).to(0);
            this.sheetA.set(0.06).to(0);
            this.swap = 2;
            if (this.opts.mode === "stage") rustle(0.4, 0.5);
          }
        }
        if (this.swap === 2) {
          sheet.x = this.sheetX.value;
          sheet.y = this.sheetY.value;
          sheet.angle = this.sheetA.value;
          if (this.sheetX.settled && this.sheetY.settled && this.sheetA.settled) {
            this.swap = 0;
            sheet.x = sheet.y = sheet.angle = 0;
            this.setPhase("idle");
          }
        }
        break;
      }
      default:
        break;
    }
  }

  private stepTile() {
    if (this.opts.reducedMotion) return;
    // sealed (rest) → breaking → open (rest) → closing → idle (rest) → holding → pressing → sealed → …
    switch (this.phase) {
      case "sealed":
        if (this.phaseTime > 2.3) this.breakSeal();
        break;
      case "open":
        if (this.phaseTime > 1.1) this.reset();
        break;
      case "idle":
        if (this.phaseTime > 0.6) {
          this.auto = true;
          this.holdStart();
        }
        break;
      default:
        break;
    }
  }

  /** The tile skips ahead on hover while it is resting. */
  nudge() {
    if (this.opts.mode !== "tile" || this.opts.reducedMotion) return;
    if (this.phase === "idle" || this.phase === "open") this.phaseTime = 10;
  }

  /** Let the next drop go once the hold has come far enough. */
  private pour() {
    while (this.poured < DROP_AT.length && this.progress >= DROP_AT[this.poured]) {
      const index = this.poured;
      this.poured += 1;
      if (this.opts.reducedMotion) {
        if (this.poured === DROP_AT.length) this.landPuddle();
        continue;
      }
      const L = this.scene.layout;
      const [sx, sy] = this.scene.sealCentre(this.view);
      const random = seededRandom(this.seed + index * 977);
      const size = L.R * (0.2 + index * 0.03);
      // Start just above the frame: through the lens a high drop sits further up.
      const below = L.eye.y - sy;
      const s = clamp((sy + below + size * 2) / Math.max(1, below - size * 4), 1.2, 3);
      const z0 = L.eye.d * (1 - 1 / s);
      this.drops.push({
        x: sx + (random() - 0.5) * L.R * 0.12,
        y: sy + (random() - 0.5) * L.R * 0.1,
        z: z0,
        z0,
        vz: 0,
        size,
        index,
        t: 0,
      });
    }
  }

  /** Reduced motion: the whole puddle at once. */
  private landPuddle() {
    this.transition("cross");
    this.waxAlpha = 1;
    this.heat = 1;
    this.impress = 0;
    this.spread.set(DROP_SPREAD[DROP_SPREAD.length - 1]);
  }

  private beginPress() {
    this.progress = 1;
    this.opts.onHold?.(1, 0);
    if (this.opts.reducedMotion) {
      this.transition("cross");
      this.poured = DROP_AT.length;
      this.drops = [];
      this.waxAlpha = 1;
      this.heat = 0;
      this.impress = 1;
      this.spread.set(1);
      this.view.lift = 0;
      this.placeStamp();
      if (this.opts.mode === "stage") thunk(0.8);
      this.setPhase("pressing");
      return;
    }
    if (!this.wax) this.newWax();
    // Any drop still on its way lands now.
    if (this.drops.length || this.poured < DROP_AT.length) {
      this.drops = [];
      this.poured = DROP_AT.length;
      this.waxAlpha = 1;
      this.heat = 1;
      if (this.spread.target < DROP_SPREAD[2]) this.spread.to(DROP_SPREAD[2]);
    }
    this.pressTime = 0;
    this.impacted = false;
    this.landedSound = false;
    this.setPhase("pressing");
  }

  private impact() {
    this.impacted = true;
    this.waxAlpha = 1;
    this.heat = 1;
    this.spread.to(1).impulse(3.2);
    this.squash.set(0).impulse(14);
    this.press.set(0).impulse(9);
    if (this.opts.mode === "stage") thunk();
  }

  /** Put the stamp where it stands on the table. */
  private placeStamp() {
    const s = this.view.stamp;
    const [x, y] = this.scene.layout.rest;
    s.x = x;
    s.y = y;
    s.z = 0;
    s.shearX = 0;
    s.shearY = 0;
    s.squash = 0;
    this.shearX.set(0);
    this.shearY.set(0);
  }

  /** The stamp's path from where it stands to the seal (u: 0 … 1), bowed a little upward; written to `pt`. */
  private path(u: number) {
    const L = this.scene.layout;
    const [rx, ry] = L.rest;
    const sx = L.x + L.W / 2 + this.view.shakeX;
    const sy = L.y + L.H * ENVELOPE.seal + this.view.shakeY;
    const dx = sx - rx;
    const dy = sy - ry;
    let nx = dy;
    let ny = -dx;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const len = Math.hypot(nx, ny) || 1;
    const bow = (Math.sin(Math.PI * u) * 0.12 * Math.hypot(dx, dy)) / len;
    this.pt.x = rx + dx * u + nx * bow;
    this.pt.y = ry + dy * u + ny * bow;
  }

  /** Where the stamp is this frame (base, height above the paper, tilt, squash). */
  private poseStamp(dt: number) {
    const v = this.view;
    const L = this.scene.layout;
    const rs = L.rs;
    const reduced = this.opts.reducedMotion;
    const tile = this.opts.mode === "tile";
    const pose = v.stamp;
    if (reduced) {
      this.placeStamp();
      return false;
    }
    let x: number;
    let y: number;
    let z: number;
    let tremble = 0;
    if (this.pressTime >= 0) {
      const t = this.pressTime;
      if (t < RAISE_FROM) {
        x = L.x + L.W / 2 + v.shakeX;
        y = L.y + L.H * ENVELOPE.seal + v.shakeY;
        const k = t / IMPACT;
        z = t < IMPACT ? Z_HOVER * rs * (1 - k * k) : 0;
      } else {
        const up = easeInOut(clamp((t - RAISE_FROM) / (RAISE_TO - RAISE_FROM)));
        const back = easeInOut(clamp((t - BACK_FROM) / (BACK_TO - BACK_FROM)));
        const land = easeIn(clamp((t - LAND_FROM) / (LAND_TO - LAND_FROM)));
        this.path(1 - back);
        x = this.pt.x;
        y = this.pt.y;
        z = Z_CARRY * rs * up * (1 - land);
        if (t > LAND_TO) {
          // set down: a small knock and a settle
          const after = t - LAND_TO;
          z = rs * 0.05 * Math.exp(-after / 0.06) * Math.abs(Math.sin(after * 26));
          if (!this.landedSound) {
            this.landedSound = true;
            if (!tile) setDown();
          }
        }
      }
    } else if (this.phase === "idle" || this.phase === "holding") {
      const p = this.progress;
      const up = smoothstep(LIFT_FROM, LIFT_TO, p);
      const down = easeOut(clamp((p - DESCEND_FROM) / (1 - DESCEND_FROM)));
      this.path(easeInOut(clamp((p - TRAVEL_FROM) / (TRAVEL_TO - TRAVEL_FROM))));
      x = this.pt.x;
      y = this.pt.y;
      z = (Z_CARRY * up + (Z_HOVER - Z_CARRY) * down) * rs;
      tremble = smoothstep(TREMBLE_FROM, 1, p);
    } else {
      x = L.rest[0];
      y = L.rest[1];
      z = 0;
    }

    // The top leads while it is carried and swings past when it slows.
    const last = this.lastBase;
    if (last.set && dt > 0) {
      const vx = (x - last.x) / dt;
      const vy = (y - last.y) / dt;
      const k = 0.00022 * clamp(z / (rs * 0.4));
      this.shearX.to(clamp(vx * k, -0.22, 0.22));
      this.shearY.to(clamp(vy * k, -0.22, 0.22));
    }
    last.x = x;
    last.y = y;
    last.set = true;
    if (z <= 0.5) {
      this.shearX.to(0);
      this.shearY.to(0);
    }

    // A hand holding it up drifts a little; under pressure it trembles.
    const tt = this.time;
    const air = clamp(z / (rs * Z_CARRY));
    const jitter = tremble * tremble * (tile ? 0.5 : 1.2);
    pose.x = x + Math.sin(tt * 1.3) * air * 1.1 + (Math.sin(tt * 71) + Math.sin(tt * 113 + 1.3) * 0.6) * jitter;
    pose.y = y + Math.cos(tt * 1.1) * air * 0.9 + (Math.sin(tt * 89 + 2.1) + Math.sin(tt * 131) * 0.5) * jitter;
    pose.z = z;
    pose.shearX = this.shearX.value + Math.sin(tt * 57) * jitter * 0.004;
    pose.shearY = this.shearY.value + Math.sin(tt * 63 + 1) * jitter * 0.004;
    pose.squash = clamp(this.squash.value, -0.5, 1.5);
    v.shakeX = (Math.sin(tt * 67 + 0.7) + Math.sin(tt * 97) * 0.5) * jitter * 0.25;
    v.shakeY = (Math.sin(tt * 83 + 1.9) + Math.sin(tt * 109) * 0.5) * jitter * 0.25;
    return this.pressTime >= 0 || (this.progress > 0 && this.progress < 1) || this.phase === "holding";
  }

  /** Springs, physics and the view; true while anything is moving. */
  private animate(dt: number): boolean {
    const v = this.view;
    const reduced = this.opts.reducedMotion;
    let busy = false;

    // the press timeline (the stamp keeps going after the seal is "sealed")
    if (this.pressTime >= 0) {
      this.pressTime += dt;
      if (this.pressTime >= IMPACT && !this.impacted && !reduced) this.impact();
      if (this.pressTime > SETTLED) {
        this.pressTime = -1;
        if (this.phase !== "holding") this.progress = 0;
        this.placeStamp();
      }
      busy = true;
    }
    if (this.poseStamp(dt)) busy = true;
    if (this.pressTime < 0 && this.phase !== "holding") {
      v.shakeX = 0;
      v.shakeY = 0;
    }

    // drops on the way down
    if (this.drops.length) {
      for (const drop of this.drops) {
        drop.t += dt;
        const k = clamp(drop.t / FALL);
        drop.z = drop.z0 * (1 - k * k);
        drop.vz = (-2 * drop.z0 * k) / FALL;
      }
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const drop = this.drops[i];
        if (drop.t < FALL) continue;
        this.drops.splice(i, 1);
        if (this.waxAlpha <= 0) {
          this.waxAlpha = 1;
          this.spread.set(0.12);
        }
        this.heat = 1;
        this.impress = 0;
        this.spread.to(Math.max(this.spread.target, DROP_SPREAD[drop.index])).impulse(1.6);
        if (this.opts.mode === "stage") drip(drop.index);
      }
      busy = true;
    }
    v.drops = this.drops;

    // the impression: pressed in quickly once the face is down
    if (this.impacted && this.impress < 1 && this.waxAlpha > 0 && (this.phase === "pressing" || this.phase === "sealed")) {
      this.impress = this.impress > 0.995 ? 1 : damp(this.impress, 1, 38, dt);
      busy = true;
    }

    // flap lift: loose at rest, weighed down by a puddle, pressed flat once sealed
    let liftTarget = 1;
    if (this.phase === "pressing" || this.phase === "sealed" || (this.phase === "breaking" && this.phaseTime < 0.3)) liftTarget = 0;
    else if (this.phase === "closing" && this.waxAlpha > 0) liftTarget = 0;
    else if (this.hasPuddle) liftTarget = 0.4;
    else if (this.phase === "holding") liftTarget = 1 - 0.3 * this.progress;
    const lift = reduced ? liftTarget : damp(v.lift, liftTarget, 10, dt);
    if (Math.abs(lift - v.lift) > 1e-4) busy = true;
    v.lift = Math.abs(lift - liftTarget) < 1e-4 ? liftTarget : lift;

    // springs
    for (const spring of this.springs) {
      if (!spring.settled) {
        spring.step(dt);
        busy = true;
      }
    }
    // A paper flap stops on the table.
    if (this.flap.value > Math.PI) {
      this.flap.value = Math.PI;
      this.flap.velocity = Math.min(0, this.flap.velocity) * -0.2;
    }
    v.flap = Math.max(0, this.flap.value);
    v.letter = this.letter.value;
    v.camera = clamp(this.camera.value, 0, 1.04);
    v.press = clamp(this.press.value, -1, 1.5);

    // hover lift on the sealed wax
    this.hover.to(this.hovering && this.phase === "sealed" ? 1 : 0);

    // heat: the wax cools once the stamp has let go
    if (this.waxAlpha > 0 && this.heat > 0 && this.impress > 0.5) {
      if (this.pressTime < 0 || this.pressTime > RAISE_FROM) {
        this.heat = this.heat * Math.exp(-dt / COOL_TAU);
        if (this.heat < 0.02) this.heat = 0;
      }
      busy = true;
    }

    // the wax, or its pieces
    const broken = this.shards !== null && (this.phase !== "breaking" || this.phaseTime >= 0.16);
    if (this.waxAlpha > 0 && !broken) {
      this.renderWax();
      const look = this.waxLook;
      look.alpha = this.waxAlpha;
      look.scale = 1;
      look.lift = clamp(this.hover.value);
      v.wax = look;
    } else v.wax = null;
    if (this.phase === "closing") busy = true;

    if (this.phase === "breaking" && this.shards && this.phaseTime < 0.16) {
      v.cracks = clamp(this.phaseTime / 0.14);
      v.shards = null;
      busy = true;
    } else {
      v.cracks = null;
      v.shards = broken ? this.shards : null;
      if (v.shards && !reduced && this.stepShards(dt)) busy = true;
    }
    v.shardAlpha = this.shardAlpha;
    // A hold (or its ease back) always keeps the loop running, even with nothing on screen moving.
    if (this.phase === "breaking" || this.phase === "holding") busy = true;

    const puddle = this.hasPuddle;
    if (puddle !== this.puddleShown) {
      this.puddleShown = puddle;
      this.opts.onPuddle?.(puddle);
    }

    if (this.fade) {
      this.fade.t += dt;
      if (this.fade.t >= (this.fade.mode === "dip" ? 0.4 : 0.26)) this.fade = null;
      busy = true;
    }
    return busy;
  }

  /** Cut the seal into pieces around the blow (`settled`: already come to rest, for reduced motion). */
  private cut(settled: boolean) {
    const wax = this.wax;
    if (!wax) return;
    this.heat = 0;
    this.impress = 1;
    this.spread.set(1);
    this.renderWax();
    const [hx, hy] = this.hit;
    const { shards, cracks } = crack(wax, hx, hy, this.seed ^ 0x51ed, this.scene.flapEdge(), this.scene.waxShadow().contact);
    this.scene.setCracks(cracks);
    const R = this.scene.layout.R;
    const u = R / 54;
    const rand = seededRandom(this.seed ^ 0x2545);
    const tile = this.opts.mode === "tile";

    this.shards = shards.map((shape) => {
      let dx = shape.cx - hx;
      let dy = shape.cy - hy;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      // The chips knocked out where it was struck pop off; everything else stays where it broke.
      const role: ShardBody["role"] = shape.chip ? "crumb" : shape.side;
      const give = (0.15 + rand() * 0.3) * u;
      const body: ShardBody = {
        shape,
        role,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        angle: 0,
        spin: 0,
        tx: dx * give,
        ty: dy * give,
        alpha: 1,
        landed: -1,
        bounced: false,
      };
      if (role === "crumb") {
        const speed = (135 + rand() * 80) * u * (tile ? 0.85 : 1);
        body.vx = dx * speed;
        body.vy = dy * speed * 0.9 + 18 * u;
        body.vz = (60 + rand() * 30) * Math.sqrt(u);
        body.spin = (rand() - 0.5) * 5;
        if (settled) {
          // where it would have come to rest
          body.x = dx * R * (0.55 + rand() * 0.4);
          body.y = dy * R * (0.55 + rand() * 0.4) + R * 0.15;
          body.angle = (rand() - 0.5) * 2;
          body.vx = body.vy = body.vz = body.spin = 0;
          body.landed = 1;
          body.bounced = true;
        }
      } else if (settled) {
        body.x = body.tx;
        body.y = body.ty;
      }
      return body;
    });
    this.landings = 0;
    this.shardAlpha = 1;
  }

  /** Cut again after a resize or a theme change, keeping where every piece got to. */
  private recut(oldR: number) {
    const old = this.shards;
    this.newWax(this.seed);
    this.cut(true);
    const fresh = this.shards;
    if (!old || !fresh || old.length !== fresh.length) return;
    const k = this.scene.layout.R / oldR;
    fresh.forEach((body, i) => {
      const prev = old[i];
      body.role = prev.role;
      body.x = prev.x * k;
      body.y = prev.y * k;
      body.z = prev.z * k;
      body.vx = prev.vx * k;
      body.vy = prev.vy * k;
      body.vz = prev.vz * k;
      body.tx = prev.tx * k;
      body.ty = prev.ty * k;
      body.angle = prev.angle;
      body.spin = prev.spin;
      body.landed = prev.landed;
      body.bounced = prev.bounced;
    });
  }

  /** Crumbs fly, bounce once and skid to a stop; the rest settle a hair apart. True while anything moves. */
  private stepShards(dt: number): boolean {
    const shards = this.shards;
    if (!shards) return false;
    const u = this.scene.layout.R / 54;
    const g = 520 * Math.sqrt(u);
    let moving = false;
    for (const s of shards) {
      if (s.role !== "crumb") {
        if (Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) > 0.01) {
          s.x = damp(s.x, s.tx, 14, dt);
          s.y = damp(s.y, s.ty, 14, dt);
          moving = true;
        }
        continue;
      }
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
        moving = true;
      } else if (Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.spin) > 0.02) {
        // skidding to a stop on the paper
        const f = Math.exp(-7 * dt);
        s.vx *= f;
        s.vy *= f;
        s.spin *= f;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.angle += s.spin * dt;
        moving = true;
      }
      if (s.landed >= 0) s.landed += dt;
    }
    return moving;
  }

  private renderWax() {
    const wax = this.wax;
    if (!wax) return;
    const spread = clamp(this.spread.value, 0.05, 1.25);
    const impress = this.impress;
    const heat = this.heat;
    const exposure = this.scene.paper.exposure;
    const theme = this.scene.theme;
    const s = this.waxState;
    const sameShape = Math.abs(s.spread - spread) < 2e-4 && Math.abs(s.impress - impress) < 1e-3;
    // Cooling only shades again once the gloss has visibly changed.
    const sameHeat = heat === s.heat || (heat > 0 && Math.abs(s.heat - heat) < 0.012);
    if (sameShape && sameHeat && s.exposure === exposure && s.theme === theme) return;
    s.spread = spread;
    s.impress = impress;
    s.heat = heat;
    s.exposure = exposure;
    s.theme = theme;
    wax.render({ spread, impress, heat, exposure, shadow: this.scene.waxShadow() });
  }

  private transition(mode: "cross" | "dip") {
    const canvas = this.scene.ctx.canvas as HTMLCanvasElement;
    if (!canvas.width || !canvas.height) return;
    if (!this.snapshot) this.snapshot = document.createElement("canvas");
    if (this.snapshot.width !== canvas.width) this.snapshot.width = canvas.width;
    if (this.snapshot.height !== canvas.height) this.snapshot.height = canvas.height;
    const sctx = this.snapshot.getContext("2d");
    if (!sctx) return;
    sctx.clearRect(0, 0, canvas.width, canvas.height);
    sctx.drawImage(canvas, 0, 0);
    this.fade = { mode, t: 0 };
    this.dirty = true;
  }

  private draw() {
    const fade = this.fade;
    const ctx = this.scene.ctx;
    if (!fade || !this.snapshot) {
      this.scene.draw(this.view);
      return;
    }
    if (fade.mode === "cross") {
      this.scene.draw(this.view);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1 - smoothstep(0, 0.26, fade.t);
      ctx.drawImage(this.snapshot, 0, 0);
      ctx.globalAlpha = 1;
      return;
    }
    // dip: the old frame fades to the bare table, then the new one fades up
    const t = clamp(fade.t / 0.4);
    if (t < 0.5) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalAlpha = 1 - smoothstep(0, 0.5, t);
      ctx.drawImage(this.snapshot, 0, 0);
      ctx.globalAlpha = 1;
      return;
    }
    this.scene.draw(this.view);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "#000";
    ctx.globalAlpha = smoothstep(0.5, 1, t);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
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
