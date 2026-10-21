// Where the bar sits and how big everything is, from the space available
// and the labels' real widths (Geist, measured with Canvas 2D). Also draws
// the labels into the mask texture the shader inks: white text on clear,
// at device pixels, so it lands on the same pixel grid as the screen.

import type { LiquidLayout, Slot } from "./engine";

/** The site's own sections, in home page order. */
export const STAGE_TABS = ["Work", "Lab", "Writing", "GitHub", "Guestbook"] as const;
export const TILE_TABS = ["Work", "Lab", "Writing", "GitHub"] as const;

const WEIGHT = 500;

export type BarLayout = {
  /** The bar's box inside the piece (CSS px). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Gap between the channel's edge and the drop at rest. */
  inset: number;
  font: number;
  labels: readonly string[];
  /** Per tab, bar-local: slot extents (the drop at rest) and the label's centre. */
  slots: Slot[];
  /** What the engine needs. */
  liquid: LiquidLayout;
  /** Key for the label texture (changes when it must be redrawn). */
  key: string;
};

export function fontFamily(): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (value) return `${value}, ui-sans-serif, system-ui, sans-serif`;
  } catch {}
  return "ui-sans-serif, system-ui, sans-serif";
}

/** Resolves when Geist can be measured and drawn (or at once if that can't be checked). */
export function fontReady(): Promise<void> {
  try {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!family || !document.fonts) return Promise.resolve();
    return document.fonts
      .load(`${WEIGHT} 20px ${family}`, "WorkLabWritingGitHubGuestbook")
      .then(() => undefined)
      .catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

let measureCtx: CanvasRenderingContext2D | null = null;
function measurer(): CanvasRenderingContext2D | null {
  if (measureCtx) return measureCtx;
  measureCtx = document.createElement("canvas").getContext("2d");
  return measureCtx;
}

function textWidths(labels: readonly string[], font: number, family: string): number[] {
  const ctx = measurer();
  if (!ctx) return labels.map((l) => l.length * font * 0.56);
  ctx.font = `${WEIGHT} ${font}px ${family}`;
  return labels.map((l) => ctx.measureText(l).width);
}

type Size = { font: number; pad: number; height: number; inset: number };

/**
 * Lay the bar out in a box `width` × `height`. Tries the size for the box
 * first, then tighter tab padding, then a smaller font, until it fits with
 * `gutter` either side. `centreY` is where the bar's middle goes.
 */
export function layoutBar(
  labels: readonly string[],
  width: number,
  centreY: number,
  mode: "stage" | "tile",
  family: string,
): BarLayout {
  const gutter = mode === "tile" ? Math.max(7, width * 0.04) : 16;
  const room = Math.max(60, width - gutter * 2);
  let size: Size;
  if (mode === "tile") {
    const k = width / 204;
    size = { font: 12 * k, pad: 7.5 * k, height: 37 * k, inset: 3.4 * k };
  } else if (width >= 940) size = { font: 21, pad: 29, height: 72, inset: 6 };
  else if (width >= 760) size = { font: 19, pad: 26, height: 64, inset: 5 };
  else if (width >= 520) size = { font: 16.5, pad: 20, height: 56, inset: 5 };
  else size = { font: 14.5, pad: 14, height: 48, inset: 4 };

  let widths = textWidths(labels, size.font, family);
  const total = (s: Size, w: number[]) => w.reduce((sum, v) => sum + v + s.pad * 2, 0) + s.inset * 2;
  // tighten the padding first, then the type
  for (let i = 0; i < 12 && total(size, widths) > room; i++) {
    if (size.pad > size.font * 0.62) size = { ...size, pad: size.pad * 0.88 };
    else {
      size = { ...size, font: size.font * 0.94, pad: size.pad * 0.96, height: size.height * 0.97 };
      widths = textWidths(labels, size.font, family);
    }
  }

  const barW = total(size, widths);
  const slots: Slot[] = [];
  let x = size.inset;
  for (const w of widths) {
    const sw = w + size.pad * 2;
    slots.push({ x0: x, x1: x + sw });
    x += sw;
  }
  const dropH = size.height - size.inset * 2;
  const bx = Math.round((width - barW) / 2);
  const by = Math.round(centreY - size.height / 2);
  return {
    x: bx,
    y: by,
    width: barW,
    height: size.height,
    inset: size.inset,
    font: size.font,
    labels,
    slots,
    liquid: { slots, height: dropH, room: size.inset, min: size.inset, max: barW - size.inset },
    key: `${labels.join("|")}:${barW.toFixed(2)}:${size.font.toFixed(2)}:${family}`,
  };
}

/** Draws the labels (white on clear) for `bar` at `dpr` into `canvas`, sized to the bar. */
export function drawLabels(canvas: HTMLCanvasElement, bar: BarLayout, dpr: number, family: string) {
  const w = Math.max(1, Math.round(bar.width * dpr));
  const h = Math.max(1, Math.round(bar.height * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.setTransform(w / bar.width, 0, 0, h / bar.height, 0, 0);
  ctx.fillStyle = "#fff";
  ctx.font = `${WEIGHT} ${bar.font}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // optical centre: the middle of the lowercase-and-caps ink box
  const m = ctx.measureText("Wbg");
  const ascent = m.actualBoundingBoxAscent || bar.font * 0.72;
  const descent = m.actualBoundingBoxDescent || bar.font * 0.2;
  const capM = ctx.measureText("W");
  const cap = capM.actualBoundingBoxAscent || bar.font * 0.7;
  // centre the cap height + a touch of the descenders, the way UI type is set
  const baseline = bar.height / 2 + cap / 2 - Math.min(descent, ascent) * 0.04;
  bar.labels.forEach((label, i) => {
    const s = bar.slots[i];
    ctx.fillText(label, (s.x0 + s.x1) / 2, baseline);
  });
}
