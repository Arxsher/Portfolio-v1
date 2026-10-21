import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "liquid-tabs",
  title: "Liquid tabs",
  summary: "A tab bar whose highlight is a drop of liquid: it stretches toward the tab you pick, pinches off and wobbles into place.",
  description:
    "A segmented control with a liquid indicator. Pick a tab and the highlight reaches toward it with the speed of the move, thins in the middle and pinches off like a droplet, then lands with a small wobble. Drag across the bar to scrub through the tabs, or use the arrow keys.",
  about: [
    "The indicator is two blobs joined by a smooth union of their distance fields, the way metaballs merge. Its leading edge runs to the new tab on a quick spring and its trailing edge follows on a softer one, so on a long jump the bridge between them stretches, necks and snaps, and the two halves flow back into one.",
    "Every spring keeps its velocity when the target changes, so scrubbing quickly across the bar never jumps: the drop is always where the physics has carried it. A last under-damped spring on its width gives the settle its wobble.",
  ],
  uses: ["Signed distance fields", "Springs", "Pointer events"],
  category: "interactions",
  inspiredBy: "Segmented controls and drops of water",
  // 204 × 132 at the 204px home tile
  tile: { aspect: 204 / 132 },
  stage: { aspect: 1 },
  controlsHint: "Click or tap a tab · Drag across the bar to scrub · ← → and Home / End on the keyboard",
};
