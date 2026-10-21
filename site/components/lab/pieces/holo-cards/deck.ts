// The motion model for the holo cards: three cards, each a small rigid body
// with springs, stepped at a fixed 240 Hz so it feels the same at any frame
// rate. Nothing here allocates per frame.
//
// Every card has eight degrees of freedom (`p`, with velocities `v` and
// goals `g`): position x, y, z, the in-plane angle rz, the tilts tx (about
// the screen's x axis) and ty (about y), the flip (about the card's own
// vertical axis, a multiple of π at rest) and a bend (how much the card
// bows, for the flex of a flick and the wobble after it lands).
//
// A card is in one of three modes:
//   REST  every degree springs toward its slot in the deck (a slightly
//         messy stack, or a hand of cards fanned round a low pivot, mixed
//         by the deck's `fan` amount), plus the hover tilt. Slightly under
//         damped: a card stepping forward lands with a little weight.
//   HELD  the card hangs off the grab point: a stiff spring pulls the point
//         you grabbed toward your finger, and the card's centre feels a drag
//         of its own, so a card grabbed by a corner swings round behind
//         your hand the way a card slid across a table does. It lifts
//         toward you, leans toward where it's going and bows a little.
//   FLY   thrown: it keeps your speed and spin with air drag and soft walls
//         at the stage edges; once it is clear of the other cards it drops
//         behind them and a soft spring brings it home to the back slot
//         (from wherever it is, with whatever speed it has: a natural arc).
//         It can be caught again at any moment.
// Ranks change with a stagger, so the cards left behind step forward one
// after the other. Everything is interruptible: a grab, a fan or a flip
// starts from the current state, never a jump.

import { clamp } from "../../hooks";

export const CARD_W = 63 / 88;
export const CARD_H = 1;
export const CARD_R = 3.2 / 88;
export const COUNT = 3;

const HALF_W = CARD_W / 2;
const HALF_H = CARD_H / 2;
const TAU = Math.PI * 2;
const STEP = 1 / 240;

// degrees of freedom
export const X = 0;
export const Y = 1;
export const Z = 2;
export const RZ = 3;
export const TX = 4;
export const TY = 5;
export const FLIP = 6;
export const BEND = 7;
const DOF = 8;

export const REST = 0;
export const HELD = 1;
export const FLY = 2;

/** Rest springs per degree of freedom: stiffness and damping ratio. */
const K = [210, 210, 260, 190, 230, 230, 150, 560];
const ZETA = [0.78, 0.78, 0.95, 0.72, 0.6, 0.6, 0.6, 0.17];

/** Stack slots by rank (front first): x, y, rz. A hair of mess reads as real cards. */
const STACK = [
  [0, 0, 0],
  [-0.016, 0.036, -0.042],
  [0.02, 0.066, 0.05],
] as const;
const STACK_DZ = 0.05;
/** The fan: cards turn round a pivot this far below the deck, this far apart (rad). */
const FAN_ANGLE = 0.27;
const FAN_PIVOT = 1.75;
const FAN_DZ = 0.035;
/** Cards behind the front one follow a held front card this much (stacked). */
const SYMPATHY = [0, 0.07, 0.03];

/** Hover tilt at the edge of a card (rad). */
export const MAX_TILT = 0.25;
const HOLD_Z = 0.16;
const FLY_Z = 0.26;
const HOVER_Z = 0.05;

// held: the grab spring, the drag on the centre, spin damping, straightening
const K_GRAB = 2600;
const C_GRAB = 2 * 0.9 * Math.sqrt(K_GRAB);
const MU_HELD = 2.6;
const MU_SPIN_HELD = 0.5;
const K_STRAIGHTEN = 0.9;
const INERTIA = ((CARD_W * CARD_W + CARD_H * CARD_H) / 12) * 1.4;

// flying
const MU_AIR = 1.9;
const MU_SPIN = 1.1;
const K_HOME = 95;
const C_HOME = 2 * 0.86 * Math.sqrt(K_HOME);
const K_WALL = 110;
const C_WALL = 9;

