import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "commit-city",
  title: "Commit city",
  summary: "A year of real GitHub contributions built as a small isometric city, one block per day.",
  description:
    "Every day of 2026 as a block in a small isometric city, its height set by that day's contributions, with the weeks laid out as streets. The city follows the site's theme from day to night, and after dark the windows light up. Hover a building to see its date and count.",
  about: [
    "The data is the real contribution calendar from GitHub, the same one behind the graph on the home page; nothing is invented or smoothed. Each day becomes a box in isometric projection, drawn back to front so nearer buildings overlap the ones behind, with a soft contact shadow under each and a lit side and a shaded side to give it form.",
    "Drag sideways to turn the city in quarter turns (it eases into place), and scroll or pinch to zoom. In the dark theme the sky turns to night and the taller buildings light their windows.",
  ],
  uses: ["Canvas 2D", "Isometric projection", "GitHub data"],
  category: "generative",
  inspiredBy: "GitHub's contribution graph",
  // 204 × 140
  tile: { aspect: 204 / 140 },
  stage: { aspect: 1 },
  controlsHint: "Hover for a day · Drag to turn · Scroll or pinch to zoom",
};
