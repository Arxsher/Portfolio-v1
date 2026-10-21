import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "golden-room",
  title: "Golden hour room",
  summary: "A small isometric room lit through its window: drag the sun and every shadow sweeps across the floor.",
  description:
    "A desk corner in a small isometric room, lit by the sun through a window. Drag the sun across the sky and the shadows of the window frame, the plant, the chair and the things on the desk sweep over the floor and up the walls as the light warms toward evening. After dark the desk lamp and the monitor come on and the window fills with stars.",
  about: [
    "The room is built from simple solids seen in an isometric projection and lit by one sun, whose direction comes from where you hold it in the sky. Every object casts its shadow from that direction each frame, so the window's bars stretch into long slats across the floor as the sun drops, and the light itself turns from white to amber and then to blue dusk.",
    "Once the sun is down two small lights take over, the lamp's warm pool on the desk and the cool glow of the screen, and the window shows the night sky. The sun follows your drag on a spring, so the light keeps moving for a moment after you let go and settles softly.",
  ],
  uses: ["Canvas 2D", "Isometric projection", "Real-time shadows", "Springs"],
  category: "scenes",
  inspiredBy: "Late afternoon light through a window",
  // 204 × 214 at the 204px home tile
  tile: { aspect: 204 / 214 },
  stage: { aspect: 1 },
  controlsHint: "Drag the sun across the sky · ← → move the hour · Home and End jump to noon and night",
};
