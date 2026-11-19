import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "rain-window",
  title: "Rain window",
  summary: "A window on a rainy evening: rain runs down the glass, and you wipe the fog off it with a finger.",
  description:
    "A painted window on a rainy evening, the street outside blurred into warm lights. Rain beads and runs down the glass, every drop holding a tiny upside-down street, and the inside is fogged over: drag across it to wipe a streak, and the water you gathered beads along its edges and drips away while the fog creeps back. Knock on the glass to shake the drops loose; now and then the thunder does it for you.",
  about: [
    "The rain is simulated. Fine beads cover the glass, a few to each small cell of it, and never move; drops are bigger and alive. Surface tension holds a drop until it is heavy enough for gravity to win, and how heavy that is depends on the glass under it, a fixed field of slick and grubby patches, so a running drop lurches, stalls and goes again, leaning toward the slicker side. It swallows the beads in its lane, leaves a dotted trail of its own water behind, merges with any drop it touches (keeping their volume and momentum) and wobbles on a spring as it does. A knock on the glass sends a wave out across it that shakes the drops and loosens the heavy ones.",
    "There are two layers of water: the rain outside and the condensation inside. The fog is a small texture over the glass that every wipe, drip and breath is stamped into and that relaxes back over a few seconds, through a grainy threshold so it returns like frost rather than a fade. A copy of it on the CPU tells the fingertip how much fog it is wiping up, and that water goes somewhere: it beads along both edges of the streak, and once there is enough, a drip forms on the lower rim of the fingertip and runs, clearing a lane through the fog.",
    "Every bead and drop is drawn as a metaball kernel into a float texture, so drops that are about to touch bridge before they merge, and a running drop is a round head with a tapering tail. Each drop is then a lens: the slope of the field bends the view through it, and it shows the street in focus and upside down, while the glass around it shows the same street out of focus. The street is drawn three times every frame for that, crisp, as soft discs and as the glow through fog, from one list of lights: lit windows, a shop with bulbs under its awning, streetlamps, a traffic light changing at the corner and cars going by, each doubled by its reflection in the wet road. The window frame is a height field lit by a lamp in the room. The rain, the rub of a fingertip on wet glass, the knock and the thunder are synthesised in the browser.",
  ],
  uses: ["WebGL2", "Water simulation", "Metaballs", "Refraction", "Depth of field", "Web Audio"],
  category: "scenes",
  inspiredBy: "Wiping a window clear to look out on a rainy evening",
  // 204 × 250 at the 204px home tile: one casement
  tile: { aspect: 204 / 250 },
  stage: { aspect: 0.78, minHeight: 420 },
  controlsHint:
    "Drag on the glass to wipe the fog · Click or tap to knock · Arrow keys wipe, Space or Enter knocks, T calls the thunder, B breathes on the glass, 1 2 3 set the rain",
  sound: true,
};
