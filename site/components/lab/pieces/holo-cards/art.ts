// The printed card faces, drawn once with Canvas 2D and sampled by the
// shader as two texture arrays (one layer per face):
//
//   print  sRGB: the inks. Where there is foil, the print is the colour of
//          the ink laid over it (white is clear foil, a tint colours it,
//          dark ink blocks it), as on a real foil card.
//   masks  linear: red is the foil with the card's main pattern, green the
//          embossed height (raised marks catch the light along their
//          edges), blue the foil with the fine concentric pattern used for
//          the emblems.
//
// Layers: 0 Prism (ink black, a sunburst foil), 1 Lattice (pearl paper, a
// mosaic of tiny foil tiles), 2 Ripple (a silver card with flowing foil and
// embossed rings), 3 the back all three share (a guilloche rosette in foil
// round a medallion). Everything is laid out in millimetres on a 63 × 88 mm
// card. Original artwork; the mark is the site's star (components/logo.tsx).

import { LOGO_PATH } from "@/components/logo";

export const LAYERS = 4;
export const BACK_LAYER = 3;
export const CARD_MM_W = 63;
export const CARD_MM_H = 88;

/** Per-card shading: main foil pattern (see shaders.ts) and pearl paper. */
export const CARD_LOOK = [
  { pattern: 0, pearl: 0, name: "Prism", foil: "Radial grating" },
  { pattern: 1, pearl: 1, name: "Lattice", foil: "Pixel hologram" },
  { pattern: 2, pearl: 0, name: "Ripple", foil: "Wave grating" },
] as const;

/** Where each face's emblem (and the centre of its pattern) sits, in mm. */
export const EMBLEM_MM: ReadonlyArray<readonly [number, number]> = [
  [31.5, 31],
  [31.5, 31.5],
  [31.5, 30],
  [31.5, 40],
];

/** The art window on Prism and Lattice (mm). */
const WINDOW = { x: 4.5, y: 4.5, w: 54, h: 56, r: 2.2 };
/** Lattice's tile pitch (mm); the shader uses the same grid for its gratings. */
export const LATTICE_MM = 4.2;

type Ctx = CanvasRenderingContext2D;

function fontFamily(): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (value) return `${value}, ui-sans-serif, system-ui, sans-serif`;
  } catch {}
  return "ui-sans-serif, system-ui, sans-serif";
}

/** Resolves when Geist can be drawn (or at once when that can't be checked). */
export function fontReady(): Promise<void> {
  try {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!family || !document.fonts) return Promise.resolve();
    return Promise.all([document.fonts.load(`500 20px ${family}`), document.fonts.load(`600 20px ${family}`)]).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

/** True when Geist is already loaded (a face painted now has its real type). */
export function fontLoaded(): boolean {
  try {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!family || !document.fonts) return true;
    return document.fonts.check(`600 20px ${family}`) && document.fonts.check(`500 20px ${family}`);
  } catch {
    return true;
  }
}

function canvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return c;
}

function context(c: HTMLCanvasElement, read = false): Ctx {
  const ctx = c.getContext("2d", read ? { willReadFrequently: true } : undefined);
  if (!ctx) throw new Error("holo-cards: no 2D context");
  return ctx;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const STAR = typeof Path2D !== "undefined" ? new Path2D(LOGO_PATH) : null;

/** The star mark, `size` mm across, centred at (cx, cy) mm (eyes cut out). */
function star(ctx: Ctx, cx: number, cy: number, size: number, fill: string) {
  if (!STAR) return;
  const k = size / 14.4;
  ctx.save();
  ctx.translate(cx - 8 * k, cy - 8.1 * k);
  ctx.scale(k, k);
  ctx.fillStyle = fill;
  ctx.fill(STAR, "evenodd");
  ctx.restore();
}

function spacing(ctx: Ctx, value: string) {
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = value;
}

/** Text in mm units (`size` is the font size in mm). */
function text(ctx: Ctx, value: string, x: number, y: number, size: number, weight: number, fill: string, align: CanvasTextAlign = "left", track = 0) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${fontFamily()}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = fill;
  spacing(ctx, `${track}px`);
  ctx.fillText(value, x, y);
  ctx.restore();
}

/** Soft blur where the canvas supports filters (the shader smooths the rest). */
function blur(ctx: Ctx, mm: number, scale: number) {
  if ("filter" in ctx) ctx.filter = mm > 0 ? `blur(${(mm * scale).toFixed(2)}px)` : "none";
}

/** Draws the faces and hands each one over as print (canvas) + masks (ImageData). */
export class CardArt {
  readonly width: number;
  readonly height: number;
  private readonly print: HTMLCanvasElement;
  private readonly chans: HTMLCanvasElement[];
  private readonly mask: ImageData;
  /** px per mm. */
  private readonly k: number;

