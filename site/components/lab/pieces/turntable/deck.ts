// The deck: its layout (in millimetres, seen from above, x right and y
// down, so a positive angle turns clockwise on screen), the tonearm's
// geometry, and the physics of the platter, the record and the arm. No
// drawing and no sound here; the piece steps it once a frame and reads the
// events it raises.
//
// Records spin clockwise seen from above, so the record's angle grows.
// The loop on it is pinned to that angle: one turn at 33⅓ is 1.8 seconds
// of music, wherever the turn comes from (the motor or a hand).

import { clamp, Spring } from "../../hooks";

/* ---------------------------------------------------------------------- */
/* layout (mm)                                                             */
/* ---------------------------------------------------------------------- */

export const PLINTH = { w: 480, h: 360, r: 16 } as const;
export const CENTRE = { x: 188, y: 180 } as const;
export const PLATTER_R = 166;
export const RECORD_R = 151;
export const LABEL_R = 50;
export const SPINDLE_R = 3.6;
/** The lead-in: smooth vinyl from the edge bead to the first groove. */
export const LEAD_IN = 148.4;
/** The run-out: the lead-out spiral runs from here to the locked groove. */
export const RUNOUT_OUTER = 62;
export const LOCK_R = 54.6;

export type Band = {
  id: string;
  name: string;
  outer: number;
  inner: number;
  /** Stem levels: drums, bass, keys. */
  stems: readonly [number, number, number];
  /** How busy the grooves look (sheen spread). */
  loud: number;
};

/** Four locked grooves, one loop each, pressed as bands with gaps between. */
export const BANDS: readonly Band[] = [
  { id: "A1", name: "Full loop", outer: 146, inner: 118.5, stems: [1, 1, 1], loud: 1 },
  { id: "A2", name: "Drums and bass", outer: 116.5, inner: 97, stems: [1, 1, 0], loud: 0.8 },
  { id: "A3", name: "Drums", outer: 95, inner: 80, stems: [1, 0, 0], loud: 0.62 },
  { id: "A4", name: "Keys and bass", outer: 78, inner: 64, stems: [0, 0.55, 1], loud: 0.45 },
];

export const PIVOT = { x: 404, y: 84 } as const;
const PIVOT_TO_SPINDLE = Math.hypot(CENTRE.x - PIVOT.x, CENTRE.y - PIVOT.y);
/** Pivot to stylus. The stylus swings 15.5 mm past the spindle (overhang). */
export const ARM_LENGTH = PIVOT_TO_SPINDLE + 15.5;
const TO_SPINDLE = Math.atan2(CENTRE.y - PIVOT.y, CENTRE.x - PIVOT.x);
/** Arm angle on its rest (pointing to the front, a touch outward). */
export const REST_ANGLE = (91.2 * Math.PI) / 180;
/** Headshell length, collar to stylus. */
export const HEAD_LEN = 36;
/** Where the tube lies in the rest's cradle, measured from the pivot. */
export const REST_AT = 172;

export const START_BUTTON = { x: 37, y: 323, half: 15 } as const;
export const SPEED_BUTTONS = [
  { rpm: 33 as const, x: 437, y: 322, r: 6.4 },
  { rpm: 45 as const, x: 461, y: 322, r: 6.4 },
] as const;
export const STROBE_LAMP = { x: 24, y: 262, r: 6.5 } as const;
export const CUE = { x: 448, y: 150, r: 6.5, length: 19 } as const;
/** The pitch fader: its slot's centre, half its travel, and the range (±8%). */
export const FADER = { x: 458, y: 238, half: 48, range: 0.08 } as const;
/** The fader cap: half its size along the slot and across it. */
export const FADER_CAP = { along: 4.6, across: 8 } as const;
/** Cue handle angle: down (arm lowered) and up. */
export const CUE_DOWN = (200 * Math.PI) / 180;
export const CUE_UP = (156 * Math.PI) / 180;

/** Strobe dot rows (120 flashes a second): 216 dots stand still at 33⅓, 160 at 45. */
export const STROBE_ROWS = [
  { rpm: 33.333, r: 158.4, dots: 216 },
  { rpm: 45, r: 154.4, dots: 160 },
] as const;
export const STROBE_HZ = 120;

