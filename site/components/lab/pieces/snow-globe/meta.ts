import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "snow-globe",
  title: "Snow globe",
  summary: "A glass snow globe with a log cabin in the pines: pick it up, shake it, and the snow swirls through the water and slowly settles.",
  description:
    "A glass globe full of water on a turned walnut base, with a log cabin and a few pines inside. Pick it up and shake it: the globe swings and twists in your hand, the snow boils up through the water and keeps swirling after you stop, then drifts down and settles on the roof and the boughs. In the dark theme it is night inside, and the cabin's windows flicker on.",
  about: [
    "Every pixel is a ray traced in the globe's own frame, so the globe can tilt and travel freely. The glass is a shell four and a half percent thick: a ray bends going into the glass and again going into the water, so the cabin is magnified and swims toward the rim the way it does in a real globe, and the thin edge where light passes through glass alone turns green. The glass reflects a small studio (a softbox, a strip light and two black flags that draw its edges) by Schlick's Fresnel. Inside, the snow, the log cabin and the pines are signed distance fields, lit by the sun or the moon with soft shadows and ambient occlusion, and at night by the cabin's windows, whose light falls on the snow and hangs as a warm haze in the water. The base is a turned walnut profile under a clear coat, with a brass band.",
    "The water is three flows added together: it keeps its spin while the glass turns under it and is slowly dragged back into step, it rolls through the middle when it is pushed, and it churns in proportion to the shake. Fifteen hundred flakes follow it with a little lag, sink along the globe's own down as it tilts, flutter, and settle on whatever lies below them until the water moving past is quick enough to lift them again. Each flake is drawn where it would appear through the glass: the GPU searches, flake by flake, for the path from the eye that bends through both surfaces and reaches it. Flakes off the focal plane open into soft discs, as in a macro photograph.",
    "The globe itself is a rigid body on springs. A stiff, critically damped spring carries it after your hand, three damped pendulums swing its tilt with the hand's acceleration, and when you let go a softer spring sets it back down with the speed you let go at, so it lands with a small bounce and rocks on the rim of its foot. The sounds are made in the browser: the water swishes with the churn and the walnut thunks on the table.",
  ],
  uses: ["WebGL2", "Ray tracing", "Signed distance fields", "Refraction", "Particle simulation", "Springs", "Web Audio"],
  category: "scenes",
  inspiredBy: "Glass snow globes, and macro photographs of them",
  // 204 × 230 at the 204px home tile
  tile: { aspect: 204 / 230 },
  stage: { aspect: 0.78, minHeight: 420 },
  controlsHint:
    "Drag the globe to pick it up and shake it · Tap the glass to rock it · Space or Enter shakes it · ← → tip it on the table · ↑ lifts it and lets it drop · L switches the cabin light",
  sound: true,
};