/** Events since the piece last read them (bit flags). */
export const EV_GRAB = 1;
export const EV_THROW = 2;
export const EV_CLEAR = 4;
export const EV_LAND = 8;
export const EV_FLIP = 16;
export const EV_FLIP_LAND = 32;
export const EV_FAN = 64;
export const EV_STEP = 128;

const smooth01 = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export class Card {
  readonly id: number;
  /** 0 is the front card. */
  rank: number;
  /** The rank it moves to once `wait` runs out (the stagger). */
  pendingRank: number;
  wait = 0;
  /** Frozen where it is until `wait` runs out (the deal). */
  hold = false;
  mode = REST;
  readonly p = new Float64Array(DOF);
  readonly v = new Float64Array(DOF);
  readonly g = new Float64Array(DOF);
  /** Unit axes in world space: x (0–2), y (3–5), normal (6–8). */
  readonly axes = new Float64Array(9);
  /** Column-major model matrix (rotation + translation). */
  readonly model = new Float32Array(16);
  // held: grab point in the card's frame (rz only), the finger, its velocity
  hx = 0;
  hy = 0;
  px = 0;
  py = 0;
  pvx = 0;
  pvy = 0;
  // flying
  flyT = 0;
  clearT = -1;
  landed = false;
  flipping = false;

  constructor(id: number) {
    this.id = id;
    this.rank = id;
    this.pendingRank = id;
  }

  get x() {
    return this.p[X];
  }
  get y() {
    return this.p[Y];
  }
  get z() {
    return this.p[Z];
  }
  /** Which face is toward the viewer's side of the card (front when the flip is a whole turn). */
  get showsFront() {
    return Math.cos(this.p[FLIP]) >= 0;
  }

  /** R = Rx(tx) · Ry(ty) · Rz(rz) · Ry(flip), and the model matrix. */
  updateBasis() {
    const p = this.p;
    const cz = Math.cos(p[RZ]);
    const sz = Math.sin(p[RZ]);
    const cf = Math.cos(p[FLIP]);
    const sf = Math.sin(p[FLIP]);
    const cy = Math.cos(p[TY]);
    const sy = Math.sin(p[TY]);
    const cx = Math.cos(p[TX]);
    const sx = Math.sin(p[TX]);
    // A = Rz · Ry(flip)
    const a00 = cz * cf;
    const a01 = -sz;
    const a02 = cz * sf;
    const a10 = sz * cf;
    const a11 = cz;
    const a12 = sz * sf;
    const a20 = -sf;
    const a21 = 0;
    const a22 = cf;
    // B = Ry(ty) · A
    const b00 = cy * a00 + sy * a20;
    const b01 = cy * a01 + sy * a21;
    const b02 = cy * a02 + sy * a22;
    const b10 = a10;
    const b11 = a11;
    const b12 = a12;
    const b20 = -sy * a00 + cy * a20;
    const b21 = -sy * a01 + cy * a21;
    const b22 = -sy * a02 + cy * a22;
    // C = Rx(tx) · B
    const c00 = b00;
    const c01 = b01;
    const c02 = b02;
    const c10 = cx * b10 - sx * b20;
    const c11 = cx * b11 - sx * b21;
    const c12 = cx * b12 - sx * b22;
    const c20 = sx * b10 + cx * b20;
    const c21 = sx * b11 + cx * b21;
    const c22 = sx * b12 + cx * b22;
    const a = this.axes;
    a[0] = c00;
    a[1] = c10;
    a[2] = c20;
    a[3] = c01;
    a[4] = c11;
    a[5] = c21;
    a[6] = c02;
    a[7] = c12;
    a[8] = c22;
    const m = this.model;
    m[0] = c00;
    m[1] = c10;
    m[2] = c20;
    m[3] = 0;
    m[4] = c01;
    m[5] = c11;
    m[6] = c21;
    m[7] = 0;
    m[8] = c02;
    m[9] = c12;
    m[10] = c22;
    m[11] = 0;
    m[12] = p[X];
    m[13] = p[Y];
    m[14] = p[Z];
    m[15] = 1;
  }
}

const slotScratch = new Float64Array(4);