export type Speed = 33 | 45;
export const omegaOf = (rpm: number) => (rpm * Math.PI * 2) / 60;
/** 33⅓ in radians a second: the speed the loop was cut at. */
export const OMEGA_33 = omegaOf(100 / 3);
export const omegaFor = (speed: Speed) => omegaOf(speed === 33 ? 100 / 3 : 45);

/* ---------------------------------------------------------------------- */
/* tonearm geometry                                                        */
/* ---------------------------------------------------------------------- */

export type Vec = { x: number; y: number };

export function stylusAt(phi: number): Vec {
  return { x: PIVOT.x + ARM_LENGTH * Math.cos(phi), y: PIVOT.y + ARM_LENGTH * Math.sin(phi) };
}

/** Where on the record (radius, mm) the stylus sits at arm angle phi. */
export function radiusAt(phi: number): number {
  return Math.hypot(PIVOT.x + ARM_LENGTH * Math.cos(phi) - CENTRE.x, PIVOT.y + ARM_LENGTH * Math.sin(phi) - CENTRE.y);
}

/** The arm angle that puts the stylus on radius r. */
export function angleFor(r: number): number {
  const d = PIVOT_TO_SPINDLE;
  const c = (d * d + ARM_LENGTH * ARM_LENGTH - r * r) / (2 * d * ARM_LENGTH);
  return TO_SPINDLE - Math.acos(clamp(c, -1, 1));
}

/**
 * The headshell's offset: turned so the cartridge follows the groove at
 * mid record (null point), as a straight arm with an angled headshell does.
 */
const OFFSET = (() => {
  const phi = angleFor(100);
  const s = stylusAt(phi);
  let t = Math.atan2(s.y - CENTRE.y, s.x - CENTRE.x) + Math.PI / 2;
  if (Math.cos(t - phi) < 0) t += Math.PI;
  return Math.atan2(Math.sin(t - phi), Math.cos(t - phi));
})();

export type ArmPose = {
  /** Stylus tip. */
  s: Vec;
  /** Collar (headshell joint). */
  k: Vec;
  /** Headshell axis, unit, pointing forward (collar → stylus). */
  h: Vec;
  /** Tube axis, unit (pivot → collar). */
  u: Vec;
};

export const newPose = (): ArmPose => ({ s: { x: 0, y: 0 }, k: { x: 0, y: 0 }, h: { x: 0, y: 0 }, u: { x: 0, y: 0 } });

/** The arm's pose at angle phi, written into `out` (a fresh one if none is given). */
export function armPose(phi: number, out: ArmPose = newPose()): ArmPose {
  const { s, k, h, u } = out;
  s.x = PIVOT.x + ARM_LENGTH * Math.cos(phi);
  s.y = PIVOT.y + ARM_LENGTH * Math.sin(phi);
  h.x = Math.cos(phi + OFFSET);
  h.y = Math.sin(phi + OFFSET);
  k.x = s.x - h.x * HEAD_LEN;
  k.y = s.y - h.y * HEAD_LEN;
  const len = Math.hypot(k.x - PIVOT.x, k.y - PIVOT.y);
  u.x = (k.x - PIVOT.x) / len;
  u.y = (k.y - PIVOT.y) / len;
  return out;
}

/** The rest's cradle: under the tube when the arm is parked. */
export const REST_POINT: Vec = (() => {
  const pose = armPose(REST_ANGLE);
  return { x: PIVOT.x + pose.u.x * REST_AT, y: PIVOT.y + pose.u.y * REST_AT };
})();

/** Furthest in the arm can go (stylus just short of the label). */
export const MAX_ANGLE = angleFor(LABEL_R + 4);
/** Just inside the lead-in's outer edge, where an automatic cue sets down. */
export const LEAD_ANGLE = angleFor(LEAD_IN - 1);

/* ---------------------------------------------------------------------- */
/* hit testing                                                             */
/* ---------------------------------------------------------------------- */

function segmentDistance(p: Vec, a: Vec, b: Vec) {
  const bx = b.x - a.x;
  const by = b.y - a.y;
  const t = clamp(((p.x - a.x) * bx + (p.y - a.y) * by) / (bx * bx + by * by));
  return Math.hypot(p.x - a.x - bx * t, p.y - a.y - by * t);
}

export type Target = "arm" | "record" | "start" | "speed33" | "speed45" | "cue" | "pitch" | null;

