import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "night-train",
  title: "Night train",
  summary:
    "A stone viaduct across a valley at evening: drag the sky to run the day into night, and click to send the next train out of the hill.",
  description:
    "A valley seen from the river bank: a curved viaduct of eleven arches between two tunnels, a hamlet on the water, pines up the slopes. Drag the sun, or anywhere on the sky, and the evening plays out under your hand, from golden hour through sunset to a moonlit night when the coaches' windows glow, the headlight sweeps the curve and it all shimmers in the river. Click and the next train comes out of the hill.",
  about: [
    "The valley is a real 3D scene, built once in the browser and drawn with WebGL2: a terrain mesh with its own ambient occlusion worked out from the slopes around each point, the viaduct lofted along its curve (piers with pilasters, arches, a string course, parapets, footings in the river), two tunnel portals with dark recesses, a hamlet, rocks along the banks and some five hundred instanced pines. The cars are instanced too, posed each frame along the line, and hidden past the tunnel mouths so a train really comes out of the hill.",
    "One number drives the light: the hour. It sets the sun on a path that starts high on the left and sets straight up the valley, through the middle arch, and a set of keyed colours for the sky, the haze, the sunlight and the ambient. The sky (a gradient, the glow around the sun, a cloud deck lit from below at sunset, stars, and a moon lit from wherever the sun has gone) is the same function the fog and the haze use, so distant hills melt into the right colour. A shadow map of the sun, or of the moon after dark, lets the piers and the train throw long shadows. The river is the scene drawn a second time upside down, read back through flowing ripples, with a glitter path to the sun or the moon that breaks into sparkles.",
    "At night the compartments glow (most lit warm, a few dark, some blinds half down), the hamlet's windows come on one by one, the train lights the parapets as it passes, and its headlight is a cone of light marched through the river mist in a half-size pass. Everything is rendered in floating point where the device allows, then finished with a bloom chain and a filmic curve. The hour is a critically damped spring: grab the sun and it follows your hand along its path, drag anywhere else to scrub, and a flick carries on and settles. Each wheel over each rail joint is a sound, timed to the frame it falls in, with the horn from the tunnel and crickets after dark.",
  ],
  uses: ["WebGL2", "GLSL", "Shadow mapping", "Planar reflections", "Instancing", "Springs", "Web Audio"],
  category: "scenes",
  inspiredBy: "Stone railway viaducts curving across hill valleys",
  // 204 × 150 at the 204px home tile
  tile: { aspect: 1.36 },
  stage: { aspect: 0.78, minHeight: 460 },
  controlsHint:
    "Drag the sun or the sky to change the time · Click or tap to send the next train · Drag sideways on a touch screen · ← → move the hour, Shift a whole hour · Enter sends a train",
  sound: true,
};
