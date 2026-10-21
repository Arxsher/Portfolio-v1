// Draws the switch into a 2D canvas: the landscape in the track, then the
// knob over it. One renderer for every size; `lod` decides how much detail
// goes in (the header switch gets the sky, sun, moon, a few hand-placed
// stars, a cloud and three ridges; the lab tile and stage add hill shading,
// a star field and whatever `extras` draws: see extras.ts, which the header
// never imports).
//
// Per frame it allocates only a handful of gradients; colours come from the
// palette tables, the star loop and the ridges reuse preallocated data, and
// the recess shadow, the glass sheen and the knob's soft shadows are drawn
// once per size into small offscreen canvases.

import { clamp, lerp, smoothstep } from "../../hooks";
import type { SwitchModel } from "./model";
import { color, rgba } from "./palette";
import {
  createScene,
  HILLS,
  hillY,
  makeStars,
  shiftAt,
  STAR_FIELDS,
  trackFor,
  updateScene,
  type HillLayer,
  type Lod,
  type Scene,
  type Track,
} from "./scene";

/** Extra layers for the bigger switches, called inside the track's clip. */
export type Extras = {
  /** over the sky gradient, under the stars (the Milky Way, a shooting star) */
  sky?: (view: SwitchView, ctx: CanvasRenderingContext2D, scene: Scene, time: number) => void;
  /** in front of the clouds, behind the ridges (birds) */
  air?: (view: SwitchView, ctx: CanvasRenderingContext2D, scene: Scene, time: number) => void;
  /** after the middle ridge (cabin, lake) */
  middle?: (view: SwitchView, ctx: CanvasRenderingContext2D, scene: Scene, time: number) => void;
  /** after the near ridge (trees, fireflies) */
  front?: (view: SwitchView, ctx: CanvasRenderingContext2D, scene: Scene, time: number) => void;
  /** the view was resized (rebuild cached art) */
  resize?: (view: SwitchView) => void;
};

/** The knob as drawn this frame (CSS px). */
export type KnobBox = { cx: number; cy: number; w: number; h: number };

type Cloud = { x: number; y: number; s: number; speed: number };

export const CLOUD_PUFFS = [
  // dx, dy, r (fractions of the track height, for a cloud of scale 1): a
  // low, wide bank, cut flat underneath at CLOUD_BASE
  [-0.13, 0.02, 0.045],
  [-0.06, -0.005, 0.07],
  [0.03, -0.035, 0.085],
  [0.12, -0.01, 0.065],
  [0.19, 0.015, 0.045],
] as const;
export const CLOUD_BASE = 0.05;

export const COMPACT_CLOUD: Cloud = { x: 0.86, y: 0.33, s: 1, speed: 0.0035 };

const CLOUDS: Record<Lod, Cloud[]> = {
  compact: [COMPACT_CLOUD],
  tile: [
    { x: 0.87, y: 0.31, s: 1, speed: 0.004 },
    { x: 0.52, y: 0.14, s: 0.65, speed: 0.006 },
    { x: 0.2, y: 0.24, s: 0.8, speed: 0.005 },
  ],
  stage: [
    { x: 0.86, y: 0.31, s: 0.95, speed: 0.0042 },
    { x: 0.52, y: 0.13, s: 0.6, speed: 0.0063 },
    { x: 0.19, y: 0.23, s: 0.8, speed: 0.0049 },
    { x: 0.36, y: 0.08, s: 0.42, speed: 0.0078 },
  ],
};

/** How much a press widens the knob, by size (a big knob would hide the scene). */
const PRESS_GROW: Record<Lod, number> = { compact: 0.16, tile: 0.1, stage: 0.06 };

/** Highest crest of each ridge (fraction of the height). */
const CREST: Record<HillLayer, number> = {
  far: Math.min(...HILLS.far),
  mid: Math.min(...HILLS.mid),
  near: Math.min(...HILLS.near),
};

