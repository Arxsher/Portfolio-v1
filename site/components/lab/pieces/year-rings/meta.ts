import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "year-rings",
  title: "Year rings",
  summary: "A year of real GitHub contributions grown as the rings of a tree trunk, one ring for every week.",
  description:
    "The 2026 GitHub contributions behind this site, drawn as the cross-section of a tree: each week is a growth ring and each day a segment of it, thicker and darker the more was committed that day. Drag to move the light across the grain, point at the wood for a day and its count, and watch the rings grow out from the centre the first time it comes into view.",
  about: [
    "The data is the real contribution calendar from GitHub, the same one behind Commit city and the graph on the home page; nothing is invented. Rings run from the first week of the year at the heart to the latest at the bark, and within a ring the seven days go round in order, so a busy stretch shows as a band of dark, wide grain and a quiet week as a thin pale line.",
    "The wood is drawn in code, with grain that wanders slightly between rings and a light you can move across the cut face to bring out its relief.",
  ],
  uses: ["Canvas 2D", "GitHub data", "Springs"],
  category: "data",
  inspiredBy: "Tree rings and dendrochronology",
  // 204 × 204 at the 204px home tile
  tile: { aspect: 204 / 204 },
  stage: { aspect: 1 },
  controlsHint: "Point at a ring for its day and count · Drag to move the light · Arrow keys step through the days",
};
