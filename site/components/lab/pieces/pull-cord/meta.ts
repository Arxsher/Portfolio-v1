import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "pull-cord",
  title: "Pull cord",
  summary: "A pendant lamp you switch with its cord: draw the pull down until it clicks and the room, and the site, go dark or light.",
  description:
    "A graphite pendant lamp with a braided cord and a porcelain pull. Draw the pull down until the switch clicks: the room drops into the dark with an orange afterglow in the bulb and the pull starts to glow, or the light blooms back out of the lamp across the wall. Let go and the cord snaps home, bounces and swings, and the lamp sways with it.",
  about: [
    "The cord is a rope of twenty particles solved with XPBD (position-based dynamics with compliance) in steps of at most 1/600 of a second, with weak bending so it hangs like braided cotton. Its top runs into a spring-loaded switch behind the grommet: the cord's tension draws it out against a preload and a cam that resists up to the click and gives past it, and the lamp it is mounted in hangs from the ceiling as a heavy pendulum with a little give in its cable, so pulling to the side swings the shade and a hard pull dips it. Your hand holds the cord with a strong spring whose force is capped, so the cord follows exactly until the switch is fully out, and keeps the speed of a flick when you let go.",
    "Everything is drawn per pixel in WebGL2, the room first and then the lamp and the cord inside a box around them. The shade is half an ellipsoid ray-cast from a little below, so the lit enamel inside shows through the rim; the bulb is clear glass with a coiled filament whose colour follows its temperature as it heats and cools. The lamp throws a scallop of light down the wall, cut off by the rim, with the cord's and the pull's shadows in it. Switching off, the room drops into the dark in a fifth of a second and warms as it goes, the way a cooling tungsten filament does, while the coil glows orange a moment longer; switching on, the light lands on the wall first, then blooms out of the lamp into the room. The phosphorescent glaze on the pull, charged by the light, glows in the dark and slowly settles. The room is painted in this site's own colours, and with Site theme on the switch sets its light or dark theme; changing the theme anywhere else tugs the cord by itself.",
  ],
  uses: ["WebGL2", "XPBD rope physics", "Ray casting", "Springs", "Pointer events", "Web Audio"],
  category: "interactions",
  inspiredBy: "Ceiling pull-cord switches and enamel pendant lamps",
  // 204 × 280 at the 204px home tile
  tile: { aspect: 204 / 280 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Draw the pull down until it clicks · flick it to swing · tap the shade · Space or Enter pulls, ← → swing it",
  sound: true,
};
