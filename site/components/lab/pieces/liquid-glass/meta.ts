import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "liquid-glass",
  title: "Liquid glass",
  summary: "A glass tab bar that bends the poster behind it, and a droplet of the same glass you can pull away and pour back in.",
  description:
    "A tab bar made of liquid glass, floating over a slowly drifting poster of type, colour and a fine grid. Its rim bends what lies just beyond it and splits it into colour, and its icons turn white when dark letters pass beneath. Drag the droplet into the bar and back out: the two bridge, merge and pinch apart like liquid.",
  about: [
    "It is two WebGL2 passes. The first draws the backdrop (the grid, an orange disc, a cobalt band and the word set in Geist, plus the glass's own soft shadow) into a texture with a full mip chain. The second draws the glass: the bar and the droplet are one signed distance field, a rounded box and a squashable ellipse joined by a smooth minimum, so they reach for each other and merge when they come close. Over that field sits a thickness profile, a rounded bevel at the rim and flat in the middle for the bar, a full dome for the droplet, and its slope gives a surface normal at every pixel.",
    "The backdrop is read through that normal with refract() at six wavelengths, which is where the colour fringes at the edges come from. Frost reads it from blurrier mip levels with a cubic filter, so even a heavy frost stays smooth. A Fresnel term mixes in a soft sky that is brighter on faces turned up, a key light from the upper left leaves a highlight and a bright rim, and on a mouse the pointer is a second, smaller light. The icons check how dark the backdrop under them is and switch between ink and white, as glass toolbars do.",
    "The droplet chases your pointer on a spring and stretches along its own velocity; let go after a fast drag and the stretch overshoots, so it wobbles like jelly. Bridging onto the bar or pinching off sends a ripple through the glass, with a small synthesised sound for each: a plip when you pick the droplet up, a round blob as it merges, a pop as it comes free, a glass tap for the tabs. The material is shared with Liquid Glass, a website in the work list that is still being built.",
  ],
  uses: ["WebGL2", "GLSL", "Signed distance fields", "Springs", "Web Audio"],
  category: "components",
  inspiredBy: "Liquid glass interfaces and drops of water",
  // 204 × 248
  tile: { aspect: 204 / 248 },
  stage: { aspect: 0.74, minHeight: 440 },
  controlsHint:
    "Drag the droplet (or focus it and use the arrow keys, Enter to drop it in or lift it out) · Tab to the bar and use the arrow keys to switch tabs · Choose a tint, refraction and frost",
  sound: true,
};
