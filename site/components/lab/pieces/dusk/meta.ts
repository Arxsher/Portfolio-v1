import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "dusk",
  title: "Casablanca at dusk",
  summary: "The Atlantic at sunset by Casablanca, rendered through an ordered dither in a handful of colours.",
  description:
    "Waves roll in toward a shore with a minaret on the skyline, and gulls drift across a low sun. The whole scene is drawn through an ordered dither in two to four colours. Move the pointer to move the sun, and the time of day and the light on the water follow it.",
  about: [
    "A WebGL2 shader paints the scene in full colour first: a sky that depends on the height of the sun, layered waves with foam along their crests, the sun's reflection broken up across the water, the shore and a minaret drawn as a silhouette from simple shapes, and gulls on slow looping paths. The image is then quantised with a Bayer matrix to a palette of a few colours, which turns smooth gradients into fine, regular patterns of dots.",
    "The dot size scales the dither matrix, from fine print to chunky pixels, and the palettes run from a two-colour ink to a warm sunset and a cool tide. Motion can be switched off for a still.",
  ],
  uses: ["WebGL2", "GLSL", "Ordered dithering"],
  category: "generative",
  inspiredBy: "Ordered dithering and the Atlantic coast",
  // 204 × 116
  tile: { aspect: 204 / 116 },
  stage: { aspect: 1 },
  controlsHint: "Move the pointer to move the sun · Pick a palette and dot size",
};
