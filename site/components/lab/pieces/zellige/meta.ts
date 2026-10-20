import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "zellige",
  title: "Zellige",
  summary: "Hand-cut glazed tiles in an eight-pointed star pattern that catch the light under your pointer.",
  description:
    "A wall of Moroccan zellige: eight-pointed stars and crosses cut from glazed tile, every piece a slightly different shade, set in fine grout. Move the pointer to slide a soft light across the glaze, and click to re-glaze: new colour ripples outward through the pattern.",
  about: [
    "The patterns are built, not drawn. The eight-fold khatam is two overlapping squares at every point of a square lattice, with the crosses falling out of the gaps; the twelve- and sixteen-fold rosettes come from Hankin's polygons-in-contact method, rays leaning off the edges of a tiling of polygons and run on until they meet. The lines are split where they cross and every closed face between them becomes a piece of tile.",
    "A WebGL2 fragment shader glazes every piece on its own: a shade nudged from its palette tone by a seeded hash, a bevel where the glaze rolls over the cut edge and pools a little deeper, faint clouding, pinholes and the odd chip. Each piece also sits at its own slight tilt, so it reflects a different patch of a room with a barred window, and the soft lamp that follows your pointer on a spring slides its glint from piece to piece.",
    "A re-glaze spreads one ring of touching pieces at a time from the one you clicked: each piece wipes to its new glaze behind a thin wet bead, rocks as if pressed into its bed and stays glossy for a moment, while Web Audio strikes one small ceramic clink per ring, panned to where the ring is.",
  ],
  uses: ["WebGL2", "GLSL", "Web Audio", "Seeded randomness", "Springs"],
  category: "generative",
  inspiredBy: "Moroccan zellige tilework",
  // 204 × 192 at the 204px home tile.
  tile: { aspect: 204 / 192 },
  stage: { aspect: 0.74, minHeight: 440 },
  controlsHint: "Move to light the glaze · Click, tap or Enter to re-glaze · Arrow keys move the light",
  sound: true,
};
