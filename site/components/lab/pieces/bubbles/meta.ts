import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "bubbles",
  title: "Bubbles",
  summary: "Soap bubbles you blow with a drag and pop with a tap, their film swirling with colour as it thins.",
  description:
    "Press and hold to blow a bubble, drag to pull it off the wand and let it float away, or sweep fast for a stream of small ones. They drift, wobble when they bump, catch the windows of the room in their film, and pop when you tap them, when they touch the floor or when the film gets too thin to hold.",
  about: [
    "The colours are thin-film interference, worked out per pixel: light bouncing off the outside of the soap film meets light bouncing off the inside, and depending on the film's thickness and the angle you see it at, some wavelengths cancel and others add up. The shader evaluates that for nine wavelengths across red, green and blue, over a film whose thickness swirls (3D noise flowing over the bubble), drains toward the bottom, and thins as the bubble ages until the top goes dark just before it pops. The film reflects a small studio, a soft ceiling, a darker floor and two windows, by its Fresnel term, so the rims are bright and the middle is nearly clear.",
    "Each bubble is a soft body in a little simulation: it rises on your warm breath, then sinks slowly, drifts on the air you push with the pointer, bumps off the walls and off other bubbles, and wobbles in two shape modes whose ring-down depends on its size. A pop tears a hole that races round the film and flings a spray of droplets. The pops and the breath are synthesised.",
  ],
  uses: ["WebGL2", "GLSL", "Thin-film interference", "Web Audio"],
  category: "objects",
  inspiredBy: "Soap bubbles in a sunny room",
  // 204 × 272 at the 204px home tile
  tile: { aspect: 204 / 272 },
  stage: { aspect: 4 / 5 },
  controlsHint:
    "Press and hold to blow a bubble · Drag to let it go · Sweep fast for a stream · Tap a bubble to pop it · Move over them to waft them · Keys: Space blows one, P pops one, arrows blow a breeze",
  sound: true,
};
