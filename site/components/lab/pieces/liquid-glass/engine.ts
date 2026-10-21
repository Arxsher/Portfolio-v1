// Layout and motion for liquid glass. No React and no GL here: the piece
// feeds it input and time, and reads back a GlassFrame for the renderer
// plus the dock icons' transforms and tone.
//
// The droplet is a point on two springs chasing a target (the pointer, the
// keys, or an idle figure-eight that dips in and out of the dock). Its
// squash is a 2D vector on a looser spring that chases the droplet's
// velocity, so a fast drag stretches it along the motion and, when it
// stops, the overshoot wobbles it like jelly. Let go mid-flick and the
// target is thrown ahead along the release velocity, so the droplet coasts
// on and settles; let go overlapping the bar and it is drawn all the way
// in. Merging and pinching off are read from the gap between the two
// shapes and kick off a ripple through the glass and a little extra wobble.
//
// The room behind (scene.ts) runs on two clocks: `ambient` (the drift of
// the bokeh, the bulbs breathing, the rain) and `ignite` (seconds since the
// fairy lights were switched on, which plays their one-by-one start).
//
// The frame loop allocates nothing: the GlassFrame, the palette and the
// targets are written in place.

import { clamp, damp, lerp, Spring } from "../../hooks";
import type { PieceMode } from "../../types";
import { createFrame, type GlassFrame } from "./renderer";
import { computeScene, mixLook, writePalette, type SceneLayout } from "./scene";

type Vec3 = readonly [number, number, number];

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

export type Layout = {
  width: number;
  height: number;
  compact: boolean;
  count: number;
  dock: { cx: number; cy: number; hw: number; hh: number; r: number };
  pitch: number;
  padX: number;
  icons: ReadonlyArray<{ x: number; y: number }>;
  iconSize: number;
  dropR: number;
  k: number;
  bevelDock: number;
  bevelDrop: number;
  /** The room behind the glass. */
  scene: SceneLayout;
  /** Idle figure-eight: half width, rise above the dock, dip below it. */
  path: { ax: number; up: number; down: number; period: number };
  /** The still frame's droplet. */
  rest: { x: number; y: number };
};

/** Room the top tray takes on the stage (12px inset + 48px tray) plus a 24px gap. */
const TOP_TRAY = 84;
/**
 * Room the bottom controls take on a phone stage: 12px inset, the 48px
 * tray, the hint line above it and a little air.
 */
const BOTTOM_CONTROLS = 96;

export function computeLayout(width: number, height: number, mode: PieceMode, count: number): Layout {
  const tile = mode === "tile";
  const compact = !tile && width < 560;
  const cx = width / 2;

  let dockH: number;
  let pitch: number;
  let padX: number;
  let cy: number;
  let dropR: number;
  let iconSize: number;
  if (tile) {
    dockH = Math.round(width * 0.2);
    pitch = Math.round(width * 0.148);
    padX = Math.round(width * 0.03);
    cy = height * 0.6;
    dropR = width * 0.074;
    iconSize = Math.round(width * 0.068);
  } else if (compact) {
    dockH = 58;
    pitch = Math.min(52, Math.floor((width - 56) / count));
    padX = 8;
    // clear of the top tray and of the bottom controls with their hint
    cy = Math.max(TOP_TRAY + dockH, Math.min(height * 0.56, height - BOTTOM_CONTROLS - dockH * 1.6));
    dropR = 27;
    iconSize = 21;
  } else {
    dockH = 78;
    pitch = 70;
    padX = 11;
    cy = height * 0.585;
    dropR = 39;
    iconSize = 24;
  }
  const hw = (count * pitch) / 2 + padX;
  const hh = dockH / 2;
  const left = cx - hw + padX;
  const icons = Array.from({ length: count }, (_, i) => ({ x: left + pitch * (i + 0.5), y: cy }));

  return {
    width,
    height,
    compact,
    count,
    dock: { cx, cy, hw, hh, r: dockH * 0.44 },
    pitch,
    padX,
    icons,
    iconSize,
    dropR,
    k: dropR * 1.05,
    // a narrow rim: the lensed sliver stays thin at every size
    bevelDock: dockH * (tile || compact ? 0.22 : 0.3),
    // the droplet's middle is flat enough to see through cleanly
    bevelDrop: dropR * 0.6,
    scene: computeScene(width, height, mode, compact),
    path: tile
      ? { ax: hw * 0.8, up: dockH * 1.6, down: dockH * 1.25, period: 10 }
      : compact
        ? { ax: hw * 0.8, up: dockH * 1.85, down: dockH * 1.05, period: 12 }
        : { ax: hw * 0.8, up: dockH * 1.95, down: dockH * 1.15, period: 12 },
    rest: { x: cx + hw * 0.88 + dropR * 0.25, y: cy - hh - dropR * 0.55 },
  };
}

