import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "liquid-tabs",
  title: "Liquid tabs",
  summary: "A tab bar whose highlight is a drop of liquid: it stretches toward the tab you pick, pinches in two and flows back together.",
  description:
    "A segmented control with a liquid indicator. Pick a far tab and the drop reaches for it, strings out across the bar, snaps in two, and the half left behind races after the other and merges with a slosh. Drag the drop to scrub through the tabs, throw it, or use the arrow keys. Ink, mercury or water.",
  about: [
    "The indicator is a few bodies on one line: the drop, a second drop that leaves it on a jump, and the bridge between them. Mass flows through the bridge while it holds; the further it is pulled, the thinner its middle and the less gets through, until it breaks. Threads snap back, a tiny bead is left where it broke, and the remnant chases the head on its own spring.",
    "All of it is drawn from one outline: the half-height of the liquid along the bar, with a ball rolled along it to fill every crease, the way metaballs merge. A WebGL2 shader lights that outline as a glossy surface in a small studio, and inverts the labels exactly where the liquid covers them. The ink is the palette's own: black by day, red or white at night.",
    "Every spring keeps its velocity when its target changes, so a new pick mid-flight or a finger catching the drop carries on from wherever the liquid is. The landing wobbles on under-damped springs for its length and lean; sound is synthesised on the spot: a plip pitched by the tab, a tick at the snap, a soft blup at the merge.",
  ],
  uses: ["WebGL2", "Signed distance fields", "Springs", "Web Audio", "Pointer events"],
  category: "interactions",
  inspiredBy: "Segmented controls and drops of water",
  // 204 × 100 at the 204px home tile
  tile: { aspect: 204 / 100 },
  stage: { aspect: 1 },
  controlsHint: "Click or tap a tab · Drag the drop to scrub, or throw it · ← → Home End and 1–5 on the keyboard",
  sound: true,
};