  constructor(width: number) {
    this.width = width;
    this.height = Math.round((width * CARD_MM_H) / CARD_MM_W);
    this.k = width / CARD_MM_W;
    this.print = canvas(this.width, this.height);
    this.chans = [0, 1, 2].map(() => canvas(this.width, this.height));
    this.mask = new ImageData(this.width, this.height);
  }

  /** Paint one face; returns the print canvas and the packed masks (valid until the next call). */
  paint(layer: number): { print: HTMLCanvasElement; mask: ImageData } {
    const p = context(this.print);
    const [r, g, b] = this.chans.map((c) => context(c, true));
    for (const ctx of [p, r, g, b]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
    }
    if (layer === 0) this.prism(p, r, g, b);
    else if (layer === 1) this.lattice(p, r, g, b);
    else if (layer === 2) this.ripple(p, r, g, b);
    else this.back(p, r, g, b);
    this.pack(layer);
    return { print: this.print, mask: this.mask };
  }

  /** Red, green and blue channels into one RGBA image (opaque, so no premultiply loss). */
  private pack(layer: number) {
    const w = this.width;
    const h = this.height;
    const [r, g, b] = this.chans.map((c) => context(c, true).getImageData(0, 0, w, h).data);
    const out = this.mask.data;
    const ripple = layer === 2;
    const [ex, ey] = EMBLEM_MM[2];
    const k = this.k;
    for (let y = 0, i = 0; y < h; y++) {
      for (let x = 0; x < w; x++, i += 4) {
        let height = g[i];
        if (ripple) {
          // engraved rings round the emblem, fading out toward the edges
          const mx = x / k - ex;
          const my = y / k - ey;
          const d = Math.sqrt(mx * mx + my * my);
          if (d > 6.2 && my < 32) {
            // a ripple spreading from a drop: crests closer and lower as they travel
            const wave = 0.5 + 0.5 * Math.cos(Math.pow(d - 6.2, 0.86) * 3.1);
            const fade = Math.exp(-(d - 6.2) / 15) * Math.min(1, (d - 6.2) / 1.2) * Math.min(1, Math.max(0, (32 - my) / 3));
            height = Math.min(255, height + wave * fade * 30 * (r[i] / 255));
          }
        }
        out[i] = r[i];
        out[i + 1] = height;
        out[i + 2] = b[i];
        out[i + 3] = 255;
      }
    }
  }

  /* -------------------------------------------------------------------- */
  /* the faces                                                             */
  /* -------------------------------------------------------------------- */

  /** A thin foil rule just inside the card's edge. */
  private frame(p: Ctx, r: Ctx, inset: number, ink: string) {
    for (const ctx of [p, r]) {
      roundRect(ctx, inset, inset, CARD_MM_W - inset * 2, CARD_MM_H - inset * 2, 3.2 - inset * 0.6);
      ctx.lineWidth = 0.32;
      ctx.strokeStyle = ctx === p ? ink : "#fff";
      ctx.stroke();
    }
  }

  private prism(p: Ctx, r: Ctx, g: Ctx, b: Ctx) {
    const [ex, ey] = EMBLEM_MM[0];
    // ink card
    const base = p.createLinearGradient(0, 0, 0, CARD_MM_H);
    base.addColorStop(0, "#1a1b21");
    base.addColorStop(1, "#0d0e11");
    p.fillStyle = base;
    p.fillRect(0, 0, CARD_MM_W, CARD_MM_H);

    // the art window: clear foil, tinted a little cooler toward its edges
    const { x, y, w, h, r: rr } = WINDOW;
    const tint = p.createRadialGradient(ex, ey, 2, ex, ey, 40);
    tint.addColorStop(0, "#ffffff");
    tint.addColorStop(0.45, "#eceef6");
    tint.addColorStop(1, "#8d93ad");
    p.fillStyle = tint;
    roundRect(p, x, y, w, h, rr);
    p.fill();
    r.fillStyle = "#fff";
    roundRect(r, x, y, w, h, rr);
    r.fill();

    // printed over the foil: fine rays and two rings round the emblem
    p.save();
    roundRect(p, x, y, w, h, rr);
    p.clip();
    p.strokeStyle = "rgba(20, 21, 28, 0.32)";
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const long = i % 2 === 0;
      p.lineWidth = long ? 0.16 : 0.1;
      p.beginPath();
      p.moveTo(ex + Math.cos(a) * 17.6, ey + Math.sin(a) * 17.6);
      p.lineTo(ex + Math.cos(a) * (long ? 60 : 26), ey + Math.sin(a) * (long ? 60 : 26));
      p.stroke();
    }
    p.restore();
    for (const [radius, width] of [
      [16.2, 0.3],
      [17.2, 0.16],
    ] as const) {
      p.beginPath();
      p.arc(ex, ey, radius, 0, Math.PI * 2);
      p.lineWidth = width;
      p.strokeStyle = "rgba(20, 21, 28, 0.7)";
      p.stroke();
      g.beginPath();
      g.arc(ex, ey, radius, 0, Math.PI * 2);
      g.lineWidth = width + 0.3;
      g.strokeStyle = "rgba(255,255,255,0.45)";
      g.stroke();
    }

