import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "macropad",
  title: "Macropad",
  summary: "A nine-key mechanical macropad in 3D, with sculpted keycaps, light under every switch and a knob that turns the glow.",
  description:
    "A small mechanical keyboard on the desk: nine sculpted keycaps and a knurled aluminium knob, rendered live in 3D. Press a key and it travels down with a deep thock while a ring of light runs out from it under the neighbouring caps. Turn the knob, notch by notch, to change the colour of the glow.",
  about: [
    "The pad is real geometry drawn with WebGL2: an aluminium case with diamond-cut chamfers, a pocket and plate for the switches, nine caps with a spherical dish, rounded top edges and slightly bowed walls, and a knob with a knurled band and a machined top. It is lit like a product shot, by a softbox overhead, a thin strip light on the left and a soft key light, so the anodised metal takes its look from what it reflects: silver by day, graphite at night. Shadows and occlusion are worked out from where each cap sits rather than traced, which keeps it smooth on a laptop.",
    "Every switch has its own LED. Its light pools on the plate round the skirt, climbs the lower walls of the caps nearby and shows in the pocket's polished edge, and a bloom pass lets it spill softly. A press drives the cap onto its bottom stop on a stiff spring and sends a ring of light across the plate that flares each neighbour as it arrives; letting go throws the cap back up against the top of the housing, where it bounces once and rests.",
    "The sound is made as you play: a short, low sine that drops in pitch for the body of the case, band-passed noise for the impact and a dull thud under it, timed to the moment the cap bottoms out, with each key tuned a little differently and every press varied. The knob has 24 detents of 15° of hue each, so its indicator points at the colour it sets, and the new colour travels out from it across the keys.",
  ],
  uses: ["WebGL2", "Web Audio", "Springs"],
  category: "objects",
  inspiredBy: "Custom mechanical keyboards",
  // 204 × 236
  tile: { aspect: 204 / 236 },
  stage: { aspect: 4 / 5, minHeight: 440 },
  controlsHint:
    "Click or tap the keys, or press 1–9 · Slide across them to play a run · Drag, scroll, tap or use the arrow keys on the knob · Choose a keycap set",
  sound: true,
};