/* ---------------------------------------------------------------------- */
/* tints                                                                   */
/* ---------------------------------------------------------------------- */

export type TintId = "clear" | "smoke" | "amber" | "sea" | "rose";

export const TINTS: ReadonlyArray<{ id: TintId; label: string; rgb: Vec3; amount: number; swatch: string }> = [
  {
    id: "clear",
    label: "Clear",
    rgb: [1, 1, 1],
    amount: 0,
    swatch: "linear-gradient(135deg, #ffffff 0%, #eef1f4 55%, #dfe4ea 100%)",
  },
  {
    id: "smoke",
    label: "Smoke",
    rgb: [0.5, 0.52, 0.56],
    amount: 0.5,
    swatch: "linear-gradient(135deg, #b9bdc4 0%, #8a8f97 60%, #6f747c 100%)",
  },
  {
    id: "amber",
    label: "Amber",
    rgb: [1, 0.72, 0.36],
    amount: 0.48,
    swatch: "linear-gradient(135deg, #ffe0a8 0%, #f7b45a 60%, #e39431 100%)",
  },
  {
    id: "sea",
    label: "Sea glass",
    rgb: [0.46, 0.84, 0.8],
    amount: 0.46,
    swatch: "linear-gradient(135deg, #cdf3ec 0%, #86d6cb 60%, #5fbdb2 100%)",
  },
  {
    id: "rose",
    label: "Rose",
    rgb: [1, 0.62, 0.7],
    amount: 0.42,
    swatch: "linear-gradient(135deg, #ffd9e0 0%, #f7a2b3 60%, #e77e95 100%)",
  },
];

export function tintById(id: TintId) {
  // (a plain loop: this runs every frame)
  for (let i = 0; i < TINTS.length; i++) if (TINTS[i].id === id) return TINTS[i];
  return TINTS[0];
}

/* ---------------------------------------------------------------------- */
/* the world                                                               */
/* ---------------------------------------------------------------------- */

type Ripple = { x: number; y: number; age: number; amp: number };

export type Driver = "path" | "drag" | "keys" | "rest" | "hover";

export type Settings = {
  refraction: number;
  frost: number;
  tint: TintId;
  dark: boolean;
  reducedMotion: boolean;
};

export type GlassEvents = {
  /** The droplet bridged onto the dock (gap closed) or pinched off. */
  onMerge?: (merged: boolean, x: number, y: number) => void;
};

/** How strongly the dock calms the ground under each icon (light, dark theme). */
const PLATE = [0.36, 0.44] as const;

export class GlassWorld {
  readonly mode: PieceMode;
  layout: Layout | null = null;

  // droplet
  readonly dx = new Spring(0, { stiffness: 150, damping: 16 });
  readonly dy = new Spring(0, { stiffness: 150, damping: 16 });
  readonly qx = new Spring(0, { stiffness: 230, damping: 8.5 });
  readonly qy = new Spring(0, { stiffness: 230, damping: 8.5 });
  driver: Driver = "path";
  readonly target = { x: 0, y: 0 };
  readonly grab = { x: 0, y: 0 };
  placed = false;
  merged = false;
  /** Seconds along the idle path (it pauses while the user has the droplet). */
  pathTime = 0;

  // tabs
  readonly count: number;
  selected = 0;
  readonly pill = new Spring(0, { stiffness: 340, damping: 26 });
  pillVelocity = 0;
  hoverIndex = -1;
  readonly hover: Spring[];
  readonly press: Spring[];
  readonly glowX = new Spring(0, { stiffness: 420, damping: 34 });
  readonly glow = new Spring(0, { stiffness: 260, damping: 26 });

