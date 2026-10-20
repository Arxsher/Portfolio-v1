// The big word in the backdrop, set in Geist with Canvas 2D into a mask
// (white on black) that the scene shader inks. Drawn at device pixels so
// it stays crisp; redrawn when its size changes or the web font arrives.

export type WordMask = {
  canvas: HTMLCanvasElement;
  /** The texture's size in CSS px. */
  width: number;
  height: number;
  /** The ink box inside it (CSS px from the texture's left / top). */
  inkLeft: number;
  inkWidth: number;
  baseline: number;
  /** The key it was drawn for. */
  key: string;
  /** The mask's red channel, for reading coverage on the CPU (icon tone). */
  coverage: Uint8Array | null;
  /** Pixel size of the mask. */
  pw: number;
  ph: number;
};

export const WORD = "arsher";
const WEIGHT = 600;
const TRACKING = -0.055;

export function fontFamily(): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (value) return `${value}, ui-sans-serif, system-ui, sans-serif`;
  } catch {}
  return "ui-sans-serif, system-ui, sans-serif";
}

/** Resolves when Geist can be drawn (or at once if that can't be checked). */
export function fontReady(): Promise<void> {
  try {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!family || !document.fonts) return Promise.resolve();
    return document.fonts
      .load(`${WEIGHT} 96px ${family}`, WORD)
      .then(() => undefined)
      .catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

type Ctx2D = CanvasRenderingContext2D & { letterSpacing?: string };

/** The small canvas the coverage is read back from (made once). */
let probeCanvas: HTMLCanvasElement | null = null;

/** Draws the word at `fontPx` CSS px for `dpr`. */
export function drawWord(fontPx: number, dpr: number, canvas: HTMLCanvasElement = document.createElement("canvas")): WordMask {
  const size = fontPx * dpr;
  const family = fontFamily();
  const key = `${Math.round(size)}:${family}`;
  const probe = canvas.getContext("2d") as Ctx2D | null;
  const pad = Math.ceil(size * 0.08);
  const empty: WordMask = { canvas, width: 1, height: 1, inkLeft: 0, inkWidth: 1, baseline: 1, key, coverage: null, pw: 1, ph: 1 };
  if (!probe) return empty;
  const font = `${WEIGHT} ${size}px ${family}`;
  probe.font = font;
  if ("letterSpacing" in probe) probe.letterSpacing = `${(TRACKING * size).toFixed(2)}px`;
  const m = probe.measureText(WORD);
  const left = m.actualBoundingBoxLeft || 0;
  const right = m.actualBoundingBoxRight || m.width;
  const ascent = m.actualBoundingBoxAscent || size * 0.75;
  const descent = m.actualBoundingBoxDescent || size * 0.02;
  const inkWidth = left + right;

  canvas.width = Math.max(1, Math.ceil(inkWidth + pad * 2));
  canvas.height = Math.max(1, Math.ceil(ascent + descent + pad * 2));
  // resizing resets the context state
  const ctx = canvas.getContext("2d") as Ctx2D | null;
  if (!ctx) return empty;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = font;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${(TRACKING * size).toFixed(2)}px`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  ctx.fillText(WORD, pad + left, pad + ascent);

  // a quarter-resolution copy of the coverage for the CPU, drawn into its
  // own small canvas that is made for readback (the big mask stays on the
  // GPU path and is never read back)
  const step = 4;
  const pw = Math.max(1, Math.floor(canvas.width / step));
  const ph = Math.max(1, Math.floor(canvas.height / step));
  let coverage: Uint8Array | null = null;
  try {
    probeCanvas ??= document.createElement("canvas");
    probeCanvas.width = pw;
    probeCanvas.height = ph;
    const small = probeCanvas.getContext("2d", { willReadFrequently: true });
    if (small) {
      small.imageSmoothingEnabled = true;
      small.imageSmoothingQuality = "medium";
      small.drawImage(canvas, 0, 0, pw * step, ph * step, 0, 0, pw, ph);
      const data = small.getImageData(0, 0, pw, ph).data;
      coverage = new Uint8Array(pw * ph);
      for (let i = 0; i < pw * ph; i++) coverage[i] = data[i * 4];
    }
  } catch {
    coverage = null;
  }

  return {
    coverage,
    pw,
    ph,
    canvas,
    width: canvas.width / dpr,
    height: canvas.height / dpr,
    inkLeft: pad / dpr,
    inkWidth: inkWidth / dpr,
    baseline: (pad + ascent) / dpr,
    key,
  };
}
