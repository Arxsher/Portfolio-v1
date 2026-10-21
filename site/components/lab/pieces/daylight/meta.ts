import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "daylight",
  title: "Daylight switch",
  summary: "A light and dark switch with a tiny landscape inside: drag the sun down behind the hills and the night comes in.",
  description:
    "A theme switch with a small world in its track. Drag or tap the knob and the sun arcs over and sets behind the hills while the sky runs through golden hour, the stars come out and the moon rises. Let go anywhere and it springs to the nearer side; the same switch, made small, sets this site's theme from the header.",
  about: [
    "The knob's place along the track is a single hour between noon and midnight, and everything inside is worked out from it: the sun's height on its arc, the sky's gradient from blue through gold to night, how much of the sun the hills hide, how many stars show and how far the moon has risen. Nothing is a canned animation, so the scene is exactly as far into the evening as your finger is.",
    "Released, the knob is carried to the nearer end by a spring that starts with the speed of your throw, so a flick crosses the whole track and a slow drag settles where you would expect. Grab it again mid-flight and it stays under your finger from wherever it is.",
  ],
  uses: ["SVG", "Springs", "Pointer events"],
  category: "interactions",
  inspiredBy: "Light switches and the last hour of daylight",
  // 204 × 150 at the 204px home tile
  tile: { aspect: 204 / 150 },
  stage: { aspect: 1 },
  controlsHint: "Drag or tap the knob · Flick it to throw it across · Space or Enter switches, ← → move the hour",
};