  // light and material
  readonly pointerLight = new Spring(0, { stiffness: 120, damping: 20 });
  readonly pointer = { x: 0, y: 0, inside: false };
  /** A fixed pool; amp 0 is a free slot. */
  private readonly ripples: Ripple[] = Array.from({ length: 4 }, () => ({ x: 0, y: 0, age: 0, amp: 0 }));
  dark = 0;
  refraction = 0.6;
  frost = 0.18;
  readonly tint = new Float32Array([1, 1, 1, 0]);
  /** Seconds of ambient motion in the room (frozen under reduced motion). */
  ambient = 0;
  /** Seconds since the fairy lights were switched on. */
  ignite = 0;
  /** A new grain pattern each frame (fixed under reduced motion). */
  private grainSeed = 0;

  /**
   * 0: ink icons, 1: white icons. One tone for the whole bar, so they
   * switch together: ink over the daylit room, white over the night one.
   */
  tone = 0;

  private readonly out: GlassFrame = createFrame();
  private readonly contactPoint = { x: 0, y: 0 };

  constructor(mode: PieceMode, count: number) {
    this.mode = mode;
    this.count = count;
    this.hover = Array.from({ length: count }, () => new Spring(0, { stiffness: 320, damping: 24 }));
    this.press = Array.from({ length: count }, () => new Spring(0, { stiffness: 520, damping: 15 }));
  }

  /** Returns true when the layout changed. */
  resize(width: number, height: number): boolean {
    const l = this.layout;
    if (l && l.width === width && l.height === height) return false;
    const next = computeLayout(width, height, this.mode, this.count);
    if (l && this.placed) {
      // keep the droplet where it was, proportionally
      const sx = width / l.width;
      const sy = height / l.height;
      this.dx.set(this.dx.value * sx);
      this.dy.set(this.dy.value * sy);
      this.target.x *= sx;
      this.target.y *= sy;
      this.pill.set(next.icons[this.selected]?.x ?? next.dock.cx);
    }
    this.layout = next;
    return true;
  }

  /** The idle figure-eight at time t, written into `out`. */
  pathInto(t: number, out: { x: number; y: number }) {
    const l = this.layout!;
    const w = (Math.PI * 2) / l.path.period;
    const v = Math.sin(2 * w * t);
    out.x = l.dock.cx + l.path.ax * Math.sin(w * t);
    out.y = l.dock.cy - v * (v > 0 ? l.path.up : l.path.down);
  }

  private setTarget(x: number, y: number) {
    this.target.x = x;
    this.target.y = y;
  }

  /** Gap between the droplet's surface and the dock's (negative = overlapping). */
  gap(x = this.dx.value, y = this.dy.value): number {
    const l = this.layout;
    if (!l) return Infinity;
    return this.dockDistance(x, y) - l.dropR;
  }

  /** Signed distance from a point to the dock's outline. */
  dockDistance(x: number, y: number): number {
    const l = this.layout;
    if (!l) return Infinity;
    const { cx, cy, hw, hh, r } = l.dock;
    const qx = Math.abs(x - cx) - hw + r;
    const qy = Math.abs(y - cy) - hh + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  }

  /** Distance from a point to the nearest glass (dock or droplet). */
  glassDistance(x: number, y: number): number {
    const l = this.layout;
    if (!l) return Infinity;
    return Math.min(this.dockDistance(x, y), Math.hypot(x - this.dx.value, y - this.dy.value) - l.dropR);
  }

  /** The point on the dock nearest the droplet (reused object). */
  contact(): { x: number; y: number } {
    const l = this.layout!;
    const { cx, cy, hw, hh } = l.dock;
    this.contactPoint.x = clamp(this.dx.value, cx - hw, cx + hw);
    this.contactPoint.y = clamp(this.dy.value, cy - hh, cy + hh);
    return this.contactPoint;
  }

  /** Is (x, y) on the droplet? `reach` is in droplet radii (fingers get more). */
  hitDroplet(x: number, y: number, reach = 1.25): boolean {
    const l = this.layout;
    if (!l) return false;
    return Math.hypot(x - this.dx.value, y - this.dy.value) < l.dropR * reach;
  }

