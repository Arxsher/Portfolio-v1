// Layout and motion for liquid glass. No React and no GL here: the piece
// feeds it input and time, and reads back a GlassFrame for the renderer
// plus the dock icons' transforms and tone.
//
// The droplet is a point on two springs chasing a target (the pointer, the
// keys, or an idle figure-eight that dips in and out of the dock). Its
// squash is a 2D vector on a looser spring that chases the droplet's
// velocity, so a fast drag stretches it along the motion and, when it
// stops, the overshoot wobbles it like jelly. Merging and pinching off are
// read from the gap between the two shapes and kick off a ripple through
// the glass and a little extra wobble.
//
// The frame loop allocates nothing: the GlassFrame, the palette and the
// targets are written in place.

import { clamp, damp, lerp, Spring } from "../../hooks";
import type { PieceMode } from "../../types";
import { createFrame, type GlassFrame } from "./renderer";
import type { WordMask } from "./type";

type Vec3 = readonly [number, number, number];

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

type Band = { x: number; y: number; hw: number; hh: number; angle: number };

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
  fontPx: number;
  /** Centre x and baseline of the word. */
  word: { cx: number; baseline: number };
  disc: { x: number; y: number; r: number };
  band: Band;
  /** A thin echo of the band, parallel to it. */
  band2: Band;
  grid: number;
  fade: readonly [number, number, number, number];
  shadow: { x: number; y: number; blur: number };
  /** Idle figure-eight: half width, rise above the dock, dip below it. */
  path: { ax: number; up: number; down: number; period: number };
  /** The still frame's droplet. */
  rest: { x: number; y: number };
  /** Size of a drift (CSS px) for the backdrop's slow motion. */
  drift: number;
};

/** Geist's x-height as a share of the font size. */
const X_HEIGHT = 0.53;
/** Room the top tray takes on the stage (12px inset + 48px tray) plus a 24px gap. */
const TOP_TRAY = 84;
/**
 * Room the bottom controls take on a phone stage: 12px inset, the 48px
 * tray, the hint line above it and a little air. The poster keeps clear.
 */
const BOTTOM_CONTROLS = 96;
/** The word's ink width as a share of its font size (Geist 600, tracked in). */
const WORD_WIDTH = 2.75;

