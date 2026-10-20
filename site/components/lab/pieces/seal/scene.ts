// The scene: an envelope seen from the back lying on the table, its flap,
// the letter inside, the wax, and a brass seal stamp standing beside it,
// drawn with Canvas 2D.
//
// The paper parts are drawn once per size and theme into device-resolution
// layers (interior, pocket, flap outside, flap inside, letter, and their
// soft shadows); a frame then only composites them, so the canvas costs
// almost nothing at rest and the loop can sleep.
//
// Camera. Straight down at the table through a shifted lens (the way an
// architectural camera keeps walls straight): flat things keep their true
// shape, tall things lean away from a point below the frame, so the stamp
// shows its front and its top, the closer to the lens the bigger. A
// second, ordinary camera move (zoom and pan, on a spring in the engine)
// pulls back when the letter comes out so the whole of it fits.
//
// The stamp is a turned solid (a lathe profile: brass head with a knurled
// band, collar and bead, walnut handle swelling to a bulb, a small brass
// medallion with the arsher mark on top) drawn as a stack of thin discs
// from the face up, each projected and shaded with a cached gradient
// worked out from a little studio environment (a big softbox upper left, a
// strip light right, the table below), so the brass reads as metal and
// the walnut as lacquered wood. Its shadow is baked once.
//
// One light for everything, high and to the upper left: the top flap
// casts a soft shadow onto the pocket below its edges, the fold along the
// top catches a highlight, and every shadow (envelope, flap, wax, stamp,
// pieces) falls down and to the right.

import { clamp, lerp, smoothstep } from "../../hooks";
import type { PieceTheme } from "../../types";
import { paperPattern, PAPERS, type Paper } from "./paper";
import { EXTENT, FACE, MARK, type CrackLine, type ShardShape, type Wax } from "./wax";

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */

/** Envelope proportions (fractions of its width W and height H). */
export const ENVELOPE = {
  aspect: 0.64, // H / W
  corner: 0.012, // × W
  flapTip: 0.56, // × H
  tipRound: 0.055, // × W
  notch: 0.5, // × H, where the side flaps meet
  seal: 0.53, // × H, the seal's centre
} as const;

/** The stamp's shadow falls this far (down and right) per px of height. */
const SHADOW_DX = 0.2;
const SHADOW_DY = 0.31;

export type Layout = {
  width: number;
  height: number;
  dpr: number;
  tile: boolean;
  /** Envelope size and its top-left corner (scene px; the scene is the canvas at rest). */
  W: number;
  H: number;
  x: number;
  y: number;
  /** Seal radius. */
  R: number;
  /** How far the letter slides up. */
  rise: number;
  /** The letter inside the envelope (envelope coordinates). */
  letter: { x: number; y: number; w: number; h: number };
  /** The stamp's face radius, and where its base stands at rest. */
  rs: number;
  rest: [number, number];
  /** Shifted-lens perspective: the point tall things lean away from, and the lens height. */
  eye: { x: number; y: number; d: number };
  /** Camera: the screen point the view centres on, and the composition with the letter out. */
  anchor: [number, number];
  open: { x: number; y: number; zoom: number };
};

export function layoutFor(
  width: number,
  height: number,
  dpr: number,
  { top, bottom, tile }: { top: number; bottom: number; tile: boolean },
): Layout {
  const narrow = width < 640;
  // Clear space kept between the scene and the controls.
  const clear = tile ? 8 : narrow ? 24 : 26;
  const t = top + clear;
  const b = height - bottom - clear;
  const availH = Math.max(60, b - t);
  const side = tile ? 10 : narrow ? 18 : 40;
  const availW = Math.max(60, width - side * 2);
  const wide = !tile && availW > availH * 1.55;
  let W: number;
  if (wide) {
    // About half the stage; larger in full screen.
    const cap = clamp(height * 0.98, 560, 860);
    W = Math.min(availW * 0.52, cap, (availH * 0.9) / ENVELOPE.aspect);
  } else if (tile) {
    W = Math.min(width * 0.7, (availH * 0.56) / ENVELOPE.aspect);
  } else {
    W = Math.min(availW * 0.92, 560, (availH * 0.6) / ENVELOPE.aspect);
  }
  W = Math.round(W);
  const H = Math.round(W * ENVELOPE.aspect);
  const R = Math.round(W * (tile ? 0.15 : 0.132) * 4) / 4;
  const rs = R * FACE * 1.06;

  let x: number;
  let y: number;
  let rest: [number, number];
  if (wide) {
    // The stamp stands on the table to the right; the pair is centred.
    const gap = W * 0.2;
    const group = W + gap + rs * 1.6;
    x = Math.round((width - group) / 2);
    y = Math.round(t + (availH - H) / 2);
    rest = [x + W + gap, y + H * 0.74];
  } else {
    // The stamp stands on the envelope's lower right corner.
    x = Math.round((width - W) / 2);
    y = Math.round(t + (availH - H) * (tile ? 0.3 : 0.36));
    rest = [x + W * 0.84, y + H * (tile ? 0.97 : 0.9)];
  }
  const sealX = x + W / 2;
  const sealY = y + H * ENVELOPE.seal;
  const eyeY = sealY + H * 1.5;
  const eye = { x: sealX + (rest[0] - sealX) * 0.3, y: eyeY, d: (eyeY - sealY) / 0.3 };

  const lw = Math.round(W * 0.88);
  const lh = Math.round(H * 0.9);
  const rise = Math.round(H * (wide ? 0.68 : 0.62));
  const letter = { x: Math.round((W - lw) / 2), y: Math.round(H * 0.06), w: lw, h: lh };

  // With the letter out: from the higher of the open flap's tip and the letter's top, to the envelope's foot.
  const anchor: [number, number] = [width / 2, t + availH / 2];
  const openTop = y + Math.min(-H * ENVELOPE.flapTip, letter.y - rise) - 4;
  // (the stamp's foot too, where it stands below the envelope)
  const openBottom = Math.max(y + H + 8, rest[1] + rs + 6);
  const room = tile ? height - 12 : availH;
  const zoom = Math.min(1, room / (openBottom - openTop));
  const open = { x: sealX, y: (openTop + openBottom) / 2, zoom };
  return { width, height, dpr, tile, W, H, x, y, R, rise, letter, rs, rest, eye, anchor, open };
}

/* ---------------------------------------------------------------------- */
/* paths                                                                   */
/* ---------------------------------------------------------------------- */

function bodyPath(W: number, H: number) {
  const path = new Path2D();
  path.roundRect(0, 0, W, H, W * ENVELOPE.corner);
  return path;
}

function flapPath(W: number, H: number) {
  const path = new Path2D();
  const r = W * ENVELOPE.corner;
  path.moveTo(r * 0.6, 0);
  path.lineTo(W - r * 0.6, 0);
  path.arcTo(W / 2, H * ENVELOPE.flapTip, 0, 0, W * ENVELOPE.tipRound);
  path.closePath();
  return path;
}

function notchPath(W: number, H: number) {
  const path = new Path2D();
  path.moveTo(0, 0);
  path.lineTo(W, 0);
  path.lineTo(W / 2, H * ENVELOPE.notch);
  path.closePath();
  return path;
}

/** The back of the envelope below the opening (side flaps and bottom flap). */
function pocketPath(W: number, H: number) {
  const path = new Path2D();
  path.roundRect(0, 0, W, H, W * ENVELOPE.corner);
  path.moveTo(0, 0);
  path.lineTo(W / 2, H * ENVELOPE.notch);
  path.lineTo(W, 0);
  path.closePath();
  return path;
}

function bottomFlapPath(W: number, H: number) {
  const path = new Path2D();
  path.moveTo(-2, H + 2);
  path.lineTo(W / 2, H * ENVELOPE.notch);
  path.lineTo(W + 2, H + 2);
  path.closePath();
  return path;
}

