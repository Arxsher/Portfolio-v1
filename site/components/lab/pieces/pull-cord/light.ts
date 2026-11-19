// The lamp's light, as a few numbers the shader reads.
//
// - power: the switch's contact, near instant.
// - filament: the tungsten's temperature. It heats in a few tens of ms and
//   cools over about a third of a second. Visible light rises very steeply
//   with temperature (emission ~ f⁶ here), so switching off the room goes
//   dark at once while the coil itself stays visibly orange for a moment.
// - room: how much of the room is lit, on a spring. Switching on it is
//   slightly under-damped (the light "lands" with a hint of flash) and
//   spreads out from the lamp, the light blooming out of the bulb into the
//   room; switching off it is stiff and critically damped and even across
//   the room (a wide front): a switch, not a dimmer.
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
/** The room's spring switching on (lands with a little flash) and off (a clean drop). */
const ROOM_ON = { stiffness: 64, damping: 11.5 };
const ROOM_OFF = { stiffness: 380, damping: 39 };
/** Width of the lighting front, as a share of the farthest distance: a soft bloom out, an even drop. */
const FRONT_ON = 0.8;
const FRONT_OFF = 6;

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
    this.room = new Spring(on ? 1 : 0, { ...(on ? ROOM_ON : ROOM_OFF), precision: 0.0005 });
    this.front = on ? FRONT_ON : FRONT_OFF;
    this.charge = on ? 1 : GLOW_FLOOR;
  }

  /** Brightness of the filament, 0..1. */
  get emission() {
    const f = this.filament;
    const f3 = f * f * f;
    return f3 * f3 * (1 + 0.04 * (this.room.value - 1));
  }

  set(on: boolean, instant = false) {
    this.on = on;
    this.room.configure(on ? ROOM_ON : ROOM_OFF).to(on ? 1 : 0);
    // the bloom starts from the bulb: narrow the front at once
    if (on) this.front = Math.min(this.front, FRONT_ON);
    if (instant || this.reduced) this.snap();
  }

  /** Jump to the resting state for the current switch position. */
  snap() {
    this.power = this.on ? 1 : 0;
    this.filament = this.power;
    this.room.set(this.on ? 1 : 0);
    this.front = this.on ? FRONT_ON : FRONT_OFF;
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
    // a narrow front while lighting up, a wide (even) one going dark
    const frontTarget = this.on ? FRONT_ON : FRONT_OFF;
    this.front += (frontTarget - this.front) * (1 - Math.exp(-dt / (this.on ? 0.08 : 0.03)));
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
