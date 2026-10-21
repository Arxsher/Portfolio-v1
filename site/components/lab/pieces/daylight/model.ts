// The switch's state, without any drawing or DOM: where the knob is, how it
// moves, and when the choice counts. The header toggle, the lab tile and the
// stage all run this same model; only the renderer's level of detail differs.
//
// Motion model
// - One position, p: 0 is the afternoon end (light), 1 the night end (dark).
//   Everything in the scene is worked out from p alone, so the landscape is
//   exactly as far into the evening as the knob is.
// - Free: a damped spring (slightly under-damped, ζ ≈ 0.75) carries p to the
//   chosen end. Its small overshoot is not drawn as travel: the renderer
//   squashes the knob against the end of the track instead, so a throw lands
//   with a soft bump.
// - Held (pointer): p follows the finger 1:1 from wherever the knob was when
//   it was grabbed (also mid-flight: grabbing takes the spring's current
//   value, so nothing jumps). Past the ends it is rubber-banded. On release
//   the throw is projected forward (p + v × 0.16 s) and the nearer end of the
//   projection wins, so a flick crosses the track and a slow drag settles
//   where it was left; the spring starts with the hand's speed.
// - Held (keys): ← / → push the knob at a steady rate for as long as the key
//   is down (a slow sunset you can stop and look at), and letting go sends it
//   on to the end it was heading for. A single press therefore switches.
// - Tap / Enter / Space: flips the target; the spring reverses smoothly if
//   the knob was already travelling.
// - Press: a second spring widens the knob while it is held (it grows away
//   from the wall it rests on). Speed adds a little stretch along the track.
// - Hover (fine pointers): the knob leans a few percent toward the other end
//   (the sun dips a little), an invitation to drag; it folds into the drag if
//   you then press.
// - Commit: a new side counts once the knob is three quarters of the way
//   there (onCommit), so the page's own theme fade runs while the knob lands
//   rather than after. Grabbing it again before then cancels the change.
// - Reduced motion: releases, taps and keys jump straight to the end; the
//   knob still follows a drag (that is direct manipulation, not animation).

import { clamp, damp, Spring, type SpringConfig } from "../../hooks";

export type Side = 0 | 1;

/** Spring feels: the header switch is quick; the big one takes its time so the evening shows. */
export const FEEL = {
  compact: { stiffness: 330, damping: 27.5 },
  tile: { stiffness: 150, damping: 19.5 },
  stage: { stiffness: 165, damping: 19.5 },
} as const satisfies Record<string, SpringConfig>;

/** Travels per second while an arrow key is held. */
const KEY_RATE = 0.55;
/** Distance from the new end at which a change counts. */
const COMMIT_AT = 0.25;
/** How far the knob leans toward the other end under a resting mouse. */
const PEEK = 0.065;
/** Seconds of throw projected forward on release. */
const PROJECT = 0.16;

/** Rubber band past the ends: resistance 0.36 at the edge, never more than 0.12 of a travel. */
function rubber(p: number): number {
  if (p > 1) {
    const o = p - 1;
    return 1 + 0.12 * (1 - 1 / (1 + o * 3));
  }
  if (p < 0) {
    const o = -p;
    return -0.12 * (1 - 1 / (1 + o * 3));
  }
  return p;
}

export class SwitchModel {
  readonly pos: Spring;
  readonly press = new Spring(0, { stiffness: 520, damping: 32, precision: 0.002 });
  readonly peek = new Spring(0, { stiffness: 230, damping: 24, precision: 0.0004 });
  /** Smoothed stretch along the track from speed (0 … 0.16). */
  stretch = 0;
  /** The end the knob is going to (or resting at). */
  target: Side = 0;
  /** The side that currently counts (the theme). */
  committed: Side = 0;
  /** A side waiting to count, or -1. */
  pending: Side | -1 = -1;
  dragging = false;
  hovering = false;
  reduced = false;
  /** Called once a new side counts. */
  onCommit: ((side: Side) => void) | null = null;
  /** The knob met the end of the track; speed in travels per second. */
  onLand: ((speed: number) => void) | null = null;

  private source: "pointer" | "key" | null = null;
  private dragP = 0;
  private grabP = 0;
  private grabX = 0;
  private startX = 0;
  private travelPx = 1;
  private lastX = 0;
  private lastT = 0;
  private downT = 0;
  private vel = 0;
  private moved = false;
  private keyDir = 0;
  private landed = true;

  constructor(feel: SpringConfig = FEEL.compact, side: Side = 0) {
    this.pos = new Spring(side, { ...feel, precision: 0.0003 });
    this.target = side;
    this.committed = side;
  }

  /** The knob's position as drawn (may overshoot 0 … 1 a little). */
  get p(): number {
    return this.dragging ? this.dragP : this.pos.value + this.peek.value;
  }

  /** The hour: p clamped to 0 … 1. */
  get t(): number {
    return clamp(this.p, 0, 1);
  }

  /** Knob speed in travels per second. */
  get speed(): number {
    return this.dragging ? this.vel : this.pos.velocity + this.peek.velocity;
  }

  get held(): boolean {
    return this.dragging;
  }

  /** True while a pointer (not a key) holds the knob. */
  get pointerHeld(): boolean {
    return this.source === "pointer";
  }

  /** Take the knob from wherever it is (mid-flight too), folding the lean in. */
  private grab() {
    const p = this.pos.value + this.peek.value;
    this.pos.set(p);
    this.peek.set(0);
    this.dragP = p;
    this.pending = -1;
    this.dragging = true;
    this.vel = 0;
  }

  private release(side: Side, velocity: number) {
    this.dragging = false;
    this.source = null;
    this.pos.value = this.dragP;
    this.pos.velocity = clamp(velocity, -14, 14);
    this.goTo(side);
  }