/** Do two cards (centre, in-plane angle) overlap on screen? Separating axes, flat cards. */
function overlaps(a: Card, b: Card, margin: number): boolean {
  const ca = Math.cos(a.p[RZ]);
  const sa = Math.sin(a.p[RZ]);
  const cb = Math.cos(b.p[RZ]);
  const sb = Math.sin(b.p[RZ]);
  const dx = b.p[X] - a.p[X];
  const dy = b.p[Y] - a.p[Y];
  // the four candidate axes: each card's x and y
  for (let i = 0; i < 4; i++) {
    let ux: number, uy: number;
    if (i === 0) (ux = ca), (uy = sa);
    else if (i === 1) (ux = -sa), (uy = ca);
    else if (i === 2) (ux = cb), (uy = sb);
    else (ux = -sb), (uy = cb);
    const ra = HALF_W * Math.abs(ca * ux + sa * uy) + HALF_H * Math.abs(-sa * ux + ca * uy);
    const rb = HALF_W * Math.abs(cb * ux + sb * uy) + HALF_H * Math.abs(-sb * ux + cb * uy);
    if (Math.abs(dx * ux + dy * uy) > ra + rb + margin) return false;
  }
  return true;
}

export class Deck {
  readonly cards: Card[] = [];
  /** Card ids by rank, front first. */
  readonly order: number[] = [];
  /** Card ids back to front (draw order). */
  readonly drawOrder: number[] = [];

  /** 0 stacked, 1 fanned (springs; goes past 1 a little when it overshoots). */
  fan = 0;
  /** How far apart fanned cards turn (rad): tighter on a portrait stage. */
  fanAngle = FAN_ANGLE;
  fanV = 0;
  fanGoal = 0;
  /** While the background is dragged, `fan` follows `fanTarget` tightly. */
  fanHeld = false;
  fanTarget = 0;

  /** The card under the pointer (-1: none) and where on it (-1…1, y up). */
  aimCard = -1;
  aimX = 0;
  aimY = 0;
  aimOn = false;
  aimAmt = 0;
  /** Tilt added to every resting card (keyboard aim, phone tilt, the tile's sway). */
  extraTx = 0;
  extraTy = 0;

  /** Where a thrown card's centre may go before the soft walls push back. */
  readonly bounds = new Float64Array([-2, 2, -1.4, 1.4]);

  events = 0;
  /** Speed of the last throw (units / s), for the whoosh. */
  throwSpeed = 0;
  time = 0;
  reduced = false;
  /** The deal on first view: seconds since it began, or -1. */
  introT = -1;
  /** Someone has handled the deck (the deal then leaves the fan alone). */
  touched = false;

  // the tile's self-play
  private autoT = 0;
  private autoNext = 2.4;
  private autoDir = 1;

  constructor() {
    for (let i = 0; i < COUNT; i++) {
      this.cards.push(new Card(i));
      this.order.push(i);
      this.drawOrder.push(i);
    }
    this.settle();
  }

  /** The slot for a rank at a fan amount: x, y, z, rz into `out`. */
  slot(rank: number, f: number, out: Float64Array) {
    const s = STACK[Math.min(rank, STACK.length - 1)];
    // below 0 (rubber band) the stack only squeezes a touch
    const t = f < 0 ? f * 0.15 : f;
    const c = COUNT - 1 - rank - (COUNT - 1) / 2;
    const a = -c * this.fanAngle;
    const fx = -FAN_PIVOT * Math.sin(a);
    const fy = FAN_PIVOT * (Math.cos(a) - 1);
    out[0] = s[0] + (fx - s[0]) * t;
    out[1] = s[1] + (fy - s[1]) * t;
    out[2] = -rank * (STACK_DZ + (FAN_DZ - STACK_DZ) * clamp(t, 0, 1.2));
    out[3] = s[2] + (a - s[2]) * t;
  }

  /** Put every card straight into its slot, at rest. */
  settle() {
    for (const card of this.cards) {
      card.mode = REST;
      card.hold = false;
      card.wait = 0;
      card.rank = card.pendingRank = this.order.indexOf(card.id);
      this.slot(card.rank, this.fan, slotScratch);
      card.p.fill(0);
      card.v.fill(0);
      card.p[X] = slotScratch[0];
      card.p[Y] = slotScratch[1];
      card.p[Z] = slotScratch[2];
      card.p[RZ] = slotScratch[3];
      card.p[FLIP] = card.g[FLIP] = Math.round(card.p[FLIP] / Math.PI) * Math.PI;
      card.updateBasis();
    }
    this.sortDraw();
  }

