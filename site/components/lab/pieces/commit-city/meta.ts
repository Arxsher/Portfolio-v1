import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "commit-city",
  title: "Commit city",
  summary: "A year of real GitHub contributions built as a small isometric city, one block per day.",
  description:
    "Every day of 2026 so far as a lot in a small model city, with a building whose height follows that day's contributions: the weeks run as streets, each month opens with a wider avenue, and the year folds into districts a season long, like lines on a page. Drag to turn it a quarter at a time, scroll or pinch to zoom, and point at a building for its date and count. The city follows the site's theme, and after dark its windows light up floor by floor.",
  about: [
    "The data is the real contribution calendar from GitHub, the same one behind the graph on the home page; nothing is invented or smoothed. Each week is a short street of seven lots, Sunday to Saturday, and the weeks line up into districts of about a season, broken where a month begins and laid one in front of the other, so the whole year fits on one plinth with the latest weeks nearest to you. A building's height follows the square root of the day's count, so one busy day doesn't flatten the rest of the year, and a day without contributions stays an empty lot. The busiest day of the year gets a tower with setbacks and an antenna.",
    "It is drawn with Canvas 2D in an orthographic projection where every wall and roof is a single affine transform, so windows stay crisp at any zoom. A lamp that turns with the camera lights the walls; each building casts a soft shadow clipped to the plinth, with contact shadows and ambient occlusion at its base. Month names are set along the boulevards like street names, wherever the ground is clear. At night the walls go dark, the windows come on a floor at a time, and a bloom pass adds their glow.",
    "Turns settle into each quarter on a spring with a soft wooden detent click, and pointing at a building plays a small note pitched by its height, so a sweep across the city plays the year back. Sound starts after your first click, tap or key press and follows the lab's mute.",
  ],
  uses: ["Canvas 2D", "Isometric projection", "Web Audio", "GitHub data"],
  category: "generative",
  inspiredBy: "GitHub's contribution graph and architects' massing models",
  // 204 × 140
  tile: { aspect: 204 / 140 },
  stage: { aspect: 1 },
  controlsHint: "Hover or tap a building · Drag to turn · Scroll or pinch to zoom · Arrow keys walk the weeks and days, Q and E turn",
  sound: true,
};
