import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "disintegrate",
  title: "Disintegrate",
  summary: "Hold delete and a message card crumbles into thousands of particles on a breeze; Undo pulls them back together.",
  description:
    "A message card with a delete button you have to hold. Keep holding and the card comes apart into thousands of particles taken from its own pixels and carried off on a breeze. Press Undo while they are still in the air and every particle turns round and flies back to its place until the card is whole again.",
  about: [
    "The card is drawn once into a texture and each particle takes its colour from one small patch of it, so the dust is exactly the card it came from. The particles are moved on the GPU: each one leaves at its own moment, sweeping across the card from one edge, and drifts on a gentle flow field that curls and lifts like a breeze.",
    "Undo does not rewind a recording. Every particle is steered home by a spring from wherever it is, so the card can be pulled back together at any point of its flight and settles into place without a seam.",
  ],
  uses: ["WebGL2", "Particles", "Springs"],
  category: "interactions",
  inspiredBy: "Things turning to dust in the wind",
  // 204 × 196 at the 204px home tile
  tile: { aspect: 204 / 196 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Hold Delete, or Space, to dissolve the card · Undo brings it back, even mid-flight",
};