  /** Set the fan amount at once (still frames). */
  setFanNow(f: number) {
    this.fan = this.fanGoal = this.fanTarget = f;
    this.fanV = 0;
  }

  /**
   * The deal: the cards wait below the stage, rise one after the other into
   * a fan, hold it a moment and gather into the stack.
   */
  deal() {
    this.setFanNow(0);
    this.fanGoal = 1;
    this.introT = 0;
    for (let r = 0; r < COUNT; r++) {
      const card = this.cards[this.order[r]];
      card.mode = REST;
      card.p.fill(0);
      card.v.fill(0);
      card.p[X] = (r - 1) * 0.22;
      card.p[Y] = -1.75 - 0.08 * (COUNT - 1 - r);
      card.p[Z] = 0.18;
      card.p[RZ] = (1 - r) * 0.35;
      card.p[TX] = 0.75;
      card.hold = true;
      card.wait = 0.05 + 0.09 * (COUNT - 1 - r);
      card.rank = card.pendingRank = r;
      card.updateBasis();
    }
  }

  setFan(goal: number) {
    const g = goal >= 0.5 ? 1 : 0;
    this.touched = true;
    if (g !== this.fanGoal) this.events |= EV_FAN;
    this.fanGoal = g;
    if (this.reduced) this.setFanNow(g);
  }

  /** Begin dragging the background: `fanTarget` follows the hand from here. */
  holdFan() {
    this.fanHeld = true;
    this.fanTarget = this.fan;
    this.touched = true;
  }

  /** Let the fan go with a speed (fan units / s): it settles open or closed. */
  releaseFan(speed: number) {
    this.fanHeld = false;
    const projected = this.fan + speed * 0.18;
    const goal = projected >= 0.5 ? 1 : 0;
    if (goal !== this.fanGoal) this.events |= EV_FAN;
    this.fanGoal = goal;
    if (this.reduced) this.setFanNow(goal);
    else this.fanV = clamp(speed, -8, 8);
  }

  heldCard(): Card | null {
    for (const card of this.cards) if (card.mode === HELD) return card;
    return null;
  }

  /** Pick a card up at the world point (wx, wy) (on the plane of its face). */
  grab(id: number, wx: number, wy: number) {
    const card = this.cards[id];
    card.mode = HELD;
    card.hold = false;
    const ox = wx - card.p[X];
    const oy = wy - card.p[Y];
    const c = Math.cos(card.p[RZ]);
    const s = Math.sin(card.p[RZ]);
    card.hx = c * ox + s * oy;
    card.hy = -s * ox + c * oy;
    card.px = wx;
    card.py = wy;
    card.pvx = card.pvy = 0;
    this.touched = true;
    this.events |= EV_GRAB;
  }

  /** Where the finger is now (world) and how fast it moves (units / s). */
  drag(wx: number, wy: number, vx: number, vy: number) {
    const card = this.heldCard();
    if (!card) return;
    card.px = wx;
    card.py = wy;
    card.pvx = vx;
    card.pvy = vy;
  }

