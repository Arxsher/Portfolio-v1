// Sound for the zellige stage, made in the browser on the shared lab audio
// graph (components/lab/audio.ts): only after a gesture, silent when muted.
//
//   tap(x)            a fingertip on glazed tile: a short, dull knock
//   cascade(steps)    the re-glaze: one ceramic clink per ring of the ripple,
//                     each a little quieter, panned to where its ring is
//
// A clink is a small struck plate: three inharmonic partials (the ratios of
// a free square plate, roughly 1 : 2.76 : 5.40) that decay fast, the higher
// ones faster, over a bright tick of filtered noise.

import { ensureAudio, isMuted, noiseBuffer, type AudioKit } from "../../audio";

function kit(): AudioKit | null {
  if (isMuted()) return null;
  const audio = ensureAudio();
  if (!audio || audio.ctx.state === "closed") return null;
  return audio;
}

function panner(ctx: AudioContext, out: AudioNode, pan: number): AudioNode {
  if (typeof ctx.createStereoPanner !== "function") return out;
  const node = ctx.createStereoPanner();
  node.pan.value = Math.max(-1, Math.min(1, pan));
  node.connect(out);
  return node;
}

function clink(audio: AudioKit, at: number, freq: number, gain: number, pan: number) {
  const { ctx, output } = audio;
  const out = panner(ctx, output, pan);
  const partials: Array<[number, number, number]> = [
    [1, 1, 0.16],
    [2.76, 0.42, 0.075],
    [5.4, 0.2, 0.035],
  ];
  for (const [ratio, level, decay] of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * ratio * (1 + (Math.random() - 0.5) * 0.006);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain * level, at + 0.0015);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay * 4);
    osc.connect(env).connect(out);
    osc.start(at);
    osc.stop(at + decay * 4 + 0.02);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx, 0.25);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = Math.min(9000, freq * 2.1);
  band.Q.value = 1.4;
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain * 0.5, at);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);
  noise.connect(band).connect(env).connect(out);
  noise.start(at, Math.random() * 0.2, 0.03);
}

/** A fingertip on the glaze (call from the gesture itself). */
export function tap(pan: number) {
  const audio = kit();
  if (!audio) return;
  const { ctx, output } = audio;
  const at = ctx.currentTime + 0.002;
  const out = panner(ctx, output, pan);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, at);
  osc.frequency.exponentialRampToValueAtTime(140, at + 0.05);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(0.12, at + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + 0.1);
  clink(audio, at, 2300 + Math.random() * 500, 0.05, pan);
}

export type Step = { delay: number; pan: number };

/** The ripple's clinks: one per step (seconds after now), fading as it spreads. */
export function cascade(steps: readonly Step[]) {
  const audio = kit();
  if (!audio) return;
  const now = audio.ctx.currentTime + 0.01;
  // a falling, slightly random run of pitches, like tiles of one batch
  let freq = 2900 + Math.random() * 400;
  steps.forEach((step, n) => {
    const gain = 0.11 * Math.pow(0.84, n);
    if (gain < 0.008) return;
    clink(audio, now + step.delay, freq * (0.94 + Math.random() * 0.12), gain, step.pan);
    freq *= 0.985;
  });
}
