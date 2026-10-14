import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "zellige",
  title: "Zellige",
  summary: "Hand-cut glazed tiles in an eight-pointed star pattern that catch the light under your pointer.",
  description:
    "A wall of Moroccan zellige: eight-pointed stars and crosses cut from glazed tile, every piece a slightly different shade, set in fine grout. Move the pointer to slide a soft light across the glaze, and click to re-glaze: new colour ripples outward through the pattern.",
  about: [
    "The pattern grows from the khatam, the eight-pointed star made of two overlapping squares, repeated on a square lattice so that the crosses between the stars fall out of the gaps. Each tile gets its own glaze from a seeded random generator: the palette colour nudged in hue and lightness, a deeper rim where the glaze pooled against the cut edge, and a faint bevel, so no two pieces match, as with hand-cut tile.",
    "The light follows the pointer on a spring, and a narrow specular glint slides from tile to tile as it moves, which is what makes the glaze read as glass rather than paint. A re-glaze is a wave front that spreads from your click; each tile turns to the new palette as the wave passes it. Palettes, the rosette's fold and the grout width are on the stage.",
  ],
  uses: ["Canvas 2D", "Seeded randomness", "Springs"],
  category: "generative",
  inspiredBy: "Moroccan zellige tilework",
  // 204 × 192 at the 204px home tile.
  tile: { aspect: 204 / 192 },
  stage: { aspect: 0.74, minHeight: 440 },
  controlsHint: "Move to light the glaze · Click or tap to re-glaze",
};