    // the emblem: a raised star in fine concentric foil
    star(p, ex, ey, 21, "#ffffff");
    star(b, ex, ey, 21, "#ffffff");
    blur(g, 0.45, this.k);
    star(g, ex, ey, 21, "#ffffff");
    blur(g, 0, this.k);

    // the caption, on the matte ink below
    text(p, "Prism", 5.6, 73.2, 7.6, 600, "#f1f1f4", "left", -0.15);
    text(p, "Radial grating", 5.7, 79.6, 2.9, 500, "#8d8f9b");
    text(p, "01 / 03", 57.4, 79.6, 2.9, 500, "#8d8f9b", "right", 0.05);
    star(p, 55.4, 70.6, 3.4, "#8d8f9b");
    blur(g, 0.25, this.k);
    text(g, "Prism", 5.6, 73.2, 7.6, 600, "rgba(255,255,255,0.55)", "left", -0.15);
    blur(g, 0, this.k);
    this.frame(p, r, 1.6, "#ffffff");
  }

  private lattice(p: Ctx, r: Ctx, g: Ctx, b: Ctx) {
    void b;
    const [ex, ey] = EMBLEM_MM[1];
    // pearl paper
    const paper = p.createLinearGradient(0, 0, CARD_MM_W, CARD_MM_H);
    paper.addColorStop(0, "#f5f2ec");
    paper.addColorStop(1, "#e8e3da");
    p.fillStyle = paper;
    p.fillRect(0, 0, CARD_MM_W, CARD_MM_H);

    const { x, y, w, h, r: rr } = WINDOW;
    // the mosaic: clear foil, each tile slightly domed, hairline gaps of paper
    p.fillStyle = "#fbfbfd";
    roundRect(p, x, y, w, h, rr);
    p.fill();
    r.fillStyle = "#fff";
    roundRect(r, x, y, w, h, rr);
    r.fill();
    g.fillStyle = "rgba(255,255,255,0.32)";
    roundRect(g, x, y, w, h, rr);
    g.fill();
    for (const ctx of [p, r, g]) {
      ctx.save();
      roundRect(ctx, x, y, w, h, rr);
      ctx.clip();
      ctx.translate(ex, ey);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = ctx === p ? "#ece8e1" : "#000";
      ctx.lineWidth = ctx === g ? 0.5 : 0.24;
      const step = LATTICE_MM;
      for (let i = -24; i <= 24; i++) {
        ctx.beginPath();
        ctx.moveTo(i * step, -120);
        ctx.lineTo(i * step, 120);
        ctx.moveTo(-120, i * step);
        ctx.lineTo(120, i * step);
        ctx.stroke();
      }
      ctx.restore();
    }

    // the star cut out of the foil: raised pearl paper with a fine keyline
    const size = 24;
    star(p, ex, ey, size + 1.3, "#cfc9bf");
    star(p, ex, ey, size, "#f6f3ee");
    star(r, ex, ey, size + 1.3, "#000");
    blur(g, 0.5, this.k);
    star(g, ex, ey, size, "#ffffff");
    blur(g, 0, this.k);

    text(p, "Lattice", 5.6, 73.2, 7.6, 600, "#1c1c20", "left", -0.15);
    text(p, "Pixel hologram", 5.7, 79.6, 2.9, 500, "#7b766d");
    text(p, "02 / 03", 57.4, 79.6, 2.9, 500, "#7b766d", "right", 0.05);
    star(p, 55.4, 70.6, 3.4, "#9d978c");
    blur(g, 0.25, this.k);
    text(g, "Lattice", 5.6, 73.2, 7.6, 600, "rgba(255,255,255,0.5)", "left", -0.15);
    blur(g, 0, this.k);
    this.frame(p, r, 1.6, "#fbfbfd");
  }

  private ripple(p: Ctx, r: Ctx, g: Ctx, b: Ctx) {
    const [ex, ey] = EMBLEM_MM[2];
    // a silver card: foil all over, under a soft silver ink
    const silver = p.createLinearGradient(0, 0, CARD_MM_W, CARD_MM_H);
    silver.addColorStop(0, "#f4f5f8");
    silver.addColorStop(0.6, "#dfe1e7");
    silver.addColorStop(1, "#c9ccd4");
    p.fillStyle = silver;
    p.fillRect(0, 0, CARD_MM_W, CARD_MM_H);
    r.fillStyle = "#fff";
    r.fillRect(0, 0, CARD_MM_W, CARD_MM_H);

    // the caption band: graphite ink, opaque over the foil
    const band = { x: 4.5, y: 63.6, w: 54, h: 20.4, r: 2.2 };
    p.fillStyle = "#24252b";
    roundRect(p, band.x, band.y, band.w, band.h, band.r);
    p.fill();
    r.fillStyle = "#000";
    roundRect(r, band.x, band.y, band.w, band.h, band.r);
    r.fill();
    blur(g, 0.3, this.k);
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 0.6;
    roundRect(g, band.x, band.y, band.w, band.h, band.r);
    g.stroke();
    blur(g, 0, this.k);

    // the emblem: a small star in fine concentric foil, ringed in graphite
    p.beginPath();
    p.arc(ex, ey, 5.6, 0, Math.PI * 2);
    p.lineWidth = 0.35;
    p.strokeStyle = "rgba(36, 37, 43, 0.85)";
    p.stroke();
    star(p, ex, ey, 7.6, "#ffffff");
    star(b, ex, ey, 7.6, "#ffffff");
    blur(g, 0.3, this.k);
    star(g, ex, ey, 7.6, "#ffffff");
    blur(g, 0, this.k);

    text(p, "Ripple", 7.4, 74.2, 7.6, 600, "#f1f1f4", "left", -0.15);
    text(p, "Wave grating", 7.5, 80.2, 2.9, 500, "#9a9ca7");
    text(p, "03 / 03", 55.6, 80.2, 2.9, 500, "#9a9ca7", "right", 0.05);
    star(p, 53.6, 71.4, 3.4, "#9a9ca7");
  }

  private back(p: Ctx, r: Ctx, g: Ctx, b: Ctx) {
    const [cx, cy] = EMBLEM_MM[3];
    const base = p.createRadialGradient(cx, cy, 4, cx, cy, 60);
    base.addColorStop(0, "#1d1e24");
    base.addColorStop(1, "#0e0f12");
    p.fillStyle = base;
    p.fillRect(0, 0, CARD_MM_W, CARD_MM_H);

    // a guilloche rosette: thin closed curves r(θ) = R + A·sin(nθ + φ) round
    // the medallion, a few phases apart so they weave into lace
    const rings = [
      { R: 13.4, A: 1.5, n: 12, count: 6 },
      { R: 19.2, A: 2.0, n: 16, count: 7 },
      { R: 25.0, A: 2.3, n: 20, count: 8 },
    ];
    for (const ctx of [p, r]) {
      ctx.strokeStyle = ctx === p ? "#e9eaf0" : "#fff";
      ctx.lineWidth = 0.11;
      for (const ring of rings) {
        for (let k = 0; k < ring.count; k++) {
          const phase = (k / ring.count) * Math.PI * 2;
          ctx.beginPath();
          for (let s = 0; s <= 720; s++) {
            const t = (s / 720) * Math.PI * 2;
            const radius = ring.R + ring.A * Math.sin(ring.n * t + phase);
            const px = cx + radius * Math.cos(t);
            const py = cy + radius * 1.32 * Math.sin(t);
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      // an inner rule inside the frame
      roundRect(ctx, 3.6, 3.6, CARD_MM_W - 7.2, CARD_MM_H - 7.2, 1.6);
      ctx.lineWidth = 0.12;
      ctx.stroke();
    }

    // the medallion: a raised disc of concentric foil with the star in ink
    const radius = 9.4;
    for (const ctx of [p, b]) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = ctx === p ? "#f4f5f8" : "#fff";
      ctx.fill();
    }
    star(p, cx, cy, 11.5, "#15161b");
    star(b, cx, cy, 11.5, "#000");
    blur(g, 0.4, this.k);
    g.beginPath();
    g.arc(cx, cy, radius, 0, Math.PI * 2);
    g.lineWidth = 1.1;
    g.strokeStyle = "rgba(255,255,255,0.7)";
    g.stroke();
    blur(g, 0, this.k);

    text(p, "arsher", CARD_MM_W / 2, 81.4, 3.1, 500, "#8d8f9b", "center", 0.6);
    this.frame(p, r, 2.2, "#e9eaf0");
  }
}
