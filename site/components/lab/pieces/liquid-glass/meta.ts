import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "liquid-glass",
  title: "Liquid glass",
  summary:
    "A glass tab bar in front of a warm room on a rainy evening, and a droplet of the same glass you can pull away and pour back in.",
  description:
    "A tab bar made of liquid glass, floating in front of a room on a rainy evening: low sun through a wet window and fairy lights in the light theme, a lamp, street light and glowing bulbs in the dark one. The frosted bar softens the room behind it and its rim splits the light into colour. The droplet is the clear part: drag it over the bulbs to see them magnified, then into the bar and back out, and the two bridge, merge and pinch apart like liquid.",
  about: [
    "It is two WebGL2 passes. The first draws the room into a texture at the canvas's own resolution, in half float where the browser allows it, with a full mip chain: a plaster wall, a lamp's glow, the light of a window out of frame cut by its bars and speckled by the raindrops on its glass (a few slide down in fits and starts), the shadow of a potted plant on the sill, two swags of fairy lights that switch on one by one, and a second string close to the lens, out of focus, as soft discs that turn into cat's eyes toward the edges. The second pass draws the screen from it. The bar and the droplet are one signed distance field, a rounded box and a squashable ellipse joined by a smooth minimum, so they reach for each other and merge when they come close. Over that field sits a thickness profile, a rounded bevel at the rim and flat beyond it, and its slope gives a surface normal at every pixel.",
    "The room is read through that normal with refract() at six wavelengths, which is where the colour fringes come from; the clear droplet magnifies what is under its flat middle like a lens and splits the bulbs into colour at its rim. The bar is frosted: it reads blurrier mip levels with a cubic filter, and because the bulbs are kept brighter than white, frost spreads them into a real glow. The room reflects in the glass: a Fresnel term, the window as a small soft box up on the left, the lamp low on the right. In the window light the glass casts a sun shadow that still lets light through, darkens at the rim and, under the droplet, gathers into a bright caustic. Under each icon the frost thickens into a soft plate so the icons stay legible over anything, ink in the daylit room and white at night. A soft shoulder and film grain finish the frame.",
    "The droplet chases your pointer on a spring and stretches along its own velocity; let go after a fast drag and it is thrown on and wobbles like jelly, and let go over the bar and it is drawn in. Bridging onto the bar or pinching off sends a ripple through the glass, with a small synthesised sound for each: a plip when you pick the droplet up, a round blob as it merges, a pop as it comes free, a glass tap for the tabs. The material is shared with Liquid Glass, a website in the work list that is still being built.",
  ],
  uses: ["WebGL2", "GLSL", "Signed distance fields", "Springs", "Web Audio"],
  category: "interactions",
  inspiredBy: "Liquid glass interfaces, fairy lights and rain on a window",
  // 204 × 248
  tile: { aspect: 204 / 248 },
  stage: { aspect: 0.74, minHeight: 440 },
  controlsHint:
    "Drag the droplet, even out of the bar, or flick it (or focus it and use the arrow keys, Enter to drop it in or lift it out) · Tab to the bar and use the arrow keys to switch tabs · Choose a tint, refraction and frost",
  sound: true,
};