/** Stadium (pill) path centred on cx, cy. */
export function stadium(path: CanvasRenderingContext2D | Path2D, cx: number, cy: number, w: number, h: number) {
  if (w >= h) {
    const r = h / 2;
    const x0 = cx - w / 2 + r;
    const x1 = cx + w / 2 - r;
    path.moveTo(x0, cy - r);
    path.lineTo(x1, cy - r);
    path.arc(x1, cy, r, -Math.PI / 2, Math.PI / 2);
    path.lineTo(x0, cy + r);
    path.arc(x0, cy, r, Math.PI / 2, (Math.PI * 3) / 2);
  } else {
    const r = w / 2;
    const y0 = cy - h / 2 + r;
    const y1 = cy + h / 2 - r;
    path.moveTo(cx + r, y0);
    path.lineTo(cx + r, y1);
    path.arc(cx, y1, r, 0, Math.PI);
    path.lineTo(cx - r, y0);
    path.arc(cx, y0, r, Math.PI, Math.PI * 2);
  }
  path.closePath();
}

/** A soft disc (alpha falls off like a blurred circle), drawn once and stretched to the knob. */
function softDisc(dpr: number, d: number, blur: number): HTMLCanvasElement {
  const size = d + blur * 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(size * dpr));
  canvas.height = canvas.width;
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  g.scale(canvas.width / size, canvas.width / size);
  const outer = d / 2 + blur;
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, outer);
  const inner = Math.max(0, d / 2 - blur) / outer;
  for (let k = 0; k <= 10; k++) {
    const x = inner + ((1 - inner) * k) / 10;
    const u = k / 10;
    // a Gaussian-ish shoulder
    gradient.addColorStop(x, `rgba(0,0,0,${(1 - u * u * (3 - 2 * u)).toFixed(3)})`);
  }
  if (inner > 0) gradient.addColorStop(0, "rgba(0,0,0,1)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);
  return canvas;
}

export class SwitchView {
  readonly lod: Lod;
  readonly scene: Scene = createScene();
  readonly stars: Float32Array;
  readonly knob: KnobBox = { cx: 0, cy: 0, w: 0, h: 0 };
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  /** CSS px */
  w = 0;
  h = 0;
  dpr = 1;
  track: Track = trackFor(2, 1, "compact");
  pill: Path2D | null = null;
  hills: Record<HillLayer, Path2D> | null = null;
  extras: Extras | null = null;
  /** Freeze time-driven detail (reduced motion): twinkle, drift. */
  still = false;
  /** Set when anything drawn depends on time (the caller keeps the loop running). */
  ambient = false;

  private recess: HTMLCanvasElement | null = null;
  private shadowSoft: HTMLCanvasElement | null = null;
  private shadowTight: HTMLCanvasElement | null = null;
  private softBlur = 0;
  private tightBlur = 0;

  constructor(lod: Lod, extras: Extras | null = null) {
    this.lod = lod;
    this.extras = extras;
    this.stars = makeStars(lod);
  }

  attach(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
  }

  /** The canvas's CSS size and device pixel ratio changed (the caller sized the backing store). */
  resize(w: number, h: number, dpr: number) {
    if (w === this.w && h === this.h && dpr === this.dpr && this.pill) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.track = trackFor(w, h, this.lod);
    const pill = new Path2D();
    stadium(pill, w / 2, h / 2, w, h);
    this.pill = pill;
    this.hills = {
      far: this.ridge("far"),
      mid: this.ridge("mid"),
      near: this.ridge("near"),
    };
    this.bake();
    this.extras?.resize?.(this);
  }