  /**
   * Let go of the held card with the hand's speed. A flick (or a card
   * dragged mostly off the deck) is thrown to the back; anything else
   * springs home with the momentum it has. Returns true for a throw.
   */
  release(vx: number, vy: number): boolean {
    const card = this.heldCard();
    if (!card) return false;
    this.slot(card.rank, this.fan, slotScratch);
    const dx = card.p[X] - slotScratch[0];
    const dy = card.p[Y] - slotScratch[1];
    const disp = Math.hypot(dx, dy);
    let speed = Math.hypot(vx, vy);
    const outward = disp > 1e-4 ? (vx * dx + vy * dy) / disp : 0;
    const flick = speed > 1.5 && (outward > -0.25 * speed || speed > 3.4);
    const away = disp > 0.62 * CARD_W && (speed > 0.25 || disp > 0.9 * CARD_W);
    if (!flick && !away) {
      card.mode = REST;
      return false;
    }
    // a slow card let go far out still gets a nudge on its way
    if (speed < 0.8 && disp > 1e-4) {
      vx += (dx / disp) * 0.8;
      vy += (dy / disp) * 0.8;
    }
    speed = Math.hypot(vx, vy);
    const cap = speed > 9 ? 9 / speed : 1;
    card.v[X] = vx * cap;
    card.v[Y] = vy * cap;
    // a push off-centre spins it: the lever arm crossed with the hand's speed
    const c = Math.cos(card.p[RZ]);
    const s = Math.sin(card.p[RZ]);
    const rx = c * card.hx - s * card.hy;
    const ry = s * card.hx + c * card.hy;
    card.v[RZ] = clamp(card.v[RZ] + (rx * card.v[Y] - ry * card.v[X]) * 1.6, -10, 10);
    card.v[BEND] += clamp(-(c * card.v[X] + s * card.v[Y]) * 0.5, -3, 3);
    this.launch(card, Math.min(speed, 9));
    return true;
  }

  /** Throw the front card to the back without a hand (keyboard, tile): `dir` ±1. */
  throwTop(dir: number) {
    const card = this.cards[this.order[0]];
    if (card.mode === HELD) return;
    this.touched = true;
    card.mode = FLY;
    card.v[X] = dir * 3.3;
    card.v[Y] = 1.05;
    card.v[RZ] = -dir * 3.4;
    card.v[BEND] = dir * 1.6;
    this.launch(card, 3.4);
  }

  private launch(card: Card, speed: number) {
    card.mode = FLY;
    card.flyT = 0;
    card.clearT = -1;
    card.landed = false;
    card.hold = false;
    this.throwSpeed = speed;
    this.events |= EV_THROW;
    this.toBack(card.id);
    if (this.reduced) {
      card.mode = REST;
      card.landed = true;
    }
  }

  /** Move a card to the back of the order; the others step forward one by one. */
  private toBack(id: number) {
    const order = this.order;
    let i = order.indexOf(id);
    for (; i < order.length - 1; i++) order[i] = order[i + 1];
    order[order.length - 1] = id;
    for (let r = 0; r < order.length; r++) {
      const card = this.cards[order[r]];
      if (card.id === id) {
        card.rank = card.pendingRank = r;
        card.wait = 0;
      } else if (card.pendingRank !== r || card.rank !== r) {
        card.pendingRank = r;
        card.wait = this.reduced ? 0 : 0.035 + 0.06 * r;
        if (this.reduced) card.rank = r;
      }
    }
  }

  /** Bring a card to the front (keyboard: pick from the fan). */
  toFront(id: number) {
    const order = this.order;
    let i = order.indexOf(id);
    if (i <= 0) return;
    for (; i > 0; i--) order[i] = order[i - 1];
    order[0] = id;
    for (let r = 0; r < order.length; r++) {
      const card = this.cards[order[r]];
      if (card.pendingRank === r && card.rank === r) continue;
      card.pendingRank = r;
      card.wait = this.reduced ? 0 : 0.02 + 0.05 * r;
      if (this.reduced) card.rank = r;
    }
    this.events |= EV_STEP;
  }

  /** Turn a card over (`dir` ±1 picks the way it turns). */
  flip(id: number, dir: number) {
    const card = this.cards[id];
    card.g[FLIP] = Math.round(card.g[FLIP] / Math.PI) * Math.PI + (dir >= 0 ? Math.PI : -Math.PI);
    card.flipping = true;
    card.v[BEND] += dir * 2.2;
    this.touched = true;
    this.events |= EV_FLIP;
    if (this.reduced) {
      card.p[FLIP] = card.g[FLIP];
      card.v[FLIP] = 0;
    }
  }

  /** The tile plays on its own: every few seconds the front card is tossed to the back. */
  auto(dt: number) {
    this.autoT += dt;
    if (this.autoT < this.autoNext) return;
    this.throwTop(this.autoDir);
    this.autoDir = -this.autoDir;
    this.autoNext = this.autoT + 5.4;
  }

