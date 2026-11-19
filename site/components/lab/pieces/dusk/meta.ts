import type { PieceMeta } from "../../types";

// The slug stays "dusk" so links to /lab/dusk/ keep working.
export const meta: PieceMeta = {
  slug: "dusk",
  title: "Last light",
  summary:
    "A dithered print of a lighthouse on a headland: drag the sun into the sea and the day runs into night, the lamp strikes and its beams sweep the dark.",
  description:
    "A small print of the sea, drawn live through an ordered dither in two to four colours. Move over the sky to move the sun, and the light, the glitter on the water and the time of day follow it. Drag it down into the sea and the evening plays out under your hand: golden hour, dusk, the cottage windows coming on, the lighthouse striking and turning its beams, then the moon and the stars. Click to leave the sun where it is.",
  about: [
    "A WebGL2 shader works out one tone per dot rather than per pixel: a sky graded by the sun's height, with a hot band along the horizon at golden hour, an afterglow and then stars, and a shooting star now and then once it is properly dark; thin cloud streaks lit from underneath near the sun and silvered near the moon; the sun's disc, squashed a little as it meets the sea; and the moon, which is in the sky all along as a pale disc and only shows as the light goes. It is drawn as a lit sphere whose bright side faces wherever the sun is, so its edge turns as you move the sun below the horizon. On the right a headland rises out of the sea with rocks off its point, a cottage, a shed and a banded lighthouse shaded as a white cylinder, its sun-side edge catching the low light.",
    "The lamp strikes when the sun goes under, with two quick flickers and a warm rise, and goes out again a little higher up, so a sun resting on the line never flickers it. Its two beams are cones of lit air drawn in perspective: long and level across the picture, narrowing toward the horizon as they swing away, flaring as one turns through you. The sea is a perspective plane of layered waves rolling toward you; each dot mirrors the sky and the headland through its wave normal, weighted for the angle it is seen at, and the sun, the moon and the lamp each lay their own glitter path, worked out from how likely a wavelet there is tilted to throw that light back at you.",
    "A second pass turns the tones into the palette with an 8×8 Bayer matrix, which is what makes gradients into the regular crosshatch of an ordered dither. Dots are whole device pixels at any screen density, so the print stays crisp, and because the scene is worked out once per dot, bigger dots cost less. Each palette has its own tone curve, so a single ink on paper still shows a gradient of sparse to dense dots. The sun follows the pointer on a heavy, critically damped spring, waits on the horizon while a hovering pointer passes over the sea, and on a touch screen a sideways drag moves it along its path. Once you click, the sea rolls in: surf made from filtered noise, a gull now and then while there is light, a bell buoy after dark, and the lamp's thunk and ticks as it strikes.",
  ],
  uses: ["WebGL2", "GLSL", "Ordered dithering", "Web Audio"],
  category: "scenes",
  inspiredBy: "Ordered-dither prints and lighthouses on the coast",
  // 204 × 116 at the 204px home tile (the third column ends level with the others)
  tile: { aspect: 204 / 116 },
  stage: { aspect: 0.74, minHeight: 440 },
  controlsHint:
    "Move over the sky to move the sun · Drag it down into the sea for night · Click or tap to leave it there · Drag sideways on a touch screen to change the hour · ↑ ↓, Page Up / Down, Home and End raise and lower it, ← → move it along the horizon",
  sound: true,
};