const UNIT = (() => {
  if (typeof Path2D === "undefined") return null;
  const path = new Path2D();
  path.arc(0, 0, 1, 0, Math.PI * 2);
  return path;
})();

/* ---------------------------------------------------------------------- */
/* helpers                                                                 */
/* ---------------------------------------------------------------------- */

type Layer = {
  canvas: HTMLCanvasElement;
  /** Where the layer's local (0, 0) is inside the canvas, CSS px. */
  pad: number;
  /** CSS size of the canvas. */
  w: number;
  h: number;
};

function makeLayer(w: number, h: number, pad: number, dpr: number, draw: (ctx: CanvasRenderingContext2D) => void): Layer {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil((w + pad * 2) * dpr));
  canvas.height = Math.max(1, Math.ceil((h + pad * 2) * dpr));
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
    draw(ctx);
  }
  return { canvas, pad, w: canvas.width / dpr, h: canvas.height / dpr };
}

/** Far enough left that a shape drawn there never lands on the canvas (device px). */
const FAR = 20000;

/**
 * Draw only the blurred shadow of whatever `draw` paints: the paint lands
 * far off the canvas and the shadow is offset back into place. Blur and
 * offsets are in device px (shadows ignore the transform). Build time only.
 */
function farShadow(ctx: CanvasRenderingContext2D, draw: () => void, color: string, blur: number, dx: number, dy: number) {
  ctx.save();
  const m = ctx.getTransform();
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e - FAR, m.f);
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = FAR + dx;
  ctx.shadowOffsetY = dy;
  draw();
  ctx.restore();
}

/** A path's soft shadow, in CSS px. */
function softFill(ctx: CanvasRenderingContext2D, path: Path2D, color: string, blur: number, dx: number, dy: number, dpr: number) {
  farShadow(
    ctx,
    () => {
      ctx.fillStyle = "#000";
      ctx.fill(path);
    },
    color,
    blur * dpr,
    dx * dpr,
    dy * dpr,
  );
}

const rgba = ([r, g, b]: readonly [number, number, number], a: number) => `rgba(${r}, ${g}, ${b}, ${clamp(a, 0, 1).toFixed(3)})`;

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const u = size / 16;
  for (const [bx, by, bw, bh] of MARK) ctx.fillRect(x + bx * u, y + by * u, bw * u, bh * u);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ---------------------------------------------------------------------- */
/* the stamp: a lathe profile and its shading                              */
/* ---------------------------------------------------------------------- */

const BRASS = 0;
const KNURL = 1;
const WOOD = 2;

/** Profile runs from the face (z = 0) up, in face radii: [height, radius]. */
const PROFILE: ReadonlyArray<{ mat: number; smooth: boolean; points: ReadonlyArray<readonly [number, number]> }> = [
  { mat: BRASS, smooth: false, points: [[0, 0.93], [0.035, 0.995], [0.07, 1]] },
  { mat: KNURL, smooth: false, points: [[0.07, 1], [0.24, 1]] },
  {
    mat: BRASS,
    smooth: false,
    points: [[0.24, 1], [0.29, 0.99], [0.325, 0.955], [0.36, 0.87], [0.41, 0.72], [0.455, 0.62], [0.49, 0.57], [0.55, 0.555], [0.575, 0.6], [0.63, 0.6], [0.655, 0.545], [0.87, 0.51], [0.92, 0.47]],
  },
  {
    mat: WOOD,
    smooth: true,
    points: [[0.92, 0.43], [1.25, 0.37], [1.7, 0.35], [2.3, 0.41], [2.9, 0.54], [3.35, 0.61], [3.7, 0.6], [4.0, 0.52], [4.2, 0.42], [4.32, 0.33], [4.38, 0.27]],
  },
];
/** Height of the handle's flat top, where the medallion sits, and the medallion's radius (face radii). */
export const STAMP_TOP = 4.38;
const MEDALLION = 0.25;

type StampSample = { z: number; r: number; key: number; last: boolean };

/** The profile as fine samples, each with its gradient key (material and slope). */
function stampSamples(): StampSample[] {
  const out: StampSample[] = [];
  for (const run of PROFILE) {
    const pts = run.points;
    // A dense polyline (Catmull-Rom through the points on the smooth runs).
    const dense: Array<[number, number]> = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const steps = 24;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        if (!run.smooth) {
          dense.push([lerp(p1[0], p2[0], t), lerp(p1[1], p2[1], t)]);
          continue;
        }
        const t2 = t * t;
        const t3 = t2 * t;
        const cr = (a: number, b: number, c: number, d: number) =>
          0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        dense.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    dense.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
    // Resample by length along the profile.
    let carry = 0;
    const step = 0.016;
    const start = out.length;
    for (let i = 0; i < dense.length; i++) {
      const prev = dense[Math.max(0, i - 1)];
      const next = dense[Math.min(dense.length - 1, i + 1)];
      const [z, r] = dense[i];
      if (i > 0) carry += Math.hypot(z - dense[i - 1][0], r - dense[i - 1][1]);
      if (i > 0 && i < dense.length - 1 && carry < step) continue;
      carry = 0;
      // Outward normal of the profile: its angle above the horizontal (+90° faces straight up).
      const dz = next[0] - prev[0];
      const dr = next[1] - prev[1];
      const phi = (Math.atan2(-dr, dz) * 180) / Math.PI;
      const bucket = Math.round((clamp(phi, -90, 90) + 90) / 2.5);
      out.push({ z, r, key: run.mat * 128 + bucket, last: false });
    }
    if (out.length > start) out[out.length - 1].last = true;
  }
  return out;
}

const norm3 = (x: number, y: number, z: number): [number, number, number] => {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
};
const LKEY = norm3(-0.42, -0.7, 0.62);
const VIEW = norm3(0, 0.34, 1);
const SOFTBOX = norm3(-0.55, -0.62, 0.56);
const OVERHEAD = norm3(-0.12, -0.2, 1);
const STRIP = norm3(0.88, -0.1, 0.46);
const toSrgb = (c: number) => {
  const v = clamp(c);
  return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
};

/** The little studio around the stamp, seen in a reflection direction (linear). */
function studio(rx: number, ry: number, rz: number, dark: boolean): number {
  // Two softboxes (the key upper left, a broad one overhead) and a strip on the right, in a dim room over a pale table.
  const key = smoothstep(0.8, 0.93, rx * SOFTBOX[0] + ry * SOFTBOX[1] + rz * SOFTBOX[2]) * 3.6;
  const top = smoothstep(0.86, 0.96, rx * OVERHEAD[0] + ry * OVERHEAD[1] + rz * OVERHEAD[2]) * 1.5;
  const strip = smoothstep(0.93, 0.985, rx * STRIP[0] + ry * STRIP[1] + rz * STRIP[2]) * 1.4;
  const walls = (dark ? 0.05 : 0.09) + (dark ? 0.08 : 0.14) * clamp(rz);
  const ground = dark ? 0.04 : 0.34;
  let e = lerp(ground, walls, smoothstep(-0.12, 0.1, rz));
  // the dark line where the table meets the room
  e -= (dark ? 0.02 : 0.12) * Math.exp(-(((rz + 0.02) / 0.05) ** 2));
  return Math.max(0.01, e) + key + top + strip;
}

