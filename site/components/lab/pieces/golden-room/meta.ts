import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "golden-room",
  title: "Golden hour room",
  summary: "A small room as a cut-away model: drag the sun across the sky and the window's light rakes across the floor and up the wall.",
  description:
    "A desk corner in a small room, shown as a cut-away model and lit only through its window. Drag the sun along its path and the patch of light, with the glazing bars' shadows in it, sweeps across the floor and climbs the desk wall as the afternoon turns gold, then red. After sunset the monitor wakes, the lamp clicks on and the window fills with stars.",
  about: [
    "The room is built from signed distance fields and ray-marched once into a G-buffer (the camera never moves), so each frame only has to light it again. Sunlight can only come in through the window: for every point, the shader follows the ray toward the sun to the wall and tests the opening, the steel frame and the glazing bars directly, with a penumbra that widens with distance, so the bars' shadows are crisp by the sill and soft across the room. A short soft-shadow march through the furniture adds the chair, the fig, the lamp and the rest.",
    "The sun comes from a real solar model for a window facing west-south-west at a middle latitude: it rises at the right of the stage, crosses the top at a quarter past one and sets at the left at 19:45, reddening with the air it passes through. Dust glints only inside the beam, the air glows where the light crosses it, and the bright patch bounces warm light back into the room. The sun follows your hand on a critically damped spring and keeps the speed of a flick, so the light sweeps on and then settles.",
  ],
  uses: ["WebGL2", "Signed distance fields", "Soft shadows", "Volumetric light", "Springs", "Web Audio"],
  category: "scenes",
  inspiredBy: "Late afternoon light through a window",
  // 204 × 214 at the 204px home tile
  tile: { aspect: 204 / 214 },
  stage: { aspect: 1 },
  controlsHint: "Drag the sun across the sky · click the lamp or the screen · ← → move the hour, Shift for a whole hour",
  sound: true,
};
