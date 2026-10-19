// Quiet interface sounds for the run, synthesised on the shared lab audio
// graph. They only play once a gesture on the stage has created the audio
// context (audio.ts never starts one by itself) and never while muted.
//
//   tick   a step checks off: a short glassy sine blip with a soft click
//   tap    a sub-agent reports back: lower and softer
//   chime  the run is done: two notes a fifth apart, slow decay
//   halt   stop: a muted downward blip

import { audioReady, getAudio, noiseBuffer } from "../../audio";

function voice(
  frequency: number,
  { at = 0, length = 0.08, gain = 0.05, type = "sine" as OscillatorType, glide = 1, pan = 0 } = {},
) {
  const kit = getAudio();
  if (!kit || !audioReady()) return;
  const { ctx, output } = kit;
  const start = ctx.currentTime + 0.005 + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (glide !== 1) osc.frequency.exponentialRampToValueAtTime(frequency * glide, start + length);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, start + length);
  let node: AudioNode = env;
  if (pan && typeof ctx.createStereoPanner === "function") {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    env.connect(panner);
    node = panner;
  }
  osc.connect(env);
  node.connect(output);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

function click(gain = 0.02, at = 0) {
  const kit = getAudio();
  if (!kit || !audioReady()) return;
  const { ctx, output } = kit;
  const start = ctx.currentTime + 0.005 + at;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 5200;
  filter.Q.value = 1.4;
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + 0.012);
  source.connect(filter).connect(env).connect(output);
  source.start(start, Math.random() * 0.5, 0.03);
}

export function tick() {
  voice(1960, { length: 0.07, gain: 0.04, glide: 0.92 });
  click(0.015);
}

export function tap(index = 0) {
  voice(1180 + index * 90, { length: 0.06, gain: 0.025, glide: 0.95, pan: (index - 1) * 0.35 });
}

export function chime() {
  voice(1318.5, { length: 0.9, gain: 0.04 });
  voice(1975.5, { at: 0.09, length: 1.1, gain: 0.03 });
  voice(2637, { at: 0.09, length: 0.5, gain: 0.006, type: "triangle" });
}

export function halt() {
  voice(620, { length: 0.12, gain: 0.04, glide: 0.7, type: "triangle" });
}
