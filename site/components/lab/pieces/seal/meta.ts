import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "seal",
  title: "Seal",
  summary: "Hold to press a wax seal onto an envelope, then break it to let the letter out.",
  description:
    "An envelope on the table and a brass seal stamp. Hold the button and the stamp comes down, trembling as the pressure builds, until it lands in molten red wax and lifts away to leave the arsher mark pressed in. A chip counts down the day until it opens; break the seal early and the letter slides out.",
  about: [
    "The hold is the whole interaction. A ring fills while you press, the button sinks a little under your finger, and the stamp descends out of focus toward the flap, slowing as it gets close and trembling over the last stretch. Let go early and everything eases back up. Hold to the end and the stamp drops the last few millimetres, lands with a squash and a low synthesised thunk, and the wax squeezes out from under its face on a spring before the stamp lifts away.",
    "The wax is a height field shaded per pixel on the CPU into a small canvas: an irregular puddle with a rounded meniscus, the sunken disc of the stamp's face with a rim of displaced wax around it, and a border ring, a ring of beads and the pixel arrowhead of the arsher mark in relief. Light wraps further into the red than the other channels so the shadow side reads as translucent, crevices darken from a blurred copy of the height, and the light's reflection is a soft studio box, sharp and bright while the wax is molten, broad and satin once it has cooled.",
    "The envelope is cotton paper drawn in code (grain, cloudy formation and short fibres) and cached in layers, lit from the upper left: the fold catches the light and the flap casts a soft shadow on the pocket. Break the seal and cracks run out from where you struck it, the pieces (a Voronoi split seeded around the blow) pop off and settle, the flap swings open on its hinge to show the printed lining, and the letter slides out. The countdown is kept in this browser, and at zero the seal opens on its own, a nod to sealed., one of the projects in the work list, where confessions can open themselves after a day.",
  ],
  uses: ["Canvas 2D", "Height-field shading", "Springs", "Web Audio"],
  category: "components",
  inspiredBy: "Wax letter seals and brass seal stamps",
  // 204 × 200
  tile: { aspect: 204 / 200 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Hold the button, the envelope, or Space / Enter to seal · Click the seal to break it · Start over to seal another",
  sound: true,
};
