import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "event-horizon",
  title: "Event horizon",
  summary: "A black hole you can fly around: its gravity bends the light behind it, and its glowing disk wraps over the top.",
  description:
    "A black hole with a disk of hot gas spinning round it. Drag to fly around it and the sky behind folds round the dark: stars smear into arcs, the far side of the disk shows up above and below the hole, and the side turning toward you burns brighter. Tap the disk to drop in a clump of gas and watch it flare as it orbits.",
  about: [
    "Every pixel is a ray of light traced backwards from your eye and bent by the hole's gravity as it goes, stepping through the photon's path around a Schwarzschild black hole rather than faking the distortion with a lens. Rays that come in too close never come out and draw the shadow; the ones that skim it can loop round, which is why the far side of the disk appears arched over the top and a thin bright ring hugs the edge. Each time a ray crosses the disk it picks up the gas's light: hotter toward the inside, turbulent, sheared by its own orbit, made brighter and bluer where the gas moves toward you (Doppler beaming) and redder where gravity drags on the light climbing out.",
    "In the dark the sky is stars and a faint band of nebula, so the lensing shows as streaked stars. On paper the sky is a printed grid of lines of longitude and latitude, so you can see exactly how the hole bends space. The scene is drawn at a lower resolution that steps down further if frames run slow, then scaled up with a soft glow taken from its mipmaps. The low drone and the flare's rush are synthesised.",
  ],
  uses: ["WebGL2", "GLSL", "Ray marching", "Web Audio"],
  category: "scenes",
  inspiredBy: "Renderings of black holes in films and physics papers",
  // 204 × 150 at the 204px home tile
  tile: { aspect: 204 / 150 },
  stage: { aspect: 4 / 5 },
  controlsHint:
    "Drag to fly around the hole · Scroll or pinch to move closer · Tap the disk to drop in gas · Keys: arrows orbit, + and − zoom, Space drops gas",
  sound: true,
};
