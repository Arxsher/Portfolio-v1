import type { PieceMeta } from "../../types";

export const meta: PieceMeta = {
  slug: "turntable",
  title: "Turntable",
  summary: "A record player from above: drop the needle on a loop made in the browser, then scratch it by hand.",
  description:
    "A turntable seen from above, with a spinning record, a tonearm and a 33 / 45 switch. Press play and the arm swings over, the platter spins up and a loop starts. Grab the record to scratch: the sound follows your hand, backwards too.",
  about: [
    "The record is drawn with fine concentric grooves and a sheen that stays fixed to the light while the vinyl turns beneath it, which is what makes it read as spinning. The platter has weight: it takes a moment to come up to speed and coasts down when you stop it, and the arm lifts and lowers rather than snapping into place.",
    "The loop is synthesised the first time you press play: drums, a bass line and chords are rendered offline into an audio buffer, along with a reversed copy. While you hold the record its playback rate follows your hand, switching to the reversed buffer when you pull it back, so a scratch sounds the way it looks.",
  ],
  uses: ["Canvas 2D", "Web Audio", "OfflineAudioContext"],
  category: "objects",
  inspiredBy: "Direct-drive DJ turntables",
  // 204 × 176
  tile: { aspect: 204 / 176 },
  stage: { aspect: 1 },
  controlsHint: "Play to start · Drag the record to scratch · Switch between 33 and 45",
  sound: true,
};