/** One gradient's stops: a colour for each position t (−1 … 1) across a slice. */
function stampStops(mat: number, phiDeg: number, dark: boolean): { axis: [number, number]; stops: Array<[number, string]> } {
  const phi = (phiDeg * Math.PI) / 180;
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  // Walls shade across (left to right as seen); faces turned up shade along the light.
  const w = smoothstep(0.25, 0.9, sp);
  let ax = lerp(1, 0.514, w);
  let ay = lerp(0, 0.857, w);
  const al = Math.hypot(ax, ay);
  ax /= al;
  ay /= al;
  // The visible half of the ring (toward the lens, down the screen).
  let px = -ay;
  let py = ax;
  if (py < 0) {
    px = -px;
    py = -py;
  }
  const count = mat === KNURL ? 97 : 33;
  const exposure = dark ? 0.86 : 1;
  const stops: Array<[number, string]> = [];
  for (let i = 0; i < count; i++) {
    const t = -1 + (2 * i) / (count - 1);
    const q = Math.sqrt(Math.max(0, 1 - t * t));
    const ux = t * ax + q * px;
    const uy = t * ay + q * py;
    const theta = Math.atan2(uy, ux);
    let nx = ux * cp;
    let ny = uy * cp;
    let nz = sp;
    if (mat === KNURL) {
      // Fine straight knurling: the normal rocks round the ring.
      const rock = Math.sin(theta * 36) * 0.45;
      const tx = -uy;
      const ty = ux;
      nx += tx * rock;
      ny += ty * rock;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
    }
    const ndv = nx * VIEW[0] + ny * VIEW[1] + nz * VIEW[2];
    const rx = 2 * ndv * nx - VIEW[0];
    const ry = 2 * ndv * ny - VIEW[1];
    const rz = 2 * ndv * nz - VIEW[2];
    const env = studio(rx, ry, rz, dark);
    const ndl = Math.max(0, nx * LKEY[0] + ny * LKEY[1] + nz * LKEY[2]);
    let r: number;
    let g: number;
    let b: number;
    if (mat === WOOD) {
      // Walnut under lacquer: grain streaks along the handle, a clear coat that reflects the studio.
      const grain = 1 + 0.16 * Math.sin(theta * 5 + 0.4) + 0.09 * Math.sin(theta * 13 + 1.9) + 0.06 * Math.sin(theta * 29 + 0.7);
      const light = (dark ? 0.2 : 0.26) + 1.15 * ndl * exposure + (dark ? 0.02 : 0.1) * Math.max(0, -nz);
      const f = 1 - Math.max(0, ndv);
      const coat = (0.035 + 0.6 * f * f * f * f * f) * env * 0.9;
      r = 0.1 * grain * light + coat;
      g = 0.048 * grain * light + coat * 0.94;
      b = 0.022 * grain * light + coat * 0.86;
    } else {
      // Brass: mostly what it reflects, warm-tinted, with a little patina.
      const groove = mat === KNURL ? 0.62 + 0.38 * (0.5 + 0.5 * Math.cos(theta * 36)) : 1;
      const e = env * exposure * groove;
      r = 0.86 * e + 0.05 * ndl;
      g = 0.63 * e + 0.035 * ndl;
      b = 0.27 * e + 0.015 * ndl;
    }
    stops.push([i / (count - 1), `rgb(${toSrgb(r)}, ${toSrgb(g)}, ${toSrgb(b)})`]);
  }
  return { axis: [ax, ay], stops };
}

type StampKit = {
  samples: StampSample[];
  gradients: Map<number, CanvasGradient>;
  medallion: HTMLCanvasElement;
  /** Shadow while standing (contact-hardened) and in the air (all soft), with the base's place in them. */
  shadowStand: HTMLCanvasElement;
  shadowAir: HTMLCanvasElement;
  shadowAnchor: [number, number];
};

/* ---------------------------------------------------------------------- */
/* the scene                                                               */
/* ---------------------------------------------------------------------- */

export type LetterCopy = {
  /** "14 Oct, 14:32": when it was sealed (may be empty). */
  date: string;
  title: string;
  body: string;
  sign: string;
};

export type ShardBody = {
  shape: ShardShape;
  /** On the flap (swings open with it), on the pocket (stays), or a crumb that popped off. */
  role: "flap" | "pocket" | "crumb";
  x: number; // CSS px from where it broke off
  y: number;
  z: number; // height above the paper (CSS px)
  vx: number;
  vy: number;
  vz: number;
  angle: number;
  spin: number;
  /** Where a piece that stays settles to (CSS px). */
  tx: number;
  ty: number;
  alpha: number;
  landed: number; // seconds since it first touched down (-1 in the air)
  bounced: boolean;
};

/** The stamp: where its base is, how high the face is off the paper, how it tilts, how squashed. */
export type StampPose = { x: number; y: number; z: number; shearX: number; shearY: number; squash: number };

/** A drop of molten wax on its way down (scene px; z is its height above the paper). */
export type Drop = { x: number; y: number; z: number; size: number; vz: number };

export type View = {
  shakeX: number;
  shakeY: number;
  /** Flap tip lifted off the pocket (0 pressed flat … 1 resting loose). */
  lift: number;
  /** Flap angle: 0 closed … π open flat. */
  flap: number;
  /** Letter out of the envelope (0 … 1, may overshoot a little). */
  letter: number;
  /** Camera pulled back for the letter (0 … 1). */
  camera: number;
  /** Envelope press (a tiny squash when the stamp lands). */
  press: number;
  wax: { alpha: number; scale: number; lift: number } | null;
  /** Crack progress 0 … 1 (null: none). */
  cracks: number | null;
  shards: ShardBody[] | null;
  /** Fade of the broken pieces (closing). */
  shardAlpha: number;
  stamp: StampPose;
  drops: Drop[];
  /** The envelope (and all on it) slid across the table: offset and turn, about its centre. */
  sheet: { x: number; y: number; angle: number };
};

export const restView = (): View => ({
  shakeX: 0,
  shakeY: 0,
  lift: 1,
  flap: 0,
  letter: 0,
  camera: 0,
  press: 0,
  wax: null,
  cracks: null,
  shards: null,
  shardAlpha: 1,
  stamp: { x: 0, y: 0, z: 0, shearX: 0, shearY: 0, squash: 0 },
  drops: [],
  sheet: { x: 0, y: 0, angle: 0 },
});

type Layers = {
  shadow: Layer;
  interior: Layer;
  pocket: Layer;
  flapOuter: Layer;
  flapInner: Layer;
  flapShadow: Layer;
  letterShadow: Layer;
};

export class Scene {
  readonly ctx: CanvasRenderingContext2D;
  layout: Layout;
  theme: PieceTheme;
  private layers: Layers | null = null;
  private letterLayer: Layer | null = null;
  private letterCopy: LetterCopy | null = null;
  private stamp: StampKit | null = null;
  private dropSprite: HTMLCanvasElement | null = null;
  private dotSprite: HTMLCanvasElement | null = null;
  private crackClip: { R: number; path: Path2D } | null = null;
  private font = "system-ui, sans-serif";
  private shadowColor = "rgb(52, 36, 24)";
  wax: Wax | null = null;
  crackLines: CrackLine[] = [];
  /** The camera of the last frame: device px = m × scene px + (ex, ey). */
  private readonly cam = { m: 1, ex: 0, ey: 0, zoom: 1, fx: 0, fy: 0 };

  constructor(ctx: CanvasRenderingContext2D, layout: Layout, theme: PieceTheme) {
    this.ctx = ctx;
    this.layout = layout;
    this.theme = theme;
    this.shadowColor = this.shadowRGB();
    try {
      const family = getComputedStyle(document.body).fontFamily;
      if (family) this.font = family;
    } catch {}
  }

  get paper(): Paper {
    return PAPERS[this.theme];
  }

  private shadowRGB() {
    const [r, g, b] = this.paper.shadow;
    return `rgb(${r}, ${g}, ${b})`;
  }

  /** Shadow colours for the wax and its pieces (baked into their canvases). */
  waxShadow(): { soft: string; contact: string } {
    const k = this.paper.shadowAlpha;
    return { soft: rgba(this.paper.shadow, 0.22 * k), contact: rgba(this.paper.shadow, 0.34 * k) };
  }

