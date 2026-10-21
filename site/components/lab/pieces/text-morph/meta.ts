import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "text-morph",
  title: "Text morph",
  summary: "Type two words and watch each letter melt into the next through signed distance fields, with a soft ink edge.",
  description:
    "Type two words and scrub between them, or let it play: each letter flows into its partner through its signed distance field rather than a cross-fade, with a soft ink edge, while the spacing eases from one word's widths to the other's. Set in Geist.",
  about: [
    "Each glyph is rasterised from Geist and turned into a signed distance field, an image where every pixel holds how far it is from the letter's outline. Blending two such fields and drawing their zero line gives a shape that is always a clean solid letterform part way between the two, so an A grows its way into an R instead of fading through it.",
    "A GPU shader draws the blended outline with a soft, slightly bleeding edge like ink on paper, and the letters' advances blend at the same rate, so the word changes its width smoothly as it changes its letters.",
  ],
  uses: ["WebGL2", "Signed distance fields", "Geist"],
  category: "interactions",
  inspiredBy: "Type specimens and ink",
  // 204 × 160 at the 204px home tile
  tile: { aspect: 204 / 160 },
  stage: { aspect: 1 },
  controlsHint: "Type the two words · Drag the scrubber or press Play · Space plays and pauses, ← → scrub",
};