/** A thin band parallel to `b`, `off` along its normal and `along` its axis. */
function echo(b: Band, along: number, off: number, length: number, thickness: number): Band {
  const c = Math.cos(b.angle);
  const s = Math.sin(b.angle);
  return {
    x: b.x + c * along - s * off,
    y: b.y + s * along + c * off,
    hw: b.hw * length,
    hh: thickness,
    angle: b.angle,
  };
}

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
  let fontPx: number;
  let grid: number;
  /** Share of the x-height the dock covers. */
  let cover: number;
  if (tile) {
    dockH = Math.round(width * 0.2);
    pitch = Math.round(width * 0.148);
    padX = Math.round(width * 0.03);
    cy = height * 0.6;
    dropR = width * 0.074;
    iconSize = Math.round(width * 0.068);
    fontPx = width * 0.245;
    grid = width > 190 ? 10 : 9;
    cover = 0.5;
  } else if (compact) {
    dockH = 58;
    pitch = Math.min(52, Math.floor((width - 56) / count));
    padX = 8;
    // The band under the dock (and its drift) stays above the bottom
    // controls and their hint: on short stages the poster moves up.
    const drift = width * 1.35 * 0.03;
    const reach = width * 0.25 * Math.sin(0.2) + width * 0.06 * Math.cos(0.2) + drift;
    cy = Math.max(TOP_TRAY + dockH, Math.min(height * 0.56, height - BOTTOM_CONTROLS - reach - height * 0.17));
    dropR = 27;
    iconSize = 21;
    // and the word, drifting, keeps a margin from the stage's sides
    fontPx = Math.min(width * 0.272, height * 0.27, (width - 48 - drift * 2.8) / WORD_WIDTH);
    grid = 14;
    cover = 0.44;
  } else {
    dockH = 78;
    pitch = 70;
    padX = 11;
    cy = height * 0.585;
    dropR = 39;
    iconSize = 24;
    fontPx = Math.min(width * 0.2, height * 0.46, 270);
    grid = 16;
    cover = 0.5;
  }
  const hw = (count * pitch) / 2 + padX;
  const hh = dockH / 2;
  const left = cx - hw + padX;
  const icons = Array.from({ length: count }, (_, i) => ({ x: left + pitch * (i + 0.5), y: cy }));
  const unit = tile ? width : compact ? width * 1.35 : Math.min(width, height * 2.1);

  let disc: Layout["disc"];
  let band: Band;
  let band2: Band;
  if (tile) {
    disc = { x: cx + width * 0.2, y: cy - height * 0.33, r: width * 0.17 };
    band = { x: cx - width * 0.16, y: cy + height * 0.15, hw: width * 0.2, hh: width * 0.052, angle: -0.21 };
    band2 = echo(band, width * 0.05, band.hh * 2.4, 0.62, width * 0.011);
  } else if (compact) {
    const r = width * 0.17;
    disc = { x: cx + width * 0.2, y: Math.max(cy - height * 0.2, TOP_TRAY + r), r };
    band = { x: cx - width * 0.15, y: cy + height * 0.17, hw: width * 0.25, hh: width * 0.06, angle: -0.2 };
    // no echo on phones: the controls need that ground
    band2 = { x: -1e4, y: -1e4, hw: 0, hh: 0, angle: band.angle };
  } else {
    // small enough that the droplet's upper loop always passes over it
    const r = Math.min(height * 0.16, dockH * 1.3);
    disc = { x: cx + hw * 0.8, y: Math.max(cy - dockH * 1.6, TOP_TRAY * 0.6 + r), r };
    band = { x: cx - unit * 0.22, y: cy + height * 0.03, hw: unit * 0.17, hh: height * 0.05, angle: -0.2 };
    band2 = echo(band, -unit * 0.035, band.hh * 2.5, 0.62, 4.5);
  }

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
    fontPx,
    word: { cx, baseline: cy - hh + fontPx * X_HEIGHT * cover },
    disc,
    band,
    band2,
    grid,
    fade: tile ? [6, 6, width * 0.16, 1] : compact ? [0, 0, 56, 0.85] : [0, 0, 90, 0.85],
    shadow: tile ? { x: 0, y: 4.5, blur: 10 } : compact ? { x: 0, y: 9, blur: 20 } : { x: 0, y: 12, blur: 26 },
    path: tile
      ? { ax: hw * 0.8, up: dockH * 1.6, down: dockH * 1.25, period: 10 }
      : compact
        ? { ax: hw * 0.8, up: dockH * 1.85, down: dockH * 1.05, period: 12 }
        : { ax: hw * 0.8, up: dockH * 1.95, down: dockH * 1.15, period: 12 },
    rest: { x: cx + hw * 0.88 + dropR * 0.25, y: cy - hh - dropR * 0.55 },
    drift: unit * 0.03,
  };
}

/* ---------------------------------------------------------------------- */
/* colour                                                                  */
/* ---------------------------------------------------------------------- */

type Palette = {
  base: Vec3;
  baseHi: Vec3;
  ink: Vec3;
  inkAlpha: number;
  c1: Vec3;
  c1b: Vec3;
  c2: Vec3;
  c2b: Vec3;
  gridAlpha: number;
  shadow: number;
  caustic: number;
};

