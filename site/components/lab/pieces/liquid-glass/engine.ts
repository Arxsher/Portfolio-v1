// Layout and motion for liquid glass. No React and no GL here: the piece
// feeds it input and time, and reads back a GlassFrame for the renderer
// plus the dock icons' transforms.
//
// The droplet is a point on two springs chasing a target (the pointer, the
// keys, or an idle figure-eight that dips in and out of the dock). Its
// squash is a 2D vector on a looser spring that chases the droplet's
// velocity, so a fast drag stretches it along the motion and, when it
// stops, the overshoot wobbles it like jelly. Merging and pinching off are
// read from the gap between the two shapes and kick off a ripple through
// the glass and a little extra wobble.

import { clamp, damp, lerp, Spring } from "../../hooks";
import type { PieceMode } from "../../types";
import type { GlassFrame, Vec3, Vec4 } from "./renderer";
import type { WordMask } from "./type";

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
  fontPx: number;
  /** Centre x and baseline of the word. */
  word: { cx: number; baseline: number };
  disc: { x: number; y: number; r: number };
  band: { x: number; y: number; hw: number; hh: number; angle: number };
  grid: number;
  fade: Vec4;
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
  if (tile) {
    dockH = Math.round(width * 0.2);
    pitch = Math.round(width * 0.148);
    padX = Math.round(width * 0.03);
    cy = height * 0.6;
    dropR = width * 0.074;
    iconSize = Math.round(width * 0.068);
    fontPx = width * 0.245;
    grid = width > 190 ? 10 : 9;
  } else if (compact) {
    dockH = 58;
    pitch = Math.min(52, Math.floor((width - 56) / count));
    padX = 8;
    cy = height * 0.52;
    dropR = 27;
    iconSize = 21;
    fontPx = Math.min(width * 0.235, height * 0.25);
    grid = 14;
  } else {
    dockH = 78;
    pitch = 70;
    padX = 11;
    cy = height * 0.585;
    dropR = 39;
    iconSize = 24;
    fontPx = Math.min(width * 0.2, height * 0.46, 270);
    grid = 16;
  }
  const hw = (count * pitch) / 2 + padX;
  const hh = dockH / 2;
  const left = cx - hw + padX;
  const icons = Array.from({ length: count }, (_, i) => ({ x: left + pitch * (i + 0.5), y: cy }));
  const unit = tile ? width : compact ? width * 1.35 : Math.min(width, height * 2.1);

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
    bevelDock: dockH * 0.36,
    bevelDrop: dropR * 0.98,
    fontPx,
    // the dock covers the lower half of the letters' x-height
    word: { cx, baseline: cy - hh + fontPx * X_HEIGHT * 0.5 },
    disc: tile
      ? { x: cx + width * 0.2, y: cy - height * 0.33, r: width * 0.17 }
      : compact
        ? { x: cx + width * 0.2, y: cy - height * 0.25, r: width * 0.2 }
        : { x: cx + unit * 0.21, y: cy - height * 0.09, r: height * 0.22 },
    band: tile
      ? { x: cx - width * 0.16, y: cy + height * 0.15, hw: width * 0.2, hh: width * 0.052, angle: -0.21 }
      : compact
        ? { x: cx - width * 0.16, y: cy + height * 0.115, hw: width * 0.25, hh: width * 0.065, angle: -0.2 }
        : { x: cx - unit * 0.22, y: cy + height * 0.03, hw: unit * 0.17, hh: height * 0.05, angle: -0.2 },
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