  /** Step the deck by dt seconds. Returns true while anything moves. */
  step(dt: number): boolean {
    this.time += dt;
    let busy = false;
    const reduced = this.reduced;

    if (this.introT >= 0) {
      this.introT += dt;
      busy = true;
      if (this.introT > 1.9) {
        if (!this.touched && this.fanGoal === 1) {
          this.fanGoal = 0;
          this.events |= EV_FAN;
        }
        this.introT = -1;
      }
    }

    // the fan
    if (reduced) {
      this.fan = this.fanHeld ? this.fanTarget : this.fanGoal;
      this.fanV = 0;
    } else {
      const goal = this.fanHeld ? this.fanTarget : this.fanGoal;
      const k = this.fanHeld ? 700 : 120;
      const c = 2 * (this.fanHeld ? 1 : 0.68) * Math.sqrt(k);
      let left = dt;
      while (left > 1e-6) {
        const h = Math.min(STEP, left);
        this.fanV += (-k * (this.fan - goal) - c * this.fanV) * h;
        this.fan += this.fanV * h;
        left -= h;
      }
      if (Math.abs(this.fan - goal) > 1e-4 || Math.abs(this.fanV) > 1e-3) busy = true;
      else {
        this.fan = goal;
        this.fanV = 0;
      }
    }

    // the hover
    const aimGoal = this.aimOn ? 1 : 0;
    this.aimAmt = reduced ? aimGoal : this.aimAmt + (aimGoal - this.aimAmt) * (1 - Math.exp(-dt * 9));
    if (Math.abs(this.aimAmt - aimGoal) < 1e-3) this.aimAmt = aimGoal;
    else busy = true;

    const stackish = 1 - clamp(this.fan, 0, 1);
    const held = this.heldCard();
    let symX = 0;
    let symY = 0;
    if (held && held.rank === 0) {
      this.slot(0, this.fan, slotScratch);
      symX = (held.p[X] - slotScratch[0]) * stackish;
      symY = (held.p[Y] - slotScratch[1]) * stackish;
    }

    for (const card of this.cards) {
      const p = card.p;
      const v = card.v;
      const g = card.g;

      if (card.wait > 0) {
        card.wait -= dt;
        busy = true;
        if (card.wait <= 0) {
          card.wait = 0;
          if (card.hold) {
            card.hold = false;
            // the deal: thrown up from below
            v[Y] = 2.4;
          }
          if (card.rank !== card.pendingRank) this.events |= EV_STEP;
          card.rank = card.pendingRank;
        }
      }
      if (card.hold) continue;

      // goals: the slot, the hover, the sympathy with a held front card
      this.slot(card.rank, this.fan, slotScratch);
      g[X] = slotScratch[0];
      g[Y] = slotScratch[1];
      g[Z] = slotScratch[2];
      g[RZ] = slotScratch[3] + TAU * Math.round((p[RZ] - slotScratch[3]) / TAU);
      if (card.mode === REST) {
        if (held && held !== card && card.rank > 0) {
          const k = SYMPATHY[Math.min(card.rank, SYMPATHY.length - 1)];
          g[X] += symX * k;
          g[Y] += symY * k;
        }
        let weight = 0;
        if (this.aimCard >= 0) {
          const stackWeight = card.rank === 0 ? 1 : card.rank === 1 ? 0.85 : 0.72;
          weight = card.id === this.aimCard ? 1 : stackish * stackWeight;
        }
        const aim = this.aimAmt * weight;
        g[TX] = -this.aimY * MAX_TILT * aim + this.extraTx;
        g[TY] = this.aimX * MAX_TILT * aim + this.extraTy;
        g[Z] += HOVER_Z * this.aimAmt * (card.id === this.aimCard ? 1 : 0.4 * stackish);
        g[BEND] = 0;
      }
      // a card turning over lifts clear of its neighbours
      g[Z] += 0.14 * Math.abs(Math.sin(p[FLIP]));

      if (reduced) {
        this.snap(card);
        continue;
      }

      let left = dt;
      while (left > 1e-6) {
        const h = Math.min(STEP, left);
        left -= h;
        if (card.mode === HELD) this.stepHeld(card, h);
        else if (card.mode === FLY) this.stepFly(card, h);
        else
          for (let d = 0; d < DOF; d++) {
            const k = d < 2 ? K[d] * (1 - 0.1 * card.rank) : K[d];
            const c = 2 * ZETA[d] * Math.sqrt(k);
            v[d] += (-k * (p[d] - g[d]) - c * v[d]) * h;
            p[d] += v[d] * h;
          }
      }

      if (card.mode === FLY) {
        card.flyT += dt;
        this.flight(card);
      }

      // the flip lands
      if (card.flipping && Math.abs(p[FLIP] - g[FLIP]) < 0.12) {
        card.flipping = false;
        this.events |= EV_FLIP_LAND;
      }

      if (card.mode !== REST) busy = true;
      else {
        let moving = false;
        for (let d = 0; d < DOF; d++) {
          if (Math.abs(p[d] - g[d]) > 2e-4 || Math.abs(v[d]) > 2e-3) {
            moving = true;
            break;
          }
        }
        if (moving) busy = true;
        else
          for (let d = 0; d < DOF; d++) {
            p[d] = g[d];
            v[d] = 0;
          }
      }
    }

    for (const card of this.cards) card.updateBasis();
    this.sortDraw();
    return busy;
  }

