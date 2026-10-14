import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "macropad",
  title: "Macropad",
  summary: "A nine-key mechanical macropad with sculpted keycaps, light under every switch and a knob for the colour.",
  description:
    "A small mechanical keyboard on the desk: nine sculpted keycaps and a rotary knob. Press a key and it travels down with a deep thock while light ripples outward from it through the under-glow. Turn the knob to shift the hue.",
  about: [
    "Each keycap is sculpted with a dished top, soft side walls and a thin highlight along its upper edge, and sits over its own pool of RGB light that spills onto the plate around it. A press drives the cap down on a stiff spring, so it bottoms out and rebounds instead of simply moving, and sends a ring of light outward that reaches the neighbouring keys a beat later.",
    "The thock is built in the browser from two parts: a short burst of low-passed noise for the impact and a quick, low sine for the body of the case, tuned per key so the corners sound a little different from the centre. Keys 1 to 9 on your keyboard press the matching caps, and the knob turns with a drag, the scroll wheel or the arrow keys.",
  ],
  uses: ["Canvas 2D", "Web Audio", "Springs"],
  category: "objects",
  inspiredBy: "Custom mechanical keyboards",
  // 204 × 236
  tile: { aspect: 204 / 236 },
  stage: { aspect: 4 / 5 },
  controlsHint: "Click or press 1–9 · Drag, scroll or use the arrow keys on the knob",
  sound: true,
};
