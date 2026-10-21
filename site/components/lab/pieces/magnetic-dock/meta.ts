import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "magnetic-dock",
  title: "Magnetic dock",
  summary: "A dock whose icons swell smoothly under the pointer, glide aside as you reorder them and puff away when flicked out.",
  description:
    "An app dock with a soft magnifying field: icons grow as the pointer nears them, with a smooth falloff and no snapping. Drag an icon to a new place and its neighbours glide aside; throw it up and out and it vanishes in a soft puff. Click one to launch it with a bounce, and Restore brings everything back.",
  about: [
    "Each icon's size comes from its distance to the pointer through a smooth bell-shaped falloff, and the dock's width follows the sum, so the row breathes outward around your cursor instead of stepping from size to size. Every size and position runs on its own spring, which is what keeps the motion soft when the pointer moves fast.",
    "Dragging lifts an icon out of the row; the others slide to open a gap wherever it would land, and dropping it lets the gap close behind it. An icon thrown upward fast enough leaves the dock in a small cloud and the row closes up.",
  ],
  uses: ["Springs", "Pointer events", "CSS transforms"],
  category: "interactions",
  inspiredBy: "Application docks",
  // 204 × 140 at the 204px home tile
  tile: { aspect: 204 / 140 },
  stage: { aspect: 1 },
  controlsHint: "Move along the dock to magnify · Drag to reorder · Flick an icon up to remove it · Click to launch · Restore brings them back",
};