  setLayout(layout: Layout) {
    this.layout = layout;
    this.layers = null;
    this.letterLayer = null;
    this.stamp = null;
    this.dropSprite = null;
    this.dotSprite = null;
    this.crackClip = null;
  }

  setTheme(theme: PieceTheme) {
    if (theme === this.theme) return;
    this.theme = theme;
    this.shadowColor = this.shadowRGB();
    this.layers = null;
    this.letterLayer = null;
    this.stamp = null;
  }

  /** Fonts arrived: the letter is drawn again with Geist. */
  refreshFont() {
    try {
      const family = getComputedStyle(document.body).fontFamily;
      if (family) this.font = family;
    } catch {}
    this.letterLayer = null;
  }

  setLetter(copy: LetterCopy | null) {
    const c = this.letterCopy;
    if (copy && c && copy.date === c.date && copy.body === c.body && copy.title === c.title && copy.sign === c.sign) return;
    this.letterCopy = copy;
    this.letterLayer = null;
  }

  setCracks(lines: CrackLine[]) {
    this.crackLines = lines;
    this.crackClip = null;
  }

  /* -------------------------------------------------------------------- */
  /* geometry                                                              */
  /* -------------------------------------------------------------------- */

  /** Seal centre in scene px. */
  sealCentre(view: View): [number, number] {
    const { W, H, x, y } = this.layout;
    return [x + W / 2 + view.shakeX, y + H * ENVELOPE.seal + view.shakeY];
  }

  /** Canvas CSS px → scene px (for input, not per frame). */
  toScene(view: View, sx: number, sy: number): [number, number] {
    const L = this.layout;
    const c = view.camera;
    const zoom = lerp(1, L.open.zoom, c);
    const [ax, ay] = L.anchor;
    return [lerp(ax, L.open.x, c) + (sx - ax) / zoom, lerp(ay, L.open.y, c) + (sy - ay) / zoom];
  }

  /** Is the point (canvas CSS px) over the closed envelope? */
  overEnvelope(px: number, py: number, view: View): boolean {
    const [x, y] = this.toScene(view, px, py);
    const L = this.layout;
    return x >= L.x && x <= L.x + L.W && y >= L.y && y <= L.y + L.H;
  }

