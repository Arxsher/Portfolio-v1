import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "pull-cord",
  title: "Pull cord",
  summary: "A hanging lamp on a cord that behaves like rope: pull it down until it clicks and the lights go out, or come on.",
  description:
    "A pendant lamp hanging on a cord. Grab the pull and draw it down: the cord stretches, the switch clicks, and the lamp comes on with a warm bloom while the stage goes dark around it, or turns off again. Let go and the cord swings back and settles.",
  about: [
    "The cord is a Verlet rope: a chain of points that remember where they were a moment ago and are pulled back to their neighbours' distance several times a frame, so it hangs, sways and whips like the real thing. Its top is fixed in the lamp; the pull at the bottom follows your finger while you hold it and is handed back to the physics when you let go, with the speed you gave it.",
    "The switch reads how far past its rest the pull has been drawn. Past the click point it toggles once, with a short synthesised click, and the lamp's light blooms in or fades away as the stage swaps between light and dark.",
  ],
  uses: ["Verlet physics", "Canvas 2D", "Web Audio"],
  category: "interactions",
  inspiredBy: "Pull-cord light switches",
  // 204 × 280 at the 204px home tile
  tile: { aspect: 204 / 280 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Grab the pull and drag it down until it clicks · Flick it to set it swinging · Space or Enter pulls it",
  sound: true,
};
