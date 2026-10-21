// The message cards, painted with Canvas 2D into one atlas texture (and
// the grid of particles the front card breaks into).
//
// Every card has the same frame: 360 × 240 card px, 22 px corners, a small
// app glyph with its name and an age, a title, a body or an attachment, and
// a full-width "Hold to delete" pill along the bottom. Their contents are
// ordinary things people delete (a blurry photo, a voice memo, a cleanup
// list, a note, a draft) so the dust has colour, type, bars and ticks in it.
// One extra slot holds the same pill already filled (red, white type): the
// shader reveals it from the left as the hold progresses.
//
// Atlas: two columns of card slots, 2 texels of clear gutter between them,
// premultiplied on upload. `scale` is texels per card px (the card's size
// on screen × the device pixel ratio), so the type lands 1:1 on the screen.

import type { PieceTheme } from "../../types";

export const CARD_W = 360;
export const CARD_H = 240;
export const CARD_R = 22;
/** The delete pill, card px from the top-left. */
export const BUTTON = { x: 16, y: 188, w: 328, h: 36, r: 12 } as const;
export const CARD_COUNT = 5;
/** Atlas slot of the filled pill. */
export const FILL_SLOT = CARD_COUNT;

const GUTTER = 2;

type Ctx = CanvasRenderingContext2D;

type Ink = {
  surface: string;
  edge: string;
  sheen: string;
  primary: string;
  secondary: string;
  tertiary: string;
  well: string;
  wellEdge: string;
  danger: string;
  dangerWash: string;
  fill: string;
};

const INK: Record<PieceTheme, Ink> = {
  light: {
    surface: "#ffffff",
    edge: "rgba(0,0,0,0.075)",
    sheen: "rgba(255,255,255,1)",
    primary: "#171717",
    secondary: "#5c5c5c",
    tertiary: "#9b9b9b",
    well: "#f3f3f3",
    wellEdge: "rgba(0,0,0,0.04)",
    danger: "#d92d2d",
    dangerWash: "rgba(220,38,38,0.075)",
    fill: "#e5484d",
  },
  dark: {
    surface: "#1b1b1b",
    edge: "rgba(255,255,255,0.085)",
    sheen: "rgba(255,255,255,0.07)",
    primary: "#ededed",
    secondary: "#a3a3a3",
    tertiary: "#6e6e6e",
    well: "#242424",
    wellEdge: "rgba(255,255,255,0.05)",
    danger: "#f2575c",
    dangerWash: "rgba(242,87,92,0.12)",
    fill: "#e5484d",
  },
};

/** What each card says (shown to screen readers too). */
export const CARDS = [
  { app: "Photos", age: "now", title: "Blurry sunset", body: "One of eleven nearly identical shots." },
  { app: "Voice memo", age: "2 min", title: "Humming in the kitchen", body: "A melody, maybe. Possibly a whole song." },
  { app: "Reminders", age: "1 h", title: "Clean up downloads", body: "" },
  {
    app: "Notes",
    age: "Yesterday",
    title: "Things to let go of",
    body: "The tab you never read. The screenshot kept just in case. The draft that said too much. Most of this note.",
  },
  {
    app: "Drafts",
    age: "Mon",
    title: "Re: the long email",
    body: "Rewrote it four times and sent none of them. This one can go too.",
  },
] as const;

/* ---------------------------------------------------------------------- */
/* type                                                                    */
/* ---------------------------------------------------------------------- */

function family(): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (value) return `${value}, ui-sans-serif, system-ui, sans-serif`;
  } catch {}
  return "ui-sans-serif, system-ui, sans-serif";
}

/** Resolves when Geist can be drawn (or at once when that can't be checked). */
export function fontReady(): Promise<void> {
  try {
    const name = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!name || !document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load(`400 14px ${name}`),
      document.fonts.load(`500 14px ${name}`),
      document.fonts.load(`600 14px ${name}`),
    ]).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

/** True when Geist is already loaded. */
export function fontLoaded(): boolean {
  try {
    const name = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!name || !document.fonts) return true;
    return document.fonts.check(`600 14px ${name}`) && document.fonts.check(`400 14px ${name}`);
  } catch {
    return true;
  }
}

