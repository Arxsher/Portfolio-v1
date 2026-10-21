import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "seal",
  title: "Seal",
  summary: "Hold to pour the wax and press a brass stamp into it, then break the seal to let the letter out.",
  description:
    "An envelope on the table and a brass seal stamp standing beside it. Hold, and three drops of molten red wax fall onto the flap while the stamp is lifted, carried over and lowered, trembling as the pressure builds, until it lands and leaves the arsher mark pressed in. A chip counts down the day until it opens; break the seal early and the letter slides out.",
  about: [
    "The hold is the whole interaction. A ring fills while you press and the button sinks a little under your finger. The wax goes first: drops fall from above the frame, bigger and blurred by speed while they are close to the lens, and spread on a spring into a glossy dome. Then the stamp is picked up off the table, carried over with its top leading and swinging past when it slows, and lowered, slowing as it nears the wax and trembling over the last stretch. Let go early and it goes back to where it stood; the poured wax stays, so the next hold goes straight to the stamp. Hold to the end and it drops the last few millimetres, lands with a squash and a low synthesised thunk, and the puddle squeezes out from under its face and takes the mark before the stamp is carried back and set down with a knock.",
    "The camera looks straight down through a shifted lens, so the paper keeps its shape while the stamp leans away from a point below the frame and shows its front. The stamp is a lathe profile (brass head with a knurled band, collar and bead, a walnut handle swelling to a bulb, a small medallion with the mark on top) drawn as a stack of thin discs, each shaded with a gradient worked out once from a little studio around it: a big softbox upper left, a strip light on the right, the table below. Brass shows mostly what it reflects; the walnut is lit, with a clear coat that catches the softbox.",
    "The wax is a height field shaded per pixel on the CPU, only over the square it covers: a round molten dome while it is a puddle, then an irregular seal with a rounded meniscus, the sunken disc of the stamp's face with a rim of displaced wax, a border ring, a ring of beads and the pixel arrowhead of the arsher mark in relief. Light wraps further into the red than the other channels so the shadow side reads as translucent, crevices darken from a blurred copy of the height, and the reflection is a soft studio box, sharp while molten, satin once cooled.",
    "Break the seal and cracks run from where you struck it, along the flap's edge first, where the paper pulls the wax apart. The half on the flap goes up with it as it swings open on its hinge, the half on the pocket stays where it was, a few crumbs pop off and skitter across the paper, the letter slides out and the view pulls back to fit it. The countdown is kept in this browser, and at zero the seal opens on its own, a nod to sealed., one of the projects in the work list, where confessions can open themselves after a day.",
  ],
  uses: ["Canvas 2D", "Height-field shading", "Springs", "Web Audio"],
  category: "interactions",
  inspiredBy: "Wax letter seals and brass seal stamps",
  // 204 × 200
  tile: { aspect: 204 / 200 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Hold the button, the envelope or the stamp, or Space / Enter, to seal · Click the seal to break it · Seal another to start again",
  sound: true,
};