  /** Start dragging from (x, y): `hit` keeps the grab offset, else the droplet comes to the pointer. */
  beginDrag(x: number, y: number, hit: boolean) {
    if (hit) {
      this.grab.x = x - this.dx.value;
      this.grab.y = y - this.dy.value;
    } else {
      this.grab.x = 0;
      this.grab.y = 0;
    }
    this.driver = "drag";
    this.dragTo(x, y);
  }

  dragTo(x: number, y: number) {
    const t = this.clampTarget(x - this.grab.x, y - this.grab.y);
    this.setTarget(t.x, t.y);
  }

  /**
   * Let go. A droplet still moving is thrown on along its velocity (as far
   * as it would coast in about a seventh of a second) and settles there on
   * its own springs; one let go overlapping the bar is drawn all the way in.
   */
  endDrag(reducedMotion = false) {
    if (this.driver !== "drag") return;
    this.driver = "rest";
    const l = this.layout;
    if (!l) return;
    let x = this.target.x;
    let y = this.target.y;
    if (!reducedMotion) {
      const vx = this.dx.velocity;
      const vy = this.dy.velocity;
      const speed = Math.hypot(vx, vy);
      if (speed > 260) {
        const reach = Math.min(speed * 0.14, l.dropR * 6);
        x += (vx / speed) * reach;
        y += (vy / speed) * reach;
      }
    }
    const { cx, cy, hw, hh } = l.dock;
    if (this.gap(x, y) < l.k * 0.32) {
      x = clamp(x, cx - hw + l.dropR * 0.9, cx + hw - l.dropR * 0.9);
      y = lerp(y, cy, Math.abs(y - cy) < hh * 1.4 ? 1 : 0.6);
    }
    const t = this.clampTarget(x, y);
    this.setTarget(t.x, t.y);
  }

  addRipple(x: number, y: number, amp: number) {
    // a free slot, or else the oldest ring
    let slot = this.ripples[0];
    for (const r of this.ripples) {
      if (r.amp <= 0) {
        slot = r;
        break;
      }
      if (r.age > slot.age) slot = r;
    }
    slot.x = x;
    slot.y = y;
    slot.age = 0;
    slot.amp = amp;
  }

  private get rippling(): boolean {
    for (const r of this.ripples) if (r.amp > 0) return true;
    return false;
  }

  select(index: number, ripple = true) {
    const l = this.layout;
    this.selected = clamp(index, 0, this.count - 1);
    if (!l) return;
    this.pill.to(l.icons[this.selected].x);
    this.press[this.selected].impulse(-4.2);
    if (ripple) this.addRipple(l.icons[this.selected].x, l.dock.cy, 0.22);
  }

  /** Keyboard / button: drop into the dock, or pull it out. */
  toggleMerge() {
    const l = this.layout;
    if (!l) return;
    const { cx, cy, hw, hh } = l.dock;
    this.driver = "keys";
    if (this.gap(this.target.x, this.target.y) < l.k * 0.5) {
      this.setTarget(clamp(this.target.x, cx - hw * 0.7, cx + hw * 0.7), cy - hh - l.dropR * 2.1);
    } else {
      this.setTarget(clamp(this.target.x, cx - hw + l.dropR, cx + hw - l.dropR), cy);
    }
  }

  nudge(dx: number, dy: number) {
    const l = this.layout;
    if (!l) return;
    if (this.driver !== "keys") this.setTarget(this.dx.value, this.dy.value);
    this.driver = "keys";
    const t = this.clampTarget(this.target.x + dx, this.target.y + dy);
    this.setTarget(t.x, t.y);
  }

  private readonly clamped = { x: 0, y: 0 };
  /** (reused object) */
  clampTarget(x: number, y: number) {
    const l = this.layout!;
    const m = l.dropR * 0.9;
    this.clamped.x = clamp(x, m, l.width - m);
    this.clamped.y = clamp(y, m, l.height - m);
    return this.clamped;
  }

  /** Busy with something that still needs frames (beyond the backdrop's drift). */
  get busy(): boolean {
    if (
      // (reduced motion eases the droplet without its springs)
      Math.hypot(this.dx.value - this.target.x, this.dy.value - this.target.y) > 0.05 ||
      !this.dx.settled ||
      !this.dy.settled ||
      !this.qx.settled ||
      !this.qy.settled ||
      !this.pill.settled ||
      !this.glow.settled ||
      !this.glowX.settled ||
      !this.pointerLight.settled ||
      this.rippling ||
      Math.abs(this.tone - (this.dark > 0.5 ? 1 : 0)) > 0.002
    ) {
      return true;
    }
    for (let i = 0; i < this.count; i++) {
      if (!this.hover[i].settled || !this.press[i].settled) return true;
    }
    return false;
  }

