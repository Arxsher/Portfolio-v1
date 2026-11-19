// Where the window sits on the stage or the tile, in CSS px from the
// canvas's top-left (y down). Everything the shaders and the simulation
// need about the woodwork comes from here: the casing (the moulded band on
// the wall around the opening), the sash frame, one to three panes of glass
// side by side, the meeting stiles between them, and the sill (a stool you
// see a little from above, its rounded nose, the apron board under it).
//
// The window is sized from the height available above the controls; the
// number of panes follows the width (three on a desktop stage, two in a
// tall full screen, one on a phone and on the tile).

export type Rect = { x: number; y: number; w: number; h: number };

export const MAX_PANES = 3;

export type WindowLayout = {
  /** canvas size, CSS px */
  W: number;
  H: number;
  /** 1 at the desktop stage's pane height; drops and beads scale with it */
  unit: number;
  paneCount: number;
  /** the glass of each pane */
  panes: Rect[];
  /** the bounding box of the panes (the simulation's and the fog map's domain) */
  glass: Rect;
  /** inside edge of the casing = outside edge of the sash frame */
  opening: Rect;
  /** outside edge of the casing (its bottom is the sill's top) */
  casing: Rect;
  casingW: number;
  stile: number;
  topRail: number;
  bottomRail: number;
  /** the sill: x range, top of the stool, depth of its top face, nose, apron */
  sillX0: number;
  sillX1: number;
  sillY: number;
  sillTop: number;
  nose: number;
  apron: number;
  /** the casement handle (centre of its plate) */
  handleX: number;
  handleY: number;
  /** bottom of everything drawn (the apron's lower edge) */
  bottom: number;
};

export function newLayout(): WindowLayout {
  const r = (): Rect => ({ x: 0, y: 0, w: 0, h: 0 });
  return {
    W: 0,
    H: 0,
    unit: 1,
    paneCount: 1,
    panes: [r(), r(), r()],
    glass: r(),
    opening: r(),
    casing: r(),
    casingW: 0,
    stile: 0,
    topRail: 0,
    bottomRail: 0,
    sillX0: 0,
    sillX1: 0,
    sillY: 0,
    sillTop: 0,
    nose: 0,
    apron: 0,
    handleX: 0,
    handleY: 0,
    bottom: 0,
  };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** The pane height the drop sizes were tuned at (desktop stage). */
const UNIT_HEIGHT = 330;

/**
 * Fit the window into a W × H canvas. `reserve` is the room kept free at
 * the bottom for the stage controls (0 on tiles). Writes into `out`.
 */
export function layoutWindow(W: number, H: number, tile: boolean, reserve: number, out: WindowLayout): WindowLayout {
  out.W = W;
  out.H = H;
  const narrow = W < 560;
  const top = tile ? Math.round(H * 0.06) : narrow ? 16 : 26;
  const bottom = tile ? H - Math.round(H * 0.075) : H - reserve;
  const side = tile ? Math.round(W * 0.1) : narrow ? 16 : 56;
  const availH = Math.max(60, bottom - top);
  const availW = Math.max(60, W - side * 2);

  const casingW = Math.round(clamp(availH * 0.04, 6, 20));
  const stile = Math.round(clamp(availH * 0.032, 5, 15));
  const topRail = stile;
  const bottomRail = Math.round(stile * 1.4);
  const sillTop = Math.round(clamp(availH * 0.034, 5, 14));
  const nose = Math.round(clamp(availH * 0.016, 2, 7));
  const apron = Math.round(clamp(availH * 0.028, 4, 12));
  const ear = Math.round(casingW * 0.85);
  const mullion = stile * 2;

  // the height the glass gets
  let glassH = availH - casingW - topRail - bottomRail - sillTop - nose - apron;
  // as many tall panes as the width holds (a casement is about 0.8 as wide as tall)
  const frameX = (casingW + stile) * 2;
  let n = tile ? 1 : clamp(Math.round((availW - frameX + mullion) / (glassH * 0.82 + mullion)), 1, MAX_PANES);
  let paneW = (availW - frameX - (n - 1) * mullion) / n;
  // never wider than a squat pane; never so narrow it reads as a slot
  paneW = Math.min(paneW, glassH * (n === 1 ? 1.15 : 0.95));
  if (paneW < glassH * 0.5 && n > 1) {
    n -= 1;
    paneW = Math.min((availW - frameX - (n - 1) * mullion) / n, glassH * 0.95);
  }
  if (paneW < glassH * 0.55) glassH = Math.max(40, paneW / 0.55);
  paneW = Math.floor(paneW);
  glassH = Math.floor(glassH);

  const glassW = paneW * n + mullion * (n - 1);
  const totalH = casingW + topRail + glassH + bottomRail + sillTop + nose + apron;
  const x0 = Math.round((W - glassW) / 2);
  const y0 = Math.round(top + (availH - totalH) / 2 + casingW + topRail);

  out.paneCount = n;
  for (let i = 0; i < MAX_PANES; i++) {
    const p = out.panes[i];
    if (i < n) {
      p.x = x0 + i * (paneW + mullion);
      p.y = y0;
      p.w = paneW;
      p.h = glassH;
    } else {
      p.x = p.y = p.w = p.h = 0;
    }
  }
  out.glass.x = x0;
  out.glass.y = y0;
  out.glass.w = glassW;
  out.glass.h = glassH;
  out.opening.x = x0 - stile;
  out.opening.y = y0 - topRail;
  out.opening.w = glassW + stile * 2;
  out.opening.h = glassH + topRail + bottomRail;
  out.casing.x = out.opening.x - casingW;
  out.casing.y = out.opening.y - casingW;
  out.casing.w = out.opening.w + casingW * 2;
  out.casing.h = out.opening.h + casingW;
  out.casingW = casingW;
  out.stile = stile;
  out.topRail = topRail;
  out.bottomRail = bottomRail;
  out.sillX0 = out.casing.x - ear;
  out.sillX1 = out.casing.x + out.casing.w + ear;
  out.sillY = out.opening.y + out.opening.h;
  out.sillTop = sillTop;
  out.nose = nose;
  out.apron = apron;
  out.bottom = out.sillY + sillTop + nose + apron;
  // the handle: on the meeting stile of the first two casements, or on the
  // opening side of a single one
  out.handleX = n >= 2 ? x0 + paneW + mullion / 2 : x0 + glassW + stile / 2;
  out.handleY = y0 + glassH * 0.56;
  out.unit = clamp(glassH / UNIT_HEIGHT, 0.42, 1.3);
  return out;
}

/** Which pane holds (x, y), or -1. */
export function paneAt(l: WindowLayout, x: number, y: number, margin = 0): number {
  for (let i = 0; i < l.paneCount; i++) {
    const p = l.panes[i];
    if (x >= p.x - margin && x <= p.x + p.w + margin && y >= p.y - margin && y <= p.y + p.h + margin) return i;
  }
  return -1;
}
