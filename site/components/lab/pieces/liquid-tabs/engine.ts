// The liquid: a drop that lives on one line (the centre line of the
// channel). The engine moves it and describes it as a handful of
// horizontal capsules (`prims`); profile.ts turns those into the drop's
// outline. No imports and no allocations after construction, so it can be
// stepped every frame (and run headless for tuning).
//
// The model, in the order things happen on a jump
// - At rest the drop is one body (the "head") sized to its slot: a pill of
//   the slot's width and the channel's height.
// - A jump seeds a second body. The old drop becomes the "tail" (all the
//   mass, where it was) and a massless head leaves it on a spring toward
//   the new slot, keeping whatever velocity it had. Mass flows from tail to
//   head through a bridge, so the drop first stretches into a teardrop
//   reaching for the target.
// - The bridge thins as it is pulled (a parabolic neck), slowly at first
//   and then all at once, the way a stretched liquid thread runs away to
//   its pinch. The thinner the neck, the less liquid gets through, so on a
//   long jump a good part of the drop is still behind when it breaks: two
//   threads snap back into the bodies, a tiny satellite bead is left where
//   it broke, and the flow stops.
// - The tail is pulled along by the bridge while it holds (hard, once the
//   head has landed: a string that didn't break is reeled back in) and
//   chases the head once it's free; when they touch they rejoin and the
//   rest drains into the head quickly. Its momentum nudges the head, so the
//   merge sloshes. Satellites chase whichever body is nearer and drain in
//   too. Mass is conserved exactly, so the drop always lands at its slot's
//   size.
// - The head's shape follows its motion through two under-damped springs:
//   "stretch" (longer and thinner with speed, shorter and taller as it
//   stops: the wobble) and "lean" (mass sloshing to the front as it
//   brakes: a teardrop, the convex hull of a larger and a smaller end).
//   The end walls of the channel squash it and push it back.
// - A finger on the drop swells it (pressed), a hover makes it reach
//   toward the hovered slot, and while dragging the head follows the finger
//   on a stiff spring; letting go picks the slot the throw is heading for.
//
// Every force is integrated in fixed 1/240 s substeps (semi-implicit
// Euler), so the motion is the same at any frame rate, and nothing ever
// resets a velocity when its target changes: a jump interrupted by another,
// or a drag that catches the drop mid-flight, continues from exactly where
// the liquid is.

export type MaterialId = "ink" | "mercury" | "water";

/** How a liquid moves. */
export type Feel = {
  /** Head toward its slot and toward a finger: [stiffness, damping]. */
  head: [number, number];
  drag: [number, number];
  /** Mass flow tail → head through a full bridge (1/s), and once rejoined. */
  flow: number;
  rejoin: number;
  /** Bridge pull on the tail (1/s²) and the free tail's chase spring. */
  tension: number;
  chase: [number, number];
  /** How far the bridge stretches before it breaks (× H, for a heavy tail; a light one lets go sooner). */
  breakLen: number;
  /** Satellite bead left at a pinch (fraction of the drop's mass; 0 for none). */
  satellite: number;
  /** Longest stretch with speed (fraction of the length) and the speed that reaches it (H/s). */
  stretch: number;
  stretchSpeed: number;
  /** Shape springs: stretch / wobble and lean: [stiffness, damping]. */
  wobble: [number, number];
  lean: [number, number];
  /** Rolling-ball radius of the smooth union (× H): how far apart drops still bridge. */
  blend: number;
  /** Seconds the floor stays wet (0: this liquid doesn't wet the floor). */
  dry: number;
};

