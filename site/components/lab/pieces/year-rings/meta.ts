import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "year-rings",
  title: "Year rings",
  summary: "This year's real GitHub contributions grown as a tree and cut into a slice: one ring a week, wider and darker on busy days.",
  description:
    "A slice of a tree that grew one ring for every week of 2026's GitHub contributions, from January at the pith to this week, still a crescent, at the bark. Busy days grow wide, dark latewood and quiet ones a pale hairline. Swing the light round the slice and the grain shimmers; move over the wood and a loupe glides after you with the day under it and its count.",
  about: [
    "The data is the real contribution calendar from GitHub, the same one behind Commit city; nothing is invented. Each ring is a week, Sunday to Saturday, and each day owns a seventh of it, Sunday at the back and the rest clockwise. A day's count sets how far its ring grows there (a little on a day without contributions, then with the square root of the count, so one huge day doesn't drown the rest) and how wide and dark its latewood is. Between two days the ring eases from one width to the next, and since every ring grows on the one before, weekdays with more work push the trunk out on their side, the way a real trunk grows lopsided. Days that haven't happened yet grow nothing.",
    "It is drawn with WebGL2. The rings are worked out per pixel from a table of where each ring lies at every angle, so they stay crisp at any size, with pale sapwood round a warmer heartwood, a dark pith, a cream cambium line and fissured bark down the side. The soft earlywood is worn a hair below the latewood, so each ring ends in a tiny step: a light from outside catches the steps as bright hairlines and a light from the pith side throws hairline shadows, so the grain shimmers as the light goes round, and the oil finish adds a soft sheen. The slice casts a soft shadow on the stage; after dark the light is a warm lamp that falls off across the wood.",
    "The loupe is a second render of the slice through a zoomed camera, composited through a round glass with a steel rim, a little barrel distortion and colour fringing at its edge: close up, the pores at the start of each ring and the fine rays are there. The light follows your hand on a stiff, critically damped spring and keeps the speed of a flick, coasting round on friction until it stops. The first time you see it, the year grows from the pith ring by ring, and Grow plays it again. Sound starts after your first click, tap or key: a tick for every ring the loupe crosses or the tree grows, and a wooden knock where you click.",
  ],
  uses: ["WebGL2", "GLSL", "GitHub data", "Springs", "Web Audio"],
  category: "data",
  inspiredBy: "Tree rings and the dendrochronologist's loupe",
  // 204 × 184 at the 204px home tile
  tile: { aspect: 204 / 184 },
  stage: { aspect: 0.86, minHeight: 420 },
  controlsHint:
    "Move over the wood for the loupe and a day's count · Drag to swing the light round, flick to spin it · Click to knock · Tap a ring, hold for the loupe on a touch screen · ← → walk the days, ↑ ↓ the rings, Q E swing the light",
  sound: true,
};
