import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "seal",
  title: "Seal",
  summary: "Hold to press a wax seal onto a letter, then break it to let the letter out.",
  description:
    "A letter, an envelope and a stick of wax. Hold the button and the pressure builds until a seal drops onto the flap, spreads and sets with the arsher mark pressed into it. Break the seal and the letter slides back out.",
  about: [
    "The hold is the whole interaction: a ring fills while you press, and the card trembles a little more the closer it gets, so letting go early feels like backing off. Release before the ring closes and everything eases back to rest. At the end the stamp drops in on a spring, squashes the wax outward, and the seal cools from glossy to set with the mark embossed in it, landing with a soft synthesised thunk.",
    "Once sealed, a chip counts down twenty-four hours until it opens again. Click the seal to break it early: it cracks into shards that fall away, and the letter slides out of the envelope. It's a nod to sealed., one of the projects in the work list, where confessions are locked away.",
  ],
  uses: ["SVG", "Springs", "Web Audio"],
  category: "components",
  inspiredBy: "Wax letter seals",
  // 204 × 200
  tile: { aspect: 204 / 200 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Hold the button, or hold Space or Enter · Click the seal to break it",
  sound: true,
};