export const FEELS: Record<MaterialId, Feel> = {
  // Ink: a little syrupy. Long jumps string out, neck and pinch; the
  // remnant catches up and the landing sloshes.
  ink: {
    head: [150, 18],
    drag: [900, 52],
    flow: 9,
    rejoin: 30,
    tension: 52,
    chase: [95, 14],
    breakLen: 2.5,
    satellite: 0.014,
    stretch: 0.3,
    stretchSpeed: 26,
    wobble: [300, 11],
    lean: [240, 19],
    blend: 0.3,
    dry: 0.55,
  },
  // Mercury: huge surface tension. It beads up, pinches early into round
  // drops that roll, and its wobble is small and quick. It never wets.
  mercury: {
    head: [190, 21],
    drag: [1100, 60],
    flow: 13,
    rejoin: 36,
    tension: 110,
    chase: [130, 17],
    breakLen: 1.5,
    satellite: 0.02,
    stretch: 0.18,
    stretchSpeed: 30,
    wobble: [520, 13],
    lean: [420, 17],
    blend: 0.24,
    dry: 0,
  },
  // Water: thin and lively. Strings break into beads easily and the drop
  // keeps jiggling after it lands.
  water: {
    head: [165, 15],
    drag: [850, 44],
    flow: 10,
    rejoin: 28,
    tension: 80,
    chase: [90, 12],
    breakLen: 2.0,
    satellite: 0.018,
    stretch: 0.38,
    stretchSpeed: 24,
    wobble: [240, 6],
    lean: [190, 11],
    blend: 0.34,
    dry: 0.5,
  },
};

/** One slot along the channel: where the drop sits when it's chosen (bar-local CSS px). */
export type Slot = { x0: number; x1: number };

export type LiquidLayout = {
  slots: readonly Slot[];
  /** The drop's rest height (CSS px). */
  height: number;
  /** Extra half-height the channel allows (squash, press). */
  room: number;
  /** Where the liquid may go along the channel (inner ends, CSS px). */
  min: number;
  max: number;
};

export type LiquidEventType = "pinch" | "join" | "land" | "cross" | "wall";
export type LiquidEvent = { type: LiquidEventType; x: number; strength: number; index: number };

/**
 * Capsules for the outline: (a, b, ra, rb, curve) each. curve 0 tapers the
 * radius between two end circles (threads, beads), 1 eases it, 2 is the
 * convex hull of the end circles (bodies), and 3 + n is a bridge: a taper
 * pinched in the middle by n (0..1), with no end circles of its own.
 */
export const PRIM_STRIDE = 5;
export const MAX_PRIMS = 12;

const SUB = 1 / 240;
const MAX_EVENTS = 8;
const EPS_MASS = 0.004;

class Body {
  x = 0;
  v = 0;
  m = 0;
  on = false;
  /** The slot width this body is sized for (eases between slots). */
  W = 0;
  /** Drawn shape (CSS px): length, height, lean (right end fuller when > 0). */
  w = 0;
  h = 0;
  lean = 0;
  copy(o: Body) {
    this.x = o.x;
    this.v = o.v;
    this.m = o.m;
    this.on = o.on;
    this.W = o.W;
    this.w = o.w;
    this.h = o.h;
    this.lean = o.lean;
  }
}

/** A thread left by a pinch, snapping back into the body it hangs from. */
type Thread = { on: boolean; body: 0 | 1; dir: number; len: number; r: number };
type Bead = { on: boolean; x: number; v: number; m: number };
type Caps = { a: number; b: number; ra: number; rb: number };

