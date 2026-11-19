import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "tiny-planet",
  title: "Tiny planet",
  summary: "A small low-poly planet you spin with your hand: flick it and it keeps turning, its towns lighting up as they roll into the night.",
  description:
    "A small low-poly world with seas, forests, drifting clouds and a moon on a tilted orbit. Grab it and the spot under your finger follows your hand; flick it and it spins on, clouds trailing and pines leaning, then slows and rights itself like a top. As land rolls past the edge of night its towns switch on one by one.",
  about: [
    "The planet is a subdivided icosahedron raised and lowered by a warped gradient noise, then cut into flat facets: beaches, meadows, forests, dry plains, hills, rock, snow and polar ice, with the sea floor showing through clear shallows. Pines, cloud banks and town lights are placed from the same fixed seed, so it is the same world every visit. Everything is drawn with WebGL2 in one pass per layer; the atmosphere is a shell whose pixels work out how much air each view ray crosses, so the rim glows blue by day, amber along the terminator and from behind after dark.",
    "Turning it is a quaternion on springs. While you hold it, a stiff, critically damped spring keeps the grabbed point under your finger; let go and it keeps the speed your hand had over the last fraction of a second. Spin about its axis glides on and eases back to a slow day, while any tumble is pulled upright by a softer spring, so it settles with a small wobble. The clouds ride a lagging copy of the turn, the pines lean with that air and a fast spin bulges the equator. Each town light has its own dusk, which is why they come on one after another as the terminator passes.",
  ],
  uses: ["WebGL2", "Low-poly geometry", "Quaternions", "Springs", "Instancing", "Web Audio"],
  category: "scenes",
  inspiredBy: "Desk globes and toy-like planets",
  tile: { aspect: 1 },
  stage: { aspect: 0.95, minHeight: 360 },
  controlsHint: "Drag to turn it · flick to spin it · drag the moon along its orbit · ← → turn it an hour, ↑ ↓ nudge the moon, Space spins it",
  sound: true,
};