const LIGHT: Palette = {
  base: hex("#f2f2f2"),
  baseHi: hex("#f6f6f6"),
  ink: hex("#161616"),
  inkAlpha: 1,
  c1: hex("#ff8443"),
  c1b: hex("#f24a1d"),
  c2: hex("#2a55f5"),
  c2b: hex("#6a8bff"),
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

const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

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

export const tintById = (id: TintId) => TINTS.find((t) => t.id === id) ?? TINTS[0];

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
  target = { x: 0, y: 0 };
  grab = { x: 0, y: 0 };
  placed = false;
  merged = false;
  /** Seconds along the idle path (it pauses while the user has the droplet). */
  pathTime = 0;

  // tabs
  readonly count: number;
  selected = 0;
  readonly pill = new Spring(0, { stiffness: 340, damping: 26 });
  hoverIndex = -1;
  readonly hover: Spring[];
  readonly press: Spring[];
  readonly glowX = new Spring(0, { stiffness: 420, damping: 34 });
  readonly glow = new Spring(0, { stiffness: 260, damping: 26 });

  // light and material
  readonly pointerLight = new Spring(0, { stiffness: 120, damping: 20 });
  pointer = { x: 0, y: 0, inside: false };
  ripples: Ripple[] = [];
  dark = 0;
  refraction = 0.6;
  frost = 0.18;
  tint: [number, number, number, number] = [1, 1, 1, 0];
  backdropTime = 0;

  private rippleData = new Float32Array(16);
  /** 0: ink icons, 1: light icons (they flip over dark things under the glass). */
  readonly tone: number[];
  private readonly toneTarget: number[];
  private lastDt = 1 / 60;
  private toneReady = false;

  constructor(mode: PieceMode, count: number) {
    this.mode = mode;
    this.count = count;
    this.hover = Array.from({ length: count }, () => new Spring(0, { stiffness: 320, damping: 24 }));
    this.press = Array.from({ length: count }, () => new Spring(0, { stiffness: 520, damping: 15 }));
    this.tone = Array.from({ length: count }, () => 0);
    this.toneTarget = Array.from({ length: count }, () => 0);
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

  pathAt(t: number) {
    const l = this.layout!;
    const w = (Math.PI * 2) / l.path.period;
    const v = Math.sin(2 * w * t);
    return {
      x: l.dock.cx + l.path.ax * Math.sin(w * t),
      y: l.dock.cy - v * (v > 0 ? l.path.up : l.path.down),
    };
  }

  /** Gap between the droplet's surface and the dock's (negative = overlapping). */
  gap(x = this.dx.value, y = this.dy.value): number {
    const l = this.layout;
    if (!l) return Infinity;
    const { cx, cy, hw, hh, r } = l.dock;
    const qx = Math.abs(x - cx) - hw + r;
    const qy = Math.abs(y - cy) - hh + r;
    const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
    return outside + Math.min(Math.max(qx, qy), 0) - r - l.dropR;
  }

  /** The point on the dock nearest the droplet. */
  contact(): { x: number; y: number } {
    const l = this.layout!;
    const { cx, cy, hw, hh } = l.dock;
    return {
      x: clamp(this.dx.value, cx - hw, cx + hw),
      y: clamp(this.dy.value, cy - hh, cy + hh),
    };
  }

  hitDroplet(x: number, y: number): boolean {
    const l = this.layout;
    if (!l) return false;
    return Math.hypot(x - this.dx.value, y - this.dy.value) < l.dropR * 1.25;
  }

  addRipple(x: number, y: number, amp: number) {
    this.ripples.push({ x, y, age: 0, amp });
    if (this.ripples.length > 4) this.ripples.shift();
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
      this.target = { x: clamp(this.target.x, cx - hw * 0.7, cx + hw * 0.7), y: cy - hh - l.dropR * 2.1 };
    } else {
      this.target = { x: clamp(this.target.x, cx - hw + l.dropR, cx + hw - l.dropR), y: cy };
    }
  }

  nudge(dx: number, dy: number) {
    const l = this.layout;
    if (!l) return;
    if (this.driver !== "keys") this.target = { x: this.dx.value, y: this.dy.value };
    this.driver = "keys";
    this.target = this.clampTarget(this.target.x + dx, this.target.y + dy);
  }

  clampTarget(x: number, y: number) {
    const l = this.layout!;
    const m = l.dropR * 0.9;
    return { x: clamp(x, m, l.width - m), y: clamp(y, m, l.height - m) };
  }

  /** Busy with something that still needs frames. */
  get busy(): boolean {
    return (
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
      this.ripples.length > 0 ||
      this.hover.some((s) => !s.settled) ||
      this.press.some((s) => !s.settled)
    );
  }

  step(dt: number, s: Settings, events: GlassEvents = {}) {
    const l = this.layout;
    if (!l) return;
    const motion = !s.reducedMotion;

    if (!this.placed) {
      const start = motion ? this.pathAt(0.0) : l.rest;
      this.dx.set(start.x);
      this.dy.set(start.y);
      this.target = { ...start };
      this.pill.set(l.icons[this.selected].x);
      this.glowX.set(l.icons[0].x);
      this.merged = this.gap() < l.k * 0.5;
      this.placed = true;
      this.dark = s.dark ? 1 : 0;
      this.refraction = s.refraction;
      this.frost = s.frost;
      const t = tintById(s.tint);
      this.tint = [t.rgb[0], t.rgb[1], t.rgb[2], t.amount];
    }

    if (motion) this.backdropTime += dt;
    this.lastDt = motion ? dt : 1;

    // where the droplet wants to be
    if (this.driver === "path") {
      if (motion) {
        this.pathTime += dt;
        this.target = this.pathAt(this.pathTime);
      } else {
        this.target = { ...l.rest };
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
    const vx = this.dx.velocity;
    const vy = this.dy.velocity;
    const scale = this.mode === "tile" ? 0.0016 : 0.00048;
    let tx = vx * scale;
    let ty = vy * scale;
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
    const pillV = dt > 0 ? (this.pill.value - pillPrev) / dt : 0;
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
    this.pillVelocity = pillV;

    // ripples
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < 1.8);

    // light and material
    this.pointerLight.to(this.pointer.inside && this.mode === "stage" ? 1 : 0);
    this.pointerLight.step(dt);
    const darkTarget = s.dark ? 1 : 0;
    this.dark = motion ? damp(this.dark, darkTarget, 7, dt) : darkTarget;
    if (Math.abs(this.dark - darkTarget) < 0.002) this.dark = darkTarget;
    this.refraction = damp(this.refraction, s.refraction, 14, dt);
    this.frost = damp(this.frost, s.frost, 14, dt);
    const t = tintById(s.tint);
    const tt = [t.rgb[0], t.rgb[1], t.rgb[2], t.amount];
    for (let i = 0; i < 4; i++) this.tint[i] = damp(this.tint[i], tt[i], 9, dt);
  }

  pillVelocity = 0;

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
   * How light the backdrop is under each icon, as the frosted glass shows
   * it, read from the same shapes the shader draws (the word from its
   * mask). Icons ease to white over dark ground and back to ink over light.
   */
  private updateTone(typeRect: Vec4, disc: Vec4, band: Vec4, angle: number, pal: { base: Vec3; ink: Vec3; c1: Vec3; c2: Vec3; inkAlpha: number }) {
    const l = this.layout;
    if (!l) return;
    const luma = (c: Vec3) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const base = luma(pal.base);
    const ink = luma(pal.ink);
    const orange = luma(pal.c1);
    const blue = luma(pal.c2);
    const milk = lerp(0.985, 0.26, this.dark);
    const body = 0.16 + 0.7 * this.frost;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const w = this.word;
    const radius = l.iconSize * 0.9;
    const k = 1 - Math.exp(-9 * this.lastDt);
    for (let i = 0; i < this.count; i++) {
      const icon = l.icons[i];
      let sum = 0;
      let n = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const x = icon.x + ox * radius * 0.7;
          const y = icon.y + oy * radius * 0.7;
          let c = base;
          if (Math.hypot(x - disc[0], y - disc[1]) < disc[2]) c = orange;
          const bx = x - band[0];
          const by = y - band[1];
          const u = Math.abs(cos * bx + sin * by);
          const v = Math.abs(-sin * bx + cos * by);
          if (u < band[2] + band[3] * 0.4 && v < band[3]) c = blue;
          if (w?.coverage && typeRect[2] > 0) {
            const tx = Math.floor(((x - typeRect[0]) / typeRect[2]) * w.pw);
            const ty = Math.floor(((y - typeRect[1]) / typeRect[3]) * w.ph);
            if (tx >= 0 && ty >= 0 && tx < w.pw && ty < w.ph) {
              const a = (w.coverage[ty * w.pw + tx] / 255) * pal.inkAlpha;
              c = lerp(c, ink, a);
            }
          }
          sum += c;
          n++;
        }
      }
      // flip with hysteresis, so an icon is always clearly ink or white
      const seen = lerp(sum / n, milk, body);
      const light = this.toneTarget[i] > 0.5 ? seen < 0.56 : seen < 0.46;
      this.toneTarget[i] = light ? 1 : 0;
      this.tone[i] = this.toneReady ? lerp(this.tone[i], this.toneTarget[i], k) : this.toneTarget[i];
    }
    this.toneReady = true;
  }

  /** Icon i's scale and lift. */
  iconTransform(i: number): { scale: number; lift: number } {
    const h = this.hover[i].value;
    return { scale: 1 + 0.13 * h + this.press[i].value * 0.9, lift: -1.5 * h };
  }

  frame(dpr: number): GlassFrame | null {
    const l = this.layout;
    if (!l) return null;
    const pal = {
      base: mix3(LIGHT.base, DARK.base, this.dark),
      baseHi: mix3(LIGHT.baseHi, DARK.baseHi, this.dark),
      ink: mix3(LIGHT.ink, DARK.ink, this.dark),
      inkAlpha: lerp(LIGHT.inkAlpha, DARK.inkAlpha, this.dark),
      c1: mix3(LIGHT.c1, DARK.c1, this.dark),
      c1b: mix3(LIGHT.c1b, DARK.c1b, this.dark),
      c2: mix3(LIGHT.c2, DARK.c2, this.dark),
      c2b: mix3(LIGHT.c2b, DARK.c2b, this.dark),
      gridAlpha: lerp(LIGHT.gridAlpha, DARK.gridAlpha, this.dark),
      shadow: lerp(LIGHT.shadow, DARK.shadow, this.dark),
      caustic: lerp(LIGHT.caustic, DARK.caustic, this.dark),
    };

    // the backdrop's slow drift
    const bt = this.backdropTime;
    const D = l.drift;
    const wordX = l.word.cx + Math.sin(bt * 0.11) * D * 1.4;
    const disc: Vec4 = [
      l.disc.x + Math.cos(bt * 0.13) * D,
      l.disc.y + Math.sin(bt * 0.17) * D * 0.9,
      l.disc.r * (1 + Math.sin(bt * 0.21) * 0.025),
      0,
    ];
    const band: Vec4 = [
      l.band.x + Math.sin(bt * 0.09 + 1.1) * D * 1.1,
      l.band.y + Math.cos(bt * 0.12) * D * 0.7,
      l.band.hw,
      l.band.hh,
    ];
    const bandAngle = l.band.angle + Math.sin(bt * 0.08) * 0.05;

    const w = this.word;
    const typeRect: Vec4 = w
      ? [wordX - w.inkWidth / 2 - w.inkLeft, l.word.baseline - w.baseline, w.width, w.height]
      : [0, 0, 0, 0];

    this.updateTone(typeRect, disc, band, bandAngle, pal);

    // squash: axis and stretch from the vector
    const qx = this.qx.value;
    const qy = this.qy.value;
    const q = Math.hypot(qx, qy);
    const squash: Vec3 = q > 1e-4 ? [qx / q, qy / q, q] : [1, 0, 0];

    // the selection stretches while it travels
    const pv = Math.abs(this.pillVelocity);
    const pillHw = l.pitch * 0.5 - (l.compact || this.mode === "tile" ? 2 : 3) + Math.min(pv * 0.016, l.pitch * 0.32);
    const pillHh = l.dock.hh - l.padX * 0.62 - Math.min(pv * 0.0035, l.dock.hh * 0.12);

    const rd = this.rippleData;
    rd.fill(0);
    this.ripples.forEach((r, i) => {
      rd[i * 4] = r.x;
      rd[i * 4 + 1] = r.y;
      rd[i * 4 + 2] = r.age;
      rd[i * 4 + 3] = r.amp;
    });

    return {
      width: l.width,
      height: l.height,
      dpr,
      dock: [l.dock.cx, l.dock.cy, l.dock.hw, l.dock.hh],
      dockR: l.dock.r,
      drop: [this.dx.value, this.dy.value, l.dropR, l.k],
      squash,
      bevelDock: l.bevelDock,
      bevelDrop: l.bevelDrop,
      typeRect,
      base: pal.base,
      baseHi: pal.baseHi,
      ink: pal.ink,
      inkAlpha: pal.inkAlpha,
      c1: pal.c1,
      c1b: pal.c1b,
      c2: pal.c2,
      c2b: pal.c2b,
      disc,
      band,
      bandAngle,
      grid: [l.grid, pal.gridAlpha, l.width / 2, l.height / 2],
      fade: l.fade,
      shadow: [l.shadow.x, l.shadow.y, l.shadow.blur, pal.shadow],
      caustic: pal.caustic,
      grain: 1.4 / 255,
      refract: this.refraction,
      frost: this.frost,
      tint: [this.tint[0], this.tint[1], this.tint[2], this.tint[3]],
      pill: [this.pill.value, l.dock.cy, pillHw, pillHh],
      pillAmt: 1,
      hover: [this.glowX.value, l.dock.cy, l.pitch * 0.62, this.glow.value],
      ripples: rd,
      pointer: [this.pointer.x, this.pointer.y, this.pointerLight.value],
      dark: this.dark,
    };
  }
}