  private goTo(side: Side) {
    this.target = side;
    this.pending = side !== this.committed ? side : -1;
    this.landed = false;
    if (this.reduced) {
      this.pos.set(side);
      this.peek.set(0);
    } else {
      this.pos.to(side);
    }
  }

  /* pointer ------------------------------------------------------------ */

  /** `x` in CSS px (any origin), `travelPx` the knob's travel in CSS px, `now` in ms. */
  down(x: number, travelPx: number, now: number) {
    if (this.source === "key") this.keyUp();
    this.grab();
    this.source = "pointer";
    this.grabP = this.dragP;
    this.grabX = x;
    this.startX = x;
    this.lastX = x;
    this.lastT = now;
    this.downT = now;
    this.travelPx = Math.max(1, travelPx);
    this.moved = false;
    this.press.to(1);
  }

  move(x: number, now: number) {
    if (this.source !== "pointer") return;
    const dt = Math.max(1, now - this.lastT) / 1000;
    const instant = (x - this.lastX) / this.travelPx / dt;
    this.vel += (instant - this.vel) * (1 - Math.exp(-dt / 0.045));
    this.lastX = x;
    this.lastT = now;
    if (Math.abs(x - this.startX) > 4) this.moved = true;
    this.dragP = rubber(this.grabP + (x - this.grabX) / this.travelPx);
  }

  /** Returns true when the press was a tap (it flipped the switch). */
  up(x: number, now: number): boolean {
    if (this.source !== "pointer") return false;
    this.dragP = rubber(this.grabP + (x - this.grabX) / this.travelPx);
    if (Math.abs(x - this.startX) > 4) this.moved = true;
    this.press.to(0);
    if (!this.moved && now - this.downT < 500) {
      this.release(this.target, 0);
      this.flip();
      return true;
    }
    // a finger that stopped before lifting throws nothing
    const velocity = now - this.lastT > 90 ? 0 : this.vel;
    const projected = this.dragP + velocity * PROJECT;
    this.release(projected >= 0.5 ? 1 : 0, velocity);
    return false;
  }

  /** The browser took the pointer (e.g. a vertical scroll began): go back. */
  cancel() {
    if (this.source !== "pointer") return;
    this.press.to(0);
    this.release(this.committed, 0);
  }

  /* keys ---------------------------------------------------------------- */

  keyDown(direction: 1 | -1) {
    if (this.source === "pointer") return;
    if (this.source !== "key") {
      this.grab();
      this.source = "key";
      this.press.to(1);
    }
    this.keyDir = direction;
  }

  keyUp() {
    if (this.source !== "key") return;
    const direction = this.keyDir;
    this.keyDir = 0;
    this.press.to(0);
    this.release(direction > 0 ? 1 : 0, direction * KEY_RATE);
  }

  /* other --------------------------------------------------------------- */

  /** Tap, Enter or Space: switch to the other end. */
  flip() {
    if (this.dragging) return;
    this.pos.value += this.peek.value;
    this.pos.velocity += this.peek.velocity;
    this.peek.set(0);
    this.press.impulse(7);
    this.goTo(this.target === 1 ? 0 : 1);
  }

  /** Go to a side without anyone touching it (the theme changed elsewhere). */
  sync(side: Side, animate: boolean) {
    this.committed = side;
    if (this.dragging) return;
    if (this.pending >= 0) {
      if (this.pending === side) return;
      this.pending = -1;
    }
    if (this.target === side) return;
    this.target = side;
    this.landed = false;
    if (!animate || this.reduced) {
      this.pos.set(side);
      this.peek.set(0);
    } else {
      this.pos.to(side);
    }
  }

  /** Put the knob at a side at once (first paint). */
  place(side: Side) {
    this.pos.set(side);
    this.peek.set(0);
    this.press.set(0);
    this.stretch = 0;
    this.target = side;
    this.committed = side;
    this.pending = -1;
    this.dragging = false;
    this.source = null;
    this.landed = true;
  }

  /** Advance by dt seconds. Returns true while anything is still moving. */
  step(dt: number): boolean {
    if (this.source === "key") {
      const next = clamp(this.dragP + this.keyDir * KEY_RATE * dt, 0, 1);
      this.vel = dt > 0 ? (next - this.dragP) / dt : 0;
      this.dragP = next;
    }

    const resting = !this.dragging && this.pending < 0 && Math.abs(this.pos.value - this.target) < 0.02;
    const lean = this.hovering && resting && !this.reduced ? (this.target === 0 ? PEEK : -PEEK) : 0;
    this.peek.to(lean);

    if (!this.dragging) this.pos.step(dt);
    this.peek.step(dt);
    this.press.step(dt);

    if (!this.dragging && !this.landed) {
      const reached = this.target === 1 ? this.pos.value >= 1 : this.pos.value <= 0;
      if (reached) {
        this.landed = true;
        this.onLand?.(Math.abs(this.pos.velocity));
      } else if (this.pos.settled) {
        this.landed = true;
      }
    }

    const pending = this.pending;
    if (pending !== -1 && !this.dragging && (this.reduced || Math.abs(this.pos.value - pending) < COMMIT_AT)) {
      const side: Side = pending;
      this.pending = -1;
      this.committed = side;
      this.onCommit?.(side);
    }

    const want = this.reduced ? 0 : Math.min(0.16, Math.abs(this.speed) * 0.024);
    this.stretch = damp(this.stretch, want, 16, dt);
    if (this.stretch < 0.0005 && want === 0) this.stretch = 0;

    return (
      this.dragging ||
      !this.pos.settled ||
      !this.peek.settled ||
      !this.press.settled ||
      this.stretch > 0 ||
      this.pending >= 0
    );
  }
}
