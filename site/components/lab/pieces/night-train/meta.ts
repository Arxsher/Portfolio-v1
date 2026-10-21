import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "night-train",
  title: "Night train",
  summary: "A train glides across a viaduct over a valley; drag the sky to move from day into night.",
  description:
    "A valley with a stone viaduct and a river under it. A train glides across with its windows lit. Drag across the sky to move the sun from afternoon into night, when the headlight sweeps the tracks and the windows glow on the water. Click to send the next train.",
  about: "Drawn live in the browser.",
  uses: ["WebGL2"],
  category: "scenes",
  tile: { aspect: 1.3600 },
  controlsHint: "Drag across the sky to change the time · Click to send a train",
};
