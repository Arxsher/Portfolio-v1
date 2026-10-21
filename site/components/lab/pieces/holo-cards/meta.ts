import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "holo-cards",
  title: "Holo cards",
  summary: "Three cards with holographic foil that shifts as they tilt: fan them out, and flick the top one to the back.",
  description:
    "A small stack of cards with holographic foil. Move over them, or tilt your phone, and the foil shifts through its colours as the light catches it at a new angle. Drag to fan the stack out, and flick the top card away to send it to the back.",
  about: [
    "The foil is a shader modelled on thin-film interference: the colour at each point comes from the path difference of light bouncing off two surfaces a fraction of a wavelength apart, which depends on the angle you see it from. A fine embossed pattern varies that thickness across the card, so tilting it sends bands of colour sliding over the surface while a soft glare follows the light.",
    "Each card tilts toward the pointer on a spring and rests in the stack with a little weight. A flick throws the top card with your speed and spin; it arcs off and tucks in at the back while the others step forward.",
  ],
  uses: ["WebGL2", "GLSL", "Springs", "Device orientation"],
  category: "objects",
  inspiredBy: "Holographic trading cards",
  // 204 × 262 at the 204px home tile
  tile: { aspect: 204 / 262 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Move over the cards to tilt them · Drag to fan the stack · Flick the top card to send it to the back · On a phone, tilt to move the light",
};
