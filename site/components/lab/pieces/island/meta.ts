import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "island",
  title: "Island",
  summary: "A small black pill that morphs into a timer, music with a live waveform, an upload or a call.",
  description:
    "A small black pill at the top of the screen that grows into whatever is going on: a running timer, a song with a live waveform, an upload's progress, an incoming call. The shape flows from one state to the next like a soft liquid and the contents cross-fade through a blur. Tap to expand or collapse it, or leave it to cycle on its own.",
  about: [
    "The pill's width, height and corner radius each run on their own spring, slightly under-damped, so a change of state overshoots by a hair and settles instead of easing in a straight line. Growing from a compact pill into a wide card, its contents fade, blur and scale through each other rather than popping.",
    "Everything in it is generic and drawn in code: the digits of the timer roll, the waveform moves with a gently varying level, and the progress ring fills. Nothing plays or uploads for real.",
  ],
  uses: ["Springs", "Shape morphing", "CSS filters"],
  category: "interactions",
  inspiredBy: "Live activity indicators on phones",
  // 204 × 150 at the 204px home tile
  tile: { aspect: 204 / 150 },
  stage: { aspect: 1 },
  controlsHint: "Tap the island to expand or collapse it · Pick a state, or let it cycle · Enter toggles, ← → change state",
};
