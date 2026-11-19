import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "turntable",
  title: "Turntable",
  summary: "A record player from above: drop the needle on a loop made in the browser, then scratch it by hand.",
  description:
    "A direct-drive turntable seen from above, with a machined platter, a record whose sheen follows the light, a tonearm with a cue lever, 33 and 45, and a pitch fader. Press start and the arm swings over and drops into the groove of a loop made in your browser. Grab the record to scratch: the music follows your hand, backwards too.",
  about: [
    "The whole deck is one WebGL2 fragment shader. Every part is an analytic shape measured in millimetres, lit by a soft key light and a studio softbox seen from a camera above, so the aluminium takes its gradients from what it reflects, and everything tall throws a shadow that softens with height, which is how a lifted arm floats. The record's sheen is anisotropic: its grooves are concentric, so the highlight sits where they run square to the light, two bright wedges through the spindle. A slight warp and the groove modulation turn with the record, so the wedges shimmer and sway as it spins. The label, the run-out etching and the plinth's printing are drawn with Canvas 2D.",
    "The platter has weight: it takes about half a second to come up to speed and coasts down when you stop it. The strobe dots stand still under the lamp only at the exact speed, so they drift as soon as you move the pitch fader. The arm lifts, swings and lowers on springs, and the grooves carry the stylus through the lead-in and across the gaps between the record's four bands.",
    "The music is synthesised the first time you press start: a four-bar loop of drums, bass and electric piano chords, rendered offline into audio buffers along with reversed copies. It plays at the record's own speed, so 45 is higher and faster, a held record falls silent, and pulling it back switches to the reversed buffer at the same point. Each band plays a different mix of the parts, with crackle in the groove.",
  ],
  uses: ["WebGL2", "Web Audio", "OfflineAudioContext", "Canvas 2D"],
  category: "objects",
  inspiredBy: "Direct-drive DJ turntables",
  // 204 × 176
  tile: { aspect: 204 / 176 },
  stage: { aspect: 4 / 5, minHeight: 420 },
  controlsHint:
    "Start to play · Drag the record to scratch · Drag the arm or use the cue lever · 33, 45 and the pitch fader · Keys: Space, hold ← →, ↑ ↓ for bands, C, 3 / 4, − + 0, R",
  sound: true,
};