  /** Reduced motion: everything at its goal at once (a held card stays under the hand). */
  private snap(card: Card) {
    const p = card.p;
    const v = card.v;
    const g = card.g;
    if (card.mode === HELD) {
      const c = Math.cos(p[RZ]);
      const s = Math.sin(p[RZ]);
      p[X] = card.px - (c * card.hx - s * card.hy);
      p[Y] = card.py - (s * card.hx + c * card.hy);
      p[Z] = HOLD_Z;
      p[TX] = p[TY] = p[BEND] = 0;
      p[FLIP] = g[FLIP];
      v.fill(0);
      return;
    }
    if (card.mode === FLY) {
      card.mode = REST;
      this.events |= EV_LAND;
    }
    for (let d = 0; d < DOF; d++) {
      p[d] = g[d];
      v[d] = 0;
    }
    p[TX] = p[TY] = p[BEND] = 0;
    card.flipping = false;
  }

  /** One substep of a held card: hanging off the grab point. */
  private stepHeld(card: Card, h: number) {
    const p = card.p;
    const v = card.v;
    const g = card.g;
    const c = Math.cos(p[RZ]);
    const s = Math.sin(p[RZ]);
    const rx = c * card.hx - s * card.hy;
    const ry = s * card.hx + c * card.hy;
    const gvx = v[X] - v[RZ] * ry;
    const gvy = v[Y] + v[RZ] * rx;
    const fx = K_GRAB * (card.px - (p[X] + rx)) - C_GRAB * (gvx - card.pvx);
    const fy = K_GRAB * (card.py - (p[Y] + ry)) - C_GRAB * (gvy - card.pvy);
    const torque = rx * fy - ry * fx - MU_SPIN_HELD * v[RZ] - K_STRAIGHTEN * (p[RZ] - g[RZ]);
    v[X] += (fx - MU_HELD * v[X]) * h;
    v[Y] += (fy - MU_HELD * v[Y]) * h;
    v[RZ] += (torque / INERTIA) * h;
    p[X] += v[X] * h;
    p[Y] += v[Y] * h;
    p[RZ] += v[RZ] * h;
    // lifted toward you, leaning into where it goes, bowing a little
    g[Z] = HOLD_Z + 0.14 * Math.abs(Math.sin(p[FLIP]));
    g[TX] = clamp(-v[Y] * 0.075, -0.42, 0.42);
    g[TY] = clamp(v[X] * 0.075, -0.42, 0.42);
    g[BEND] = clamp(-(c * v[X] + s * v[Y]) * 0.045, -0.3, 0.3);
    for (let d = Z; d < DOF; d++) {
      if (d === RZ) continue;
      const k = K[d];
      const cc = 2 * ZETA[d] * Math.sqrt(k);
      v[d] += (-k * (p[d] - g[d]) - cc * v[d]) * h;
      p[d] += v[d] * h;
    }
  }