  /** Is the point (canvas CSS px) over the stamp where it stands? */
  overStamp(px: number, py: number, view: View): boolean {
    const [x, y] = this.toScene(view, px, py);
    const L = this.layout;
    const pose = view.stamp;
    const [tx, ty] = this.project(pose.x, pose.y, pose.z + STAMP_TOP * L.rs);
    // The face, or within the handle's width of the line from the base to the top.
    const dx = tx - pose.x;
    const dy = ty - pose.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((x - pose.x) * dx + (y - pose.y) * dy) / len2);
    const d = Math.hypot(x - (pose.x + dx * t), y - (pose.y + dy * t));
    return d <= L.rs * lerp(1.02, 0.66, t);
  }

  /** A point at height z above the paper at (x, y), through the shifted lens. */
  project(x: number, y: number, z: number): [number, number, number] {
    const { eye } = this.layout;
    const s = eye.d / Math.max(1, eye.d - z);
    return [x + (x - eye.x) * (s - 1), y + (y - eye.y) * (s - 1), s];
  }

  /** The flap's edge across the seal (seal units, left to right, lowest at the tip), for the crack. */
  flapEdge(): Array<[number, number]> {
    const { W, H, R } = this.layout;
    const tipY = H * ENVELOPE.flapTip - H * ENVELOPE.seal;
    const k = (H * ENVELOPE.flapTip) / (W / 2); // slope of the edges
    const rr = W * ENVELOPE.tipRound;
    const len = Math.hypot(1, k);
    const dLx = -1 / len;
    const dLy = -k / len;
    // The rounded tip: a circle tangent to both edges.
    const cy = tipY - rr * len;
    const reach = rr * k;
    const plx = dLx * reach;
    const ply = tipY + dLy * reach;
    const aL = Math.atan2(ply - cy, plx);
    const aR = Math.PI - aL;
    const far = R * 2.2;
    const points: Array<[number, number]> = [[dLx * far, tipY + dLy * far]];
    for (let i = 0; i <= 6; i++) {
      const a = lerp(aL, aR, i / 6);
      points.push([Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    points.push([-dLx * far, tipY + dLy * far]);
    return points.map(([px, py]) => [px / R, py / R] as [number, number]);
  }

  /* -------------------------------------------------------------------- */
  /* layers                                                                */
  /* -------------------------------------------------------------------- */

  private build(): Layers {
    const { W, H, dpr } = this.layout;
    const p = this.paper;
    const theme = this.theme;
    const body = bodyPath(W, H);
    const flap = flapPath(W, H);
    const notch = notchPath(W, H);
    const pocket = pocketPath(W, H);
    const bottomFlap = bottomFlapPath(W, H);
    const tipY = H * ENVELOPE.flapTip;
    const notchY = H * ENVELOPE.notch;
    const shadow = p.shadow;
    const k = p.shadowAlpha;
    const big = clamp(W / 420, 1, 1.6);

    // Broad light across the whole envelope: brighter upper left.
    const lightSweep = (ctx: CanvasRenderingContext2D, strength = 1) => {
      const g = ctx.createLinearGradient(0, 0, W * 0.8, H * 1.1);
      g.addColorStop(0, theme === "light" ? `rgba(255, 255, 255, ${0.22 * strength})` : `rgba(255, 240, 220, ${0.07 * strength})`);
      g.addColorStop(0.55, "rgba(255, 255, 255, 0)");
      g.addColorStop(1, rgba(shadow, (theme === "light" ? 0.05 : 0.1) * strength));
      ctx.fillStyle = g;
      ctx.fillRect(-4, -4, W + 8, H + 8);
    };
    const grain = (ctx: CanvasRenderingContext2D, ox: number, oy: number, alpha = 1) => {
      const pattern = paperPattern(ctx, theme, dpr, ox, oy);
      if (!pattern) return;
      ctx.save();
      ctx.globalAlpha = p.grain * alpha;
      ctx.fillStyle = pattern;
      ctx.fillRect(-4, -4, W + 8, H + 8);
      ctx.restore();
    };

    // The envelope's shadow on the table: a wide soft one and a close contact one.
    const shadowLayer = makeLayer(W, H, 48, dpr, (ctx) => {
      softFill(ctx, body, rgba(shadow, 0.12 * k), 26 * big, 3 * big, 10 * big, dpr);
      softFill(ctx, body, rgba(shadow, 0.1 * k), 7 * big, 1, 3 * big, dpr);
      softFill(ctx, body, rgba(shadow, 0.12 * k), 1.5, 0, 0.8, dpr);
    });

    // Inside: the lining, in the shade of the pocket.
    const interior = makeLayer(W, H, 2, dpr, (ctx) => {
      ctx.save();
      ctx.clip(body);
      ctx.fillStyle = p.paper;
      ctx.fillRect(0, 0, W, H);
      const m = W * 0.03;
      ctx.fillStyle = p.liner;
      ctx.fillRect(m, m * 0.8, W - m * 2, H - m * 1.8);
      lattice(ctx, m, m * 0.8, W - m * 2, H - m * 1.8, W * 0.022, p.linerLine);
      grain(ctx, 37, 91, 0.7);
      // Deeper in, darker.
      const g = ctx.createLinearGradient(0, 0, 0, notchY);
      g.addColorStop(0, rgba(shadow, 0.08 * k));
      g.addColorStop(1, rgba(shadow, 0.32 * k));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Contact shadow under the side flaps' edges.
      ctx.save();
      ctx.clip(notch);
      ctx.lineWidth = 3;
      ctx.strokeStyle = rgba(shadow, 0.3 * k);
      ctx.shadowColor = rgba(shadow, 0.35 * k);
      ctx.shadowBlur = 6 * dpr;
      ctx.beginPath();
      ctx.moveTo(-2, 1);
      ctx.lineTo(W / 2, notchY + 1);
      ctx.lineTo(W + 2, 1);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    });

    // The back of the envelope: side flaps under the bottom flap.
    const pocketLayer = makeLayer(W, H, 2, dpr, (ctx) => {
      ctx.save();
      ctx.clip(pocket, "evenodd");
      ctx.fillStyle = p.paper;
      ctx.fillRect(0, 0, W, H);
      grain(ctx, 0, 0);
      // side flaps sit a layer lower: a touch darker
      ctx.fillStyle = rgba(shadow, theme === "light" ? 0.025 : 0.06);
      ctx.fillRect(0, 0, W, H);
      // contact shade along the bottom flap's edges, on the side flaps
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rgba(shadow, 0.16 * k);
      ctx.shadowColor = rgba(shadow, 0.18 * k);
      ctx.shadowBlur = 3 * dpr;
      ctx.shadowOffsetY = -0.5 * dpr;
      ctx.stroke(bottomFlap);
      ctx.restore();
      // the bottom flap
      ctx.save();
      ctx.clip(bottomFlap);
      ctx.fillStyle = p.paper;
      ctx.fillRect(0, 0, W, H);
      grain(ctx, 211, 57);
      ctx.restore();
      // hairline of light along its edges (they face the light)
      ctx.save();
      ctx.clip(bottomFlap);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = p.light;
      ctx.beginPath();
      ctx.moveTo(-2, H + 2);
      ctx.lineTo(W / 2, notchY + 0.6);
      ctx.lineTo(W + 2, H + 2);
      ctx.stroke();
      ctx.restore();
      lightSweep(ctx);
      // top edges of the side flaps (seen when the flap is open)
      ctx.lineWidth = 1;
      ctx.strokeStyle = p.light;
      ctx.beginPath();
      ctx.moveTo(0, 0.5);
      ctx.lineTo(W / 2, notchY + 0.5);
      ctx.lineTo(W, 0.5);
      ctx.stroke();
      // paper edge
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(shadow, 0.12 * k);
      ctx.stroke(body);
      ctx.restore();
    });

    // The flap, outside: the fold along the top catches the light.
    const flapOuter = makeLayer(W, tipY, 3, dpr, (ctx) => {
      ctx.save();
      ctx.clip(flap);
      ctx.fillStyle = p.paper;
      ctx.fillRect(0, 0, W, H);
      grain(ctx, 123, 301);
      lightSweep(ctx, 1.1);
      ctx.fillStyle = theme === "light" ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 240, 220, 0.025)";
      ctx.fillRect(0, 0, W, tipY);
      // the fold: a rounded edge, bright on top, a soft shade just below
      const fold = ctx.createLinearGradient(0, 0, 0, Math.max(6, H * 0.06));
      fold.addColorStop(0, theme === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 244, 228, 0.32)");
      fold.addColorStop(0.18, theme === "light" ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 244, 228, 0.09)");
      fold.addColorStop(0.45, rgba(shadow, 0.035 * k));
      fold.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fold;
      ctx.fillRect(0, 0, W, H * 0.06 + 6);
      // its lower edges face away from the light
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = rgba(shadow, 0.14 * k);
      ctx.stroke(flap);
      if (theme === "dark") {
        // at night a faint rim of lamplight just inside that edge keeps the fold legible
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = "rgba(255, 244, 228, 0.045)";
        ctx.stroke(flap);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = rgba(shadow, 0.14 * k);
        ctx.stroke(flap);
      }
      ctx.restore();
    });

    // The flap, inside: the lining with a margin of paper.
    const flapInner = makeLayer(W, tipY, 3, dpr, (ctx) => {
      ctx.save();
      ctx.clip(flap);
      ctx.fillStyle = p.paper;
      ctx.fillRect(0, 0, W, H);
      const inset = W * 0.035;
      const liner = new Path2D();
      liner.moveTo(inset * 1.6, inset * 0.7);
      liner.lineTo(W - inset * 1.6, inset * 0.7);
      liner.arcTo(W / 2, tipY - inset * 1.25, inset * 1.6, inset * 0.7, W * ENVELOPE.tipRound * 0.8);
      liner.closePath();
      ctx.save();
      ctx.clip(liner);
      ctx.fillStyle = p.liner;
      ctx.fillRect(0, 0, W, tipY);
      lattice(ctx, 0, 0, W, tipY, W * 0.022, p.linerLine);
      ctx.restore();
      grain(ctx, 401, 17, 0.8);
      lightSweep(ctx, 0.7);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = rgba(shadow, 0.12 * k);
      ctx.stroke(flap);
      ctx.restore();
    });

    // The flap's shadow (drawn per frame with an offset that follows the lift).
    const flapShadow = makeLayer(W, tipY, 16, dpr, (ctx) => {
      softFill(ctx, flap, rgba(shadow, 0.2 * k), 5 * big, 0, 0, dpr);
    });

    const { w: lw, h: lh } = this.layout.letter;
    const card = new Path2D();
    card.roundRect(0, 0, lw, lh, Math.max(2, W * 0.008));
    const letterShadow = makeLayer(lw, lh, 18, dpr, (ctx) => {
      softFill(ctx, card, rgba(shadow, 0.12 * k), 9, 1, 4, dpr);
      softFill(ctx, card, rgba(shadow, 0.14 * k), 1.6, 0, 0.6, dpr);
    });

    return { shadow: shadowLayer, interior, pocket: pocketLayer, flapOuter, flapInner, flapShadow, letterShadow };
  }

  private buildLetter(): Layer {
    const { dpr, W, tile } = this.layout;
    const { w, h } = this.layout.letter;
    const p = this.paper;
    const copy = this.letterCopy;
    const theme = this.theme;
    const font = this.font;
    return makeLayer(w, h, 1, dpr, (ctx) => {
      const card = new Path2D();
      card.roundRect(0, 0, w, h, Math.max(2, W * 0.008));
      ctx.save();
      ctx.clip(card);
      ctx.fillStyle = p.letter;
      ctx.fillRect(0, 0, w, h);
      const pattern = paperPattern(ctx, "light", dpr, 77, 13);
      if (pattern) {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      const g = ctx.createLinearGradient(0, 0, w * 0.7, h);
      g.addColorStop(0, "rgba(255, 255, 255, 0.35)");
      g.addColorStop(1, theme === "light" ? "rgba(80, 56, 32, 0.05)" : "rgba(40, 28, 16, 0.12)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (copy) {
        // Type scales with the envelope (tiny print on the tile).
        const s = tile ? W / 380 : clamp(W / 430, 0.78, 1.3);
        const floor = (v: number, min: number) => (tile ? v : Math.max(min, v));
        const pad = Math.round(w * 0.075);
        const ink = p.ink;
        const small = floor(Math.round(11 * s * 2) / 2, 9);
        let y = pad;
        ctx.textBaseline = "alphabetic";
        // header: the mark, "sealed." and the date
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.78;
        drawMark(ctx, pad, y, small);
        ctx.font = `600 ${small}px ${font}`;
        ctx.fillText("sealed.", pad + small * 1.45, y + small * 0.86);
        if (copy.date) {
          ctx.globalAlpha = 0.5;
          ctx.font = `400 ${small}px ${font}`;
          ctx.textAlign = "right";
          ctx.fillText(copy.date, w - pad, y + small * 0.86);
          ctx.textAlign = "left";
        }
        y += small * 1.9;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(pad, Math.round(y), w - pad * 2, 1);
        y += small * 1.9;
        // title
        const title = floor(Math.round(16.5 * s * 2) / 2, 12);
        ctx.globalAlpha = 0.92;
        ctx.font = `500 ${title}px ${font}`;
        for (const line of wrap(ctx, copy.title, w - pad * 2)) {
          ctx.fillText(line, pad, y);
          y += title * 1.32;
        }
        y += title * 0.28;
        // body
        const text = floor(Math.round(12.75 * s * 2) / 2, 10.5);
        if (copy.body) {
          ctx.globalAlpha = 0.68;
          ctx.font = `400 ${text}px ${font}`;
          for (const line of wrap(ctx, copy.body, w - pad * 2)) {
            ctx.fillText(line, pad, y);
            y += text * 1.55;
          }
          y += text * 0.45;
        }
        if (copy.sign) {
          ctx.globalAlpha = 0.85;
          ctx.font = `500 ${text}px ${font}`;
          ctx.fillText(copy.sign, pad, y);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(60, 40, 20, 0.12)";
      ctx.stroke(card);
    });
  }

  /** The stamp's slices, gradients, medallion and shadows (once per size and theme). */
  private buildStamp(): StampKit {
    const { dpr, rs } = this.layout;
    const dark = this.theme === "dark";
    const ctx = this.ctx;
    const samples = stampSamples();
    const gradients = new Map<number, CanvasGradient>();
    for (const sample of samples) {
      if (gradients.has(sample.key)) continue;
      const mat = Math.floor(sample.key / 128);
      const phi = (sample.key % 128) * 2.5 - 90;
      const { axis, stops } = stampStops(mat, phi, dark);
      const g = ctx.createLinearGradient(-axis[0], -axis[1], axis[0], axis[1]);
      for (const [at, color] of stops) g.addColorStop(at, color);
      gradients.set(sample.key, g);
    }

    // The medallion on top: a brass disc with the mark standing up from it.
    const mr = MEDALLION * rs * 1.3;
    const medallion = makeLayer(mr * 2, mr * 2, 1, dpr, (m) => {
      const c = mr;
      const disc = m.createRadialGradient(c - mr * 0.4, c - mr * 0.5, mr * 0.05, c, c, mr);
      disc.addColorStop(0, dark ? "#e6c98a" : "#f6dea0");
      disc.addColorStop(0.55, dark ? "#a98446" : "#c39a52");
      disc.addColorStop(1, dark ? "#5c4219" : "#715223");
      m.beginPath();
      m.arc(c, c, mr, 0, Math.PI * 2);
      m.fillStyle = disc;
      m.fill();
      // a turned bevel
      m.lineWidth = mr * 0.12;
      const bevel = m.createLinearGradient(c - mr, c - mr, c + mr, c + mr);
      bevel.addColorStop(0, "rgba(255, 246, 214, 0.75)");
      bevel.addColorStop(0.5, "rgba(255, 246, 214, 0.05)");
      bevel.addColorStop(1, "rgba(40, 24, 4, 0.6)");
      m.strokeStyle = bevel;
      m.beginPath();
      m.arc(c, c, mr - m.lineWidth / 2, 0, Math.PI * 2);
      m.stroke();
      // the mark in relief: a shadow below right, a lit edge above left
      const size = mr * 1.05;
      const ox = c - size / 2;
      const oy = c - size / 2 - mr * 0.02;
      m.fillStyle = "rgba(50, 30, 6, 0.55)";
      drawMark(m, ox + mr * 0.035, oy + mr * 0.05, size);
      m.fillStyle = "rgba(255, 244, 210, 0.85)";
      drawMark(m, ox - mr * 0.02, oy - mr * 0.025, size);
      m.fillStyle = dark ? "#c7a362" : "#dab66c";
      drawMark(m, ox, oy, size);
    }).canvas;

    // Shadows: slices of the profile projected along the light, sharper near the paper.
    const top = STAMP_TOP * rs;
    const ext = [rs * 1.4 + 24, rs * 1.4 + 24, top * SHADOW_DX + rs * 1.4 + 30, top * SHADOW_DY + rs * 1.4 + 30];
    const k = this.paper.shadowAlpha;
    const shadow = this.paper.shadow;
    const w = ext[0] + ext[2];
    const h = ext[1] + ext[3];
    const unit = rs / 40;
    const circles = (from: number, to: number) => {
      const path = new Path2D();
      for (let z = from; z <= to + 1e-6; z += 0.06) {
        const r = profileRadius(z) * rs;
        if (r <= 0) continue;
        const hz = z * rs;
        path.moveTo(hz * SHADOW_DX + r, hz * SHADOW_DY);
        path.arc(hz * SHADOW_DX, hz * SHADOW_DY, r, 0, Math.PI * 2);
      }
      return path;
    };
    const bands: Array<[number, number, number, number]> = [
      // from, to (face radii), blur (× unit), alpha
      [3.4, STAMP_TOP, 12, 0.13],
      [2.2, 3.4, 9, 0.15],
      [1.1, 2.2, 6, 0.17],
      [0.35, 1.1, 3.5, 0.2],
      [0, 0.35, 2, 0.24],
    ];
    const shadowStand = makeLayer(w, h, 0, dpr, (s) => {
      s.translate(ext[0], ext[1]);
      for (const [from, to, blur, alpha] of bands) softFill(s, circles(from, to), rgba(shadow, alpha * k), blur * unit, 0, 0, dpr);
      // contact: the brass rim right on the paper
      const base = new Path2D();
      base.arc(0.4 * unit, 0.7 * unit, rs * 0.98, 0, Math.PI * 2);
      softFill(s, base, rgba(shadow, 0.3 * k), 1.6 * unit, 0, 0, dpr);
    }).canvas;
    const shadowAir = makeLayer(w, h, 0, dpr, (s) => {
      s.translate(ext[0], ext[1]);
      softFill(s, circles(0, STAMP_TOP), rgba(shadow, 0.2 * k), 14 * unit, 0, 0, dpr);
    }).canvas;
    return { samples, gradients, medallion, shadowStand, shadowAir, shadowAnchor: [ext[0], ext[1]] };
  }

  /** A glossy drop of molten wax, and a soft dot for its shadow. */
  private buildDrops() {
    const size = 32;
    this.dropSprite = makeLayer(size, size, 0, 2, (c) => {
      const r = size / 2;
      const body = c.createRadialGradient(r * 0.72, r * 0.62, r * 0.08, r, r, r);
      body.addColorStop(0, "#e2413f");
      body.addColorStop(0.45, "#a3141d");
      body.addColorStop(0.85, "#5e0710");
      body.addColorStop(1, "#3c040a");
      c.beginPath();
      c.arc(r, r, r, 0, Math.PI * 2);
      c.fillStyle = body;
      c.fill();
      const hi = c.createRadialGradient(r * 0.66, r * 0.58, 0, r * 0.66, r * 0.58, r * 0.34);
      hi.addColorStop(0, "rgba(255, 236, 228, 0.95)");
      hi.addColorStop(1, "rgba(255, 236, 228, 0)");
      c.fillStyle = hi;
      c.fillRect(0, 0, size, size);
    }).canvas;
    this.dotSprite = makeLayer(size, size, 0, 2, (c) => {
      const r = size / 2;
      const g = c.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, "rgba(0, 0, 0, 1)");
      g.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = g;
      c.fillRect(0, 0, size, size);
    }).canvas;
  }

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  draw(view: View) {
    const ctx = this.ctx;
    const L = this.layout;
    const { dpr, W, H } = L;
    if (!this.layers) this.layers = this.build();
    const layers = this.layers;
    const p = this.paper;
    const k = p.shadowAlpha;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingQuality = "high";

    // Camera: device px = m × scene px + (ex, ey).
    const cam = this.cam;
    const zoom = lerp(1, L.open.zoom, view.camera);
    const fx = lerp(L.anchor[0], L.open.x, view.camera);
    const fy = lerp(L.anchor[1], L.open.y, view.camera);
    const m = dpr * zoom;
    const ex = dpr * (L.anchor[0] - fx * zoom);
    const ey = dpr * (L.anchor[1] - fy * zoom);
    cam.m = m;
    cam.ex = ex;
    cam.ey = ey;
    cam.zoom = zoom;
    cam.fx = fx;
    cam.fy = fy;
    ctx.setTransform(m, 0, 0, m, ex, ey);

    const sheet = view.sheet;
    const moved = sheet.x !== 0 || sheet.y !== 0 || sheet.angle !== 0;
    const still = view.camera < 1e-4 && !moved;
    const snap = (v: number) => (still ? Math.round(v * dpr) / dpr : v);
    const ox = snap(L.x + view.shakeX);
    const oy = snap(L.y + view.shakeY);
    const sealY = H * ENVELOPE.seal;

    const put = (layer: Layer, x: number, y: number) =>
      ctx.drawImage(layer.canvas, x - layer.pad, y - layer.pad, layer.w, layer.h);

    // The envelope and everything on it, slid across the table when it is swapped for a fresh one.
    ctx.save();
    if (moved) {
      const cx = L.x + W / 2;
      const cy = L.y + H / 2;
      ctx.translate(cx + sheet.x, cy + sheet.y);
      ctx.rotate(sheet.angle);
      ctx.translate(-cx, -cy);
    }

    // A tiny squash when the stamp lands (the whole sheet gives a little).
    ctx.save();
    if (view.press) {
      const s = 1 - view.press * 0.006;
      const cx = ox + W / 2;
      const cy = oy + sealY;
      ctx.translate(cx, cy);
      ctx.scale(1 + view.press * 0.003, s);
      ctx.translate(-cx, -cy);
    }

    put(layers.shadow, ox, oy);

    const open = view.flap > 0.001 || view.letter > 0.001;
    if (open) put(layers.interior, ox, oy);

    const tipY = H * ENVELOPE.flapTip;
    const cos = Math.cos(view.flap);
    const sin = Math.sin(view.flap);

    // Flap past upright: lying back above the envelope, inside up.
    if (view.flap > Math.PI / 2) {
      const sy = -cos; // 0 … 1
      ctx.save();
      ctx.globalAlpha = clamp(sy * 1.3);
      ctx.translate(ox, oy);
      ctx.scale(1, -sy);
      ctx.translate(0, -0.5);
      const fs = layers.flapShadow;
      ctx.drawImage(fs.canvas, -fs.pad + 1, -fs.pad - 1 - sin * tipY * 0.25, fs.w, fs.h);
      ctx.restore();
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(1, -sy);
      put(layers.flapInner, 0, 0);
      // facing the light more as it lies down
      ctx.globalAlpha = (0.16 * (1 - sy) + 0.02) * k;
      ctx.fillStyle = this.shadowColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W / 2, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // the crease where it folds
      ctx.globalAlpha = 0.2 * k;
      ctx.fillStyle = this.shadowColor;
      ctx.fillRect(ox + 1, oy - 0.5, W - 2, 1);
      ctx.globalAlpha = 1;
    }

    // The letter, between the lining and the pocket.
    if (view.letter > 0.001) {
      const lt = L.letter;
      const lx = snap(ox + lt.x);
      const ly = snap(oy + lt.y - view.letter * L.rise);
      if (!this.letterLayer) this.letterLayer = this.buildLetter();
      put(layers.letterShadow, lx, ly);
      put(this.letterLayer, lx, ly);
    }

    put(layers.pocket, ox, oy);

    // Flap closed or rising: outside up, foreshortened as it lifts.
    if (view.flap <= Math.PI / 2) {
      const lift = clamp(view.lift);
      // its shadow on the pocket: longer as the tip lifts or the flap rises
      ctx.save();
      ctx.globalAlpha = clamp(0.75 + 0.25 * lift - sin * 0.3);
      ctx.translate(ox, oy);
      ctx.scale(1, Math.max(0.02, cos));
      const fs = layers.flapShadow;
      const drop = 1.5 + lift * 2.6 + sin * tipY * 0.45;
      ctx.drawImage(fs.canvas, -fs.pad + 0.6 + lift * 0.8, -fs.pad + drop / Math.max(0.2, cos), fs.w, fs.h);
      ctx.restore();

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(1, Math.max(0.005, cos));
      put(layers.flapOuter, 0, 0);
      if (sin > 0.001) {
        // tilting away from the light as it rises
        ctx.globalAlpha = sin * 0.22 * k;
        ctx.fillStyle = this.shadowColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W / 2, tipY);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // the half of the seal stuck to the flap goes up with it
      if (view.shards) this.drawPieces(view.shards, "flap", W / 2, sealY, view.shardAlpha);
      ctx.restore();
    }
    ctx.restore();

    const sx = ox + W / 2;
    const sy = oy + sealY;
    if (view.wax && this.wax) this.drawWax(sx, sy, view);
    if (view.shards) {
      this.drawPieces(view.shards, "pocket", sx, sy, view.shardAlpha);
      this.drawPieces(view.shards, "crumb", sx, sy, view.shardAlpha);
    }
    ctx.restore();
    if (view.drops.length) this.drawDrops(view.drops);
    this.drawStamp(view.stamp);
    ctx.globalAlpha = 1;
  }

  private drawWax(sx: number, sy: number, view: View) {
    const ctx = this.ctx;
    const wax = this.wax;
    const look = view.wax;
    if (!wax || !look || look.alpha <= 0) return;
    const { R } = this.layout;
    const size = R * EXTENT * 2;
    const f = size / wax.size; // CSS px per wax pixel
    const s = look.scale * (1 + look.lift * 0.02);
    const lift = look.lift;
    const u = R / 54;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(s, s);
    // its shadow: further off and softer-looking as the hover lifts it a little
    const pad = wax.shadowPad * f;
    ctx.globalAlpha = look.alpha * (1 - lift * 0.2);
    const grow = 1 + lift * 0.03;
    ctx.drawImage(
      wax.shadow,
      -size / 2 - pad + lift * 1.6 * u,
      -size / 2 - pad + lift * 2.6 * u,
      (wax.size + wax.shadowPad * 2) * f * grow,
      (wax.size + wax.shadowPad * 2) * f * grow,
    );
    ctx.globalAlpha = look.alpha;
    ctx.drawImage(wax.canvas, -size / 2, -size / 2, size, size);

    // Cracks running out from the blow before the pieces part.
    if (view.cracks !== null && this.crackLines.length) {
      if (!this.crackClip || this.crackClip.R !== R) {
        const path = new Path2D();
        wax.outline(72).forEach(([x, y], i) => (i ? path.lineTo(x * R, y * R) : path.moveTo(x * R, y * R)));
        path.closePath();
        this.crackClip = { R, path };
      }
      const reach = view.cracks * 1.6;
      ctx.clip(this.crackClip.path);
      ctx.lineCap = "round";
      for (const [x0, y0, x1, y1, d] of this.crackLines) {
        if (d > reach) break;
        const t = clamp((reach - d) / 0.3);
        const ex = lerp(x0, x1, t);
        const ey = lerp(y0, y1, t);
        ctx.lineWidth = Math.max(1, R * 0.032);
        ctx.strokeStyle = "rgba(34, 0, 4, 0.85)";
        ctx.beginPath();
        ctx.moveTo(x0 * R, y0 * R);
        ctx.lineTo(ex * R, ey * R);
        ctx.stroke();
        ctx.lineWidth = Math.max(0.6, R * 0.012);
        ctx.strokeStyle = "rgba(255, 176, 166, 0.45)";
        ctx.beginPath();
        ctx.moveTo(x0 * R - 0.5, y0 * R - 0.7);
        ctx.lineTo(ex * R - 0.5, ey * R - 0.7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** The broken pieces of one role, around (sx, sy) in the current transform. */
  private drawPieces(shards: ShardBody[], role: ShardBody["role"], sx: number, sy: number, fade: number) {
    const ctx = this.ctx;
    const { dpr, R } = this.layout;
    const u = R / 54;
    for (const shard of shards) {
      if (shard.role !== role) continue;
      const alpha = shard.alpha * fade;
      if (alpha <= 0.002) continue;
      const { shape } = shard;
      const w = shape.canvas.width / dpr;
      const h = shape.canvas.height / dpr;
      const x0 = shape.ox / dpr;
      const y0 = shape.oy / dpr;
      const pad = shape.shadowPad / dpr;
      const z = Math.max(0, shard.z);
      const scale = 1 + z * 0.012;
      const cx = sx + shape.cx * R + shard.x;
      const cy = sy + shape.cy * R + shard.y;
      // shadow on the paper: falls further away the higher the piece is
      ctx.save();
      ctx.globalAlpha = alpha * clamp(1 - z * 0.02, 0.4, 1);
      ctx.translate(cx + (0.5 + z * 0.5) * u, cy + (1.1 + z * 0.8) * u);
      ctx.rotate(shard.angle);
      ctx.scale(scale, scale);
      ctx.drawImage(shape.shadow, x0 - pad, y0 - pad, w + pad * 2, h + pad * 2);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.rotate(shard.angle);
      ctx.scale(scale, scale);
      ctx.drawImage(shape.canvas, x0, y0, w, h);
      ctx.restore();
    }
  }

  private drawDrops(drops: Drop[]) {
    const ctx = this.ctx;
    if (!this.dropSprite || !this.dotSprite) this.buildDrops();
    const sprite = this.dropSprite;
    const dot = this.dotSprite;
    if (!sprite || !dot) return;
    const { m, ex, ey } = this.cam;
    const k = this.paper.shadowAlpha;
    for (const drop of drops) {
      const z = Math.max(0, drop.z);
      // its shadow, gathering as it nears the paper
      const spread = drop.size * (1.1 + z * 0.012);
      ctx.globalAlpha = clamp(0.32 * k * (1 - z / 260), 0, 0.5);
      ctx.drawImage(dot, drop.x + z * SHADOW_DX - spread, drop.y + z * SHADOW_DY - spread, spread * 2, spread * 2);
      // the drop, through the lens: bigger and further out while high, stretched by its speed
      const [px, py, s] = this.project(drop.x, drop.y, z);
      // where it was a moment ago (vz < 0 while falling)
      const [qx, qy] = this.project(drop.x, drop.y, z - drop.vz * 0.016);
      const dx = px - qx;
      const dy = py - qy;
      const len = Math.hypot(dx, dy);
      const r = drop.size * s;
      const stretch = 1 + Math.min(2.2, len / Math.max(1, r));
      const ux = len > 1e-3 ? dx / len : 0;
      const uy = len > 1e-3 ? dy / len : 1;
      // rotate so local y runs along the motion; scale y by the stretch
      const a = r * m;
      ctx.setTransform(uy * a, -ux * a, ux * a * stretch, uy * a * stretch, m * px + ex, m * py + ey);
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite, -1, -1, 2, 2);
      ctx.setTransform(m, 0, 0, m, ex, ey);
    }
    ctx.globalAlpha = 1;
  }

  private drawStamp(pose: StampPose) {
    const ctx = this.ctx;
    const L = this.layout;
    if (!UNIT) return;
    if (!this.stamp) this.stamp = this.buildStamp();
    const kit = this.stamp;
    const { rs, eye, dpr } = L;
    const { m, ex, ey } = this.cam;

    // Shadow: crisp and dark where it stands, lifting off soft and wide.
    const lift = Math.max(0, pose.z);
    const ground = clamp(1 - lift / (rs * 0.45));
    const gx = pose.x + lift * SHADOW_DX;
    const gy = pose.y + lift * SHADOW_DY;
    const [ax, ay] = kit.shadowAnchor;
    const sw = kit.shadowStand.width / dpr;
    const sh = kit.shadowStand.height / dpr;
    if (ground > 0.005) {
      ctx.globalAlpha = ground;
      ctx.drawImage(kit.shadowStand, gx - ax, gy - ay, sw, sh);
    }
    if (ground < 0.995) {
      const grow = 1 + lift / (rs * 9);
      ctx.globalAlpha = (1 - ground) * clamp(1 - lift / (rs * 9), 0.25, 1);
      ctx.drawImage(kit.shadowAir, gx - ax * grow, gy - ay * grow, sw * grow, sh * grow);
    }
    ctx.globalAlpha = 1;

    // The body, slice by slice from the face up; a slice is skipped when it would barely move on screen.
    const squash = pose.squash;
    const minStep = 0.75 / m;
    let px = NaN;
    let py = NaN;
    let pr = NaN;
    let pkey = -1;
    const squeeze = 1 - squash * 0.05;
    for (const smp of kit.samples) {
      const hz = pose.z + smp.z * rs * squeeze;
      const s = eye.d / Math.max(1, eye.d - hz);
      const bx = pose.x + pose.shearX * smp.z * rs;
      const by = pose.y + pose.shearY * smp.z * rs;
      const cx = bx + (bx - eye.x) * (s - 1);
      const cy = by + (by - eye.y) * (s - 1);
      const r = smp.r * rs * s * (1 + squash * (smp.z < 1 ? 0.03 : 0.01));
      if (!smp.last && smp.key === pkey && Math.abs(cx - px) + Math.abs(cy - py) + Math.abs(r - pr) < minStep) continue;
      px = cx;
      py = cy;
      pr = r;
      pkey = smp.key;
      const g = kit.gradients.get(smp.key);
      if (!g) continue;
      ctx.setTransform(m * r, 0, 0, m * r, m * cx + ex, m * cy + ey);
      ctx.fillStyle = g;
      ctx.fill(UNIT);
    }

    // The medallion on the flat top.
    const hz = pose.z + STAMP_TOP * rs * squeeze;
    const s = eye.d / Math.max(1, eye.d - hz);
    const bx = pose.x + pose.shearX * STAMP_TOP * rs;
    const by = pose.y + pose.shearY * STAMP_TOP * rs;
    const cx = bx + (bx - eye.x) * (s - 1);
    const cy = by + (by - eye.y) * (s - 1);
    const mr = MEDALLION * rs * s;
    const scale = (mr * m) / (MEDALLION * rs * 1.3 * dpr);
    ctx.setTransform(scale, 0, 0, scale, m * cx + ex, m * cy + ey);
    const half = kit.medallion.width / 2;
    ctx.drawImage(kit.medallion, -half, -half);
    ctx.setTransform(m, 0, 0, m, ex, ey);
  }
}

/** The handle's radius at a height (face radii), for the shadow. */
function profileRadius(z: number): number {
  for (const run of PROFILE) {
    const pts = run.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const [z0, r0] = pts[i];
      const [z1, r1] = pts[i + 1];
      if (z >= z0 && z <= z1) return z1 > z0 ? lerp(r0, r1, (z - z0) / (z1 - z0)) : Math.max(r0, r1);
    }
  }
  return z <= STAMP_TOP ? 0.27 : 0;
}

/** A fine diagonal lattice (the printed lining). */
function lattice(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step: number, color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.6, step * 0.08);
  ctx.beginPath();
  for (let d = -h; d < w + h; d += step) {
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d + h, y + h);
    ctx.moveTo(x + d + h, y);
    ctx.lineTo(x + d, y + h);
  }
  ctx.stroke();
  ctx.restore();
}
