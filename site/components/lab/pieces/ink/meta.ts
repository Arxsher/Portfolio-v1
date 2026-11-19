import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "ink",
  title: "Ink",
  summary: "Ink in water you stir with a finger: drop colour in, drag through it, and it curls into marbled swirls.",
  description:
    "A shallow dish of water and a few inks. Press and drag to pour a line of ink and stir it, move over the water to push what is already there, and tap to let a drop fall and bloom. The swirls keep curling on their own for a while, then settle into a marbled print.",
  about: [
    "It is a real fluid simulation, run on the GPU in WebGL2. Every frame the water's velocity is carried along by itself, its swirl is fed back a little (vorticity confinement, which keeps the small curls alive), and twenty passes of a pressure solve keep it incompressible, so ink pushed one way has to flow round and come back. The ink is a separate, finer layer carried along by that flow, and it fades so slowly that a stirred dish turns into a marbled print.",
    "On paper the ink is drawn the way pigment works: it absorbs light, each colour taking out its complement, so overlapping inks mix toward deep browns and blacks instead of white, and pigment gathers a little at the edges of a stroke the way watercolour dries. The amount of ink is also read as a height, so a wet sheen catches the light along the edges. In the dark the same inks glow instead. The water sounds are synthesised from filtered noise that follows how fast you stir.",
  ],
  uses: ["WebGL2", "GLSL", "Fluid simulation", "Web Audio"],
  category: "interactions",
  inspiredBy: "Marbled paper and ink dropped into water",
  // 204 × 240 at the 204px home tile
  tile: { aspect: 204 / 240 },
  stage: { aspect: 4 / 5 },
  controlsHint:
    "Press and drag to pour and stir · Move over the water to push the ink · Tap for a drop · Keys: Space drops ink, arrows push a current, R rinses, 1–3 change the ink",
  sound: true,
};