/** Where the fader cap sits (y, mm) for a pitch. Toward you is faster, as on a DJ deck. */
export const faderY = (pitch: number) => FADER.y + (pitch / FADER.range) * FADER.half;
/** The pitch for a cap position. */
export const pitchAt = (y: number) => clamp((y - FADER.y) / FADER.half, -1, 1) * FADER.range;

const hitPose = newPose();

/** What a press at p (mm) takes hold of. */
export function hitTest(p: Vec, phi: number, slop = 0): Target {
  const pose = armPose(phi, hitPose);
  const tip = { x: pose.s.x + pose.h.x * 16, y: pose.s.y + pose.h.y * 16 };
  // the headshell and the outer half of the tube (near the pivot a drag
  // would swing the arm too fast to control)
  if (segmentDistance(p, pose.k, tip) < 12 + slop) return "arm";
  const fromPivot = Math.hypot(p.x - PIVOT.x, p.y - PIVOT.y);
  if (fromPivot > 70 && segmentDistance(p, PIVOT, pose.k) < 7 + slop) return "arm";
  // finger lift, out to the side
  const side = { x: -pose.h.y, y: pose.h.x };
  const lift = { x: pose.s.x + side.x * 15 - pose.h.x * 4, y: pose.s.y + side.y * 15 - pose.h.y * 4 };
  if (Math.hypot(p.x - lift.x, p.y - lift.y) < 9 + slop) return "arm";

  if (Math.abs(p.x - FADER.x) < FADER_CAP.across + 2 + slop && Math.abs(p.y - FADER.y) < FADER.half + FADER_CAP.along + 2 + slop) return "pitch";
  if (Math.abs(p.x - START_BUTTON.x) < START_BUTTON.half + 3 + slop && Math.abs(p.y - START_BUTTON.y) < START_BUTTON.half + 3 + slop) return "start";
  for (const b of SPEED_BUTTONS) {
    if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 4 + slop) return b.rpm === 33 ? "speed33" : "speed45";
  }
  const cueTip = cueHandle(1);
  if (Math.hypot(p.x - CUE.x, p.y - CUE.y) < CUE.r + 6 + slop || segmentDistance(p, CUE, cueTip) < 7 + slop) return "cue";
  if (Math.hypot(p.x - CENTRE.x, p.y - CENTRE.y) <= RECORD_R + 1 + slop) return "record";
  return null;
}

/** The cue handle's tip for lever position t (0 down, 1 up). */
export function cueHandle(t: number): Vec {
  const a = CUE_DOWN + (CUE_UP - CUE_DOWN) * t;
  return { x: CUE.x + Math.cos(a) * CUE.length, y: CUE.y + Math.sin(a) * CUE.length };
}

/** Which band a radius falls in, or -1 (gap, lead-in, run-out). */
export function bandAt(r: number): number {
  for (let i = 0; i < BANDS.length; i++) if (r <= BANDS[i].outer + 0.05 && r >= BANDS[i].inner - 0.05) return i;
  return -1;
}

/** The outer edge of the first band inside radius r, or null past the last one. */
function nextBandIn(r: number): number | null {
  for (let i = 0; i < BANDS.length; i++) if (BANDS[i].outer < r) return BANDS[i].outer;
  return null;
}

/* ---------------------------------------------------------------------- */
/* physics                                                                 */
/* ---------------------------------------------------------------------- */

export type DeckEvent =
  | { type: "touchdown"; speed: number }
  | { type: "liftoff" }
  | { type: "rest" }
  | { type: "lock" }
  | { type: "band"; band: number };

type Plan = { phi: number; then: "lower" | "rest" | "hold"; stage: "lift" | "swing" | "settle" } | null;

const TAU = Math.PI * 2;

/** Spin-up and braking, rad/s² (a direct drive is quick: about 0.5 s to 33⅓). */
const TORQUE = 7.4;
const BRAKE = 4.6;
/** Freewheeling friction after a flick with the motor off. */
const COAST = 1.5;
/** How hard the slipmat pulls the record back to the platter, 1/s. */
const SLIP = 13;

