// Sounds for the big switch (stage only), synthesised through the lab's
// shared audio graph: nothing plays before a press or key on the switch has
// created the context, and nothing plays while the lab is muted.
//
// - land: the knob seating at the end of the track, a soft detent (a few
//   ms of band-passed noise over a low knock), louder for a harder throw.
// - tick: a faint watch-crown tick for each hour the evening passes while
//   the knob moves, so a slow drag has a texture under the finger.
// - star: as the knob goes into the night, the first bright stars each
//   ring a small glassy note, rising on a pentatonic scale; dragging back
//   plays nothing, so a sunset sounds like a music box opening.

import { audioReady, getAudio, noiseBuffer } from "../../audio";

let lastTick = 0;
let lastStar = 0;

export function land(speed: number) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  // a tap lands at about 0.9 travels per second, a hard flick at 3 or more
  const level = Math.min(1, Math.max(0, (speed - 0.15) / 2.4));
  if (level <= 0.02) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2600 + Math.random() * 300;
  band.Q.value = 1.4;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0, now);
  clickGain.gain.linearRampToValueAtTime(0.12 * level, now + 0.0015);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
  noise.connect(band).connect(clickGain).connect(output);
  noise.start(now, Math.random() * 0.5, 0.04);

  const knock = ctx.createOscillator();
  knock.type = "sine";
  knock.frequency.setValueAtTime(210, now);
  knock.frequency.exponentialRampToValueAtTime(110, now + 0.06);
  const knockGain = ctx.createGain();
  knockGain.gain.setValueAtTime(0, now);
  knockGain.gain.linearRampToValueAtTime(0.16 * level, now + 0.003);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  knock.connect(knockGain).connect(output);
  knock.start(now);
  knock.stop(now + 0.11);
}

export function tick() {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  if (now - lastTick < 0.035) return;
  lastTick = now;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 4200;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.045, now + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
  noise.connect(high).connect(gain).connect(output);
  noise.start(now, Math.random() * 0.8, 0.02);
}

/** Pentatonic notes from E5, one per bright star, in the order they come out. */
const STAR_NOTES = [659.25, 739.99, 880, 987.77, 1108.73, 1318.51];

export function star(index: number) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  if (now - lastStar < 0.06) return;
  lastStar = now;
  const f = STAR_NOTES[Math.max(0, Math.min(STAR_NOTES.length - 1, index))];
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (pan) pan.pan.value = -0.5 + (index / (STAR_NOTES.length - 1)) * 0.6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  // a glassy partial pair: the note and a slightly sharp twelfth
  for (const [ratio, level] of [
    [1, 1],
    [3.01, 0.22],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f * ratio;
    const partial = ctx.createGain();
    partial.gain.value = level;
    osc.connect(partial).connect(gain);
    osc.start(now);
    osc.stop(now + 1.45);
  }
  if (pan) gain.connect(pan).connect(output);
  else gain.connect(output);
}

/** Where along the evening each note rings (crossing upward). */
export const STAR_CUES = [0.62, 0.68, 0.73, 0.78, 0.83, 0.88] as const;
