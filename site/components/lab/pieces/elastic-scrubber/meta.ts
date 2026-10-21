import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "elastic-scrubber",
  title: "Elastic scrubber",
  summary: "A slider with weight: flick it and it coasts, pull past an end and it stretches back, and it clicks into its marks.",
  description:
    "A value scrubber that behaves like something physical. Flick it and it coasts on its own momentum, pull it past either end and it stretches like rubber and springs back, and near a marked value it is drawn in with a small tick. The number rolls like an odometer and the playhead stretches with its speed.",
  about: [
    "Under the track is a value with a velocity. Your drag sets both, letting go hands the velocity to friction so it coasts and slows, and past the ends the overshoot is squashed by a rubber-band curve and pulled back on a spring. Near a snap point a gentle magnet draws the value in once it has slowed enough, so a flick can still fly past the marks.",
    "Each mark it crosses makes a short synthesised tick, pitched by where it is on the scale. The readout's digits are columns that roll to their place, and the playhead's length follows the speed, so the motion can be read at a glance.",
  ],
  uses: ["Springs", "Inertia", "Web Audio"],
  category: "interactions",
  inspiredBy: "Jog wheels and video timelines",
  // 204 × 128 at the 204px home tile
  tile: { aspect: 204 / 128 },
  stage: { aspect: 1 },
  controlsHint: "Drag or flick the track · Pull past the ends · ← → nudge, Page Up / Down jump between marks",
  sound: true,
};
