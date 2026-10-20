import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "dusk",
  title: "Casablanca at dusk",
  summary: "A small dithered print of the Atlantic at sunset, a minaret on the shore; move the sun and the light follows.",
  description:
    "A print of the sea at Casablanca, drawn live through an ordered dither in two to four colours. Move over the sky to move the sun: the light, the glitter on the water and the time of day follow it. Rest on the sea and it sets, and the town's windows light up one by one. Click to leave the sun where it is.",
  about: [
    "A WebGL2 shader works out one tone per dot rather than per pixel: a sky graded by the sun's height, with a hot band along the horizon at golden hour, an afterglow and then stars; thin cloud streaks lit from underneath near the sun; the sun's disc, squashed a little as it meets the sea; gulls that flap in bouts and glide; and a low shore with houses, a mosque and a square minaret whose windows come on in turn as dusk deepens. The sea is a perspective plane of layered waves rolling toward you. Each dot mirrors the sky or the shore through its wave normal, weighted for the angle it is seen at, and the sun's glitter path comes from how likely a wavelet there is tilted to throw the sun back at you, with a twinkle of its own.",
    "A second pass turns the tones into the palette with an 8×8 Bayer matrix, which is what makes gradients into the regular crosshatch of an ordered dither. Dots are whole device pixels at any screen density, so the print stays crisp, and because the scene is worked out once per dot, bigger dots cost less. Each palette has its own tone curve, so a single ink on paper still shows a gradient of sparse to dense dots. A new palette or dot size comes in dot by dot in Bayer order, like a print being pulled. The sun follows the pointer on a heavy spring, waits on the horizon while the pointer passes over the sea, and on a touch screen a sideways drag moves it along its real path, setting toward the north. Once you click, the sea rolls in: surf made from filtered noise, swelling on alternate sides, with a distant gull now and then while there is light.",
  ],
  uses: ["WebGL2", "GLSL", "Ordered dithering", "Web Audio"],
  category: "generative",
  inspiredBy: "Ordered-dither prints and the Atlantic coast",
  // 204 × 116 at the 204px home tile (the third column ends level with the others)
  tile: { aspect: 204 / 116 },
  stage: { aspect: 0.74, minHeight: 440 },
  controlsHint:
    "Move over the sky to move the sun · Rest on the sea to let it set · Click or tap to leave it there · Drag sideways on a touch screen to change the hour · ↑ ↓, Page Up / Down, Home and End raise and lower it, ← → move it along the horizon",
  sound: true,
};