  step(dt: number, s: Settings, events: GlassEvents = {}) {
    const l = this.layout;
    if (!l) return;
    const motion = !s.reducedMotion;

    if (!this.placed) {
      if (motion) this.pathInto(0, this.target);
      else this.setTarget(l.rest.x, l.rest.y);
      this.dx.set(this.target.x);
      this.dy.set(this.target.y);
      this.pill.set(l.icons[this.selected].x);
      this.glowX.set(l.icons[0].x);
      this.merged = this.gap() < l.k * 0.5;
      this.placed = true;
      this.dark = s.dark ? 1 : 0;
      this.tone = this.dark;
      // a still frame starts with the lights long on
      if (!motion) this.ignite = 60;
      this.refraction = s.refraction;
      this.frost = s.frost;
      const t = tintById(s.tint);
      this.tint[0] = t.rgb[0];
      this.tint[1] = t.rgb[1];
      this.tint[2] = t.rgb[2];
      this.tint[3] = t.amount;
    }

    if (motion) {
      this.ambient += dt;
      this.ignite += dt;
      this.grainSeed = (this.grainSeed + 97.31) % 4096;
    } else {
      this.ignite = Math.max(this.ignite, 60);
    }

    // where the droplet wants to be
    if (this.driver === "path") {
      if (motion) {
        this.pathTime += dt;
        this.pathInto(this.pathTime, this.target);
      } else {
        this.setTarget(l.rest.x, l.rest.y);
      }
    }
    if (motion) {
      this.dx.to(this.target.x);
      this.dy.to(this.target.y);
      this.dx.step(dt);
      this.dy.step(dt);
    } else {
      // no flight: ease straight there
      this.dx.set(damp(this.dx.value, this.target.x, 18, dt));
      this.dy.set(damp(this.dy.value, this.target.y, 18, dt));
      if (Math.hypot(this.dx.value - this.target.x, this.dy.value - this.target.y) < 0.05) {
        this.dx.set(this.target.x);
        this.dy.set(this.target.y);
      }
    }

    // squash chases velocity
    const scale = this.mode === "tile" ? 0.0016 : 0.00048;
    let tx = this.dx.velocity * scale;
    let ty = this.dy.velocity * scale;
    const mag = Math.hypot(tx, ty);
    const max = 0.27;
    if (mag > max) {
      tx *= max / mag;
      ty *= max / mag;
    }
    if (motion) {
      this.qx.to(tx);
      this.qy.to(ty);
      this.qx.step(dt);
      this.qy.step(dt);
    } else {
      this.qx.set(0);
      this.qy.set(0);
    }

    // merging and pinching off
    const gap = this.gap();
    const was = this.merged;
    if (!was && gap < l.k * 0.45) this.merged = true;
    else if (was && gap > l.k * 0.55) this.merged = false;
    if (was !== this.merged) {
      const c = this.contact();
      if (motion) {
        this.addRipple(c.x, c.y, this.merged ? 0.3 : 0.22);
        // a kick of wobble along the line between them
        const ax = this.dx.value - c.x;
        const ay = this.dy.value - c.y;
        const len = Math.hypot(ax, ay) || 1;
        const kick = this.merged ? -1.6 : 2.2;
        this.qx.impulse((ax / len) * kick);
        this.qy.impulse((ay / len) * kick);
      }
      events.onMerge?.(this.merged, c.x, c.y);
    }

    // tabs
    const pillPrev = this.pill.value;
    if (motion) this.pill.step(dt);
    else this.pill.set(this.pill.target);
    this.pillVelocity = dt > 0 ? (this.pill.value - pillPrev) / dt : 0;
    for (let i = 0; i < this.count; i++) {
      this.hover[i].to(i === this.hoverIndex ? 1 : 0);
      if (motion) {
        this.hover[i].step(dt);
        this.press[i].step(dt);
      } else {
        this.hover[i].set(this.hover[i].target);
        this.press[i].set(0);
      }
    }
    if (this.hoverIndex >= 0) this.glowX.to(l.icons[this.hoverIndex].x);
    this.glow.to(this.hoverIndex >= 0 ? 1 : 0);
    this.glowX.step(dt);
    this.glow.step(dt);

    // ripples (a finished ring frees its slot)
    for (const r of this.ripples) {
      if (r.amp <= 0) continue;
      r.age += dt;
      if (r.age >= 1.8) r.amp = 0;
    }

    // light and material: the pointer is a light only while it hovers near
    // the glass (not while it is carrying the droplet)
    const p = this.pointer;
    const near =
      this.mode === "stage" && p.inside && this.driver !== "drag" && this.glassDistance(p.x, p.y) < l.dock.hh * 1.4;
    this.pointerLight.to(near ? 1 : 0);
    if (motion) this.pointerLight.step(dt);
    else this.pointerLight.set(this.pointerLight.target);
    const darkTarget = s.dark ? 1 : 0;
    // the room's light changes over about half a second
    this.dark = motion ? damp(this.dark, darkTarget, 5, dt) : darkTarget;
    if (Math.abs(this.dark - darkTarget) < 0.002) this.dark = darkTarget;
    // the icons turn over together a little after the room passes halfway
    const toneTarget = this.dark > 0.5 ? 1 : 0;
    this.tone = motion ? damp(this.tone, toneTarget, 9, dt) : toneTarget;
    if (Math.abs(this.tone - toneTarget) < 0.002) this.tone = toneTarget;
    this.refraction = damp(this.refraction, s.refraction, 14, dt);
    this.frost = damp(this.frost, s.frost, 14, dt);
    const t = tintById(s.tint);
    this.tint[0] = damp(this.tint[0], t.rgb[0], 9, dt);
    this.tint[1] = damp(this.tint[1], t.rgb[1], 9, dt);
    this.tint[2] = damp(this.tint[2], t.rgb[2], 9, dt);
    this.tint[3] = damp(this.tint[3], t.amount, 9, dt);
  }

