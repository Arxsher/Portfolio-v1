// The scene: an envelope seen from the back lying on the tile, its flap,
// the letter inside, the wax and the stamp, drawn with Canvas 2D.
//
// The paper parts are drawn once per size and theme into device-resolution
// layers (interior, pocket, flap outside, flap inside, letter, and their
// soft shadows); a frame then only composites them, so the canvas costs
// almost nothing at rest and the loop can sleep.
//
// One light for everything, high and to the upper left: the top flap
// casts a soft shadow onto the pocket below its edges, the fold along the
// top catches a highlight, the bottom flap's edges catch a hairline of
// light, and every shadow (envelope, flap, wax, stamp, shards) falls down
// and to the right.

import { clamp, lerp } from "../../hooks";
import type { PieceTheme } from "../../types";
import { paperPattern, PAPERS, type Paper } from "./paper";
import { EXTENT, FACE, type ShardShape, type Wax } from "./wax";

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

export type Layout = {
  width: number;
  height: number;
  dpr: number;
  /** Envelope size and its top-left corner at rest (CSS px). */
  W: number;
  H: number;
  x: number;
  y: number;
  /** Seal radius (CSS px). */
  R: number;
  /** How far the letter slides up, and how far the envelope moves down meanwhile. */
  rise: number;
  shift: number;
  /** The letter inside the envelope (envelope coordinates). */
  letter: { x: number; y: number; w: number; h: number };
};