  /** A ridge as a closed path (before parallax), sampled from its curve. */
  private ridge(layer: HillLayer): Path2D {
    const { w, h } = this;
    const path = new Path2D();
    const samples = this.lod === "compact" ? 36 : this.lod === "tile" ? 64 : 120;
    const x0 = -0.08;
    const x1 = 1.08;
    path.moveTo(x0 * w, h + 2);
    let px = x0 * w;
    let py = hillY(layer, x0) * h;
    path.lineTo(px, py);
    for (let i = 1; i <= samples; i++) {
      const x = x0 + ((x1 - x0) * i) / samples;
      const nx = x * w;
      const ny = hillY(layer, x) * h;
      path.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2);
      px = nx;
      py = ny;
    }
    path.lineTo(px, py);
    path.lineTo(x1 * w, h + 2);
    path.closePath();
    return path;
  }

  /** The recess (inner shadow + glass sheen) and the knob's soft shadows, once per size. */
  private bake() {
    const { w, h, dpr, lod } = this;
    const recess = document.createElement("canvas");
    recess.width = Math.max(1, Math.round(w * dpr));
    recess.height = Math.max(1, Math.round(h * dpr));
    const g = recess.getContext("2d");
    if (g && this.pill) {
      g.scale(dpr, dpr);
      g.save();
      g.clip(this.pill);
      const frame = new Path2D();
      frame.rect(-w, -h, w * 3, h * 3);
      stadium(frame, w / 2, h / 2, w + 0.5, h + 0.5);
      const blur = lod === "compact" ? 2.4 : h * (lod === "tile" ? 0.06 : 0.04);
      g.shadowColor = "rgba(0,0,0,0.34)";
      g.shadowBlur = blur * dpr;
      g.shadowOffsetY = (lod === "compact" ? 0.9 : h * 0.014) * dpr;
      g.fillStyle = "#000";
      g.fill(frame, "evenodd");
      g.shadowColor = "transparent";
      // glass over the window: a faint sheen on the upper half
      const sheen = g.createLinearGradient(0, 0, 0, h * 0.55);
      sheen.addColorStop(0, "rgba(255,255,255,0.16)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = sheen;
      g.fillRect(0, 0, w, h * 0.55);
      g.restore();
    }
    this.recess = recess;
    const d = this.track.d;
    this.softBlur = d * 0.22;
    this.tightBlur = Math.max(0.8, d * 0.05);
    this.shadowSoft = softDisc(dpr, d, this.softBlur);
    this.shadowTight = softDisc(dpr, d, this.tightBlur);
  }

  /** Where the knob is drawn for the model's state (also used for the cursor and hit tests). */
  layoutKnob(model: SwitchModel): KnobBox {
    const { pad, d, travel, w, h } = this.track;
    const p = model.p;
    const pc = clamp(p, 0, 1);
    const overPx = (p - pc) * travel;
    const press = clamp(model.press.value, -0.4, 1.4);
    let kw = d * (1 + PRESS_GROW[this.lod] * press + model.stretch);
    let kh = d * (1 - 0.2 * model.stretch - 0.02 * Math.max(0, press));
    const minL = pad;
    const maxR = w - pad;
    let left = pad + d / 2 + pc * travel - kw / 2;
    if (left < minL) left = minL;
    if (left + kw > maxR) left = maxR - kw;
    if (overPx > 0) {
      left = Math.min(left + overPx, maxR - kw * 0.55);
      kw = maxR - left;
      kh += overPx * 0.55;
    } else if (overPx < 0) {
      const right = Math.max(left + kw + overPx, minL + kw * 0.55);
      left = minL;
      kw = right - left;
      kh -= overPx * 0.55;
    }
    kh = Math.min(kh, h - pad * 0.7);
    const k = this.knob;
    k.cx = left + kw / 2;
    k.cy = h / 2;
    k.w = kw;
    k.h = kh;
    return k;
  }

  /** Draw one frame. `time` in seconds drives twinkle and drift (ignored while `still`). */
  draw(model: SwitchModel, time: number) {
    const ctx = this.ctx;
    if (!ctx || !this.pill || !this.hills || this.w < 2) return;
    const { w, h, dpr, lod } = this;
    const s = this.scene;
    const t = model.t;
    const clock = this.still ? 0 : time;
    updateScene(s, t, lod);
    this.ambient = false;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.clip(this.pill);

    this.sky(ctx, s);
    this.extras?.sky?.(this, ctx, s, clock);
    this.starField(ctx, s, clock);
    this.moon(ctx, s);
    this.sun(ctx, s);
    this.clouds(ctx, s, clock);
    this.extras?.air?.(this, ctx, s, clock);
    this.hill(ctx, "far", s);
    this.hill(ctx, "mid", s);
    this.extras?.middle?.(this, ctx, s, clock);
    this.hill(ctx, "near", s);
    this.extras?.front?.(this, ctx, s, clock);

    // the recess, then the knob's shadow on the landscape
    if (this.recess) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.recess, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const knob = this.layoutKnob(model);
    this.knobShadow(ctx, s, knob);
    ctx.restore();

    this.knobBody(ctx, s, knob);
    this.ring(ctx, s);
  }

  /* sky ----------------------------------------------------------------- */

  private sky(ctx: CanvasRenderingContext2D, s: Scene) {
    const { w, h } = this;
    const t = s.t;
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.68);
    sky.addColorStop(0, color("zenith", t));
    sky.addColorStop(0.42, color("upper", t));
    sky.addColorStop(0.78, color("lower", t));
    sky.addColorStop(1, color("horizon", t));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // the glow along the horizon around the setting sun (an ellipse)
    if (s.glow > 0.01) {
      const cx = s.sunX * w;
      const cy = 0.6 * h;
      const ry = h * 0.5;
      const rx = w * 0.42;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rx / ry, 1);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      glow.addColorStop(0, rgba("sunGlow", t, 0.85 * s.glow));
      glow.addColorStop(0.45, rgba("sunGlow", t, 0.32 * s.glow));
      glow.addColorStop(1, rgba("sunGlow", t, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
      ctx.restore();
    }

    // the belt of Venus: a rosy band low on the side away from the sunset
    if (s.belt > 0.01 && this.lod !== "compact") {
      const ry = h * 0.32;
      ctx.save();
      ctx.translate(w * 0.16, h * 0.58);
      ctx.scale((w * 0.55) / ry, 1);
      const belt = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      belt.addColorStop(0, `rgba(226,160,178,${(0.42 * s.belt).toFixed(3)})`);
      belt.addColorStop(1, "rgba(226,160,178,0)");
      ctx.fillStyle = belt;
      ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
      ctx.restore();
    }
  }

  private starField(ctx: CanvasRenderingContext2D, s: Scene, time: number) {
    if (s.night <= 0.001) return;
    const { w, h, dpr, stars } = this;
    const t = s.t;
    const compact = this.lod === "compact";
    const n = stars.length / STAR_FIELDS;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = compact ? 0.5 : Math.max(0.6, h * 0.0022);
    for (let i = 0; i < n; i++) {
      const o = i * STAR_FIELDS;
      const a = clamp((t - stars[o + 3]) / 0.07);
      if (a <= 0) continue;
      const bright = stars[o + 6] > 0.5;
      const twinkle = 0.7 + 0.3 * Math.sin(time * stars[o + 4] + stars[o + 5]);
      ctx.globalAlpha = a * twinkle * (bright ? 1 : 0.82);
      // each star swells a little as it comes out
      const r = stars[o + 2] * h * (1 + 0.7 * Math.sin(a * Math.PI) * (1 - a * 0.3));
      const x = stars[o] * w;
      const y = stars[o + 1] * h;
      if (r * dpr < 1.1) {
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (bright) {
        // a faint four-point glint
        const g = r * (compact ? 2.4 : 3.6) * twinkle;
        ctx.globalAlpha *= 0.45;
        ctx.beginPath();
        ctx.moveTo(x - g, y);
        ctx.lineTo(x + g, y);
        ctx.moveTo(x, y - g);
        ctx.lineTo(x, y + g);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (!this.still) this.ambient = true;
  }

  private clouds(ctx: CanvasRenderingContext2D, s: Scene, time: number) {
    const { w, h } = this;
    const t = s.t;
    const list = CLOUDS[this.lod];
    const alpha = lerp(0.95, 0.2, smoothstep(0.55, 0.9, t));
    for (let c = 0; c < list.length; c++) {
      const cloud = list[c];
      // drift right, wrapping well outside the track
      let x = cloud.x + time * cloud.speed;
      x = ((((x + 0.35) % 1.7) + 1.7) % 1.7) - 0.35;
      const cx = x * w + shiftAt("far", t) * w * 1.5;
      const cy = cloud.y * h;
      const k = cloud.s * h;
      ctx.save();
      // cut flat underneath
      ctx.beginPath();
      ctx.rect(cx - k, cy - k, k * 2, k * (1 + CLOUD_BASE));
      ctx.clip();
      ctx.beginPath();
      for (let i = 0; i < CLOUD_PUFFS.length; i++) {
        const [dx, dy, r] = CLOUD_PUFFS[i];
        const px = cx + dx * k;
        const py = cy + dy * k;
        ctx.moveTo(px + r * k, py);
        ctx.arc(px, py, r * k, 0, Math.PI * 2);
      }
      ctx.rect(cx - 0.13 * k, cy, 0.32 * k, CLOUD_BASE * k);
      const top = cy - 0.12 * k;
      const bottom = cy + CLOUD_BASE * k;
      const body = ctx.createLinearGradient(0, top, 0, bottom);
      body.addColorStop(0, color("cloud", t));
      body.addColorStop(1, color("cloudShade", t));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = body;
      ctx.fill();
      if (s.glow > 0.02) {
        // lit from below by the low sun
        const lit = ctx.createLinearGradient(0, top, 0, bottom);
        lit.addColorStop(0.35, rgba("rim", t, 0));
        lit.addColorStop(1, rgba("rim", t, 0.85 * s.glow));
        ctx.fillStyle = lit;
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (!this.still) this.ambient = true;
  }

  private moon(ctx: CanvasRenderingContext2D, s: Scene) {
    const rise = smoothstep(0.5, 0.64, s.t);
    if (rise <= 0) return;
    const { w, h } = this;
    const x = s.moonX * w;
    const y = s.moonY * h;
    const r = s.moonR * h;
    // halo
    const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * (this.lod === "compact" ? 3.2 : 5));
    halo.addColorStop(0, `rgba(205,215,245,${(0.3 * rise).toFixed(3)})`);
    halo.addColorStop(1, "rgba(205,215,245,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    // the dark part, faintly lit by the earth
    ctx.globalAlpha = 0.16 * rise;
    ctx.fillStyle = "#c9cfdf";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // the lit crescent, facing where the sun went down
    ctx.globalAlpha = rise;
    const [sx, sy] = [s.sunX * w, s.sunY * h];
    const angle = Math.atan2(sy - y, sx - x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.ellipse(0, 0, r * 0.3, r, 0, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath();
    if (this.lod === "compact") {
      ctx.fillStyle = "#f4f1e6";
    } else {
      const face = ctx.createRadialGradient(r * 0.35, -r * 0.2, 0, 0, 0, r);
      face.addColorStop(0, "#fbf9f1");
      face.addColorStop(1, "#ddd8c8");
      ctx.fillStyle = face;
    }
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private sun(ctx: CanvasRenderingContext2D, s: Scene) {
    if (s.t > 0.68) return;
    const { w, h } = this;
    const t = s.t;
    const x = s.sunX * w;
    const y = s.sunY * h;
    const r = s.sunR * h;
    // corona: wide and white by day, warmer and larger as it lowers
    const reach = r * (this.lod === "compact" ? 2.6 : 3.6) * (1 + 0.5 * s.golden);
    const corona = ctx.createRadialGradient(x, y, r * 0.6, x, y, reach);
    corona.addColorStop(0, rgba("sunGlow", t, 0.7));
    corona.addColorStop(0.35, rgba("sunGlow", t, 0.26));
    corona.addColorStop(1, rgba("sunGlow", t, 0));
    ctx.fillStyle = corona;
    ctx.fillRect(x - reach, y - reach, reach * 2, reach * 2);
    // the disc, flattened a little by the air near the horizon
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * s.sunFlat, 0, 0, Math.PI * 2);
    if (this.lod === "compact") {
      ctx.fillStyle = color("sun", t);
    } else {
      const disc = ctx.createRadialGradient(x, y, 0, x, y, r);
      disc.addColorStop(0, "#fffef8");
      disc.addColorStop(0.55, color("sun", t));
      disc.addColorStop(1, rgba("sunGlow", t, 1));
      ctx.fillStyle = disc;
    }
    ctx.fill();
  }

  /* land ---------------------------------------------------------------- */

  private hill(ctx: CanvasRenderingContext2D, layer: HillLayer, s: Scene) {
    const path = this.hills?.[layer];
    if (!path) return;
    const { w, h } = this;
    const t = s.t;
    const dx = shiftAt(layer, t) * w;
    ctx.save();
    ctx.translate(dx, 0);
    if (this.lod === "compact") {
      ctx.fillStyle = color(layer, t);
    } else {
      // a little darker toward the foot of each ridge
      const crest = CREST[layer] * h;
      const shade = ctx.createLinearGradient(0, crest, 0, h);
      shade.addColorStop(0, color(layer, t));
      shade.addColorStop(1, layer === "near" ? color("fore", t) : color(layer === "far" ? "mid" : "near", t));
      ctx.fillStyle = shade;
    }
    ctx.fill(path);

    // light caught along the crest, strongest under the light
    const strength =
      layer === "far"
        ? 0.35 * s.golden
        : Math.max(0.85 * s.golden + 0.25 * s.sunLight * (1 - s.golden), 0.4 * s.moonLight);
    if (strength > 0.02) {
      const lx = s.lightX * w - dx;
      const rim = ctx.createLinearGradient(lx - w * 0.55, 0, lx + w * 0.55, 0);
      rim.addColorStop(0, rgba("rim", t, 0));
      rim.addColorStop(0.5, rgba("rim", t, strength));
      rim.addColorStop(1, rgba("rim", t, 0));
      ctx.clip(path);
      ctx.strokeStyle = rim;
      ctx.lineWidth = this.lod === "compact" ? 1.4 : Math.max(1.6, h * 0.008);
      ctx.stroke(path);
    }
    ctx.restore();
  }

  /* knob ---------------------------------------------------------------- */

  /** Shadow of the knob on the landscape: cast away from the sun (or moon), plus a tight contact shadow. */
  private knobShadow(ctx: CanvasRenderingContext2D, s: Scene, k: KnobBox) {
    const { w, h } = this;
    const d = this.track.d;
    let dx = k.cx - s.lightX * w;
    let dy = k.cy - s.lightY * h;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    // lower light, longer shadow
    const reach = d * (0.05 + 0.12 * clamp(s.lightY * 1.4)) * s.light;
    const ox = dx * reach;
    const oy = dy * reach * 0.6 + d * 0.05;
    const soft = this.shadowSoft;
    const tight = this.shadowTight;
    if (soft) {
      const b = this.softBlur;
      ctx.globalAlpha = 0.16 + 0.2 * s.light;
      ctx.drawImage(soft, k.cx + ox - k.w / 2 - b, k.cy + oy - k.h / 2 - b, k.w + b * 2, k.h + b * 2);
    }
    if (tight) {
      const b = this.tightBlur;
      ctx.globalAlpha = 0.22;
      ctx.drawImage(tight, k.cx - k.w / 2 - b, k.cy + d * 0.025 - k.h / 2 - b, k.w + b * 2, k.h + b * 2);
    }
    ctx.globalAlpha = 1;
  }

  private knobBody(ctx: CanvasRenderingContext2D, s: Scene, k: KnobBox) {
    const { w, h } = this;
    const t = s.t;
    const compact = this.lod === "compact";
    // unit vector toward the light
    let lx = s.lightX * w - k.cx;
    let ly = s.lightY * h - k.cy;
    const len = Math.hypot(lx, ly) || 1;
    lx /= len;
    ly /= len;
    const r = Math.max(k.w, k.h) / 2;

    ctx.beginPath();
    stadium(ctx, k.cx, k.cy, k.w, k.h);
    const hx = k.cx + lx * k.w * 0.18;
    const hy = k.cy - k.h * 0.28 + ly * k.h * 0.06;
    const body = ctx.createRadialGradient(hx, hy, 0, k.cx, k.cy + k.h * 0.1, r * 1.12);
    body.addColorStop(0, color("knob", t));
    body.addColorStop(0.6, color("knob", t));
    body.addColorStop(1, color("knobShade", t));
    ctx.fillStyle = body;
    ctx.fill();

    if (!compact) {
      // the world reflected faintly in the knob: sky above, land below
      const env = ctx.createLinearGradient(0, k.cy - k.h / 2, 0, k.cy + k.h / 2);
      env.addColorStop(0, rgba("upper", t, 0.14));
      env.addColorStop(0.45, rgba("upper", t, 0));
      env.addColorStop(0.62, rgba("near", t, 0));
      env.addColorStop(1, rgba("near", t, 0.16));
      ctx.fillStyle = env;
      ctx.fill();
      // warm light on the side facing a low sun
      if (s.golden > 0.02) {
        const warm = ctx.createRadialGradient(k.cx + lx * r, k.cy + ly * r * 0.5, 0, k.cx + lx * r, k.cy, r * 1.3);
        warm.addColorStop(0, rgba("sunGlow", t, 0.38 * s.golden));
        warm.addColorStop(1, rgba("sunGlow", t, 0));
        ctx.fillStyle = warm;
        ctx.fill();
      }
      // specular highlight toward the light
      const sx = k.cx + lx * k.w * 0.2;
      const sy = k.cy - k.h * 0.26;
      const spec = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.42);
      spec.addColorStop(0, `rgba(255,255,255,${(0.75 * s.light + 0.15).toFixed(3)})`);
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.fill();
    }

    // rim: a hairline edge plus a bright lip along the top
    ctx.lineWidth = compact ? 0.6 : Math.max(0.8, h * 0.004);
    ctx.strokeStyle = `rgba(0,0,0,${(0.08 + 0.12 * s.night).toFixed(3)})`;
    ctx.stroke();
    if (!compact) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(k.cx - k.w, k.cy - k.h, k.w * 2, k.h * 0.8);
      ctx.clip();
      ctx.beginPath();
      const inset = Math.max(1, h * 0.006);
      stadium(ctx, k.cx, k.cy, k.w - inset * 2, k.h - inset * 2);
      const lip = ctx.createLinearGradient(0, k.cy - k.h / 2, 0, k.cy);
      lip.addColorStop(0, "rgba(255,255,255,0.9)");
      lip.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = lip;
      ctx.lineWidth = Math.max(1, h * 0.006);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Hairline around the track: dark on the light page, light on the dark one. */
  private ring(ctx: CanvasRenderingContext2D, s: Scene) {
    const { w, h } = this;
    const n = s.t;
    const v = Math.round(lerp(0, 255, n));
    const a = lerp(0.1, 0.12, n);
    ctx.beginPath();
    const inset = this.lod === "compact" ? 0.5 : 0.75;
    stadium(ctx, w / 2, h / 2, w - inset * 2, h - inset * 2);
    ctx.lineWidth = inset * 2;
    ctx.strokeStyle = `rgba(${v},${v},${v},${a.toFixed(3)})`;
    ctx.stroke();
  }
}