  /** Settings or theme still easing toward their targets. */
  easing(s: Settings): boolean {
    const t = tintById(s.tint);
    return (
      Math.abs(this.dark - (s.dark ? 1 : 0)) > 0.002 ||
      Math.abs(this.refraction - s.refraction) > 0.002 ||
      Math.abs(this.frost - s.frost) > 0.002 ||
      Math.abs(this.tint[3] - t.amount) > 0.002 ||
      Math.abs(this.tint[0] - t.rgb[0]) > 0.002 ||
      Math.abs(this.tint[1] - t.rgb[1]) > 0.002 ||
      Math.abs(this.tint[2] - t.rgb[2]) > 0.002
    );
  }

  /** Icon i's scale. */
  iconScale(i: number): number {
    return 1 + 0.13 * this.hover[i].value + this.press[i].value * 0.9;
  }

  /** Icon i's lift (CSS px, negative is up). */
  iconLift(i: number): number {
    return -1.5 * this.hover[i].value;
  }

  /** Writes this frame into the shared GlassFrame and returns it. */
  frame(dpr: number): GlassFrame | null {
    const l = this.layout;
    if (!l) return null;
    const f = this.out;
    const dk = this.dark;
    f.width = l.width;
    f.height = l.height;
    f.dpr = dpr;

    // the room
    const sc = l.scene;
    f.time = this.ambient;
    f.ignite = this.ignite;
    writePalette(f.pal, dk);
    f.lamp[0] = sc.lamp.x;
    f.lamp[1] = sc.lamp.y;
    f.lamp[2] = sc.lamp.r;
    f.win[0] = sc.win.x;
    f.win[1] = sc.win.y;
    f.win[2] = sc.win.w;
    f.win[3] = sc.win.h;
    f.winBars[0] = sc.win.slope;
    f.winBars[1] = sc.win.mullion;
    f.winBars[2] = sc.win.transom;
    f.winBars[3] = sc.win.bar;
    f.winSoft[0] = sc.win.softNear;
    f.winSoft[1] = sc.win.softFar;
    f.sun[0] = sc.sun.x;
    f.sun[1] = sc.sun.y;
    f.rain = sc.rain;
    f.plant[0] = sc.plant.x;
    f.plant[1] = sc.plant.y;
    f.plant[2] = sc.plant.size;
    for (let i = 0; i < 2; i++) {
      const w = sc.swags[i];
      f.swag[i * 4] = w.x0;
      f.swag[i * 4 + 1] = w.y0;
      f.swag[i * 4 + 2] = w.x1;
      f.swag[i * 4 + 3] = w.y1;
      f.swagB[i * 4] = w.sag;
      f.swagB[i * 4 + 1] = w.spacing;
      f.swagB[i * 4 + 2] = w.phase;
      f.swagB[i * 4 + 3] = w.sway;
    }
    f.bulb[0] = sc.bulb.r;
    f.bulb[1] = sc.bulb.hang;
    f.bulb[2] = sc.bulb.halo;
    f.bulb[3] = sc.bulb.wire;
    f.bokeh.set(sc.bokeh);
    f.look[0] = mixLook("bokehAmount", dk);
    f.look[1] = mixLook("bokehBlend", dk);
    f.look[2] = mixLook("vignette", dk);
    f.look[3] = mixLook("wireAlpha", dk);
    f.shadow[0] = sc.shadow.x;
    f.shadow[1] = sc.shadow.y;
    f.shadow[2] = sc.shadow.blur;
    f.shadow[3] = mixLook("shadow", dk);
    f.caustic = mixLook("causticAmount", dk);
    f.grain = mixLook("grain", dk);
    f.grainSeed = this.grainSeed;
    // the window in reflections: up and to the left, where the light comes from
    f.envWin[0] = -0.48;
    f.envWin[1] = -0.6;
    f.envWin[2] = 0.3;
    f.envWin[3] = 0.32;

    // shapes
    f.dock[0] = l.dock.cx;
    f.dock[1] = l.dock.cy;
    f.dock[2] = l.dock.hw;
    f.dock[3] = l.dock.hh;
    f.dockR = l.dock.r;
    f.drop[0] = this.dx.value;
    f.drop[1] = this.dy.value;
    f.drop[2] = l.dropR;
    f.drop[3] = l.k;
    const qx = this.qx.value;
    const qy = this.qy.value;
    const q = Math.hypot(qx, qy);
    if (q > 1e-4) {
      f.squash[0] = qx / q;
      f.squash[1] = qy / q;
      f.squash[2] = q;
    } else {
      f.squash[0] = 1;
      f.squash[1] = 0;
      f.squash[2] = 0;
    }
    f.bevelDock = l.bevelDock;
    f.bevelDrop = l.bevelDrop;

    // material
    f.refract = this.refraction;
    f.frost = this.frost;
    f.tint.set(this.tint);
    f.dark = dk;

    // the selection: a capsule that stretches while it travels
    const pv = Math.abs(this.pillVelocity);
    const tile = this.mode === "tile";
    f.pill[0] = this.pill.value;
    f.pill[1] = l.dock.cy;
    f.pill[2] = l.pitch * 0.5 - (tile || l.compact ? 1.5 : 2) + Math.min(pv * 0.016, l.pitch * 0.32);
    f.pill[3] = l.dock.hh * (tile ? 0.56 : 0.62) - Math.min(pv * 0.0035, l.dock.hh * 0.12);
    f.pillAmt = 1;
    f.hover[0] = this.glowX.value;
    f.hover[1] = l.dock.cy;
    f.hover[2] = l.pitch * 0.62;
    f.hover[3] = this.glow.value;

    const rd = f.ripples;
    for (let i = 0; i < 4; i++) {
      const r = this.ripples[i];
      rd[i * 4] = r.x;
      rd[i * 4 + 1] = r.y;
      rd[i * 4 + 2] = r.age;
      rd[i * 4 + 3] = r.amp;
    }
    f.pointer[0] = this.pointer.x;
    f.pointer[1] = this.pointer.y;
    f.pointer[2] = this.pointerLight.value;

    // the icons and the plate that calms the ground under them
    f.icons[0] = l.icons[0].x;
    f.icons[1] = l.dock.cy;
    f.icons[2] = l.pitch;
    f.icons[3] = l.count;
    f.plate[0] = l.pitch * 0.45;
    f.plate[1] = lerp(PLATE[0], PLATE[1], dk);
    f.plate[2] = this.tone;
    f.plate[3] = 0;
    return f;
  }
}