const hex = (value: string): Vec3 => {
  const n = parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Moves a colour `amount` of the way to its own grey. */
const desaturate = (c: Vec3, amount: number): Vec3 => {
  const y = luma(c[0], c[1], c[2]);
  return [lerp(c[0], y, amount), lerp(c[1], y, amount), lerp(c[2], y, amount)];
};

const LIGHT: Palette = {
  base: hex("#f2f2f2"),
  baseHi: hex("#f6f6f6"),
  ink: hex("#161616"),
  inkAlpha: 1,
  // a little quieter than the pure hues, so the glass stays the subject
  c1: desaturate(hex("#ff8443"), 0.1),
  c1b: desaturate(hex("#f24a1d"), 0.1),
  c2: desaturate(hex("#2a55f5"), 0.1),
  c2b: desaturate(hex("#6a8bff"), 0.1),
  gridAlpha: 0.062,
  shadow: 0.13,
  caustic: 0.2,
};

const DARK: Palette = {
  base: hex("#232323"),
  baseHi: hex("#292929"),
  ink: hex("#ededed"),
  inkAlpha: 0.95,
  c1: hex("#ff8048"),
  c1b: hex("#dc4119"),
  c2: hex("#3a5fff"),
  c2b: hex("#7e98ff"),
  gridAlpha: 0.06,
  shadow: 0.42,
  caustic: 0.1,
};

function mix3Into(out: Float32Array, a: Vec3, b: Vec3, t: number) {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
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
  word: WordMask | null = null;

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
  backdropTime = 0;

  /** 0: ink icons, 1: white icons. One tone for the whole bar, so they switch together. */
  tone = 0;
  private toneTarget = 0;
  private toneReady = false;
  private lastDt = 1 / 60;

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

  endDrag() {
    if (this.driver === "drag") this.driver = "rest";
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
      Math.abs(this.tone - this.toneTarget) > 0.002
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
      this.refraction = s.refraction;
      this.frost = s.frost;
      const t = tintById(s.tint);
      this.tint[0] = t.rgb[0];
      this.tint[1] = t.rgb[1];
      this.tint[2] = t.rgb[2];
      this.tint[3] = t.amount;
    }

    if (motion) this.backdropTime += dt;
    this.lastDt = motion ? dt : 1;

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
    this.dark = motion ? damp(this.dark, darkTarget, 7, dt) : darkTarget;
    if (Math.abs(this.dark - darkTarget) < 0.002) this.dark = darkTarget;
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

  /**
   * How light the ground under the icons is, as the frosted, tinted glass
   * shows it, read from the same shapes the shader draws (the word from its
   * mask). One decision for the whole bar, from the mean of every icon's
   * samples, with hysteresis: all icons go white over dark ground and back
   * to ink over light, together.
   */
  private updateTone(f: GlassFrame) {
    const l = this.layout;
    if (!l) return;
    const base = luma(f.base[0], f.base[1], f.base[2]);
    const ink = luma(f.ink[0], f.ink[1], f.ink[2]);
    const orange = luma(f.c1[0], f.c1[1], f.c1[2]);
    const blue = luma(f.c2[0], f.c2[1], f.c2[2]);
    const milk = lerp(0.985, 0.26, this.dark);
    const body = 0.16 + 0.7 * this.frost;
    const cos = Math.cos(f.bandAngle);
    const sin = Math.sin(f.bandAngle);
    const w = this.word;
    const tr = f.typeRect;
    const disc = f.disc;
    const radius = l.iconSize * 0.9;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < this.count; i++) {
      const icon = l.icons[i];
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const x = icon.x + ox * radius * 0.7;
          const y = icon.y + oy * radius * 0.7;
          let c = base;
          if (Math.hypot(x - disc[0], y - disc[1]) < disc[2]) c = orange;
          for (let b = 0; b < 2; b++) {
            const band = b === 0 ? f.band : f.band2;
            const bx = x - band[0];
            const by = y - band[1];
            const u = Math.abs(cos * bx + sin * by);
            const v = Math.abs(-sin * bx + cos * by);
            if (u < band[2] + band[3] * 0.4 && v < band[3]) c = blue;
          }
          if (w?.coverage && tr[2] > 0) {
            const tx = Math.floor(((x - tr[0]) / tr[2]) * w.pw);
            const ty = Math.floor(((y - tr[1]) / tr[3]) * w.ph);
            if (tx >= 0 && ty >= 0 && tx < w.pw && ty < w.ph) {
              c = lerp(c, ink, (w.coverage[ty * w.pw + tx] / 255) * f.inkAlpha);
            }
          }
          sum += c;
          n++;
        }
      }
    }
    const tl = luma(this.tint[0], this.tint[1], this.tint[2]);
    let seen = lerp(sum / n, milk, body);
    seen = lerp(seen, seen * tl * 1.08 + tl * 0.05, this.tint[3] * 0.8);
    const light = this.toneTarget > 0.5 ? seen < 0.56 : seen < 0.46;
    this.toneTarget = light ? 1 : 0;
    const k = 1 - Math.exp(-9 * this.lastDt);
    this.tone = this.toneReady ? lerp(this.tone, this.toneTarget, k) : this.toneTarget;
    if (Math.abs(this.tone - this.toneTarget) < 0.002) this.tone = this.toneTarget;
    this.toneReady = true;
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

    // palette
    mix3Into(f.base, LIGHT.base, DARK.base, dk);
    mix3Into(f.baseHi, LIGHT.baseHi, DARK.baseHi, dk);
    mix3Into(f.ink, LIGHT.ink, DARK.ink, dk);
    f.inkAlpha = lerp(LIGHT.inkAlpha, DARK.inkAlpha, dk);
    mix3Into(f.c1, LIGHT.c1, DARK.c1, dk);
    mix3Into(f.c1b, LIGHT.c1b, DARK.c1b, dk);
    mix3Into(f.c2, LIGHT.c2, DARK.c2, dk);
    mix3Into(f.c2b, LIGHT.c2b, DARK.c2b, dk);

    // the backdrop's slow drift
    const bt = this.backdropTime;
    const D = l.drift;
    const wordX = l.word.cx + Math.sin(bt * 0.11) * D * 1.4;
    f.disc[0] = l.disc.x + Math.cos(bt * 0.13) * D;
    f.disc[1] = l.disc.y + Math.sin(bt * 0.17) * D * 0.9;
    f.disc[2] = l.disc.r * (1 + Math.sin(bt * 0.21) * 0.025);
    f.disc[3] = 0;
    const bdx = Math.sin(bt * 0.09 + 1.1) * D * 1.1;
    const bdy = Math.cos(bt * 0.12) * D * 0.7;
    f.band[0] = l.band.x + bdx;
    f.band[1] = l.band.y + bdy;
    f.band[2] = l.band.hw;
    f.band[3] = l.band.hh;
    // the echo trails the band a little
    f.band2[0] = l.band2.x + bdx * 1.25;
    f.band2[1] = l.band2.y + bdy * 1.25;
    f.band2[2] = l.band2.hw;
    f.band2[3] = l.band2.hh;
    f.bandAngle = l.band.angle + Math.sin(bt * 0.08) * 0.05;

    const w = this.word;
    if (w) {
      f.typeRect[0] = wordX - w.inkWidth / 2 - w.inkLeft;
      f.typeRect[1] = l.word.baseline - w.baseline;
      f.typeRect[2] = w.width;
      f.typeRect[3] = w.height;
    } else {
      f.typeRect.fill(0);
    }

    f.grid[0] = l.grid;
    f.grid[1] = lerp(LIGHT.gridAlpha, DARK.gridAlpha, dk);
    f.grid[2] = l.width / 2;
    f.grid[3] = l.height / 2;
    f.fade.set(l.fade);
    f.shadow[0] = l.shadow.x;
    f.shadow[1] = l.shadow.y;
    f.shadow[2] = l.shadow.blur;
    f.shadow[3] = lerp(LIGHT.shadow, DARK.shadow, dk);
    f.caustic = lerp(LIGHT.caustic, DARK.caustic, dk);
    f.grain = 1.4 / 255;

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
    this.updateTone(f);
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