function setTracking(ctx: Ctx, px: number) {
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${px}px`;
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  size: number,
  weight: number,
  fill: string,
  align: CanvasTextAlign = "left",
  track = 0,
) {
  ctx.font = `${weight} ${size}px ${family()}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = fill;
  setTracking(ctx, track);
  ctx.fillText(value, x, y);
  setTracking(ctx, 0);
}

/** Greedy word wrap to `width` (at the current font). */
function wrap(ctx: Ctx, value: string, width: number): string[] {
  const words = value.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/* ---------------------------------------------------------------------- */
/* shapes                                                                  */
/* ---------------------------------------------------------------------- */

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

/** Seeded 0..1 noise for the waveform. */
function rand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A trash can, 14 card px, centred on (cx, cy). */
function trash(ctx: Ctx, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.translate(cx - 7, cy - 7);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.45;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(1.5, 3.4);
  ctx.lineTo(12.5, 3.4);
  ctx.moveTo(5.2, 3.2);
  ctx.lineTo(5.6, 1.4);
  ctx.lineTo(8.4, 1.4);
  ctx.lineTo(8.8, 3.2);
  ctx.moveTo(3, 3.6);
  ctx.lineTo(3.7, 12.1);
  ctx.quadraticCurveTo(3.8, 12.9, 4.6, 12.9);
  ctx.lineTo(9.4, 12.9);
  ctx.quadraticCurveTo(10.2, 12.9, 10.3, 12.1);
  ctx.lineTo(11, 3.6);
  ctx.moveTo(5.8, 6);
  ctx.lineTo(6, 10.4);
  ctx.moveTo(8.2, 6);
  ctx.lineTo(8, 10.4);
  ctx.stroke();
  ctx.restore();
}

/** The pill's content (icon + label), centred in the pill. */
function pillLabel(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  const label = "Hold to delete";
  ctx.font = `500 13.5px ${family()}`;
  const tw = ctx.measureText(label).width;
  const total = 14 + 7 + tw;
  const left = x + (w - total) / 2;
  trash(ctx, left + 7, y + h / 2 - 0.5, color);
  text(ctx, label, left + 21, y + h / 2 + 4.6, 13.5, 500, color);
}

/* ---------------------------------------------------------------------- */
/* app glyphs                                                              */
/* ---------------------------------------------------------------------- */

const GLYPH = 24;

function glyphTile(ctx: Ctx, x: number, y: number, top: string, bottom: string) {
  const g = ctx.createLinearGradient(x, y, x, y + GLYPH);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  roundRect(ctx, x, y, GLYPH, GLYPH, 7);
  ctx.fillStyle = g;
  ctx.fill();
  // a hairline and a soft top light, like a pressed enamel badge
  ctx.save();
  roundRect(ctx, x + 0.5, y + 0.5, GLYPH - 1, GLYPH - 1, 6.5);
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
  const shine = ctx.createLinearGradient(x, y, x, y + GLYPH * 0.6);
  shine.addColorStop(0, "rgba(255,255,255,0.32)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  roundRect(ctx, x, y, GLYPH, GLYPH * 0.6, 7);
  ctx.fillStyle = shine;
  ctx.fill();
  ctx.restore();
}

function glyph(ctx: Ctx, kind: number, x: number, y: number) {
  const cx = x + GLYPH / 2;
  const cy = y + GLYPH / 2;
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.6;
  switch (kind) {
    case 0: {
      glyphTile(ctx, x, y, "#ff9f5a", "#f0577b");
      // a sun over a hill
      ctx.beginPath();
      ctx.arc(cx + 3.2, cy - 3, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 18);
      ctx.quadraticCurveTo(x + 10, y + 9.5, x + 14.5, y + 15);
      ctx.quadraticCurveTo(x + 17, y + 12.5, x + 19.5, y + 18);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 1: {
      glyphTile(ctx, x, y, "#ff6a5f", "#e5384d");
      const bars = [3, 7, 11, 6, 9, 4];
      for (let i = 0; i < bars.length; i++) {
        const bx = x + 5.5 + i * 2.6;
        ctx.beginPath();
        ctx.moveTo(bx, cy - bars[i] / 2);
        ctx.lineTo(bx, cy + bars[i] / 2);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      break;
    }
    case 2: {
      glyphTile(ctx, x, y, "#59a8ff", "#2f74e8");
      ctx.beginPath();
      ctx.arc(cx, cy, 6.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy + 0.2);
      ctx.lineTo(cx - 0.8, cy + 2.4);
      ctx.lineTo(cx + 3.2, cy - 2.2);
      ctx.stroke();
      break;
    }
    case 3: {
      glyphTile(ctx, x, y, "#ffd45c", "#f5a524");
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 6.5, y + 8 + i * 4);
        ctx.lineTo(x + (i === 2 ? 13.5 : 17.5), y + 8 + i * 4);
        ctx.stroke();
      }
      break;
    }
    default: {
      glyphTile(ctx, x, y, "#8e9bb0", "#5f6b80");
      roundRect(ctx, x + 5.5, y + 7.5, 13, 9.5, 2);
      ctx.lineWidth = 1.45;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 6.3, y + 8.6);
      ctx.lineTo(cx, cy + 1.2);
      ctx.lineTo(x + 17.7, y + 8.6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------- */
/* attachments                                                             */
/* ---------------------------------------------------------------------- */

/** A soft, slightly out-of-focus sunset over water. */
function photo(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  ctx.clip();
  const horizon = y + h * 0.6;
  const sky = ctx.createLinearGradient(0, y, 0, horizon);
  sky.addColorStop(0, "#3b3a7a");
  sky.addColorStop(0.32, "#8a4f9a");
  sky.addColorStop(0.62, "#e0727a");
  sky.addColorStop(0.86, "#ffa55e");
  sky.addColorStop(1, "#ffd27a");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, horizon - y);
  // the sun, half down, and its glow
  const sx = x + w * 0.64;
  const glow = ctx.createRadialGradient(sx, horizon, 0, sx, horizon, w * 0.36);
  glow.addColorStop(0, "rgba(255,236,170,0.95)");
  glow.addColorStop(0.18, "rgba(255,190,110,0.55)");
  glow.addColorStop(1, "rgba(255,160,100,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  ctx.arc(sx, horizon + 1, h * 0.17, Math.PI, 0);
  ctx.fillStyle = "#fff4cf";
  ctx.fill();
  // thin clouds lit from below
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#ffb98a";
  for (const [cx0, cy0, cw] of [
    [0.16, 0.3, 0.3],
    [0.5, 0.18, 0.22],
    [0.8, 0.36, 0.26],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x + w * cx0, y + h * cy0, w * cw * 0.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // the sea
  const sea = ctx.createLinearGradient(0, horizon, 0, y + h);
  sea.addColorStop(0, "#c9606f");
  sea.addColorStop(0.35, "#6a4378");
  sea.addColorStop(1, "#2a2752");
  ctx.fillStyle = sea;
  ctx.fillRect(x, horizon, w, y + h - horizon);
  // the sun's path on the water
  const r = rand(17);
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const ly = horizon + 2 + t * (y + h - horizon - 4);
    const spread = 6 + t * 26;
    const lw = (0.35 + r() * 0.65) * spread;
    const lx = sx - lw / 2 + (r() - 0.5) * spread * 0.6;
    ctx.globalAlpha = 0.75 * (1 - t * 0.7);
    ctx.fillStyle = i % 3 ? "#ffcf86" : "#fff0c2";
    ctx.fillRect(lx, ly, lw, 0.9 + r() * 0.6);
  }
  ctx.globalAlpha = 1;
  // a distant headland on the left
  ctx.fillStyle = "#2c2650";
  ctx.beginPath();
  ctx.moveTo(x, horizon + 0.5);
  ctx.lineTo(x, horizon - 7);
  ctx.quadraticCurveTo(x + w * 0.1, horizon - 9, x + w * 0.2, horizon - 3);
  ctx.quadraticCurveTo(x + w * 0.26, horizon - 1, x + w * 0.31, horizon + 0.5);
  ctx.closePath();
  ctx.fill();
  // the "blurry" in the title: a soft haze and a vignette
  const haze = ctx.createLinearGradient(0, horizon - 6, 0, horizon + 6);
  haze.addColorStop(0, "rgba(255,210,150,0)");
  haze.addColorStop(0.5, "rgba(255,210,150,0.35)");
  haze.addColorStop(1, "rgba(255,210,150,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(x, horizon - 6, w, 12);
  const vignette = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.4, x + w / 2, y + h / 2, w * 0.62);
  vignette.addColorStop(0, "rgba(20,10,40,0)");
  vignette.addColorStop(1, "rgba(20,10,40,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // a hairline so the photo sits in the card
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 11.5);
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function memo(ctx: Ctx, ink: Ink, x: number, y: number, w: number, h: number) {
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = ink.well;
  ctx.fill();
  ctx.strokeStyle = ink.wellEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  // play button
  const cx = x + 26;
  const cy = y + h / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle = ink.primary;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 3.6, cy - 5.6);
  ctx.lineTo(cx + 6, cy);
  ctx.lineTo(cx - 3.6, cy + 5.6);
  ctx.closePath();
  ctx.fillStyle = ink.surface;
  ctx.fill();
  // the waveform: a phrase, a breath, a longer phrase
  const r = rand(5);
  const left = x + 52;
  const right = x + w - 48;
  const n = 46;
  const step = (right - left) / n;
  ctx.lineCap = "round";
  ctx.lineWidth = 2.1;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const phrase = Math.sin(Math.PI * Math.min(1, t / 0.42)) * (t < 0.42 ? 1 : 0) + Math.sin(Math.PI * Math.max(0, (t - 0.5) / 0.5)) * (t > 0.5 ? 1 : 0);
    const amp = 2 + (0.25 + 0.75 * r()) * 20 * Math.max(0.12, phrase);
    const bx = left + i * step + step / 2;
    ctx.strokeStyle = i < n * 0.34 ? ink.danger : ink.tertiary;
    ctx.beginPath();
    ctx.moveTo(bx, cy - amp / 2);
    ctx.lineTo(bx, cy + amp / 2);
    ctx.stroke();
  }
  text(ctx, "0:42", x + w - 14, cy + 4.5, 12.5, 500, ink.secondary, "right");
}

function checklist(ctx: Ctx, ink: Ink, x: number, y: number) {
  const items = [
    { label: "Installers from three laptops ago", done: false },
    { label: "Duplicates of duplicates", done: true },
    { label: "final_v2_really_final.pdf", done: false },
  ];
  for (let i = 0; i < items.length; i++) {
    const cy = y + i * 25;
    const item = items[i];
    ctx.beginPath();
    ctx.arc(x + 8, cy, 7.5, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    if (item.done) {
      ctx.fillStyle = "#2f74e8";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 4.6, cy + 0.2);
      ctx.lineTo(x + 7, cy + 2.6);
      ctx.lineTo(x + 11.4, cy - 2.4);
      ctx.strokeStyle = "#ffffff";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    } else {
      ctx.strokeStyle = ink.tertiary;
      ctx.stroke();
    }
    text(ctx, item.label, x + 24, cy + 4.6, 13.5, 400, item.done ? ink.tertiary : ink.primary);
    if (item.done) {
      ctx.font = `400 13.5px ${family()}`;
      const tw = ctx.measureText(item.label).width;
      ctx.fillStyle = ink.tertiary;
      ctx.fillRect(x + 24, cy - 0.2, tw, 1);
    }
  }
}

function fileChip(ctx: Ctx, ink: Ink, x: number, y: number) {
  const w = 176;
  const h = 34;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = ink.well;
  ctx.fill();
  ctx.strokeStyle = ink.wellEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  // a page with a folded corner
  ctx.save();
  ctx.translate(x + 10, y + 8);
  ctx.beginPath();
  ctx.moveTo(0, 1.5);
  ctx.quadraticCurveTo(0, 0, 1.5, 0);
  ctx.lineTo(9, 0);
  ctx.lineTo(13.5, 4.5);
  ctx.lineTo(13.5, 16.5);
  ctx.quadraticCurveTo(13.5, 18, 12, 18);
  ctx.lineTo(1.5, 18);
  ctx.quadraticCurveTo(0, 18, 0, 16.5);
  ctx.closePath();
  ctx.fillStyle = ink.surface;
  ctx.fill();
  ctx.strokeStyle = ink.tertiary;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(9, 4.5);
  ctx.lineTo(13.5, 4.5);
  ctx.stroke();
  ctx.restore();
  text(ctx, "draft-4.txt", x + 32, y + 21.6, 13, 500, ink.primary);
  text(ctx, "3 KB", x + w - 12, y + 21.6, 12.5, 400, ink.tertiary, "right");
}

/* ---------------------------------------------------------------------- */
/* the card                                                                */
/* ---------------------------------------------------------------------- */

function paintCard(ctx: Ctx, index: number, ink: Ink) {
  const card = CARDS[index];
  // the surface: flat, with a hairline edge and a light catch along the top
  roundRect(ctx, 0, 0, CARD_W, CARD_H, CARD_R);
  ctx.fillStyle = ink.surface;
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0.5, 0.5, CARD_W - 1, CARD_H - 1, CARD_R - 0.5);
  ctx.strokeStyle = ink.edge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CARD_R, 1);
  ctx.lineTo(CARD_W - CARD_R, 1);
  ctx.strokeStyle = ink.sheen;
  ctx.stroke();
  ctx.restore();

  // header
  glyph(ctx, index, 16, 16);
  text(ctx, card.app, 48, 32.6, 13, 500, ink.secondary);
  text(ctx, card.age, CARD_W - 18, 32.6, 12.5, 400, ink.tertiary, "right");

  // title
  text(ctx, card.title, 16, 72, 17, 600, ink.primary, "left", -0.2);

  // body and attachment
  switch (index) {
    case 0:
      text(ctx, card.body, 16, 94, 13.5, 400, ink.secondary);
      photo(ctx, 16, 106, CARD_W - 32, 70);
      break;
    case 1:
      text(ctx, card.body, 16, 94, 13.5, 400, ink.secondary);
      memo(ctx, ink, 16, 108, CARD_W - 32, 66);
      break;
    case 2:
      checklist(ctx, ink, 16, 104);
      break;
    case 3: {
      ctx.font = `400 13.5px ${family()}`;
      const lines = wrap(ctx, card.body, CARD_W - 32).slice(0, 4);
      for (let i = 0; i < lines.length; i++) text(ctx, lines[i], 16, 95 + i * 20, 13.5, 400, ink.secondary);
      break;
    }
    default: {
      ctx.font = `400 13.5px ${family()}`;
      const lines = wrap(ctx, card.body, CARD_W - 32).slice(0, 2);
      for (let i = 0; i < lines.length; i++) text(ctx, lines[i], 16, 95 + i * 20, 13.5, 400, ink.secondary);
      fileChip(ctx, ink, 16, 138);
    }
  }

  // the pill
  const b = BUTTON;
  roundRect(ctx, b.x, b.y, b.w, b.h, b.r);
  ctx.fillStyle = ink.dangerWash;
  ctx.fill();
  pillLabel(ctx, b.x, b.y, b.w, b.h, ink.danger);
}

/** The pill, filled: what the hold reveals. Drawn at the pill's own origin. */
function paintFill(ctx: Ctx, ink: Ink) {
  const b = BUTTON;
  roundRect(ctx, 0, 0, b.w, b.h, b.r);
  const g = ctx.createLinearGradient(0, 0, 0, b.h);
  g.addColorStop(0, ink.fill);
  g.addColorStop(1, "#d93b41");
  ctx.fillStyle = g;
  ctx.fill();
  // a soft top light so it reads as pressed glass, not a flat fill
  ctx.save();
  roundRect(ctx, 0, 0, b.w, b.h, b.r);
  ctx.clip();
  const shine = ctx.createLinearGradient(0, 0, 0, b.h * 0.55);
  shine.addColorStop(0, "rgba(255,255,255,0.22)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, b.w, b.h * 0.55);
  ctx.restore();
  pillLabel(ctx, 0, 0, b.w, b.h, "#ffffff");
}

export type Atlas = {
  canvas: HTMLCanvasElement;
  /** uv rects (u, v, du, dv) per slot, v down (the texture is uploaded without a flip). */
  slots: Float32Array;
  /** Texels per card px. */
  scale: number;
};

/** Paint all cards and the filled pill for a theme at `scale` texels per card px. */
export function paintAtlas(theme: PieceTheme, scale: number, reuse?: HTMLCanvasElement): Atlas {
  const ink = INK[theme];
  const sw = Math.ceil(CARD_W * scale) + GUTTER * 2;
  const sh = Math.ceil(CARD_H * scale) + GUTTER * 2;
  const rows = Math.ceil((CARD_COUNT + 1) / 2);
  const width = sw * 2;
  const height = sh * rows;
  const canvas = reuse ?? document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("disintegrate: no 2D context");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const slots = new Float32Array((CARD_COUNT + 1) * 4);
  for (let i = 0; i <= CARD_COUNT; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ox = col * sw + GUTTER;
    const oy = row * sh + GUTTER;
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    if (i < CARD_COUNT) paintCard(ctx, i, ink);
    else paintFill(ctx, ink);
    ctx.restore();
    const w = i < CARD_COUNT ? CARD_W : BUTTON.w;
    const h = i < CARD_COUNT ? CARD_H : BUTTON.h;
    slots[i * 4] = ox / width;
    slots[i * 4 + 1] = oy / height;
    slots[i * 4 + 2] = (w * scale) / width;
    slots[i * 4 + 3] = (h * scale) / height;
  }
  return { canvas, slots, scale };
}

/** One card, painted on its own (the fallback without WebGL2). */
export function paintSingle(ctx: Ctx, index: number, theme: PieceTheme) {
  paintCard(ctx, index, INK[theme]);
}

/* ---------------------------------------------------------------------- */
/* the particles                                                           */
/* ---------------------------------------------------------------------- */

/** Smooth value noise for the dissolve's ragged front. */
function valueNoise(seed: number) {
  const hash = (x: number, y: number) => {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 2147483647)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

export type Grid = {
  /** Card px per particle. */
  cell: number;
  cols: number;
  rows: number;
  count: number;
  /**
   * Per particle, 8 floats: home x, y (card px from the centre, y up), the
   * release order r (0 first … 1 last), a return delay, and four randoms.
   */
  data: Float32Array;
  /** The release order per cell (cols × rows, row 0 at the top), 0..255, for the shadow's mask. */
  order: Uint8Array;
};

/** Inside the card's rounded rectangle (card px from the centre), with a margin. */
function insideCard(x: number, y: number, margin: number) {
  const qx = Math.abs(x) - (CARD_W / 2 - CARD_R);
  const qy = Math.abs(y) - (CARD_H / 2 - CARD_R);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - CARD_R;
  return outside < margin;
}

/**
 * The front card cut into square cells, each one a particle. The release
 * order sweeps from the top right (downwind) to the bottom left, with a
 * ragged, fbm-noised front and a little grain per cell.
 */
export function buildGrid(cell: number, seed = 7): Grid {
  const cols = Math.round(CARD_W / cell);
  const rows = Math.round(CARD_H / cell);
  const noise = valueNoise(seed);
  const r = rand(seed * 31 + 1);
  const order = new Float32Array(cols * rows);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const u = (i + 0.5) / cols;
      const v = 1 - (j + 0.5) / rows; // 0 bottom … 1 top
      const n =
        noise(u * 3.1, v * 2.2) * 0.6 + noise(u * 7.3 + 11, v * 5.1 + 3) * 0.28 + noise(u * 17 + 5, v * 12 + 9) * 0.12;
      const value = 0.7 * (1 - u) + 0.3 * (1 - v) + (n - 0.5) * 0.42 + (r() - 0.5) * 0.045;
      order[j * cols + i] = value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  const span = max - min || 1;
  const bytes = new Uint8Array(cols * rows);
  const cells: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const o = (order[k] - min) / span;
      order[k] = o;
      bytes[k] = Math.round(o * 255);
      const x = (i + 0.5) * cell - CARD_W / 2;
      const y = CARD_H / 2 - (j + 0.5) * cell;
      if (insideCard(x, y, cell * 0.75)) cells.push(k);
    }
  }
  const data = new Float32Array(cells.length * 8);
  for (let n = 0; n < cells.length; n++) {
    const k = cells[n];
    const i = k % cols;
    const j = (k - i) / cols;
    const o = n * 8;
    data[o] = (i + 0.5) * cell - CARD_W / 2;
    data[o + 1] = CARD_H / 2 - (j + 0.5) * cell;
    data[o + 2] = order[k];
    data[o + 3] = r();
    data[o + 4] = r();
    data[o + 5] = r();
    data[o + 6] = r();
    data[o + 7] = r();
  }
  return { cell, cols, rows, count: cells.length, data, order: bytes };
}