// The automatic cue (start, a band key, park): a brisk lift, a swing that
// lands without hunting, and a lowering that begins as the swing settles, so
// the needle is in the lead-in a little over a second after start.
const CUE_LIFT = { stiffness: 240, damping: 31 };
/** The swing begins once the arm is this far up. */
const CUE_LIFTED = 0.72;
const CUE_SWING = { stiffness: 120, damping: 21 };
const CUE_SWING_REDUCED = { stiffness: 160, damping: 26 };
const CUE_LOWER = { stiffness: 72, damping: 16 };
/** The cue lever's own descent, slower: it's damped like a real one. */
const LEVER_LOWER = { stiffness: 46, damping: 13.2 };
const LOWER_REDUCED = { stiffness: 120, damping: 22 };
/** How far a turning record carries the stylus, mm a turn: the lead-in is pitched wide, the gaps and run-out tighter. */
const CARRY_LEAD_IN = 16;
const CARRY_GAP = 4;
const CARRY_RUNOUT = 4.2;

export class Deck {
  motor = false;
  speed: Speed = 33;
  /** Pitch fader, -0.08..0.08 (0 is quartz-locked to the speed). */
  pitch = 0;

  platterAngle = 0;
  platterVel = 0;
  recordAngle = 0;
  recordVel = 0;

  /** Held by a hand (pointer or keys): the record follows `holdTarget`. */
  held = false;
  holdTarget = 0;
  private hold = new Spring(0, { stiffness: 2600, damping: 96, precision: 1e-6 });

  /** Freewheeling after a flick (bearing friction, not the brake). */
  private coasting = false;

  /** Apparent phase of each strobe row (what the lamp shows). */
  strobe = [0, 0];

  /** Arm angle and lift (0 resting on the record or the rest, 1 up). */
  arm = new Spring(REST_ANGLE, { stiffness: 60, damping: 15, precision: 1e-5 });
  lift = new Spring(0, { stiffness: 34, damping: 11.6, precision: 1e-4 });
  onRest = true;
  dragging = false;
  private plan: Plan = null;
  private contact = false;
  private lastTurn = 0;
  private band = -1;

  reduced = false;
  events: DeckEvent[] = [];

  /** The stylus is in a groove (down on the record, not lifted). */
  get needleDown(): boolean {
    return this.contact;
  }

  /** The cue lever is up (the arm is lifted or on its way up). */
  get cueUp(): boolean {
    return this.lift.target > 0.5;
  }

  get radius(): number {
    return radiusAt(this.arm.value);
  }

  /** The band under the stylus (-1 when not in one). */
  get currentBand(): number {
    return this.contact ? bandAt(this.radius) : -1;
  }

  /** Playback rate of the loop (1 = 33⅓ forward). */
  get rate(): number {
    return this.recordVel / OMEGA_33;
  }

  /** Playhead in seconds of the loop's time (unwrapped). */
  get position(): number {
    return this.recordAngle / OMEGA_33;
  }

  get busy(): boolean {
    return (
      this.motor ||
      Math.abs(this.platterVel) > 1e-4 ||
      Math.abs(this.recordVel) > 1e-4 ||
      this.held ||
      this.dragging ||
      this.plan !== null ||
      !this.arm.settled ||
      !this.lift.settled
    );
  }

  setMotor(on: boolean) {
    this.motor = on;
    this.coasting = false;
    if (on && this.onRest && !this.dragging) this.cueTo(LEAD_ANGLE);
    else if (on && !this.onRest && this.lift.target > 0.5 && !this.dragging && !this.plan) this.lower();
  }

  setPitch(pitch: number) {
    this.pitch = clamp(pitch, -FADER.range, FADER.range);
    // a detent at zero
    if (Math.abs(this.pitch) < 0.0012) this.pitch = 0;
  }

  setSpeed(speed: Speed) {
    this.speed = speed;
  }

  /** Lift the arm (cue lever up). */
  raise() {
    this.plan = null;
    this.lift.configure(CUE_LIFT).to(1);
    if (this.onRest) this.onRest = false;
  }

  /** Lower the arm where it is (cue lever down). Over the rest, it parks. */
  lower() {
    this.plan = null;
    if (this.arm.target <= REST_ANGLE + 0.035) {
      this.arm.configure({ stiffness: 60, damping: 15 }).to(REST_ANGLE);
      this.plan = { phi: REST_ANGLE, then: "rest", stage: "swing" };
      return;
    }
    this.lift.configure(this.reduced ? LOWER_REDUCED : LEVER_LOWER).to(-0.04);
  }

  toggleCue() {
    if (this.cueUp) this.lower();
    else this.raise();
  }

  /** Lift, swing to phi, lower. */
  cueTo(phi: number) {
    this.dragging = false;
    const target = clamp(phi, REST_ANGLE, MAX_ANGLE);
    this.plan = { phi: target, then: "lower", stage: "lift" };
    this.onRest = false;
    this.lift.configure(CUE_LIFT).to(1);
  }

