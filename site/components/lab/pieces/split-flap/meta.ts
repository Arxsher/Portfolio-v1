import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "split-flap",
  title: "Departures",
  summary: "A split-flap board that clatters through its drum, flap by flap, to spell out your message.",
  description:
    "A departures board with real two-half flaps and the time in Casablanca. Every cell turns its drum one flap at a time until it lands, so each change ripples across the board with a clack per flap. Type a message and it rolls over to it, or press a flap and drag along a row to turn them by hand.",
  about: [
    "Each cell is built from plain elements and CSS 3D transforms: a fixed top half and bottom half, and two flaps that take turns falling between them. A flap's front is the top half of the old character; once it passes 90° you see its back, the bottom half of the new one. It falls under something like gravity, strikes the stop, bounces back a few degrees and settles, and the next flap is released as the last one lands, so a cell runs through its drum at about fifteen flaps a second.",
    "One light from above does all the shading. The falling front darkens as it tips away, the back catches a glint while it faces up, and the half underneath sits in the flap's shadow. Cells only ever turn forwards, so a change takes as many flaps as the two letters are apart on the drum, and neighbouring cells start a few milliseconds apart along the row and down the board, which is where the ripple comes from.",
    "The clack is synthesised as it plays: a few milliseconds of band-passed noise, a bright tick and a low knock, varied for every flap and panned by column. A full board can drop hundreds of flaps a second, so the landings in each frame are pooled into one or two clacks. The timetable lists Zakaria's projects, boarding while they are still in the works, and the clock reads Casablanca's time from the browser's own time-zone data.",
  ],
  uses: ["CSS 3D transforms", "Web Audio", "Intl time zones"],
  category: "components",
  inspiredBy: "Solari split-flap departure boards",
  // A landscape tile: the miniature board sits on it as an object, about 78% of its width.
  tile: { aspect: 204 / 144 },
  stage: { aspect: 1, minHeight: 360 },
  controlsHint:
    "Type a message and press Enter · Press, hold or drag along the flaps · On the board: arrows choose a flap, Space turns it, typing sets it · Shuffle · Change the rows",
  sound: true,
};