export function layoutFor(
  width: number,
  height: number,
  dpr: number,
  { top, bottom, tile }: { top: number; bottom: number; tile: boolean },
): Layout {
  const avail = Math.max(60, height - top - bottom);
  let W: number;
  if (tile) {
    W = Math.min(width * 0.7, (avail / ENVELOPE.aspect) * 0.92);
  } else {
    // Room for the letter out of the envelope too (about 1.7 envelope heights).
    W = Math.min(420, width * 0.84, avail / (ENVELOPE.aspect * 1.72));
  }
  W = Math.round(W);
  const H = Math.round(W * ENVELOPE.aspect);
  const x = Math.round((width - W) / 2);
  const y = Math.round(top + (avail - H) / 2);
  const R = Math.round(W * (tile ? 0.16 : 0.132) * 4) / 4;
  const lw = Math.round(W * 0.88);
  const lh = Math.round(H * 0.9);
  const rise = Math.round(H * 0.72);
  return {
    width,
    height,
    dpr,
    W,
    H,
    x,
    y,
    R,
    rise,
    shift: Math.round(rise * 0.5),
    letter: { x: Math.round((W - lw) / 2), y: Math.round(H * 0.06), w: lw, h: lh },
  };
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
 * offsets are in device px (shadows ignore the transform).
 */
function farShadow(ctx: CanvasRenderingContext2D, draw: () => void, color: string, blur: number, dx: number, dy: number) {
  ctx.save();
  const m = ctx.getTransform();
  ctx.setTransform(new DOMMatrix().translateSelf(-FAR, 0).multiplySelf(m));
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

/* ---------------------------------------------------------------------- */
/* letter copy                                                             */
/* ---------------------------------------------------------------------- */

export type LetterCopy = {
  /** "14 Oct, 14:32": when it was sealed. */
  date: string;
  title: string;
  body: string;
  sign: string;
};

const MARK: ReadonlyArray<readonly [number, number, number, number]> = [
  [7, 1, 2, 2],
  [5, 3, 2, 3],
  [9, 3, 2, 3],
  [3, 6, 2, 4],
  [11, 6, 2, 4],
  [1, 10, 2, 5],
  [13, 10, 2, 5],
  [7, 10, 2, 2],
];

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
/* the scene                                                               */
/* ---------------------------------------------------------------------- */

export type ShardBody = {
  shape: ShardShape;
  x: number; // CSS px from the seal centre
  y: number;
  z: number; // height above the paper (CSS px)
  vx: number;
  vy: number;
  vz: number;
  angle: number;
  spin: number;
  alpha: number;
  landed: number; // seconds since it first touched down (-1 in the air)
  bounced: boolean;
};

export type View = {
  shakeX: number;
  shakeY: number;
  /** Flap tip lifted off the pocket (0 pressed flat … 1 resting loose). */
  lift: number;
  /** Flap angle: 0 closed … π open flat. */
  flap: number;
  /** Letter out of the envelope (0 … 1, may overshoot a little). */
  letter: number;
  /** Envelope composition shift (0 … 1). */
  shift: number;
  /** Envelope press (a tiny squash when the stamp lands). */
  press: number;
  wax: { alpha: number; scale: number; lift: number } | null;
  /** Crack progress 0 … 1 (null: none). */
  cracks: number | null;
  shards: ShardBody[] | null;
  stamp: { z: number; alpha: number; squash: number; dx: number; dy: number } | null;
};

export const restView = (): View => ({
  shakeX: 0,
  shakeY: 0,
  lift: 1,
  flap: 0,
  letter: 0,
  shift: 0,
  press: 0,
  wax: null,
  cracks: null,
  shards: null,
  stamp: null,
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
  private stampLayer: Layer | null = null;
  private font = "system-ui, sans-serif";
  wax: Wax | null = null;
  crackLines: Array<[number, number, number, number, number]> = [];

  constructor(ctx: CanvasRenderingContext2D, layout: Layout, theme: PieceTheme) {
    this.ctx = ctx;
    this.layout = layout;
    this.theme = theme;
    try {
      const family = getComputedStyle(document.body).fontFamily;
      if (family) this.font = family;
    } catch {}
  }

  get paper(): Paper {
    return PAPERS[this.theme];
  }

  setLayout(layout: Layout) {
    this.layout = layout;
    this.layers = null;
    this.letterLayer = null;
    this.stampLayer = null;
  }

  setTheme(theme: PieceTheme) {
    if (theme === this.theme) return;
    this.theme = theme;
    this.layers = null;
    this.letterLayer = null;
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
    if (copy && this.letterCopy && copy.date === this.letterCopy.date && copy.body === this.letterCopy.body && copy.title === this.letterCopy.title) return;
    this.letterCopy = copy;
    this.letterLayer = null;
  }

  /** Seal centre in canvas CSS px for a view. */
  sealCentre(view: View): [number, number] {
    const { W, H, x, y, shift } = this.layout;
    return [x + W / 2 + view.shakeX, y + H * ENVELOPE.seal + view.shift * shift + view.shakeY];
  }

  /** Is the point over the envelope (closed footprint)? */
  overEnvelope(px: number, py: number, view: View): boolean {
    const { W, H, x, y, shift } = this.layout;
    const oy = y + view.shift * shift;
    return px >= x && px <= x + W && py >= oy && py <= oy + H;
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

    // Broad light across the whole envelope: brighter upper left.
    const lightSweep = (ctx: CanvasRenderingContext2D, strength = 1) => {
      const g = ctx.createLinearGradient(0, 0, W * 0.8, H * 1.1);
      g.addColorStop(0, theme === "light" ? `rgba(255, 255, 255, ${0.22 * strength})` : `rgba(255, 240, 220, ${0.05 * strength})`);
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

    // The envelope's shadow on the tile: a wide soft one and a close contact one.
    const shadowLayer = makeLayer(W, H, 40, dpr, (ctx) => {
      softFill(ctx, body, rgba(shadow, 0.12 * k), 26, 3, 10, dpr);
      softFill(ctx, body, rgba(shadow, 0.1 * k), 7, 1, 3, dpr);
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
      fold.addColorStop(0, theme === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 244, 228, 0.22)");
      fold.addColorStop(0.18, theme === "light" ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 244, 228, 0.06)");
      fold.addColorStop(0.45, rgba(shadow, 0.035 * k));
      fold.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fold;
      ctx.fillRect(0, 0, W, H * 0.06 + 6);
      // its lower edges face away from the light
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = rgba(shadow, 0.14 * k);
      ctx.stroke(flap);
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
      softFill(ctx, flap, rgba(shadow, 0.2 * k), 5, 0, 0, dpr);
    });

    const { w: lw, h: lh } = this.layout.letter;
    const card = new Path2D();
    card.roundRect(0, 0, lw, lh, Math.max(2, W * 0.008));
    const letterShadow = makeLayer(lw, lh, 18, dpr, (ctx) => {
      softFill(ctx, card, rgba(shadow, 0.12 * k), 9, 1, 4, dpr);
      softFill(ctx, card, rgba(shadow, 0.14 * k), 1.6, 0, 0.6, dpr);
    });

    return {
      shadow: shadowLayer,
      interior,
      pocket: pocketLayer,
      flapOuter,
      flapInner,
      flapShadow,
      letterShadow,
    };
  }

  private buildLetter(): Layer {
    const { dpr, W } = this.layout;
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
      const pattern = paperPattern(ctx, theme === "dark" ? "light" : "light", dpr, 77, 13);
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
        const s = clamp(W / 400, 0.72, 1.1);
        const pad = Math.round(w * 0.075);
        const ink = p.ink;
        const small = Math.max(9, Math.round(11 * s * 2) / 2);
        let y = pad;
        ctx.textBaseline = "alphabetic";
        // header: the mark, "sealed." and the date
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.78;
        drawMark(ctx, pad, y, small);
        ctx.font = `600 ${small}px ${font}`;
        ctx.fillText("sealed.", pad + small * 1.45, y + small * 0.86);
        ctx.globalAlpha = 0.5;
        ctx.font = `400 ${small}px ${font}`;
        ctx.textAlign = "right";
        ctx.fillText(copy.date, w - pad, y + small * 0.86);
        ctx.textAlign = "left";
        y += small * 1.9;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(pad, Math.round(y), w - pad * 2, 1);
        y += small * 1.9;
        // title
        const title = Math.max(12, Math.round(16.5 * s * 2) / 2);
        ctx.globalAlpha = 0.92;
        ctx.font = `500 ${title}px ${font}`;
        for (const line of wrap(ctx, copy.title, w - pad * 2)) {
          ctx.fillText(line, pad, y);
          y += title * 1.32;
        }
        y += title * 0.28;
        // body
        const text = Math.max(10.5, Math.round(12.75 * s * 2) / 2);
        ctx.globalAlpha = 0.68;
        ctx.font = `400 ${text}px ${font}`;
        for (const line of wrap(ctx, copy.body, w - pad * 2)) {
          ctx.fillText(line, pad, y);
          y += text * 1.55;
        }
        y += text * 0.45;
        ctx.globalAlpha = 0.85;
        ctx.font = `500 ${text}px ${font}`;
        ctx.fillText(copy.sign, pad, y);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(60, 40, 20, 0.12)";
      ctx.stroke(card);
    });
  }

  /** The stamp seen from above: a walnut handle on a brass head (drawn once, at full size). */
  private buildStamp(): Layer {
    const { dpr, R } = this.layout;
    const rs = R * FACE * 1.06;
    const size = rs * 2;
    return makeLayer(size, size, 2, dpr, (ctx) => {
      const c = rs;
      // brass head
      const brass = ctx.createRadialGradient(c - rs * 0.35, c - rs * 0.45, rs * 0.1, c, c, rs);
      brass.addColorStop(0, "#f0d896");
      brass.addColorStop(0.42, "#bf9850");
      brass.addColorStop(0.82, "#80602a");
      brass.addColorStop(1, "#4a3512");
      ctx.beginPath();
      ctx.arc(c, c, rs, 0, Math.PI * 2);
      ctx.fillStyle = brass;
      ctx.fill();
      // brushed, turned metal: a conic sheen
      if (typeof ctx.createConicGradient === "function") {
        const conic = ctx.createConicGradient(-Math.PI / 4, c, c);
        const stops: Array<[number, number]> = [
          [0, 0.24],
          [0.12, 0],
          [0.25, 0.16],
          [0.38, 0],
          [0.5, 0.22],
          [0.62, 0],
          [0.75, 0.14],
          [0.88, 0],
          [1, 0.24],
        ];
        stops.forEach(([at, a]) => conic.addColorStop(at, `rgba(255, 246, 214, ${a})`));
        ctx.fillStyle = conic;
        ctx.globalCompositeOperation = "overlay";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
      // bevelled rim: lit upper left, dark lower right
      const rim = ctx.createLinearGradient(c - rs, c - rs, c + rs, c + rs);
      rim.addColorStop(0, "rgba(255, 248, 220, 0.9)");
      rim.addColorStop(0.5, "rgba(255, 248, 220, 0.1)");
      rim.addColorStop(1, "rgba(40, 24, 4, 0.7)");
      ctx.lineWidth = Math.max(1, rs * 0.06);
      ctx.strokeStyle = rim;
      ctx.beginPath();
      ctx.arc(c, c, rs - ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.stroke();
      // knurled band
      ctx.save();
      ctx.translate(c, c);
      const teeth = 64;
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        const lit = 0.5 + 0.5 * Math.cos(a + Math.PI * 0.75);
        ctx.strokeStyle = `rgba(${lit > 0.5 ? "255, 240, 200" : "50, 30, 6"}, ${0.1 + Math.abs(lit - 0.5) * 0.25})`;
        ctx.lineWidth = Math.max(0.5, rs * 0.018);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rs * 0.8, Math.sin(a) * rs * 0.8);
        ctx.lineTo(Math.cos(a) * rs * 0.9, Math.sin(a) * rs * 0.9);
        ctx.stroke();
      }
      ctx.restore();
      // brass collar under the handle
      const collar = rs * 0.66;
      const cg = ctx.createRadialGradient(c - collar * 0.3, c - collar * 0.4, collar * 0.1, c, c, collar);
      cg.addColorStop(0, "#fbe7ae");
      cg.addColorStop(0.6, "#b58b40");
      cg.addColorStop(1, "#6a4d1c");
      ctx.beginPath();
      ctx.arc(c, c, collar, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.shadowColor = "rgba(30, 16, 0, 0.45)";
      ctx.shadowBlur = rs * 0.12 * dpr;
      ctx.shadowOffsetX = rs * 0.03 * dpr;
      ctx.shadowOffsetY = rs * 0.05 * dpr;
      ctx.fill();
      ctx.shadowColor = "transparent";
      // walnut handle top
      const knob = rs * 0.56;
      const wood = ctx.createRadialGradient(c - knob * 0.38, c - knob * 0.45, knob * 0.05, c, c, knob * 1.02);
      wood.addColorStop(0, "#8a5a38");
      wood.addColorStop(0.5, "#5a3520");
      wood.addColorStop(1, "#2b170c");
      ctx.beginPath();
      ctx.arc(c, c, knob, 0, Math.PI * 2);
      ctx.fillStyle = wood;
      ctx.fill();
      // growth rings, a little off centre
      ctx.save();
      ctx.clip();
      for (let i = 1; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(c + knob * 0.18, c + knob * 0.1, knob * (0.12 * i), knob * (0.1 * i + 0.02), 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(20, 8, 2, ${0.06 + (i % 2) * 0.04})`;
        ctx.lineWidth = Math.max(0.5, knob * 0.02);
        ctx.stroke();
      }
      // lacquer highlight
      const hi = ctx.createRadialGradient(c - knob * 0.4, c - knob * 0.48, 0, c - knob * 0.4, c - knob * 0.48, knob * 0.62);
      hi.addColorStop(0, "rgba(255, 236, 214, 0.6)");
      hi.addColorStop(0.4, "rgba(255, 236, 214, 0.14)");
      hi.addColorStop(1, "rgba(255, 236, 214, 0)");
      ctx.fillStyle = hi;
      ctx.fillRect(c - knob, c - knob, knob * 2, knob * 2);
      ctx.restore();
      ctx.lineWidth = Math.max(0.75, knob * 0.03);
      ctx.strokeStyle = "rgba(255, 220, 190, 0.18)";
      ctx.beginPath();
      ctx.arc(c, c, knob - ctx.lineWidth, Math.PI * 0.9, Math.PI * 1.6);
      ctx.stroke();
    });
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
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const snap = (v: number) => Math.round(v * dpr) / dpr;
    const ox = snap(L.x + view.shakeX);
    const oy = snap(L.y + view.shift * L.shift + view.shakeY);

    const put = (layer: Layer, x: number, y: number) =>
      ctx.drawImage(layer.canvas, x - layer.pad, y - layer.pad, layer.w, layer.h);

    // A tiny squash when the stamp lands (the whole sheet gives a little).
    ctx.save();
    if (view.press) {
      const s = 1 - view.press * 0.006;
      const [cx, cy] = [ox + W / 2, oy + H * ENVELOPE.seal];
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
      ctx.drawImage(layers.flapShadow.canvas, -layers.flapShadow.pad + 1, -layers.flapShadow.pad - 1 - sin * tipY * 0.25, layers.flapShadow.w, layers.flapShadow.h);
      ctx.restore();
      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(1, -sy);
      put(layers.flapInner, 0, 0);
      // facing the light more as it lies down
      ctx.fillStyle = rgba(p.shadow, (0.16 * (1 - sy) + 0.02) * k);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W / 2, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // the crease where it folds
      ctx.fillStyle = rgba(p.shadow, 0.2 * k);
      ctx.fillRect(ox + 1, oy - 0.5, W - 2, 1);
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
        ctx.fillStyle = rgba(p.shadow, sin * 0.22 * k);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W / 2, tipY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    const sx = ox + W / 2;
    const sy = oy + H * ENVELOPE.seal;
    if (view.wax && this.wax) this.drawWax(sx, sy, view);
    if (view.shards) this.drawShards(sx, sy, view.shards);
    if (view.stamp) this.drawStamp(sx + view.stamp.dx, sy + view.stamp.dy, view.stamp);
  }

  private drawWax(sx: number, sy: number, view: View) {
    const ctx = this.ctx;
    const wax = this.wax;
    const look = view.wax;
    if (!wax || !look || look.alpha <= 0) return;
    const { R, dpr } = this.layout;
    const p = this.paper;
    const k = p.shadowAlpha;
    const size = R * EXTENT * 2;
    const s = look.scale * (1 + look.lift * 0.02);
    const draw = () => ctx.drawImage(wax.canvas, -size / 2, -size / 2, size, size);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(s, s);
    ctx.globalAlpha = look.alpha;
    const lift = look.lift;
    const d = dpr * s;
    farShadow(ctx, draw, rgba(p.shadow, (0.22 + lift * 0.06) * k), (6 + lift * 5) * d, (1.5 + lift * 2) * d, (3 + lift * 3) * d);
    farShadow(ctx, draw, rgba(p.shadow, (0.34 - lift * 0.14) * k), 1.6 * d, 0.4 * d, 1 * d);
    draw();

    // Cracks running out from the blow before the pieces part.
    if (view.cracks !== null && this.crackLines.length) {
      const reach = view.cracks * 1.6;
      const outline = wax.outline(72);
      ctx.beginPath();
      outline.forEach(([x, y], i) => (i ? ctx.lineTo(x * R, y * R) : ctx.moveTo(x * R, y * R)));
      ctx.closePath();
      ctx.clip();
      ctx.lineCap = "round";
      for (const [x0, y0, x1, y1, d] of this.crackLines) {
        if (d > reach) break;
        const t = clamp((reach - d) / 0.35);
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

  private drawShards(sx: number, sy: number, shards: ShardBody[]) {
    const ctx = this.ctx;
    const { dpr } = this.layout;
    const p = this.paper;
    const k = p.shadowAlpha;
    for (const shard of shards) {
      if (shard.alpha <= 0.002) continue;
      const { shape } = shard;
      const w = shape.canvas.width / dpr;
      const h = shape.canvas.height / dpr;
      const x0 = shape.ox / dpr;
      const y0 = shape.oy / dpr;
      const scale = 1 + shard.z * 0.012;
      const cx = sx + shape.cx * this.layout.R + shard.x;
      const cy = sy + shape.cy * this.layout.R + shard.y;
      ctx.save();
      ctx.globalAlpha = shard.alpha;
      // shadow on the paper: falls further away the higher the piece is
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(shard.angle);
      ctx.scale(scale, scale);
      const dx = 1 + shard.z * 0.5;
      const dy = 1.5 + shard.z * 0.8;
      farShadow(
        ctx,
        () => ctx.drawImage(shape.canvas, x0, y0, w, h),
        rgba(p.shadow, (0.32 - Math.min(0.2, shard.z * 0.01)) * k),
        (1.5 + shard.z * 0.25) * dpr,
        dx * dpr,
        dy * dpr,
      );
      ctx.drawImage(shape.canvas, x0, y0, w, h);
      ctx.restore();
      ctx.restore();
    }
  }

  private drawStamp(x: number, y: number, stamp: NonNullable<View["stamp"]>) {
    if (stamp.alpha <= 0.002) return;
    const ctx = this.ctx;
    const { R } = this.layout;
    if (!this.stampLayer) this.stampLayer = this.buildStamp();
    const layer = this.stampLayer;
    const p = this.paper;
    const k = p.shadowAlpha;
    const z = Math.max(0, stamp.z);
    const scale = (1 + z * 0.55) * (1 - stamp.squash * 0.035);
    const rs = R * FACE * 1.06;

    // Shadow: soft and far while high, tight and dark as it lands.
    ctx.save();
    ctx.globalAlpha = stamp.alpha;
    const sxo = x + 2 + z * 26;
    const syo = y + 3 + z * 40;
    const sr = rs * (1.02 + z * 0.35);
    const blur = 0.12 + z * 0.9;
    const g = ctx.createRadialGradient(sxo, syo, Math.max(0, sr * (1 - blur) * 0.6), sxo, syo, sr * (1 + blur));
    const a = (0.34 - z * 0.2) * k;
    g.addColorStop(0, rgba(p.shadow, a));
    g.addColorStop(0.55, rgba(p.shadow, a * 0.75));
    g.addColorStop(1, rgba(p.shadow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(sxo - sr * 2.2, syo - sr * 2.2, sr * 4.4, sr * 4.4);

    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // Out of focus as it rises toward the camera.
    const defocus = z > 0.35 ? (z - 0.35) * 3.2 : 0;
    if (defocus > 0.2 && "filter" in ctx) ctx.filter = `blur(${defocus.toFixed(2)}px)`;
    ctx.drawImage(layer.canvas, -rs - layer.pad, -rs - layer.pad, layer.w, layer.h);
    ctx.restore();
  }
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
