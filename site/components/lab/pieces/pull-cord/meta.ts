import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "pull-cord",
  title: "Pull cord",
  summary: "A pendant lamp you switch with its cord: draw the pull down until it clicks and the room, and the site, go dark or light.",
  description:
    "A graphite pendant lamp with a braided cord and a porcelain pull. Draw the pull down: the cord slides out of the switch, the lamp tips toward your hand and clicks. The light goes out through an orange afterglow and the pull starts to glow in the dark; pull again and the light blooms back out of the bulb across the wall. Let go and the cord snaps home, bounces and swings, and the lamp sways with it.",
  about: [
    "The cord is a rope of twenty particles solved with XPBD (position-based dynamics with compliance) six hundred times a second, with weak bending so it hangs like braided cotton. Its top runs into a spring-loaded switch behind the grommet: the cord's tension draws it out against a preload and a cam that resists up to the click and gives past it, and the lamp it is mounted in hangs from the ceiling as a heavy pendulum with a little give in its cable, so pulling to the side swings the shade and a hard pull dips it. Your hand holds the cord with a strong spring whose force is capped, so the cord follows exactly until the switch is fully out, and keeps the speed of a flick when you let go.",
    "Everything is drawn in one WebGL2 pass. The shade is half an ellipsoid ray-cast from a little below, so the lit enamel inside shows through the rim; the bulb is clear glass with a coiled filament whose colour follows its temperature as it heats and cools. The lamp throws a scallop of light down the wall, cut off by the rim, with the cord's and the pull's shadows in it. Switching on, the room fills with light outward from the lamp; switching off, the phosphorescent glaze on the pull, charged by the light, glows and slowly settles. With Site theme on, the switch sets this site's light or dark theme, and changing the theme anywhere else tugs the cord by itself.",
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
