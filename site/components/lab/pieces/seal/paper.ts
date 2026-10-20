// Paper: the colours of the envelope, its liner and the letter for each
// theme, and a cotton-paper texture drawn once in code (grain, cloudy
// formation and a few hundred short fibres, light and dark), tiled as a
// pattern at device resolution so it stays crisp at any pixel ratio.

import { seededRandom } from "../../hooks";
import type { PieceTheme } from "../../types";

export type Paper = {
  /** Envelope paper. */
  paper: string;
  /** The lining printed inside the envelope and its flap. */
  liner: string;
  linerLine: string;
  /** The letter card and its ink. */
  letter: string;
  ink: string;
  /** Shadow tint (r, g, b) and strength. */
  shadow: readonly [number, number, number];
  shadowAlpha: number;
  /** How strongly the texture shows. */
  grain: number;
  /** Highlight and shade used on folds and edges. */
  light: string;
  shade: string;
  /** Overall light on the wax (the dark theme sits in a dimmer room). */
  exposure: number;
};

export const PAPERS: Record<PieceTheme, Paper> = {
  light: {
    paper: "#f1ebdf",
    liner: "#6f1d24",
    linerLine: "rgba(255, 214, 196, 0.16)",
    letter: "#fcfaf5",
    ink: "#2a2420",
    shadow: [52, 36, 24],
    shadowAlpha: 1,
    grain: 1,
    light: "rgba(255, 255, 255, 0.85)",
    shade: "rgba(80, 56, 32, 0.16)",
    exposure: 1,
  },
  dark: {
    // a warm mid-grey a step above the stage, so the envelope's silhouette
    // holds against the dark ground before any wax lands
    paper: "#4b453e",
    liner: "#4b161b",
    linerLine: "rgba(255, 190, 170, 0.1)",
    letter: "#e6dfd1",
    ink: "#2a2420",
    shadow: [0, 0, 0],
    shadowAlpha: 3,
    grain: 0.8,
    light: "rgba(255, 244, 228, 0.24)",
    shade: "rgba(0, 0, 0, 0.32)",
    exposure: 0.86,
  },
};

const SIZE = 512;
const cache = new Map<string, HTMLCanvasElement>();

/**
 * The texture tile (device px; transparent, light and dark marks over
 * whatever paper colour is under it). `strength` is per theme.
 */
export function paperTexture(theme: PieceTheme): HTMLCanvasElement {
  const key = theme;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  cache.set(key, canvas);
  if (!ctx) return canvas;
  const random = seededRandom(theme === "light" ? 0x5ea1 : 0x5ea2);
  const dark = theme === "dark";

  // 1. grain: per-pixel noise, very fine.
  const image = ctx.createImageData(SIZE, SIZE);
  const data = image.data;
  for (let i = 0; i < SIZE * SIZE; i++) {
    const v = random() - 0.5 + (random() - 0.5) * 0.6;
    const o = i * 4;
    if (v > 0) {
      data[o] = 255;
      data[o + 1] = 252;
      data[o + 2] = 246;
      data[o + 3] = v * (dark ? 22 : 34);
    } else {
      data[o] = dark ? 0 : 70;
      data[o + 1] = dark ? 0 : 52;
      data[o + 2] = dark ? 0 : 34;
      data[o + 3] = -v * (dark ? 40 : 30);
    }
  }
  ctx.putImageData(image, 0, 0);

  // Draw something at its position and at the wrapped copies across the edges.
  const wrapped = (x: number, y: number, reach: number, draw: (x: number, y: number) => void) => {
    for (const dx of [-SIZE, 0, SIZE]) {
      for (const dy of [-SIZE, 0, SIZE]) {
        const px = x + dx;
        const py = y + dy;
        if (px < -reach || py < -reach || px > SIZE + reach || py > SIZE + reach) continue;
        draw(px, py);
      }
    }
  };

  // 2. formation: the cloudy look of cotton paper held up to the light.
  for (let i = 0; i < 90; i++) {
    const x = random() * SIZE;
    const y = random() * SIZE;
    const r = 14 + random() * 46;
    const lightBlob = random() > 0.45;
    const a = (0.008 + random() * 0.014) * (dark ? 0.9 : 1);
    wrapped(x, y, r, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      const c = lightBlob ? "255, 252, 244" : dark ? "0, 0, 0" : "90, 66, 40";
      g.addColorStop(0, `rgba(${c}, ${a})`);
      g.addColorStop(1, `rgba(${c}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }

  // 3. fibres: short curved strokes, most of them pale, some darker.
  ctx.lineCap = "round";
  const fibres = (count: number, minLength: number, maxLength: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      const x = random() * SIZE;
      const y = random() * SIZE;
      const angle = random() * Math.PI;
      const length = minLength + random() * (maxLength - minLength);
      const bend = (random() - 0.5) * length * 0.5;
      const pale = random() < 0.7;
      const a = alpha * (0.5 + random() * 0.8);
      const width = 0.5 + random() * 0.6;
      const ex = Math.cos(angle) * length;
      const ey = Math.sin(angle) * length;
      wrapped(x, y, length, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + ex / 2 - Math.sin(angle) * bend, py + ey / 2 + Math.cos(angle) * bend, px + ex, py + ey);
        ctx.lineWidth = width;
        ctx.strokeStyle = pale
          ? `rgba(255, 253, 248, ${a * (dark ? 0.55 : 1.15)})`
          : dark
            ? `rgba(0, 0, 0, ${a * 1.4})`
            : `rgba(96, 72, 46, ${a * 0.85})`;
        ctx.stroke();
      });
    }
  };
  fibres(1400, 3, 11, 0.075);
  fibres(70, 14, 30, 0.04);
  return canvas;
}

/** A pattern of the paper texture for `ctx`, scaled from device px to the context's units. */
export function paperPattern(
  ctx: CanvasRenderingContext2D,
  theme: PieceTheme,
  dpr: number,
  offsetX = 0,
  offsetY = 0,
  rotate = 0,
): CanvasPattern | null {
  const pattern = ctx.createPattern(paperTexture(theme), "repeat");
  if (!pattern) return null;
  const matrix = new DOMMatrix().translateSelf(offsetX, offsetY).rotateSelf(rotate).scaleSelf(1 / dpr, 1 / dpr);
  pattern.setTransform(matrix);
  return pattern;
}
