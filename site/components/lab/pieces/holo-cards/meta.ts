import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "holo-cards",
  title: "Holo cards",
  summary: "Three foil cards that throw rainbows as they tilt: flick one to the back, fan them out, turn them over.",
  description:
    "A small stack of cards with holographic foil, each a different kind: a sunburst, a mosaic of tiny tiles and a flowing wave. Move over them, or tilt your phone and the whole stack leans with it, and bands of colour slide across the foil as the light catches it. Flick the front card and it spins away and tucks in at the back; drag the table to fan them out, and tap a card to turn it over.",
  about: [
    "The foil is a diffraction grating, the physics of real holographic foil: grooves about a micron apart send each wavelength off at its own angle. For every pixel the shader works out which wavelength the grooves send toward your eye, from the angle of the light and of the card, turns it into colour for the first three orders, and so bands of spectrum sweep across the card as it tilts. Each card lays its grooves out differently (radiating from the star, tile by tile, in waves), the pearl card's paper shimmers by thin-film interference instead, embossed marks catch the light along their edges and tiny facets glint as their angle passes. The faces are drawn once in Canvas 2D; the cards cast soft shadows on each other and on the table.",
    "Every card is a small rigid body on springs. Picked up, it hangs off the point you took it by, so a card held by a corner swings round behind your hand, and it lifts, leans and bows a little as it moves. Let go with speed and it keeps your speed and spin, clears the deck, drops behind it and arcs home while the others step forward one after another. Everything can be caught mid-flight. The sounds (pick-up, whoosh, the tap of a card landing, the riffle of the fan) are synthesised as you play.",
  ],
  uses: ["WebGL2", "GLSL", "Canvas 2D", "Springs", "Web Audio", "Device orientation"],
  category: "objects",
  inspiredBy: "Holographic trading cards",
  // 204 × 262 at the 204px home tile: the stack with room to sway
  tile: { aspect: 204 / 262 },
  stage: { aspect: 4 / 5 },
  controlsHint:
    "Move over the cards, or tilt your phone, to tilt them in the light · Flick a card to send it to the back · Tap the front card to turn it over, another to bring it forward · Drag the table to fan · Keys: Space next, F flip, S fan, arrows tilt",
  sound: true,
};