  /** One substep of a thrown card. */
  private stepFly(card: Card, h: number) {
    const p = card.p;
    const v = card.v;
    const g = card.g;
    const clear = card.clearT >= 0;
    const ramp = clear ? smooth01((card.flyT - card.clearT) / 0.35) : 0;
    let ax = -MU_AIR * v[X];
    let ay = -MU_AIR * v[Y];
    // soft walls at the stage edges
    const b = this.bounds;
    if (p[X] < b[0]) ax += -K_WALL * (p[X] - b[0]) - C_WALL * v[X];
    else if (p[X] > b[1]) ax += -K_WALL * (p[X] - b[1]) - C_WALL * v[X];
    if (p[Y] < b[2]) ay += -K_WALL * (p[Y] - b[2]) - C_WALL * v[Y];
    else if (p[Y] > b[3]) ay += -K_WALL * (p[Y] - b[3]) - C_WALL * v[Y];
    if (clear) {
      ax += ramp * (-K_HOME * (p[X] - g[X]) - C_HOME * v[X]);
      ay += ramp * (-K_HOME * (p[Y] - g[Y]) - C_HOME * v[Y]);
    } else if (card.flyT > 0.2) {
      // still over the deck after a slow throw: ease it out of the way
      const dx = p[X];
      const dy = p[Y] - 0.03;
      const len = Math.hypot(dx, dy) || 1;
      ax += (dx / len) * 7;
      ay += (dy / len) * 7;
    }
    v[X] += ax * h;
    v[Y] += ay * h;
    p[X] += v[X] * h;
    p[Y] += v[Y] * h;
    // spin glides on, then winds to the slot's angle
    if (clear) {
      const k = K[RZ] * 0.6 * ramp;
      v[RZ] += (-k * (p[RZ] - g[RZ]) - (2 * 0.8 * Math.sqrt(K[RZ] * 0.6) * ramp + MU_SPIN) * v[RZ]) * h;
    } else v[RZ] -= MU_SPIN * v[RZ] * h;
    p[RZ] += v[RZ] * h;
    // high while it is over the deck, behind once it is clear
    if (!clear) g[Z] = FLY_Z + 0.14 * Math.abs(Math.sin(p[FLIP]));
    const lean = 1 - ramp * 0.7;
    g[TX] = clamp(-v[Y] * 0.06, -0.45, 0.45) * lean;
    g[TY] = clamp(v[X] * 0.06, -0.45, 0.45) * lean;
    g[BEND] = 0;
    for (let d = Z; d < DOF; d++) {
      if (d === RZ) continue;
      const k = d === Z ? 240 : K[d];
      const cc = 2 * (d === Z ? 0.9 : ZETA[d]) * Math.sqrt(k);
      v[d] += (-k * (p[d] - g[d]) - cc * v[d]) * h;
      p[d] += v[d] * h;
    }
  }

  /** After a flying card's substeps: is it clear of the deck yet, has it landed. */
  private flight(card: Card) {
    const p = card.p;
    const v = card.v;
    const g = card.g;
    if (card.clearT < 0) {
      let blocked = false;
      for (const other of this.cards) {
        if (other === card || other.hold) continue;
        if (overlaps(card, other, 0.01)) {
          blocked = true;
          break;
        }
      }
      if (!blocked || card.flyT > 1.4) {
        card.clearT = card.flyT;
        this.events |= EV_CLEAR;
      }
      return;
    }
    const dist = Math.hypot(p[X] - g[X], p[Y] - g[Y]);
    if (!card.landed && dist < 0.035 && card.flyT - card.clearT > 0.15) {
      card.landed = true;
      this.events |= EV_LAND;
    }
    if (dist < 0.012 && Math.hypot(v[X], v[Y]) < 0.2 && Math.abs(p[Z] - g[Z]) < 0.01 && card.flyT - card.clearT > 0.35) {
      card.mode = REST;
      if (!card.landed) {
        card.landed = true;
        this.events |= EV_LAND;
      }
    }
  }

  private sortDraw() {
    const order = this.drawOrder;
    const cards = this.cards;
    for (let i = 1; i < order.length; i++) {
      const id = order[i];
      const z = cards[id].p[Z];
      let j = i - 1;
      while (j >= 0 && cards[order[j]].p[Z] > z) {
        order[j + 1] = order[j];
        j--;
      }
      order[j + 1] = id;
    }
  }
}
