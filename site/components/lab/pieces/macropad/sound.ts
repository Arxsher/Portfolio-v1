// Sound for the macropad stage, synthesised on the lab's shared audio graph
// (components/lab/audio.ts): only after a gesture, silent when muted.
//
//   thock(key)    the downstroke as the cap bottoms out: a low sine body
//                 that drops in pitch (the case), a hollow mid resonance
//                 (the cap), a band of filtered noise (the impact) and a
//                 short dull thud under it
//   clack(key)    the upstroke: the stem hitting the top of the housing,
//                 lighter, higher and quieter
//   detent(dir)   one notch of the knob: a tiny metallic tick
//
// Each key has its own voice (`VOICES`), a little lower at the corners and
// brighter in the middle, as a real case resonates differently under each
// switch, and every press is jittered so repeats never sound copied.

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

type Voice = { body: number; hollow: number; band: number; level: number };

/** Per key (reading order): body pitch, hollow resonance of the cap, impact band (Hz), level. */
const VOICES: readonly Voice[] = Array.from({ length: 9 }, (_, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const edge = Math.abs(col - 1) + Math.abs(row - 1); // 0 centre, 1 sides, 2 corners
  return {
    body: 205 - edge * 14 + (row - 1) * 5,
    hollow: 470 - edge * 30 + (col - 1) * 12,
    band: 1900 - edge * 170 + (col - 1) * 60,
    level: 1 - edge * 0.04,
  };
});

const jitter = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

function noise(audio: AudioKit, at: number, out: AudioNode, type: BiquadFilterType, freq: number, q: number, gain: number, decay: number) {
  const { ctx } = audio;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.5);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.0012);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  src.connect(filter).connect(env).connect(out);
  src.start(at, Math.random() * 0.4, decay + 0.03);
}

function tone(audio: AudioKit, at: number, out: AudioNode, freq: number, from: number, sweep: number, gain: number, decay: number, type: OscillatorType = "sine") {
  const { ctx } = audio;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * from, at);
  osc.frequency.exponentialRampToValueAtTime(freq, at + sweep);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

/** The downstroke. `delay`: seconds until the cap bottoms out. */
export function thock(key: number, pan: number, delay = 0.024, force = 1) {
  const audio = kit();
  if (!audio) return;
  const voice = VOICES[key] ?? VOICES[4];
  const at = audio.ctx.currentTime + delay;
  const out = panner(audio.ctx, audio.output, pan);
  const level = voice.level * force * jitter(0.08);
  const body = voice.body * jitter(0.035);
  // the case: a low body that settles in pitch, and its first overtone
  tone(audio, at, out, body, 1.5, 0.028, 0.2 * level, 0.09);
  tone(audio, at, out, body * 2.38, 1.2, 0.02, 0.04 * level, 0.04, "triangle");
  // the cap: a hollow, damped resonance in the mids (what makes it a thock
  // rather than a click, and what small speakers can still play)
  noise(audio, at, out, "bandpass", voice.hollow * jitter(0.05), 3.2, 0.62 * level, 0.055);
  // the impact: a band of noise, and a dull thud under it
  noise(audio, at, out, "bandpass", voice.band * jitter(0.08), 1.15, 0.17 * level, 0.024);
  noise(audio, at, out, "lowpass", 620 * jitter(0.1), 0.7, 0.24 * level, 0.05);
  // the plastic: a very short bright tick on top
  noise(audio, at, out, "highpass", 4200, 0.7, 0.04 * level, 0.006);
}

/** The upstroke as the stem returns to the top of the housing. */
export function clack(key: number, pan: number, delay = 0.035) {
  const audio = kit();
  if (!audio) return;
  const voice = VOICES[key] ?? VOICES[4];
  const at = audio.ctx.currentTime + delay;
  const out = panner(audio.ctx, audio.output, pan);
  noise(audio, at, out, "bandpass", voice.band * 1.55 * jitter(0.1), 1.6, 0.12 * voice.level, 0.016);
  noise(audio, at, out, "bandpass", voice.hollow * 1.35 * jitter(0.05), 3, 0.22 * voice.level, 0.03);
  tone(audio, at, out, voice.body * 2.1 * jitter(0.04), 1.25, 0.012, 0.05 * voice.level, 0.035);
}

/** One notch of the knob (dir: +1 clockwise, -1 back), `delay` seconds from now. */
export function detent(dir: number, delay = 0) {
  const audio = kit();
  if (!audio) return;
  const at = audio.ctx.currentTime + 0.002 + delay;
  const out = panner(audio.ctx, audio.output, 0.32);
  noise(audio, at, out, "highpass", 2600 * jitter(0.08), 0.8, 0.09, 0.007);
  tone(audio, at, out, (dir > 0 ? 2350 : 2150) * jitter(0.02), 1, 0.001, 0.026, 0.012);
}
