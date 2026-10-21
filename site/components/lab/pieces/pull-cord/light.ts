// The lamp's light, as a few numbers the shader reads.
//
// - power: the switch's contact, near instant.
// - filament: the tungsten's temperature. It heats in a few tens of ms and
//   cools over about a third of a second, so switching off leaves an orange
//   afterglow in the bulb that fades. Emission rises steeply with it.
// - room: how much of the room is lit, on a spring (slightly under-damped,
//   so the light "lands"). Switching on, the room lights up from the lamp
//   outward like the light is blooming out of it; switching off it closes
//   in from the edges all at once, nearly evenly (frontWidth).
// - charge: the glaze on the pull is phosphorescent. Light charges it; in
//   the dark it glows, brightest just after the light goes off, then
//   settles to a faint glow that never quite goes (so the pull can always
//   be found in the dark).
//
// Every value is continuous and the switch can flip at any moment: a
// toggle mid-transition reverses from wherever things are.

import { Spring } from "../../hooks";

const HEAT = 0.045;
const COOL = 0.32;
const GLOW_FLOOR = 0.55;

export class LampLight {
  on: boolean;
  power: number;
  filament: number;
  readonly room: Spring;
  /** Width of the lighting front, as a share of the farthest distance. */
  front: number;
  charge: number;
  reduced = false;

  constructor(on: boolean) {
    this.on = on;
    this.power = on ? 1 : 0;
    this.filament = on ? 1 : 0;
    this.room = new Spring(on ? 1 : 0, { stiffness: 46, damping: 11.2, precision: 0.0005 });
    this.front = on ? 0.55 : 2.6;
    this.charge = on ? 1 : GLOW_FLOOR;
  }

  /** Brightness of the filament, 0..1. */
  get emission() {
    const f = this.filament;
    return f * f * Math.sqrt(f) * (1 + 0.04 * (this.room.value - 1));
  }

  set(on: boolean, instant = false) {
    this.on = on;
    this.room.to(on ? 1 : 0);
    if (instant || this.reduced) this.snap();
  }

  /** Jump to the resting state for the current switch position. */
  snap() {
    this.power = this.on ? 1 : 0;
    this.filament = this.power;
    this.room.set(this.on ? 1 : 0);
    this.front = this.on ? 0.55 : 2.6;
    if (this.on) this.charge = 1;
  }

  /** Advances everything; returns true while anything is still changing. */
  step(dt: number): boolean {
    const target = this.on ? 1 : 0;
    this.power += (target - this.power) * (1 - Math.exp(-dt / 0.006));
    const tau = this.power > this.filament ? HEAT : COOL;
    this.filament += (this.power - this.filament) * (1 - Math.exp(-dt / tau));
    if (Math.abs(this.filament - target) < 1e-4) this.filament = target;
    if (Math.abs(this.power - target) < 1e-4) this.power = target;
    // a narrow front while lighting up, a wide (near even) one going dark
    const frontTarget = this.on ? 0.55 : 2.6;
    this.front += (frontTarget - this.front) * (1 - Math.exp(-dt / 0.08));
    if (Math.abs(this.front - frontTarget) < 1e-3) this.front = frontTarget;
    this.room.step(dt);
    // the glaze: charged by the light, a phosphor's long tail in the dark
    const lit = Math.max(0, Math.min(1, this.room.value));
    if (lit > 0.4) this.charge += (1 - this.charge) * (1 - Math.exp(-dt * 1.6 * lit));
    else this.charge += (GLOW_FLOOR - this.charge) * (1 - Math.exp(-dt / 3.2));
    const settledCharge = Math.abs(this.charge - (lit > 0.4 ? 1 : GLOW_FLOOR)) < 0.002;
    if (settledCharge) this.charge = lit > 0.4 ? 1 : GLOW_FLOOR;
    return !(
      this.power === target &&
      this.filament === target &&
      this.front === frontTarget &&
      this.room.settled &&
      settledCharge
    );
  }

  /** How strongly the pull glows right now (zero in a lit room). */
  get glow() {
    const dark = 1 - Math.max(0, Math.min(1, this.room.value));
    return this.charge * dark * dark;
  }
}