  /** Lift and take the arm home. */
  park() {
    this.dragging = false;
    this.plan = { phi: REST_ANGLE, then: "rest", stage: "lift" };
    this.lift.configure(CUE_LIFT).to(1);
  }

  /** Move to band i (0-based) and drop the needle at its first groove. */
  cueBand(i: number) {
    const band = BANDS[clamp(Math.round(i), 0, BANDS.length - 1)];
    this.cueTo(angleFor(band.outer - 0.4));
  }

  /* hand on the arm ---------------------------------------------------- */

  private grabOffset = 0;

  grabArm(angleFromPivot: number) {
    this.dragging = true;
    this.plan = null;
    this.onRest = false;
    this.grabOffset = this.arm.value - angleFromPivot;
    this.lift.configure({ stiffness: 260, damping: 32 }).to(1);
    this.arm.configure({ stiffness: 420, damping: 38 });
  }

  dragArm(angleFromPivot: number) {
    if (!this.dragging) return;
    let a = angleFromPivot + this.grabOffset;
    // keep it continuous across the ±π seam
    while (a - this.arm.value > Math.PI) a -= TAU;
    while (a - this.arm.value < -Math.PI) a += TAU;
    this.arm.to(clamp(a, REST_ANGLE - 0.02, MAX_ANGLE));
  }

  releaseArm() {
    if (!this.dragging) return;
    this.dragging = false;
    this.arm.configure({ stiffness: 60, damping: 15 });
    const phi = this.arm.target;
    const edge = angleFor(RECORD_R - 1);
    if (phi < REST_ANGLE + (edge - REST_ANGLE) * 0.55) {
      this.plan = { phi: REST_ANGLE, then: "rest", stage: "swing" };
      this.arm.to(REST_ANGLE);
    } else {
      // let go over the record (or the rim): settle onto the lead-in at least
      const target = Math.max(phi, LEAD_ANGLE);
      this.arm.to(target);
      this.plan = { phi: target, then: "lower", stage: "swing" };
      this.lift.configure({ stiffness: 60, damping: 15.5 });
    }
  }

  /* hand on the record ------------------------------------------------- */

  /** Start holding the record (a press on the vinyl, or a key). */
  grabRecord() {
    this.held = true;
    this.holdTarget = this.recordAngle;
    this.hold.set(this.recordAngle);
    this.hold.velocity = this.recordVel;
  }

  /** Turn the held record by dAngle (radians, clockwise positive). */
  turnRecord(dAngle: number) {
    if (!this.held) return;
    this.holdTarget += dAngle;
  }

  /**
   * Let go of the record. A pointer lets go with the hand's speed (a flick
   * spins a stopped record on). Keys aren't a flick: with the motor off the
   * record stops where the hand left it; with it on the slipmat takes over.
   */
  releaseRecord({ flick = true }: { flick?: boolean } = {}) {
    if (!this.held) return;
    this.held = false;
    if (!flick && !this.motor) {
      this.recordVel = this.platterVel;
      return;
    }
    this.recordVel = clamp(this.hold.velocity, -OMEGA_33 * 5, OMEGA_33 * 5);
    // With the motor off nothing holds the platter: a flick drags it along
    // and the two coast down together on the bearing and the brake.
    if (!this.motor && Math.abs(this.recordVel) > Math.abs(this.platterVel)) {
      this.platterVel = this.platterVel + (this.recordVel - this.platterVel) * 0.55;
      this.coasting = true;
    }
  }

  /* the step ----------------------------------------------------------- */

