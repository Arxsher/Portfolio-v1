import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "split-flap",
  title: "Departures",
  summary: "A split-flap board that clatters through its drum of letters to spell out your message.",
  description:
    "A departures board with real two-half flaps. Every cell flips through its drum one character at a time until it lands, with a clack for each flap. Type your own message and the board rolls over to it.",
  about: [
    "Each cell holds a drum of characters split across two halves. A flip folds the top half of the current character down over the bottom one, so the next character's top appears behind it while the falling flap darkens as it turns away from the light. Cells only ever move forward through the drum, so changing one letter can take a long run of flaps, and neighbouring cells start a few milliseconds apart, which gives the board its ripple.",
    "The clack is synthesised in the browser: a short burst of filtered noise with a fast decay, varied slightly per cell so a full row sounds like a mechanism rather than a sample on repeat. Until you type something, the rows show the local time in Casablanca and a few status lines.",
  ],
  uses: ["CSS 3D transforms", "Web Audio", "Springs"],
  category: "components",
  inspiredBy: "Solari split-flap departure boards",
  // 204 × 144
  tile: { aspect: 204 / 144 },
  stage: { aspect: 1, minHeight: 340 },
  controlsHint: "Type a message and press Enter · Change the number of rows",
  sound: true,
};
