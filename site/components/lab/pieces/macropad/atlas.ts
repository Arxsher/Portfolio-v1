// The printed and engraved parts, drawn once with Canvas 2D into a 4 × 4
// atlas the shader samples (alpha is the ink):
//
//   cells (0..2, 0..2)  the legends 1–9, in Geist, one per cap
//   row 3               the engraving on the top row: the arsher mark
//                       (the site's pixel arrowhead) and the wordmark
//
// Legend art is white on transparent; the shader inks it in the colourway.

export const ATLAS_SIZE = 1024;
const CELL = ATLAS_SIZE / 4;

/** The site's mark on its 16 × 16 grid (the same blocks as components/logo.tsx). */
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

function fontFamily(): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (value) return `${value}, ui-sans-serif, system-ui, sans-serif`;
  } catch {}
  return "ui-sans-serif, system-ui, sans-serif";
}

/**
 * Draws the atlas. Call again once the web font has loaded. Tiles use a
 * heavier legend so it survives being a few pixels tall.
 */
export function drawAtlas(canvas: HTMLCanvasElement = document.createElement("canvas"), weight = 500): HTMLCanvasElement {
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
  ctx.fillStyle = "#fff";
  const family = fontFamily();

  // legends: a centred numeral, set a touch above centre (optically centred
  // on a dished top seen from the front)
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${weight} ${Math.round(CELL * (weight > 500 ? 0.4 : 0.36))}px ${family}`;
  for (let i = 0; i < 9; i++) {
    const cx = (i % 3) * CELL + CELL / 2;
    const cy = Math.floor(i / 3) * CELL + CELL / 2;
    const text = String(i + 1);
    const m = ctx.measureText(text);
    const ascent = m.actualBoundingBoxAscent || CELL * 0.26;
    const descent = m.actualBoundingBoxDescent || 0;
    ctx.fillText(text, cx, cy + (ascent - descent) / 2 - CELL * 0.01);
  }

  // engraving strip (1024 × 256 ↔ 1.8 × 0.45 key pitches on the case)
  const top = CELL * 3;
  const markSize = CELL * 0.4;
  const markX = CELL * 0.36;
  const markY = top + (CELL - markSize) / 2;
  const px = markSize / 16;
  for (const [x, y, w, h] of MARK) ctx.fillRect(markX + x * px, markY + y * px, w * px, h * px);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${Math.round(CELL * 0.27)}px ${family}`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1px";
  ctx.fillText("arsher", markX + markSize + CELL * 0.14, top + CELL / 2 + CELL * 0.01);
  return canvas;
}

/** Resolves when Geist is ready to draw (or at once if it can't be checked). */
export function fontReady(): Promise<void> {
  try {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!family || !document.fonts) return Promise.resolve();
    return document.fonts
      .load(`500 64px ${family}`)
      .then(() => undefined)
      .catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}
