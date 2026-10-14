import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "liquid-glass",
  title: "Liquid glass",
  summary: "A dock made of liquid glass that bends the scene behind it, with a droplet you can pull away and merge back in.",
  description:
    "A floating dock of liquid glass over a slowly drifting backdrop. The glass refracts what's behind it, splits light into colour at its edges and catches a bright rim. Drag the droplet away from the dock and bring it back: the two reach for each other and merge like liquid.",
  about: [
    "It is one WebGL2 fragment shader. The dock and the droplet are signed distance fields joined with a smooth union, which is what lets them bridge and merge when they come close. The slope of that field gives a surface normal at every pixel, and the backdrop is sampled through it as through a lens; reading the red, green and blue channels at slightly different offsets gives the colour fringes near the edge, and a Fresnel term adds the bright rim.",
    "The droplet follows your pointer on a spring, so a fast drag stretches and wobbles it before it settles. Frost softens what the glass sees and tint colours it. The material also gives its name to Liquid Glass, a website in the work list.",
  ],
  uses: ["WebGL2", "GLSL", "Signed distance fields", "Springs"],
  category: "components",
  inspiredBy: "Liquid glass interfaces",
  // 204 × 248
  tile: { aspect: 204 / 248 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Drag the droplet · Hover the dock · Adjust frost and tint",
};
