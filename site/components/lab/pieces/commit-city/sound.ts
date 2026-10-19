// Sounds for the city, synthesised on the spot through the lab's shared
// audio graph. Nothing plays until a gesture on the stage has created the
// context (audio.ts), and nothing plays while the lab is muted.
//
// - detent: the soft wooden click of a turntable settling into a quarter
//   turn (a few ms of band-passed noise over a short low knock).
// - chime: a small glassy note when you point at a building, pitched by its
//   height on a pentatonic scale, so sweeping across the city plays the
//   year back as a quiet melody.

import { audioReady, getAudio, noiseBuffer } from "../../audio";

let lastChime = 0;

export function detent(strength = 1) {
  if (!audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const level = Math.max(0.15, Math.min(1, strength));

  // Click.
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.playbackRate.value = 0.9 + Math.random() * 0.2;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2100 + Math.random() * 300;
  band.Q.value = 1.6;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0, now);
  clickGain.gain.linearRampToValueAtTime(0.16 * level, now + 0.002);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  noise.connect(band).connect(clickGain).connect(output);
  noise.start(now, Math.random() * 0.5, 0.05);

  // Knock.
  const knock = ctx.createOscillator();
  knock.type = "sine";
  knock.frequency.setValueAtTime(190, now);
  knock.frequency.exponentialRampToValueAtTime(96, now + 0.07);
  const knockGain = ctx.createGain();
  knockGain.gain.setValueAtTime(0, now);
  knockGain.gain.linearRampToValueAtTime(0.2 * level, now + 0.004);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  knock.connect(knockGain).connect(output);
  knock.start(now);
  knock.stop(now + 0.13);
}

/** Major pentatonic over two and a half octaves from A3. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];

/** A soft note for a day's count (0 plays nothing). `pan` is -1 … 1. */
export function chime(count: number, pan = 0) {
  if (count <= 0 || !audioReady()) return;
  const kit = getAudio();
  if (!kit) return;
  const nowMs = performance.now();
  if (nowMs - lastChime < 45) return;
  lastChime = nowMs;
  const { ctx, output } = kit;
  const now = ctx.currentTime;
  const step = Math.min(SCALE.length - 1, Math.round(Math.sqrt(count) * 1.6) - 1);
  const frequency = 220 * Math.pow(2, SCALE[Math.max(0, step)] / 12);

  const panner = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : null;
  if (panner) panner.pan.value = Math.max(-0.8, Math.min(0.8, pan));
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 3200;
  (panner ? gain.connect(tone).connect(panner) : gain.connect(tone)).connect(output);

  const partials: Array<[number, number, OscillatorType]> = [
    [1, 1, "sine"],
    [2.01, 0.28, "sine"],
    [3.98, 0.08, "triangle"],
  ];
  for (const [ratio, level, type] of partials) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency * ratio;
    const partial = ctx.createGain();
    partial.gain.value = level;
    osc.connect(partial).connect(gain);
    osc.start(now);
    osc.stop(now + 0.65);
  }
}