/** A damped spring on one number (a local copy, so the engine has no imports). */
class Osc {
  value = 0;
  velocity = 0;
  target = 0;
  k: number;
  c: number;
  constructor(k: number, c: number) {
    this.k = k;
    this.c = c;
  }
  step(h: number) {
    const a = -this.k * (this.value - this.target) - this.c * this.velocity;
    this.velocity += a * h;
    this.value += this.velocity * h;
  }
  get quiet() {
    return Math.abs(this.value - this.target) < 1e-3 && Math.abs(this.velocity) < 1e-2;
  }
  set(value: number) {
    this.value = this.target = value;
    this.velocity = 0;
  }
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export class Liquid {
  layout: LiquidLayout = { slots: [{ x0: 0, x1: 100 }], height: 40, room: 4, min: 0, max: 100 };
  feel: Feel = FEELS.ink;

  /** The selected slot (what the control reports). */
  index = 0;
  readonly head = new Body();
  readonly tail = new Body();
  connected = false;
  /** Rejoined after a pinch: drains at the rejoin rate. */
  private rejoined = false;

  readonly threads: Thread[] = [
    { on: false, body: 0, dir: 1, len: 0, r: 0 },
    { on: false, body: 1, dir: -1, len: 0, r: 0 },
  ];
  readonly beads: Bead[] = [
    { on: false, x: 0, v: 0, m: 0 },
    { on: false, x: 0, v: 0, m: 0 },
  ];
  private nextBead = 0;

  /** Where the head is going (slot centre) and the width it will have there. */
  target = 50;
  targetW = 100;
  dragging = false;
  dragX = 0;
  /** Pressed (0..1), hover reach (CSS px, signed), and the two shape springs. */
  readonly press = new Osc(320, 26);
  readonly reach = new Osc(260, 18);
  readonly stretch = new Osc(300, 9);
  readonly lean = new Osc(240, 12);
  private landed = true;
  /** The slot under a hovering mouse (-1: none), so a new pick re-aims the reach. */
  private hovered = -1;
  private lastV = 0;
  private accel = 0;
  /** Every move lands at once (reduced motion). */
  instant = false;

  /** A ripple across the head's surface after a merge: origin (CSS px), age (s), amplitude. */
  readonly ripple = { x: 0, age: 10, amp: 0 };

  readonly prims = new Float32Array(MAX_PRIMS * PRIM_STRIDE);
  primCount = 0;

  readonly events: LiquidEvent[] = Array.from({ length: MAX_EVENTS }, () => ({ type: "land" as LiquidEventType, x: 0, strength: 0, index: 0 }));
  eventCount = 0;

  private readonly capsH: Caps = { a: 0, b: 0, ra: 0, rb: 0 };
  private readonly capsT: Caps = { a: 0, b: 0, ra: 0, rb: 0 };

  /* ------------------------------------------------------------------ */
  /* setup                                                               */
  /* ------------------------------------------------------------------ */

  setFeel(feel: Feel) {
    this.feel = feel;
    this.stretch.k = feel.wobble[0];
    this.stretch.c = feel.wobble[1];
    this.lean.k = feel.lean[0];
    this.lean.c = feel.lean[1];
  }

  /** New geometry (first layout or a resize): the drop rests on its slot at once. */
  setLayout(layout: LiquidLayout) {
    this.layout = layout;
    this.rest(Math.min(this.index, layout.slots.length - 1));
  }

  get count() {
    return this.layout.slots.length;
  }

  slotCentre(i: number) {
    const s = this.layout.slots[i];
    return (s.x0 + s.x1) / 2;
  }

  slotWidth(i: number) {
    const s = this.layout.slots[i];
    return s.x1 - s.x0;
  }

  /** The slot under a point. */
  slotAt(x: number): number {
    const slots = this.layout.slots;
    for (let i = 0; i < slots.length; i++) if (x < slots[i].x1) return i;
    return slots.length - 1;
  }

  /** Slot width, eased between slot centres (for a drop between slots). */
  widthAt(x: number): number {
    const n = this.layout.slots.length;
    if (x <= this.slotCentre(0)) return this.slotWidth(0);
    for (let i = 0; i < n - 1; i++) {
      const c0 = this.slotCentre(i);
      const c1 = this.slotCentre(i + 1);
      if (x <= c1) {
        const t = (x - c0) / Math.max(1e-3, c1 - c0);
        const s = t * t * (3 - 2 * t);
        return this.slotWidth(i) + (this.slotWidth(i + 1) - this.slotWidth(i)) * s;
      }
    }
    return this.slotWidth(n - 1);
  }

  /** Everything at rest on slot `i`, nothing moving. */
  rest(i: number) {
    this.index = i;
    this.target = this.slotCentre(i);
    this.targetW = this.slotWidth(i);
    const h = this.head;
    h.on = true;
    h.x = this.target;
    h.v = 0;
    h.m = 1;
    h.W = this.targetW;
    this.tail.on = false;
    this.tail.m = 0;
    this.connected = false;
    for (const t of this.threads) t.on = false;
    for (const b of this.beads) b.on = false;
    this.stretch.set(0);
    this.lean.set(0);
    this.reach.set(0);
    this.lastV = 0;
    this.accel = 0;
    this.landed = true;
    this.dragging = false;
    this.ripple.age = 10;
    this.shape();
    this.build();
  }

  /* ------------------------------------------------------------------ */
  /* input                                                               */
  /* ------------------------------------------------------------------ */

  /** Split the drop so a fresh head can leave it (they coincide, so nothing jumps). */
  private seed() {
    const h = this.head;
    const t = this.tail;
    // A tail still catching up keeps chasing; the head is simply retargeted.
    if (t.on && t.m > 0.12) return;
    if (t.on) {
      h.m += t.m;
      t.on = false;
    }
    t.copy(h);
    t.on = true;
    h.m = 0;
    this.connected = true;
    this.rejoined = false;
  }

  /** Choose slot `i`. Returns whether the selection changed. */
  select(i: number): boolean {
    i = Math.max(0, Math.min(this.count - 1, i));
    const changed = i !== this.index;
    this.index = i;
    if (this.instant) {
      this.rest(i);
      return changed;
    }
    const target = this.slotCentre(i);
    if (!this.dragging && Math.abs(target - this.head.x) > this.layout.height * 0.6) this.seed();
    this.target = target;
    this.targetW = this.slotWidth(i);
    this.landed = false;
    this.hover(this.hovered);
    return changed;
  }

  /** A finger takes the drop at `x` (anywhere: the drop comes to it). */
  grab(x: number) {
    this.dragging = true;
    this.dragX = x;
    this.reach.target = 0;
    if (this.instant) return;
    if (Math.abs(x - this.head.x) > this.layout.height * 0.6) this.seed();
    this.landed = false;
  }

  /** The finger moves; returns whether the slot under the drop changed. */
  drag(x: number): boolean {
    const L = this.layout;
    this.dragX = Math.max(L.min - L.height, Math.min(L.max + L.height, x));
    const i = this.slotAt(this.instant ? this.dragX : this.head.x);
    if (i === this.index) return false;
    if (this.instant) {
      this.rest(i);
      this.dragging = true;
    } else {
      this.index = i;
    }
    this.emit("cross", this.head.x, Math.min(1, Math.abs(this.head.v) / (L.height * 20)), i);
    return true;
  }

  /** The finger lets go: settle on the slot the throw is heading for, which is returned. */
  release(): number {
    this.dragging = false;
    const L = this.layout;
    const i = this.slotAt(Math.max(L.min, Math.min(L.max, this.head.x + this.head.v * 0.11)));
    this.index = i;
    if (this.instant) {
      this.rest(i);
      return i;
    }
    this.target = this.slotCentre(i);
    this.targetW = this.slotWidth(i);
    this.landed = false;
    this.hover(this.hovered);
    return i;
  }

  setPressed(on: boolean) {
    this.press.target = on ? 1 : 0;
    if (this.instant) this.press.set(this.press.target);
  }

  /** Reach toward a hovered slot (-1, or the selected one, to stop). */
  hover(i: number) {
    this.hovered = i;
    if (i < 0 || i === this.index || this.dragging || this.instant) {
      this.reach.target = 0;
      return;
    }
    const dir = Math.sign(this.slotCentre(i) - this.slotCentre(this.index));
    const near = Math.abs(i - this.index) === 1 ? 1 : 0.72;
    this.reach.target = dir * this.layout.height * 0.2 * near;
  }

  /* ------------------------------------------------------------------ */
  /* stepping                                                            */
  /* ------------------------------------------------------------------ */

  private emit(type: LiquidEventType, x: number, strength: number, index = this.index) {
    if (this.eventCount >= MAX_EVENTS) return;
    const e = this.events[this.eventCount++];
    e.type = type;
    e.x = x;
    e.strength = strength;
    e.index = index;
  }

  /** Area of the whole drop sized for width W (a stadium W × H). */
  private fullArea(W: number) {
    const H = this.layout.height;
    return (Math.max(W, H) - H) * H + (Math.PI * H * H) / 4;
  }

  /** Length and height of a body of mass m sized for W (before stretch and walls). */
  private sizeOf(m: number, W: number, out: Body) {
    const H = this.layout.height;
    const area = Math.max(0, m) * this.fullArea(W);
    let h = Math.sqrt((4 * area) / Math.PI);
    let w = h;
    if (h > H) {
      h = H;
      w = (area - (Math.PI * H * H) / 4) / H + H;
    }
    out.w = w;
    out.h = h;
  }

  /** Gap between the facing edges of head and tail (negative while they overlap). */
  gap(): number {
    return Math.abs(this.head.x - this.tail.x) - (this.head.w + this.tail.w) / 2;
  }

  /** Radius of a body's end facing `dir` (+1: right). */
  private facingRadius(b: Body, dir: number) {
    return (b.h / 2) * Math.max(0.3, Math.min(1.3, 1 + dir * b.lean));
  }

  /**
   * How pinched the bridge is: 0 (a straight cone) … 1 (broken). It grows
   * with the bridge's free length against the length this liquid holds,
   * slowly at first and fast at the end.
   */
  neck(): number {
    const H = this.layout.height;
    const g = this.gap();
    if (g <= 0) return 0;
    const heavy = clamp01(this.tail.m / 0.4);
    const hold = this.feel.breakLen * H * (0.55 + 0.45 * Math.sqrt(heavy));
    const u = clamp01(g / hold);
    return Math.pow(u, 1.35);
  }

  /** Advance by dt seconds. Returns true while anything is still moving. */
  step(dt: number): boolean {
    this.eventCount = 0;
    let remaining = Math.min(Math.max(0, dt), 0.1);
    while (remaining > 1e-6) {
      const h = Math.min(SUB, remaining);
      this.substep(h);
      remaining -= h;
    }
    this.ripple.age += dt;
    this.shape();
    this.build();
    return !this.settled();
  }

  /** How far a body of length w pokes past an end wall (signed push back). */
  private wall(x: number, w: number): number {
    const L = this.layout;
    const over = x + w / 2 - L.max;
    if (over > 0) return -over;
    const under = L.min - (x - w / 2);
    if (under > 0) return under;
    return 0;
  }

  private substep(dt: number) {
    const f = this.feel;
    const H = this.layout.height;
    const head = this.head;
    const tail = this.tail;

    // Head: toward the finger or the slot, pushed back by the end walls.
    const [k, c] = this.dragging ? f.drag : f.head;
    const goal = this.dragging ? this.dragX : this.target;
    const before = head.x - this.target;
    // the pull saturates, so a long jump travels (and strings out) instead of teleporting
    const reachMax = this.dragging ? H * 6 : H * 4;
    const pull = Math.max(-reachMax, Math.min(reachMax, goal - head.x));
    let a = k * pull - c * head.v;
    const push = this.wall(head.x, head.w);
    if (push !== 0) a += 2600 * push - (Math.sign(push) !== Math.sign(head.v) ? 24 * head.v : 0);
    head.v += a * dt;
    head.x += head.v * dt;
    const wantW = this.dragging ? this.widthAt(head.x) : this.targetW;
    head.W += (wantW - head.W) * (1 - Math.exp(-14 * dt));

    // Landing: the first time it crosses its slot centre (or comes to rest on it).
    if (!this.landed && !this.dragging) {
      const after = head.x - this.target;
      if ((before !== 0 && Math.sign(after) !== Math.sign(before)) || Math.abs(after) < Math.max(2, head.W * 0.05)) {
        this.landed = true;
        this.emit("land", head.x, Math.min(1, Math.abs(head.v) / (H * 30)), this.index);
      }
    }
    if (push !== 0 && Math.abs(head.v) > H * 8 && Math.sign(head.v) !== Math.sign(push)) {
      this.emit("wall", head.x, Math.min(1, Math.abs(head.v) / (H * 30)));
    }

    // Tail: dragged by the bridge, or chasing the head once free.
    if (tail.on) {
      let at: number;
      if (this.connected && this.rejoined) {
        // merging: it's pulled into the head and carried along with it
        at = f.chase[0] * 1.5 * (head.x - tail.x) - 30 * (tail.v - head.v);
      } else if (this.connected) {
        // once the head has landed, surface tension reels the rest in
        const n = this.neck();
        const reel = this.landed && !this.dragging ? 3.2 : 1;
        at = f.tension * reel * (1 - n) * (head.x - tail.x) - (reel > 1 ? 17 : 9) * tail.v;
      } else {
        at = f.chase[0] * (head.x - tail.x) - f.chase[1] * (tail.v - head.v * 0.4);
      }
      const tp = this.wall(tail.x, tail.w);
      if (tp !== 0) at += 2600 * tp;
      tail.v += at * dt;
      tail.x += tail.v * dt;
      tail.W += (head.W - tail.W) * (1 - Math.exp(-3 * dt));

      const gap = this.gap();
      if (this.connected) {
        const n = this.neck();
        const inside = Math.abs(head.x - tail.x) + tail.w / 2 <= head.w / 2 + 0.5;
        // a small remnant is swallowed faster (surface tension wins), but
        // a thinning neck lets less and less through, so a long jump keeps
        // a real drop behind until it breaks
        const small = 1 + 3 * Math.max(0, 1 - tail.m / 0.25);
        const open = (1 - n) * (1 - n);
        const rate = inside ? f.rejoin * 1.6 * small : this.rejoined ? f.rejoin * small : f.flow * open * (1 + 2 * Math.max(0, 1 - tail.m / 0.12) * open);
        const dm = tail.m * (1 - Math.exp(-rate * dt));
        tail.m -= dm;
        head.m += dm;
        if (n >= 0.985 && gap > 0) this.pinch(gap);
      } else if (gap < H * 0.04) {
        // touching again: they rejoin, and the tail's momentum sloshes the head
        this.connected = true;
        this.rejoined = true;
        const rel = tail.v - head.v;
        const share = tail.m / Math.max(1e-3, tail.m + head.m);
        head.v += rel * share * 0.22;
        const side = Math.sign(tail.x - head.x);
        this.lean.velocity += side * Math.min(5, (Math.abs(rel) / H) * 0.25) * share;
        this.stretch.velocity -= Math.min(4, (Math.abs(rel) / H) * 0.2) * share;
        this.ripple.x = head.x + side * head.w * 0.4;
        this.ripple.age = 0;
        this.ripple.amp = Math.min(1, share * 2 + 0.3);
        this.emit("join", (head.x + tail.x) / 2, Math.min(1, (Math.abs(rel) / (H * 18)) * 0.6 + share));
      }
      if (tail.m < EPS_MASS) {
        head.m += tail.m;
        tail.m = 0;
        tail.on = false;
        this.connected = false;
      }
    } else {
      // no tail: the head holds everything but the beads still on their
      // way in (so the drop is exactly its slot's size once they land)
      let loose = 0;
      for (const bead of this.beads) if (bead.on) loose += bead.m;
      head.m = 1 - loose;
    }

    // Satellites: chase the nearer body and drain into it on contact.
    for (const bead of this.beads) {
      if (!bead.on) continue;
      const body = tail.on && Math.abs(tail.x - bead.x) < Math.abs(head.x - bead.x) ? tail : head;
      const ab = f.chase[0] * 1.7 * (body.x - bead.x) - f.chase[1] * 1.3 * (bead.v - body.v * 0.5);
      bead.v += ab * dt;
      bead.x += bead.v * dt;
      if (Math.abs(body.x - bead.x) - body.w / 2 - this.beadRadius(bead.m) < 0) {
        const dm = bead.m * (1 - Math.exp(-26 * dt));
        bead.m -= dm;
        body.m += dm;
        if (bead.m < 0.0006) {
          body.m += bead.m;
          bead.on = false;
        }
      }
    }

    // Threads snap back.
    for (const th of this.threads) {
      if (!th.on) continue;
      th.len *= Math.exp(-dt / 0.018);
      if (th.len < 1.2) th.on = false;
    }

    // Shape springs: stretch with speed, lean as it brakes, press, reach.
    const speed = Math.min(1, Math.abs(head.v) / (H * f.stretchSpeed));
    // a finger drags the drop out a little longer than its own run does
    this.stretch.target = speed * f.stretch * (this.dragging ? 1.35 : 1);
    this.stretch.step(dt);
    const acc = (head.v - this.lastV) / dt;
    this.lastV = head.v;
    this.accel += (acc - this.accel) * (1 - Math.exp(-dt / 0.03));
    // a sliding drop is a teardrop, round in front; braking throws mass forward too
    const run = Math.sign(head.v) * Math.sqrt(speed) * 0.1;
    this.lean.target = Math.max(-0.2, Math.min(0.2, run - this.accel / (H * 1100)));
    this.lean.step(dt);
    this.press.step(dt);
    this.reach.step(dt);
  }

  private beadRadius(m: number) {
    return Math.sqrt((m * this.fullArea(this.head.W)) / Math.PI);
  }

  private pinch(gap: number) {
    const head = this.head;
    const tail = this.tail;
    this.connected = false;
    const dir = Math.sign(head.x - tail.x) || 1;
    const r = Math.max(0.8, Math.min(head.h, tail.h) * 0.06);
    const t0 = this.threads[0];
    t0.on = true;
    t0.body = 0;
    t0.dir = -dir;
    t0.len = gap * 0.45;
    t0.r = r;
    const t1 = this.threads[1];
    t1.on = true;
    t1.body = 1;
    t1.dir = dir;
    t1.len = gap * 0.45;
    t1.r = r;
    // the satellite: a bead where it broke, carried on at the thread's speed
    const sat = this.feel.satellite;
    if (sat > 0 && tail.m > sat * 2) {
      const bead = this.beads[this.nextBead];
      this.nextBead = (this.nextBead + 1) % this.beads.length;
      if (bead.on) head.m += bead.m;
      bead.on = true;
      bead.x = tail.x + dir * (tail.w / 2 + gap * 0.5);
      bead.v = (head.v + tail.v) * 0.5;
      bead.m = sat;
      tail.m -= sat;
    }
    this.emit("pinch", (head.x + tail.x) / 2, Math.min(1, 0.4 + Math.abs(head.v - tail.v) / (this.layout.height * 40)));
  }

  /** Drawn sizes of the bodies from their mass, speed, lean and the walls. */
  private shape() {
    const L = this.layout;
    const H = L.height;
    const head = this.head;
    const tail = this.tail;
    const press = Math.max(0, this.press.value);

    this.sizeOf(head.m, head.W, head);
    // stretch: longer and thinner (area kept); squash: shorter and taller, up to the room
    const s = Math.max(0.7, 1 + this.stretch.value);
    let w = head.w * s;
    let hh = head.h / s;
    hh *= 1 + press * (L.room / H) * 1.5;
    w *= 1 + press * 0.035;
    const maxH = H + L.room * 2 * 0.86;
    if (hh > maxH) {
      w *= hh / maxH;
      hh = maxH;
    }
    // the end walls squash it
    const cut = Math.max(0, head.x + w / 2 - L.max) + Math.max(0, L.min - (head.x - w / 2));
    if (cut > 0) {
      const nw = Math.max(hh * 0.7, w - cut * 0.85);
      hh = Math.min(maxH, hh * Math.sqrt(w / nw));
      w = nw;
    }
    head.w = Math.max(w, hh);
    head.h = hh;
    head.lean = Math.max(-0.2, Math.min(0.2, this.lean.value));

    if (tail.on) {
      this.sizeOf(tail.m, tail.W, tail);
      // a free tail racing to catch up is a teardrop, its bulb in front
      const sp = Math.min(1, Math.abs(tail.v) / (H * this.feel.stretchSpeed));
      const ts = 1 + sp * this.feel.stretch * 0.8;
      tail.w *= ts;
      tail.h /= ts;
      tail.lean = this.connected ? 0 : Math.sign(tail.v) * sp * 0.22;
    }
  }

  /* ------------------------------------------------------------------ */
  /* outline                                                             */
  /* ------------------------------------------------------------------ */

  private push(a: number, b: number, ra: number, rb: number, curve: number) {
    if (this.primCount >= MAX_PRIMS) return;
    if (ra < 0.05 && rb < 0.05) return;
    if (a > b) {
      let s = a;
      a = b;
      b = s;
      s = ra;
      ra = rb;
      rb = s;
    }
    const o = this.primCount * PRIM_STRIDE;
    const p = this.prims;
    p[o] = a;
    p[o + 1] = b;
    p[o + 2] = ra;
    p[o + 3] = rb;
    p[o + 4] = curve;
    this.primCount++;
  }

  /** A body as left / right cap centres and radii. */
  private caps(b: Body, out: Caps) {
    const r = b.h / 2;
    const ra = r * Math.max(0.3, Math.min(1.3, 1 - b.lean));
    const rb = r * Math.max(0.3, Math.min(1.3, 1 + b.lean));
    let a = b.x - b.w / 2 + ra;
    let bb = b.x + b.w / 2 - rb;
    if (a > bb) a = bb = (a + bb) / 2;
    out.a = a;
    out.b = bb;
    out.ra = ra;
    out.rb = rb;
  }

  /** Fill `prims` from the current state. */
  build() {
    this.primCount = 0;
    const head = this.head;
    const tail = this.tail;
    const ch = this.capsH;
    const ct = this.capsT;

    if (head.m > 1e-4) {
      this.caps(head, ch);
      // reach: the end facing a hovered slot swells out a little
      const reach = this.reach.value;
      if (Math.abs(reach) > 0.05) {
        const thin = 1 - Math.min(0.14, (Math.abs(reach) / this.layout.height) * 0.7);
        if (reach > 0) {
          ch.b += reach;
          ch.rb *= thin;
        } else {
          ch.a += reach;
          ch.ra *= thin;
        }
      }
      this.push(ch.a, ch.b, ch.ra, ch.rb, 2);
    } else {
      ch.a = ch.b = head.x;
      ch.ra = ch.rb = 0;
    }

    if (tail.on && tail.m > 1e-4) {
      this.caps(tail, ct);
      this.push(ct.a, ct.b, ct.ra, ct.rb, 2);
      if (this.connected) this.bridge(ct, ch);
    }

    for (const th of this.threads) {
      if (!th.on || (th.body === 1 && !tail.on)) continue;
      const b = th.body === 0 ? ch : ct;
      const base = th.dir > 0 ? b.b : b.a;
      const rBase = th.dir > 0 ? b.rb : b.ra;
      const edge = base + th.dir * rBase;
      const fade = Math.min(1, th.len / (this.layout.height * 0.5));
      // a retracting thread gathers into a little bulb at its tip
      this.push(edge - th.dir * rBase * 0.4, edge + th.dir * th.len, Math.min(rBase * 0.45, th.r * 2.6) * (0.4 + 0.6 * fade), th.r * (1.1 + 0.5 * (1 - fade)), 0);
    }

    for (const bead of this.beads) {
      if (!bead.on) continue;
      const r = this.beadRadius(bead.m);
      const sp = Math.min(1, Math.abs(bead.v) / (this.layout.height * this.feel.stretchSpeed));
      const len = r * sp * 0.7;
      const rr = r * (1 - sp * 0.18);
      this.push(bead.x - len, bead.x + len, rr, rr, 0);
    }
  }

  /** The bridge from tail to head: one taper with a parabolic neck (drawn exactly by the profile). */
  private bridge(t: Caps, h: Caps) {
    const dir = Math.sign(this.head.x - this.tail.x) || 1;
    const x0 = dir > 0 ? t.b : t.a;
    const r0 = (dir > 0 ? t.rb : t.ra) * 0.94;
    const x1 = dir > 0 ? h.a : h.b;
    const r1 = (dir > 0 ? h.ra : h.rb) * 0.94;
    if ((x1 - x0) * dir < -Math.min(r0, r1)) return; // overlapping: nothing to bridge
    this.push(x0, x1, Math.max(r0, 0.25), Math.max(r1, 0.25), 3 + Math.min(0.999, this.neck()));
  }

  /** Nothing moving (the floor may still be drying: see Wet). */
  settled(): boolean {
    const h = this.head;
    if (this.dragging || this.tail.on) return false;
    for (const b of this.beads) if (b.on) return false;
    for (const t of this.threads) if (t.on) return false;
    if (Math.abs(h.x - this.target) > 0.05 || Math.abs(h.v) > 0.5) return false;
    if (Math.abs(h.W - this.targetW) > 0.05) return false;
    if (!this.stretch.quiet || !this.lean.quiet || !this.press.quiet || !this.reach.quiet) return false;
    return this.ripple.age > 1.6;
  }
}
