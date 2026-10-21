import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "daylight",
  title: "Daylight switch",
  summary: "A light and dark switch with a tiny landscape inside: drag the sun down behind the hills and the night comes in.",
  description:
    "A theme switch with a small world in its track. Drag or tap the knob and the sun arcs down and sets behind the hills while the sky runs through golden hour, the cabin's windows light, the stars come out and the moon rises. Let go anywhere and it springs to the nearer side; the same switch, made small, sets this site's theme from the header.",
  about: [
    "The knob's place along the track is the hour, from mid-afternoon to late evening, and everything inside is worked out from it: the sun's height on its arc, the sky's four bands from blue through gold and rose to night, how much of the sun the far ridge hides, which stars are out (the brightest first) and how far the moon has risen, lit on the side where the sun went down. The ridges slide at different rates as the knob moves, the knob's shadow on the land swings and lengthens as the sun gets low, and its porcelain picks up the colour of the sky. Nothing is a canned animation, so the scene is exactly as far into the evening as your finger is.",
    "Released, the knob is carried to the nearer end by a spring that starts with the speed of your throw, so a flick crosses the whole track and a slow drag settles where you would expect; its small overshoot squashes the knob against the end instead of moving it. Grab it again mid-flight and it stays under your finger from wherever it is. The header's switch is this same component at a lower level of detail, drawn on a 2D canvas that sleeps as soon as the knob rests.",
  ],
  uses: ["Canvas 2D", "Springs", "Pointer events", "Web Audio"],
  category: "interactions",
  inspiredBy: "Light switches and the last hour of daylight",
  // 204 × 150 at the 204px home tile
  tile: { aspect: 204 / 150 },
  stage: { aspect: 0.95 },
  controlsHint: "Drag or tap the knob · Flick it to throw it across · Enter or Space switches · Hold ← → for a slow sunset",
  sound: true,
};
