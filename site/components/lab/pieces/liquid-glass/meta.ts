import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "liquid-glass",
  title: "Liquid glass",
  summary: "A glass tab bar that bends the poster behind it, and a droplet of the same glass you can pull away and pour back in.",
  description:
    "A tab bar made of liquid glass, floating over a slowly drifting poster of type, colour and a fine grid. Its frosted body softens what passes behind it, and its rim bends in a thin sliver of what lies just beyond and splits it into colour. The droplet is the clear part: drag it over the letters to see them magnified, then into the bar and back out, and the two bridge, merge and pinch apart like liquid.",
  about: [
    "It is two WebGL2 passes. The first draws the backdrop (the grid, an orange disc, a cobalt band with a thin echo and the word set in Geist, plus the glass's own soft shadow) into a small texture with a full mip chain. The second draws the screen: outside the glass the same backdrop again, straight from its function at full resolution, and inside it the glass. The bar and the droplet are one signed distance field, a rounded box and a squashable ellipse joined by a smooth minimum, so they reach for each other and merge when they come close. Over that field sits a thickness profile, a rounded bevel at the rim and flat beyond it, and its slope gives a surface normal at every pixel.",
    "The backdrop is read through that normal with refract() at six wavelengths, which is where the colour fringes at the edges come from. The bar is frosted: it reads blurrier mip levels with a cubic filter, and its narrow rim draws in a thin bright sliver of what lies just past it. The droplet skips the frost and magnifies what is under its flat middle, bends it hard at the rim and gathers a crescent of light on its far side. A Fresnel term mixes in a soft sky that is brighter on faces turned up, a key light from the upper left leaves a highlight and a bright rim, and a hovering mouse is a second light that glints along the rims. Under each icon the frost thickens into a soft plate, light under ink icons and dark under white ones, and the whole bar takes one tone from how light the ground beneath it reads, so the icons stay legible whatever drifts past.",
    "The droplet chases your pointer on a spring and stretches along its own velocity; let go after a fast drag and the stretch overshoots, so it wobbles like jelly. Bridging onto the bar or pinching off sends a ripple through the glass, with a small synthesised sound for each: a plip when you pick the droplet up, a round blob as it merges, a pop as it comes free, a glass tap for the tabs. The material is shared with Liquid Glass, a website in the work list that is still being built.",
  ],
  uses: ["WebGL2", "GLSL", "Signed distance fields", "Springs", "Web Audio"],
  category: "interactions",
  inspiredBy: "Liquid glass interfaces and drops of water",
  // 204 × 248
  tile: { aspect: 204 / 248 },
  stage: { aspect: 0.74, minHeight: 440 },
  controlsHint:
    "Drag the droplet, even out of the bar (or focus it and use the arrow keys, Enter to drop it in or lift it out) · Tab to the bar and use the arrow keys to switch tabs · Choose a tint, refraction and frost",
  sound: true,
};
