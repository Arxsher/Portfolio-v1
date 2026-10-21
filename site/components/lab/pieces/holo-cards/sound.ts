// Sound for the holo cards, synthesised on the lab's shared audio graph
// (components/lab/audio.ts): stage only, after a gesture, silent when muted.
// Card stock is mostly air and paper, so everything is shaped noise with a
// little body under it:
//
//   pick(pan)          a card lifted off the deck: a dry paper tick
//   whoosh(speed,pan)  a flick: a band of air sweeping up and away, louder
//                      and brighter the faster the throw
//   slide(pan)         the card slipping in behind the others
//   land(pan)          it settles on the back of the deck: a soft tap
//   flap(dir)          a card turning over: a quick swish…
//   snap()             …and the small slap as it lands face up (or down)
//   riffle(open)       the fan: one tick per card as they spread or gather
//
// Every sound is jittered a little so repeats never sound copied.

import { ensureAudio, isMuted, noiseBuffer, type AudioKit } from "../../audio";

function kit(): AudioKit | null {
  if (isMuted()) return null;
  const audio = ensureAudio();
  if (!audio || audio.ctx.state === "closed") return null;
  return audio;
}

const jitter = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

function panner(ctx: AudioContext, out: AudioNode, pan: number): AudioNode {
  if (typeof ctx.createStereoPanner !== "function") return out;
  const node = ctx.createStereoPanner();
  node.pan.value = Math.max(-1, Math.min(1, pan));
  node.connect(out);
  return node;
}

type Band = { type: BiquadFilterType; freq: number; to?: number; q: number; gain: number; attack: number; decay: number };

/** A burst of filtered noise; `to` sweeps the filter over the decay. */
function noise(audio: AudioKit, at: number, out: AudioNode, band: Band) {
  const { ctx } = audio;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 1);
  const filter = ctx.createBiquadFilter();
  filter.type = band.type;
  filter.frequency.setValueAtTime(band.freq, at);
  if (band.to) filter.frequency.exponentialRampToValueAtTime(band.to, at + band.decay * 0.85);
  filter.Q.value = band.q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(band.gain, at + band.attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + band.attack + band.decay);
  src.connect(filter).connect(env).connect(out);
  src.start(at, Math.random() * 0.5, band.attack + band.decay + 0.03);
}

function thump(audio: AudioKit, at: number, out: AudioNode, freq: number, gain: number, decay: number) {
  const { ctx } = audio;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.5, at);
  osc.frequency.exponentialRampToValueAtTime(freq, at + 0.03);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

export function pick(pan = 0) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.005;
  const out = panner(audio.ctx, audio.output, pan);
  noise(audio, at, out, { type: "highpass", freq: 3200 * jitter(0.1), q: 0.7, gain: 0.05, attack: 0.001, decay: 0.022 });
  noise(audio, at, out, { type: "bandpass", freq: 1100 * jitter(0.1), q: 1.4, gain: 0.04, attack: 0.001, decay: 0.03 });
}

export function whoosh(speed: number, pan = 0) {
  const audio = kit();
  if (!audio) return;
  const s = Math.max(0, Math.min(1, (speed - 1) / 6));
  const at = audio.ctx.currentTime + 0.004;
  const out = panner(audio.ctx, audio.output, pan);
  noise(audio, at, out, {
    type: "bandpass",
    freq: 520 * jitter(0.08),
    to: (1700 + 1500 * s) * jitter(0.08),
    q: 0.9,
    gain: 0.08 + 0.16 * s,
    attack: 0.035,
    decay: 0.26 + 0.1 * s,
  });
  // the edge of the card cutting the air: thin and high
  noise(audio, at + 0.01, out, { type: "highpass", freq: 4200, q: 0.5, gain: 0.025 + 0.04 * s, attack: 0.02, decay: 0.12 });
}

export function slide(pan = 0) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.004;
  const out = panner(audio.ctx, audio.output, pan * 0.6);
  noise(audio, at, out, { type: "bandpass", freq: 1500 * jitter(0.1), to: 900, q: 1.1, gain: 0.05, attack: 0.03, decay: 0.16 });
}

export function land(pan = 0) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.003;
  const out = panner(audio.ctx, audio.output, pan * 0.5);
  noise(audio, at, out, { type: "bandpass", freq: 1900 * jitter(0.12), q: 1.2, gain: 0.07, attack: 0.001, decay: 0.04 });
  thump(audio, at, out, 150 * jitter(0.06), 0.09, 0.07);
}

export function flap(dir: number, pan = 0) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.004;
  const out = panner(audio.ctx, audio.output, pan + dir * 0.15);
  noise(audio, at, out, { type: "bandpass", freq: 900 * jitter(0.1), to: 2600 * jitter(0.1), q: 1.0, gain: 0.08, attack: 0.025, decay: 0.15 });
}

export function snap(pan = 0) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.002;
  const out = panner(audio.ctx, audio.output, pan * 0.5);
  noise(audio, at, out, { type: "highpass", freq: 2400 * jitter(0.1), q: 0.8, gain: 0.06, attack: 0.001, decay: 0.03 });
  thump(audio, at, out, 210 * jitter(0.05), 0.05, 0.05);
}

export function riffle(open: boolean) {
  const audio = kit();
  if (!audio) return;
  const start = audio.ctx.currentTime + 0.01;
  for (let i = 0; i < 3; i++) {
    const at = start + i * (0.05 + Math.random() * 0.012);
    const pan = open ? (i - 1) * 0.5 : (1 - i) * 0.5;
    const out = panner(audio.ctx, audio.output, pan);
    noise(audio, at, out, { type: "bandpass", freq: (open ? 2600 + i * 400 : 3400 - i * 400) * jitter(0.08), q: 1.6, gain: 0.05, attack: 0.001, decay: 0.03 });
  }
  noise(audio, start, audio.output, { type: "bandpass", freq: 1300, to: open ? 2000 : 900, q: 0.8, gain: 0.03, attack: 0.04, decay: 0.16 });
}
