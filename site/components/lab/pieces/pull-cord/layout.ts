// Fits the lamp to a stage or a tile. The scene is drawn in scene units
// (geometry.ts) and scaled by `scale` CSS px per unit; physics runs in the
// same units with gravity scaled alongside, so the lamp swings with the
// same period on a phone, a tile and the big stage.

import { BEAD_LENGTH, CANOPY_H, DOME_R, EXIT_Y } from "./geometry";
import type { PieceMode } from "../../types";

export type Layout = {
  /** CSS px per scene unit. */
  scale: number;
  /** The canvas in scene units. */
  width: number;
  height: number;
  /** Canopy (the pivot the lamp swings from), scene units. */
  ax: number;
  ay: number;
  /** Canopy to the centre of the rim, along the cable. */
  arm: number;
  /** Rest length of the free cord, grommet to pull. */
  cord: number;
  /** Room the cord can be pulled down into before it would leave the canvas. */
  floor: number;
};

/**
 * Stage: the scene keeps clear of the tray and the hint at the bottom
 * (`reserve`, CSS px). Tile: a tighter crop, shorter cable and cord, so the
 * lamp is bigger in the small card.
 */
export function layoutFor(mode: PieceMode, cssWidth: number, cssHeight: number, reserve = 0): Layout {
  const tile = mode === "tile";
  const arm = tile ? 142 : 196;
  const cord = tile ? 112 : 148;
  // canopy, cable and shade, the cord and the pull, plus room to pull it down
  const pull = tile ? 22 : 40;
  const content = CANOPY_H + arm - EXIT_Y + cord + BEAD_LENGTH + pull;
  const width = DOME_R * 2 + (tile ? 28 : 120);
  const room = Math.max(80, cssHeight - reserve - (tile ? 4 : 12));
  let scale = Math.min(room / content, (cssWidth * (tile ? 0.98 : 0.9)) / width);
  scale = Math.max(0.2, Math.min(tile ? 1.4 : 1.12, scale));
  const w = cssWidth / scale;
  const h = cssHeight / scale;
  // the cord hangs at the shade's right edge: lean the lamp left so the pair is centred
  const ax = w / 2 - DOME_R * (tile ? 0.12 : 0.16);
  const ay = CANOPY_H;
  const floor = Math.min(h - 6, (cssHeight - reserve * 0.35) / scale);
  return { scale, width: w, height: h, ax, ay, arm, cord, floor };
}