  step(dt: number) {
    if (dt <= 0) return;
    // motor and platter
    const target = this.motor ? omegaFor(this.speed) * (1 + this.pitch) : 0;
    const want = (target - this.platterVel) * 11;
    const brake = this.motor ? BRAKE : this.coasting ? COAST : BRAKE;
    this.platterVel += clamp(want, -brake, this.motor ? TORQUE : brake) * dt;
    if (!this.motor && Math.abs(this.platterVel) < 0.002) {
      this.platterVel = 0;
      this.coasting = false;
    }
    this.platterAngle += this.platterVel * dt;

    // record: the hand, or the slipmat
    if (this.held) {
      this.hold.to(this.holdTarget);
      const before = this.hold.value;
      this.hold.step(dt);
      this.recordAngle = this.hold.value;
      this.recordVel = (this.hold.value - before) / dt;
    } else {
      const k = 1 - Math.exp(-SLIP * dt);
      this.recordVel += (this.platterVel - this.recordVel) * k;
      if (Math.abs(this.recordVel) < 1e-4 && this.platterVel === 0) this.recordVel = 0;
      this.recordAngle += this.recordVel * dt;
    }
    if (Math.abs(this.platterAngle) > TAU * 64) this.platterAngle %= TAU;

    // strobe: what 120 flashes a second make of each row
    const perFlash = this.platterVel / STROBE_HZ;
    for (let i = 0; i < STROBE_ROWS.length; i++) {
      const period = TAU / STROBE_ROWS[i].dots;
      const alias = perFlash - Math.round(perFlash / period) * period;
      this.strobe[i] = (this.strobe[i] + alias * STROBE_HZ * dt) % TAU;
    }

    this.stepArm(dt);
  }

  private stepArm(dt: number) {
    const plan = this.plan;
    if (plan) {
      if (plan.stage === "lift") {
        if (this.lift.value > CUE_LIFTED) {
          plan.stage = "swing";
          this.arm.configure(this.reduced ? CUE_SWING_REDUCED : CUE_SWING).to(plan.phi);
        }
      } else if (plan.stage === "swing") {
        // start down as the swing comes in: the arm has settled by the time the stylus lands
        const near = Math.abs(this.arm.value - plan.phi) < 0.02 && Math.abs(this.arm.velocity) < 0.15;
        if (near) {
          if (plan.then === "lower") {
            plan.stage = "settle";
            this.lift.configure(this.reduced ? LOWER_REDUCED : CUE_LOWER).to(-0.04);
          } else if (plan.then === "rest") {
            plan.stage = "settle";
            this.lift.configure(CUE_LOWER).to(-0.04);
          } else {
            this.plan = null;
          }
        }
      } else if (this.lift.value <= 0) {
        if (plan.then === "rest") {
          this.onRest = true;
          this.events.push({ type: "rest" });
        }
        this.plan = null;
      }
    }

    // the grooves carry the stylus: through the lead-in to the first band,
    // across a gap into the next one, along the run-out to the locked
    // groove. Only a turning record pulls it, a few mm a turn.
    if (this.contact && !this.dragging && !this.plan) {
      const r = this.radius;
      if (bandAt(r) < 0 && r > LOCK_R + 0.05) {
        const target =
          r > BANDS[0].outer ? BANDS[0].outer - 0.4 : r < RUNOUT_OUTER + 0.3 ? LOCK_R : (nextBandIn(r) ?? LOCK_R + 0.4) - 0.4;
        const pitch = r < RUNOUT_OUTER + 0.3 ? CARRY_RUNOUT : r > BANDS[0].outer ? CARRY_LEAD_IN : CARRY_GAP;
        const next = Math.max(target, r - (Math.abs(this.recordVel) / TAU) * pitch * dt);
        if (next !== r) this.arm.set(angleFor(next));
      }
    }

    this.arm.step(dt);
    if (this.arm.value < REST_ANGLE - 0.03) this.arm.set(REST_ANGLE - 0.03);

    const before = this.lift.value;
    this.lift.step(dt);
    if (this.lift.value < 0) {
      this.lift.set(0);
      this.lift.target = 0;
    }

    const r = this.radius;
    const overVinyl = !this.onRest && r <= LEAD_IN + 0.2 && r >= LOCK_R - 0.5 && this.arm.value > REST_ANGLE + 0.05;
    const down = overVinyl && this.lift.value <= 0.001 && !this.dragging;
    if (down && !this.contact) {
      this.contact = true;
      this.events.push({ type: "touchdown", speed: Math.abs(before - this.lift.value) / Math.max(dt, 1e-3) });
    } else if (!down && this.contact) {
      this.contact = false;
      this.events.push({ type: "liftoff" });
    }

    const band = this.currentBand;
    if (band !== this.band) {
      this.band = band;
      if (band >= 0) this.events.push({ type: "band", band });
    }

    // the locked groove at the end clicks once a turn
    const turn = Math.floor(this.recordAngle / TAU);
    if (turn !== this.lastTurn) {
      if (this.contact && this.radius < RUNOUT_OUTER - 1) this.events.push({ type: "lock" });
      this.lastTurn = turn;
    }
  }
}
